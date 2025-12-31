/**
 * Output Generator module
 * Generates PDF and HTML outputs
 */

import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

import type { Logger } from '../cli/index.js';
import type {
  ChronologicalOrder,
  CVOptions,
  OutputFormat,
  OutputType,
  PaperSize,
  ResolvedConfig,
} from '../types/config.js';
import type { ParsedSection } from '../types/sections.js';
import {
  findSectionByTag,
  isSectionValidForFormat,
} from '../types/sections.js';
import type { CVInput } from './common.js';
import { generateEnHtml } from './resume_en.js';
import { generateJaHtml } from './resume_ja.js';
import { generateRirekishoHTML } from './rirekisho/index.js';

// Re-export generators
export { generateEnHtml, generateJaHtml, generateRirekishoHTML };

/**
 * Page size dimensions in mm (portrait orientation for CV)
 */
export const PAGE_SIZES: Record<PaperSize, { width: number; height: number }> =
  {
    a3: { width: 297, height: 420 },
    a4: { width: 210, height: 297 },
    b4: { width: 257, height: 364 },
    b5: { width: 182, height: 257 },
    letter: { width: 215.9, height: 279.4 },
  };

/**
 * Page size dimensions in mm (landscape orientation for Rirekisho)
 */
export const PAGE_SIZES_LANDSCAPE: Record<
  PaperSize,
  { width: number; height: number }
> = {
  a3: { width: 420, height: 297 },
  a4: { width: 297, height: 210 },
  b4: { width: 364, height: 257 },
  b5: { width: 257, height: 182 },
  letter: { width: 279.4, height: 215.9 },
};

/**
 * MIME types for supported image formats
 */
export const IMAGE_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
};

/**
 * Supported image file extensions (without leading dot)
 */
export const SUPPORTED_IMAGE_EXTENSIONS: readonly string[] = Object.keys(
  IMAGE_MIME_TYPES,
).map((ext) => ext.slice(1));

/**
 * Read image file and convert to base64 data URI
 */
export function readPhotoAsDataUri(photoPath: string): string {
  const ext = path.extname(photoPath).toLowerCase();
  const mimeType = IMAGE_MIME_TYPES[ext];

  if (!mimeType) {
    throw new Error(`Unsupported image format: ${ext}`);
  }

  const imageBuffer = fs.readFileSync(photoPath);
  const base64 = imageBuffer.toString('base64');

  return `data:${mimeType};base64,${base64}`;
}

/**
 * Read stylesheet file content
 */
function readStylesheet(stylesheetPath: string): string {
  return fs.readFileSync(stylesheetPath, 'utf-8');
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Input type for detectLanguage function
 */
export interface DetectLanguageInput {
  readonly metadata: { name_ja?: string };
  readonly sections: readonly { title: string }[];
}

/**
 * Detect language from CV content
 * Checks for Japanese name or Japanese section titles
 */
export function detectLanguage(cv: DetectLanguageInput): 'en' | 'ja' {
  // Import isJapaneseText from sections to avoid duplication
  const isJapanese = (text: string): boolean =>
    /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);

  // Check if name_ja exists or if sections have Japanese titles
  if (cv.metadata.name_ja) return 'ja';

  for (const section of cv.sections) {
    // Check for Japanese characters in title
    if (isJapanese(section.title)) {
      return 'ja';
    }
  }

  return 'en';
}

/**
 * Default section order for CV format
 */
const DEFAULT_CV_SECTION_ORDER = [
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'languages',
  'competencies',
  'motivation',
];

/**
 * Resolve section ID from tag or ID
 * Returns the section ID if input matches a tag or is already an ID
 */
function resolveSectionId(
  input: string,
  sections: readonly ParsedSection[],
): string | undefined {
  // First check if it's a direct section ID match
  const directMatch = sections.find((s) => s.id === input);
  if (directMatch) {
    return directMatch.id;
  }

  // Then check if it matches a section title (case-insensitive)
  const titleMatch = sections.find(
    (s) => s.title.toLowerCase() === input.toLowerCase(),
  );
  if (titleMatch) {
    return titleMatch.id;
  }

  // Finally, check SECTION_DEFINITIONS tags
  const def = findSectionByTag(input);
  if (def) {
    // Check if this section exists in the input
    const sectionExists = sections.find((s) => s.id === def.id);
    if (sectionExists) {
      return def.id;
    }
  }

  return undefined;
}

