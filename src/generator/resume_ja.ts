/**
 * Japanese CV Generator (職務経歴書スタイル)
 * Generates HTML for Japanese CV format with Mincho font
 */

import type { PaperSize } from '../types/config.js';
import type { CVMetadata } from '../types/metadata.js';
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  ParsedSection,
  SectionContent,
  SkillEntry,
  SkillsOptions,
} from '../types/sections.js';
import { isSectionValidForFormat } from '../types/sections.js';

export interface CVJaOptions {
  readonly paperSize: PaperSize;
  readonly customStylesheet?: string | undefined;
}

/**
 * Input for CV generation
 */
export interface CVInput {
  readonly metadata: CVMetadata;
  readonly sections: readonly ParsedSection[];
}

/**
 * Page size dimensions in mm
 * CV uses portrait orientation (width < height)
 */
const PAGE_SIZES: Record<PaperSize, { width: number; height: number }> = {
  a3: { width: 297, height: 420 },
  a4: { width: 210, height: 297 },
  b4: { width: 257, height: 364 },
  b5: { width: 182, height: 257 },
  letter: { width: 215.9, height: 279.4 },
};

/**
 * Default number of columns for skills grid
 */
const DEFAULT_SKILLS_COLUMNS = 3;

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format date for Japanese display
 */
