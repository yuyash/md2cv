/**
 * Template types for CV/rirekisho markdown generation
 */

import type { OutputFormat } from './config.js';

/**
 * Supported template languages
 */
export type TemplateLanguage = 'en' | 'ja';

/**
 * Template generation options
 */
export interface TemplateOptions {
  readonly language: TemplateLanguage;
  readonly format: OutputFormat;
  readonly includeComments: boolean;
  readonly outputPath: string | undefined;
}

/**
 * Default template options
 */
export const DEFAULT_TEMPLATE_OPTIONS: Omit<TemplateOptions, 'outputPath'> = {
  language: 'en',
  format: 'cv',
  includeComments: true,
} as const;

/**
 * Section template definition
 */
export interface SectionTemplate {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
  readonly usage: 'cv' | 'rirekisho' | 'both';
}

/**
 * Frontmatter field template
 */
export interface FrontmatterFieldTemplate {
  readonly key: string;
  readonly example: string;
  readonly description: string;
  readonly required: boolean;
}

/**
 * Complete template definition for a language
 */
export interface TemplateDefinition {
  readonly language: TemplateLanguage;
  readonly frontmatterFields: readonly FrontmatterFieldTemplate[];
  readonly sections: readonly SectionTemplate[];
}

/**
 * Template info for listing available templates
 */
export interface TemplateInfo {
  readonly language: TemplateLanguage;
  readonly languageName: string;
  readonly formats: readonly OutputFormat[];
  readonly sectionCount: number;
  readonly frontmatterFieldCount: number;
}

/**
 * Section info for listing available sections
 */
export interface SectionInfo {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly usage: 'cv' | 'rirekisho' | 'both';
}