/**
 * Filter and order sections based on sectionOrder config
 * If sectionOrder is provided, only include sections in that order
 * If not provided, use default order for CV or include all sections for rirekisho
 */
function filterAndOrderSections(
  sections: readonly ParsedSection[],
  format: 'cv' | 'rirekisho',
  logger: Logger,
  sectionOrder?: string[],
): ParsedSection[] {
  // Get all section IDs from input
  const allSectionIds = sections.map((s) => s.id);

  // Determine which sections are valid for this format
  const validSectionIds = allSectionIds.filter((id) =>
    isSectionValidForFormat(id, format),
  );
  const invalidSectionIds = allSectionIds.filter(
    (id) => !isSectionValidForFormat(id, format),
  );

  let includedSectionIds: string[];
  let skippedSectionIds: string[];

  if (format === 'cv') {
    if (sectionOrder && sectionOrder.length > 0) {
      // Resolve section order (tags/titles to IDs)
      const resolvedOrder: string[] = [];
      for (const input of sectionOrder) {
        const resolvedId = resolveSectionId(input, sections);
        if (
          resolvedId &&
          validSectionIds.includes(resolvedId) &&
          !resolvedOrder.includes(resolvedId)
        ) {
          resolvedOrder.push(resolvedId);
        }
      }

      // Use custom order - only include sections that are in sectionOrder AND valid for format
      includedSectionIds = resolvedOrder;
      skippedSectionIds = validSectionIds.filter(
        (id) => !resolvedOrder.includes(id),
      );
    } else {
      // Use default order for CV
      const orderedIds: string[] = [];
      const remainingIds = new Set(validSectionIds);

      // Add sections in default order
      for (const id of DEFAULT_CV_SECTION_ORDER) {
        if (remainingIds.has(id)) {
          orderedIds.push(id);
          remainingIds.delete(id);
        }
      }
      // Add any remaining sections not in default order
      for (const id of remainingIds) {
        orderedIds.push(id);
      }

      includedSectionIds = orderedIds;
      skippedSectionIds = [];
    }
  } else {
    // Rirekisho: use all valid sections in original order
    includedSectionIds = validSectionIds;
    skippedSectionIds = [];
  }

  // Log section information
  logger.info({ sections: includedSectionIds }, 'Sections included');
  if (skippedSectionIds.length > 0) {
    logger.info(
      { sections: skippedSectionIds },
      'Sections skipped (not in section-order)',
    );
  }
  if (invalidSectionIds.length > 0) {
    logger.info(
      { sections: invalidSectionIds },
      `Sections skipped (not valid for ${format} format)`,
    );
  }

  // Build ordered section list
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const orderedSections: ParsedSection[] = [];

  for (const id of includedSectionIds) {
    const section = sectionMap.get(id);
    if (section) {
      orderedSections.push(section);
    }
  }

  return orderedSections;
}

/**
 * Generate HTML for CV format
 * Note: chronologicalOrder is not yet implemented for CV format.
 * CV format currently uses the order as defined in the markdown file.
 */
function generateHtml(
  cv: CVInput,
  paperSize: PaperSize,
  sectionOrder?: string[],
  logger?: Logger,
  customStylesheet?: string,
): string {
  const language = detectLanguage(cv);

  // Filter and order sections if logger is provided
  let sections: readonly ParsedSection[] = cv.sections;
  if (logger) {
    sections = filterAndOrderSections(cv.sections, 'cv', logger, sectionOrder);
  }

  const filteredCv: CVInput = { ...cv, sections };

  const options: CVOptions = customStylesheet
    ? { paperSize, customStylesheet }
    : { paperSize };

  if (language === 'ja') {
    return generateJaHtml(filteredCv, options);
  }
  return generateEnHtml(filteredCv, options);
}

