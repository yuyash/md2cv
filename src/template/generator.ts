/**
 * Template generator module
 * Generates markdown templates for CV/rirekisho
 */

import type { OutputFormat } from '../types/config.js';
import type {
  FrontmatterFieldTemplate,
  SectionInfo,
  SectionTemplate,
  TemplateDefinition,
  TemplateInfo,
  TemplateLanguage,
  TemplateOptions,
} from '../types/template.js';
import { EN_TEMPLATE } from './definitions/en.js';
import { JA_TEMPLATE } from './definitions/ja.js';

/**
 * Language display names
 */
const LANGUAGE_NAMES: Record<TemplateLanguage, string> = {
  en: 'English',
  ja: '日本語 (Japanese)',
};

/**
 * Get template definition for a language
 */
export function getTemplateDefinition(
  language: TemplateLanguage,
): TemplateDefinition {
  switch (language) {
    case 'ja':
      return JA_TEMPLATE;
    case 'en':
    default:
      return EN_TEMPLATE;
  }
}

/**
 * Get information about available templates
 */
export function getTemplateInfo(language: TemplateLanguage): TemplateInfo {
  const definition = getTemplateDefinition(language);
  return {
    language,
    languageName: LANGUAGE_NAMES[language],
    formats: ['cv', 'rirekisho', 'both'],
    sectionCount: definition.sections.length,
    frontmatterFieldCount: definition.frontmatterFields.length,
  };
}

/**
 * Get all available template infos
 */
export function getAllTemplateInfos(): TemplateInfo[] {
  return getAvailableLanguages().map(getTemplateInfo);
}

/**
 * Get section info for a specific language and format
 */
export function getSectionInfos(
  language: TemplateLanguage,
  format: OutputFormat,
): SectionInfo[] {
  const definition = getTemplateDefinition(language);
  const sections = filterSectionsForFormat(definition.sections, format);
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    usage: section.usage,
  }));
}

/**
 * Format section list for display
 */
export function formatSectionList(
  language: TemplateLanguage,
  format: OutputFormat,
): string {
  const sections = getSectionInfos(language, format);
  const lines: string[] = [];

  const header =
    language === 'ja'
      ? `利用可能なセクション (${format} フォーマット):`
      : `Available sections (${format} format):`;
  lines.push(header);
  lines.push('');

  for (const section of sections) {
    const usageLabel =
      section.usage === 'both'
        ? language === 'ja'
          ? '共通'
          : 'both'
        : section.usage;
    lines.push(`  ${section.id}`);
    lines.push(
      `    ${language === 'ja' ? 'タイトル' : 'Title'}: ${section.title}`,
    );
    lines.push(`    ${language === 'ja' ? '用途' : 'Usage'}: ${usageLabel}`);
    lines.push(
      `    ${language === 'ja' ? '説明' : 'Description'}: ${section.description}`,
    );
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format template list for display
 */
export function formatTemplateList(): string {
  const infos = getAllTemplateInfos();
  const lines: string[] = [];

  lines.push('Available templates:');
  lines.push('');

  for (const info of infos) {
    lines.push(`  ${info.language} - ${info.languageName}`);
    lines.push(`    Formats: ${info.formats.join(', ')}`);
    lines.push(`    Sections: ${info.sectionCount}`);
    lines.push(`    Frontmatter fields: ${info.frontmatterFieldCount}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Filter sections based on output format
 */
export function filterSectionsForFormat(
  sections: readonly SectionTemplate[],
  format: OutputFormat,
): SectionTemplate[] {
  return sections.filter((section) => {
    if (format === 'both') return true;
    return section.usage === 'both' || section.usage === format;
  });
}

/**
 * Generate frontmatter field descriptions as HTML comment block
 * This is placed before the frontmatter to avoid YAML parsing issues
 */
export function generateFrontmatterDescription(
  fields: readonly FrontmatterFieldTemplate[],
  language: TemplateLanguage,
): string {
  const requiredLabel = language === 'ja' ? '必須' : 'required';
  const optionalLabel = language === 'ja' ? '任意' : 'optional';
  const headerLabel =
    language === 'ja'
      ? 'フロントマターフィールドの説明'
      : 'Frontmatter Field Descriptions';

  const lines: string[] = [`<!-- ${headerLabel}:`];

  for (const field of fields) {
    const reqLabel = field.required ? requiredLabel : optionalLabel;
    lines.push(`  ${field.key}: ${field.description} (${reqLabel})`);
  }

  lines.push('-->');
  return lines.join('\n');
}

/**
 * Generate frontmatter block
 * Note: Comments are NOT included inside YAML frontmatter to avoid parsing issues
 */
export function generateFrontmatter(
  fields: readonly FrontmatterFieldTemplate[],
  _includeComments: boolean,
  _language: TemplateLanguage,
): string {
  const lines: string[] = ['---'];

  for (const field of fields) {
    lines.push(`${field.key}: ${field.example}`);
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Generate section block
 */
export function generateSection(
  section: SectionTemplate,
  includeComments: boolean,
  _language: TemplateLanguage,
): string {
  const lines: string[] = [];

  lines.push(`# ${section.title}`);
  lines.push('');

  if (includeComments) {
    const commentLines = section.description.split('\n');
    for (const line of commentLines) {
      lines.push(`<!-- ${line} -->`);
    }
    lines.push('');
  }

  lines.push(section.content);

  return lines.join('\n');
}

/**
 * Generate complete markdown template
 */
export function generateTemplate(options: TemplateOptions): string {
  const definition = getTemplateDefinition(options.language);
  const sections = filterSectionsForFormat(definition.sections, options.format);

  const parts: string[] = [];

  // Add header comment
  if (options.includeComments) {
    const headerComment =
      options.language === 'ja'
        ? `<!-- 
  md2cv テンプレート
  フォーマット: ${options.format}
  
  このテンプレートを編集して、あなたの CV/履歴書を作成してください。
  コメント（<!-- -->）は出力には含まれません。
  
  使い方:
    md2cv -i this-file.md -f ${options.format}
  
  詳細: https://github.com/yuyash/md2cv
-->`
        : `<!-- 
  md2cv Template
  Format: ${options.format}
  
  Edit this template to create your CV/resume.
  Comments (<!-- -->) will not appear in the output.
  
  Usage:
    md2cv -i this-file.md -f ${options.format}
  
  Documentation: https://github.com/yuyash/md2cv
-->`;
    parts.push(headerComment);
    parts.push('');

    // Add frontmatter field descriptions as HTML comment (outside YAML block)
    parts.push(
      generateFrontmatterDescription(
        definition.frontmatterFields,
        options.language,
      ),
    );
    parts.push('');
  }

  // Add frontmatter
  parts.push(
    generateFrontmatter(
      definition.frontmatterFields,
      options.includeComments,
      options.language,
    ),
  );
  parts.push('');

  // Add sections
  for (const section of sections) {
    parts.push(
      generateSection(section, options.includeComments, options.language),
    );
    parts.push('');
  }

  return parts.join('\n').trimEnd() + '\n';
}

/**
 * Get available template languages
 */
export function getAvailableLanguages(): TemplateLanguage[] {
  return ['en', 'ja'];
}

/**
 * Validate template language
 */
export function isValidLanguage(lang: string): lang is TemplateLanguage {
  return getAvailableLanguages().includes(lang as TemplateLanguage);
}