function formatDate(date: Date | undefined): string {
  if (!date) return '';
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

/**
 * Format end date which can be Date or 'present'
 */
function formatEndDate(end: Date | 'present' | undefined): string {
  if (!end) return '';
  if (end === 'present') return '現在';
  return formatDate(end);
}

/**
 * Format date range
 */
function formatDateRange(
  start: Date | undefined,
  end: Date | 'present' | undefined,
): string {
  const startStr = formatDate(start);
  const endStr = formatEndDate(end);
  if (startStr && endStr) return `${startStr} - ${endStr}`;
  if (startStr) return startStr;
  return '';
}

/**
 * Get current date in Japanese format (yyyy年mm月dd日現在)
 */
function getCurrentDateJa(): string {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日現在`;
}

/**
 * Generate base CSS styles
 */
function generateStyles(paperSize: PaperSize): string {
  const size = PAGE_SIZES[paperSize];
  const pageMargin = 15; // mm

  return `
    :root {
      --cv-font-family: "Noto Serif JP", "Hiragino Mincho Pro", "Yu Mincho", "MS Mincho", serif;
      --cv-font-size-base: 10pt;
      --cv-font-size-title: 18pt;
      --cv-font-size-section: 12pt;
      --cv-font-size-small: 9pt;
      --cv-line-height: 1.6;
      --cv-color-text: #333;
      --cv-color-heading: #000;
      --cv-color-border: #333;
      --cv-color-background: #fff;
      --cv-spacing-section: 16px;
      --cv-spacing-entry: 12px;
    }
    @page {
      size: ${size.width}mm ${size.height}mm;
      margin: ${pageMargin}mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html {
      background: #e0e0e0;
    }
    body {
      font-family: var(--cv-font-family);
      font-size: var(--cv-font-size-base);
      line-height: var(--cv-line-height);
      color: var(--cv-color-text);
      background: var(--cv-color-background);
      width: ${size.width}mm;
      min-height: ${size.height}mm;
      margin: 0 auto;
      padding: ${pageMargin}mm;
    }
    header {
      margin-bottom: 20px;
      padding-bottom: 15px;
    }
    .document-title {
      text-align: center;
      font-size: var(--cv-font-size-title);
      font-weight: bold;
      margin-bottom: 12px;
      color: var(--cv-color-heading);
    }
    .header-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .header-name {
      font-size: var(--cv-font-size-base);
      color: var(--cv-color-heading);
    }
    .header-date {
      font-size: var(--cv-font-size-base);
      color: var(--cv-color-text);
    }
    section {
      margin-bottom: var(--cv-spacing-section);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    h2 {
      font-size: var(--cv-font-size-section);
      font-weight: bold;
      border-bottom: 1px solid var(--cv-color-border);
      padding-bottom: 3px;
      margin-bottom: 10px;
      color: var(--cv-color-heading);
    }
    .entry {
      margin-bottom: var(--cv-spacing-entry);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
    }
    .entry-title {
      font-weight: bold;
      color: var(--cv-color-heading);
    }
    .cert-item {
      font-size: var(--cv-font-size-small);
      color: var(--cv-color-heading);
      margin-bottom: 2px;
    }
    .lang-item {
      font-size: var(--cv-font-size-small);
    }
    .entry-subtitle {
      font-size: var(--cv-font-size-small);
      color: var(--cv-color-text);
    }
    .entry-date {
      color: var(--cv-color-text);
      font-size: var(--cv-font-size-small);
    }
    .entry-summary {
      margin-top: 4px;
      font-size: var(--cv-font-size-small);
    }
    ul {
      margin-left: 18px;
      margin-top: 4px;
    }
    li {
      margin-bottom: 2px;
      font-size: var(--cv-font-size-small);
    }
    p {
      margin-bottom: 8px;
      font-size: var(--cv-font-size-base);
    }
    .skills-grid {
      display: grid;
      gap: 2px 20px;
    }
    .skills-grid--cols-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .skill-item {
      font-size: var(--cv-font-size-small);
    }
    .skill-category {
      margin-bottom: 4px;
      font-size: var(--cv-font-size-small);
    }
    .skill-category-name {
      font-weight: bold;
    }
    @media print {
      html {
        background: none;
      }
      body {
        width: auto;
        min-height: auto;
        padding: 0;
      }
    }
  `;
}

/**
 * Render education section
 * Format:
 *   <school>    <start - end>
 *   <degree> — <location>
 *   <details>
 */
function renderEducation(entries: readonly EducationEntry[]): string {
  return entries
    .map((entry) => {
      const dateRange = formatDateRange(entry.start, entry.end);
      let html = '<div class="entry">';

      // Title line: <school> —— <date range>
      html += '<div class="entry-header">';
      html += `<span class="entry-title">${escapeHtml(entry.school)}</span>`;
      if (dateRange) {
        html += `<span class="entry-date">${escapeHtml(dateRange)}</span>`;
      }
      html += '</div>';

      // Subtitle line: <degree> — <location>
      const subtitleParts: string[] = [];
      if (entry.degree) {
        subtitleParts.push(escapeHtml(entry.degree));
      }
      if (entry.location) {
        subtitleParts.push(escapeHtml(entry.location));
      }
      if (subtitleParts.length > 0) {
        html += `<div class="entry-subtitle">${subtitleParts.join(' — ')}</div>`;
      }

      // Details - filter out empty strings
      const nonEmptyDetails = entry.details?.filter((d) => d && d.trim()) ?? [];
      if (nonEmptyDetails.length > 0) {
        html += '<ul>';
        for (const detail of nonEmptyDetails) {
          html += `<li>${escapeHtml(detail)}</li>`;
        }
        html += '</ul>';
      }
      html += '</div>';
      return html;
    })
    .join('\n');
}

/**
 * Render experience section
 * Format:
 *   <company> —— <title>    <start - end>
 *   <summary>
 *   <highlights>
 */
function renderExperience(entries: readonly ExperienceEntry[]): string {
  return entries
    .flatMap((entry) => {
      return entry.roles.map((role) => {
        const dateRange = formatDateRange(role.start, role.end);
        let html = '<div class="entry">';

        // Title line: <company> —— <title>    <date range>
        html += '<div class="entry-header">';
        html += `<span class="entry-title">${escapeHtml(entry.company)} —— ${escapeHtml(role.title)}</span>`;
        if (dateRange) {
          html += `<span class="entry-date">${escapeHtml(dateRange)}</span>`;
        }
        html += '</div>';

        // Summary
        if (role.summary && role.summary.length > 0) {
          html += '<div class="entry-summary">';
          html += role.summary.map((s) => escapeHtml(s)).join(' ');
          html += '</div>';
        }

        // Highlights
        if (role.highlights && role.highlights.length > 0) {
          html += '<ul>';
          for (const highlight of role.highlights) {
            html += `<li>${escapeHtml(highlight)}</li>`;
          }
          html += '</ul>';
        }

        html += '</div>';
        return html;
      });
    })
    .join('\n');
}

/**
 * Render certifications section
 */
function renderCertifications(entries: readonly CertificationEntry[]): string {
  return entries
    .map((entry) => {
      let html = `<div class="cert-item">• ${escapeHtml(entry.name)}`;
      if (entry.date) {
        html += ` (${escapeHtml(formatDate(entry.date))})`;
      }
      html += '</div>';
      return html;
    })
    .join('\n');
}

/**
 * Render skills section - supports grid and categorized formats
 */
function renderSkills(
  entries: readonly SkillEntry[],
  options: SkillsOptions,
): string {
  // Check if categorized format (entries have non-empty category with description)
  const isCategorized =
    options.format === 'categorized' ||
    entries.some((e) => e.category && (e.description || e.items.length > 0));

  if (isCategorized && entries.some((e) => e.category)) {
    // Categorized format: • <category>: <description or items>
    return entries
      .filter((e) => e.category)
      .map((entry) => {
        const content = entry.description || entry.items.join('、');
        return `<div class="skill-category">• <span class="skill-category-name">${escapeHtml(entry.category)}:</span> ${escapeHtml(content)}</div>`;
      })
      .join('\n');
  }

  // Grid format: flatten all items
  const allItems: string[] = [];
  for (const entry of entries) {
    for (const item of entry.items) {
      allItems.push(item);
    }
  }

  if (allItems.length === 0) {
    return '';
  }

  const columns = options.columns ?? DEFAULT_SKILLS_COLUMNS;
  const colsClass = columns === 3 ? 'skills-grid--cols-3' : '';
  const colsStyle =
    columns !== 3 ? `grid-template-columns: repeat(${columns}, 1fr);` : '';
  let html = `<div class="skills-grid ${colsClass}"${colsStyle ? ` style="${colsStyle}"` : ''}>`;
  for (const item of allItems) {
    html += `<div class="skill-item">• ${escapeHtml(item)}</div>`;
  }
  html += '</div>';
  return html;
}

/**
 * Render skills from list content as grid
 */
function renderSkillsList(
  items: readonly string[],
  columns: number = DEFAULT_SKILLS_COLUMNS,
): string {
  if (items.length === 0) {
    return '';
  }

  const colsClass = columns === 3 ? 'skills-grid--cols-3' : '';
  const colsStyle =
    columns !== 3 ? `grid-template-columns: repeat(${columns}, 1fr);` : '';
  let html = `<div class="skills-grid ${colsClass}"${colsStyle ? ` style="${colsStyle}"` : ''}>`;
  for (const item of items) {
    html += `<div class="skill-item">• ${escapeHtml(item)}</div>`;
  }
  html += '</div>';
  return html;
}

/**
 * Render languages section
 */
function renderLanguages(entries: readonly LanguageEntry[]): string {
  return entries
    .map((entry) => {
      let html = `<span class="lang-item">${escapeHtml(entry.language)}`;
      if (entry.level) {
        html += ` (${escapeHtml(entry.level)})`;
      }
      html += '</span>';
      return html;
    })
    .join(' • ');
}

/**
 * Render section content
 */
function renderSectionContent(
  content: SectionContent,
  sectionId: string,
): string {
  switch (content.type) {
    case 'text':
      return `<p>${escapeHtml(content.text)}</p>`;
    case 'list':
      // For skills section, render as grid
      if (sectionId === 'skills') {
        return renderSkillsList(content.items);
      }
      return (
        '<ul>' +
        content.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n') +
        '</ul>'
      );
    case 'education':
      return renderEducation(content.entries);
    case 'experience':
      return renderExperience(content.entries);
    case 'certifications':
      return renderCertifications(content.entries);
    case 'skills':
      return renderSkills(content.entries, content.options);
    case 'languages':
      return renderLanguages(content.entries);
    case 'table':
      return (
        '<ul>' +
        content.rows
          .map((row) => `<li>${escapeHtml(row.content)}</li>`)
          .join('\n') +
        '</ul>'
      );
    default:
      return '';
  }
}

/**
 * Filter sections by format validity, preserving input order
 * Note: Section ordering is now handled by filterAndOrderSections in generator/index.ts
 */
function filterSections(sections: readonly ParsedSection[]): ParsedSection[] {
  return sections.filter((section) =>
    isSectionValidForFormat(section.id, 'cv'),
  );
}

/**
 * Generate Japanese HTML CV
 */
export function generateCVJaHTML(cv: CVInput, options: CVJaOptions): string {
  const styles = generateStyles(options.paperSize);
  const name = cv.metadata.name_ja ?? cv.metadata.name;
  const currentDate = getCurrentDateJa();

  // Filter sections (order is preserved from input)
  const filteredSections = filterSections(cv.sections);

  const sectionsHtml = filteredSections
    .map((section) => {
      return `
<section class="cv-section cv-section--${section.id}">
  <h2>${escapeHtml(section.title)}</h2>
  ${renderSectionContent(section.content, section.id)}
</section>`;
    })
    .join('\n');

  // Include custom stylesheet if provided
  const customStylesHtml = options.customStylesheet
    ? `<style class="custom-styles">${options.customStylesheet}</style>`
    : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)} - 職務経歴書</title>
  <style class="default-styles">${styles}</style>
  ${customStylesHtml}
</head>
<body class="cv cv--ja">
  <header class="cv-header">
    <div class="document-title">職務経歴書</div>
    <div class="header-info">
      <div class="header-name">${escapeHtml(name)}</div>
      <div class="header-date">${escapeHtml(currentDate)}</div>
    </div>
  </header>
  <main class="cv-content">
${sectionsHtml}
  </main>
</body>
</html>`;
}