/**
 * Generate PDF from HTML
 */
async function generatePDF(
  html: string,
  paperSize: PaperSize,
  isRirekisho: boolean,
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: ['load', 'networkidle0'] });

    const size = PAGE_SIZES[paperSize];

    let pdfOptions: Parameters<typeof page.pdf>[0];

    if (isRirekisho) {
      // Rirekisho uses landscape orientation with the specified paper size
      const rirekishoSize = PAGE_SIZES_LANDSCAPE[paperSize];
      await page.setViewport({
        width: Math.round(rirekishoSize.width * 3.78),
        height: Math.round(rirekishoSize.height * 3.78),
        deviceScaleFactor: 2,
      });

      pdfOptions = {
        width: `${rirekishoSize.width}mm`,
        height: `${rirekishoSize.height}mm`,
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        preferCSSPageSize: false,
        scale: 1,
      };
    } else {
      pdfOptions = {
        width: `${size.width}mm`,
        height: `${size.height}mm`,
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        preferCSSPageSize: true,
      };
    }

    const pdfUint8Array = await page.pdf(pdfOptions);
    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}

/**
 * Generate output files
 */
export async function generateOutput(
  cv: CVInput,
  config: ResolvedConfig,
  logger: Logger,
): Promise<string[]> {
  const generatedFiles: string[] = [];
  const formats: OutputFormat[] =
    config.format === 'both' ? ['cv', 'rirekisho'] : [config.format];
  const outputTypes: OutputType[] =
    config.outputType === 'both' ? ['html', 'pdf'] : [config.outputType];

  // Ensure output directory exists
  const outputDir = path.dirname(config.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const format of formats) {
    logger.debug(`Generating ${format}...`);

    // Determine chronological order
    // rirekisho always uses 'asc' (oldest first), cv uses config value or defaults to 'desc'
    const chronologicalOrder: ChronologicalOrder =
      format === 'rirekisho' ? 'asc' : (config.chronologicalOrder ?? 'desc');

    // Read custom stylesheet if provided
    let customStylesheet: string | undefined;
    if (config.stylesheet) {
      customStylesheet = readStylesheet(config.stylesheet);
      logger.debug(
        { stylesheet: config.stylesheet },
        'Custom stylesheet loaded',
      );
    }

    // Generate HTML
    let html: string;
    if (format === 'rirekisho') {
      // Log sections for rirekisho
      const sections = filterAndOrderSections(cv.sections, 'rirekisho', logger);
      const filteredCv = { ...cv, sections };

      // Read photo file if provided (only for rirekisho)
      let photoDataUri: string | undefined;
      if (config.photo) {
        photoDataUri = readPhotoAsDataUri(config.photo);
        logger.debug({ photo: config.photo }, 'Photo loaded for rirekisho');
      }

      html = generateRirekishoHTML(filteredCv, {
        paperSize: config.paperSize,
        chronologicalOrder,
        hideMotivation: config.hideMotivation,
        ...(photoDataUri !== undefined && { photoDataUri }),
        ...(customStylesheet !== undefined && { customStylesheet }),
      });
    } else {
      html = generateHtml(
        cv,
        config.paperSize,
        config.sectionOrder,
        logger,
        customStylesheet,
      );
    }

    const baseName = path.basename(config.output);
    const suffix = format === 'rirekisho' ? '_rirekisho' : '_cv';

    for (const outputType of outputTypes) {
      const ext = outputType === 'pdf' ? '.pdf' : '.html';
      const outputPath = path.join(outputDir, `${baseName}${suffix}${ext}`);

      if (outputType === 'html') {
        fs.writeFileSync(outputPath, html, 'utf-8');
      } else {
        const pdfBuffer = await generatePDF(
          html,
          config.paperSize,
          format === 'rirekisho',
        );
        fs.writeFileSync(outputPath, pdfBuffer);
      }

      generatedFiles.push(outputPath);
      logger.debug(`Generated: ${outputPath}`);
    }
  }

  return generatedFiles;
}

export default generateOutput;
