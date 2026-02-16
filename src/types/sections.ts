/**
 * Section types and definitions for CV/rirekisho
 */

import type { OutputFormat } from './config.js';

/**
 * Section usage context
 */
export type SectionUsage = 'cv' | 'rirekisho' | 'both' | 'cover_letter' | 'all';

/**
 * Section definition
 */
export interface SectionDef {
  readonly id: string;
  readonly tags: readonly string[];
  readonly usage: SectionUsage;
  readonly requiredFor: readonly OutputFormat[];
}

/**
 * All section definitions
 */
export const SECTION_DEFINITIONS: readonly SectionDef[] = [
  {
    id: 'summary',
    tags: [
      '概要',
      '職務要約',
      'Summary',
      'Professional Summary',
      'Profile',
      'Profile Summary',
      'Executive Summary',
    ],
    usage: 'cv',
    requiredFor: [],
  },
  {
    id: 'education',
    tags: ['学歴', 'Education'],
    usage: 'both',
    requiredFor: [],
  },
  {
    id: 'experience',
    tags: [
      '職歴',
      '職務経歴',
      '職務履歴',
      'Experience',
      'Work Experience',
      'Professional Experience',
    ],
    usage: 'both',
    requiredFor: ['cv', 'rirekisho', 'both'],
  },
  {
    id: 'certifications',
    tags: ['免許・資格', '資格', '免許', 'Certifications'],
    usage: 'both',
    requiredFor: [],
  },
  {
    id: 'motivation',
    tags: ['志望動機', '志望の動機', 'Motivation', 'Motivation for Applying'],
    usage: 'rirekisho',
    requiredFor: [],
  },
  {
    id: 'competencies',
    tags: [
      '自己PR',
      '自己pr',
      '自己ＰＲ',
      '自己ｐｒ',
      'Core Competencies',
      'Key Competencies',
      'Competencies',
      'Key Highlights',
      'Superpowers',
    ],
    usage: 'both',
    requiredFor: [],
  },
  {
    id: 'notes',
    tags: ['本人希望記入欄', 'Notes'],
    usage: 'rirekisho',
    requiredFor: [],
  },
  {
    id: 'skills',
    tags: ['スキル', 'Skills', 'Technical Skills'],
    usage: 'both',
    requiredFor: [],
  },
  {
    id: 'languages',
    tags: ['語学', 'Languages', 'Language Skills'],
    usage: 'cv',
    requiredFor: [],
  },
  {
    id: 'cover_letter_body',
    tags: ['Cover Letter', 'Body', 'Letter'],
    usage: 'cover_letter',
    requiredFor: ['cover_letter'],
  },
] as const;

/**
 * Find section definition by tag (case-insensitive)
 */
export function findSectionByTag(tag: string): SectionDef | undefined {
  const normalizedTag = tag.toLowerCase().trim();
  return SECTION_DEFINITIONS.find((def) =>
    def.tags.some((t) => t.toLowerCase() === normalizedTag),
  );
}

/**
 * Get all valid tags for a given output format
 */
export function getValidTagsForFormat(format: OutputFormat): string[] {
  const tags: string[] = [];
  for (const def of SECTION_DEFINITIONS) {
    if (def.usage === 'all') {
      tags.push(...def.tags);
    } else if (format === 'both') {
      if (def.usage !== 'cover_letter') {
        tags.push(...def.tags);
      }
    } else if (def.usage === 'both' || def.usage === format) {
      tags.push(...def.tags);
    }
  }
  return tags;
}

/**
 * Get required section IDs for a given output format
 */
export function getRequiredSectionsForFormat(format: OutputFormat): string[] {
  return SECTION_DEFINITIONS.filter((def) => {
    if (format === 'cover_letter') {
      return def.requiredFor.includes('cover_letter');
    }
    if (format === 'both') {
      return (
        def.requiredFor.includes('cv') || def.requiredFor.includes('rirekisho')
      );
    }
    return def.requiredFor.includes(format) || def.requiredFor.includes('both');
  }).map((def) => def.id);
}

/**
 * Check if a section is valid for a given output format
 */
export function isSectionValidForFormat(
  sectionId: string,
  format: OutputFormat,
): boolean {
  const def = SECTION_DEFINITIONS.find((d) => d.id === sectionId);
  if (!def) return false;
  if (format === 'both') return def.usage !== 'cover_letter';
  if (def.usage === 'all') return true;
  return def.usage === 'both' || def.usage === format;
}

/**
 * CV language type
 */
export type CvLanguage = 'en' | 'ja';

/**
 * Check if text contains Japanese characters (Hiragana, Katakana, or Kanji)
 */
export function isJapaneseText(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

/**
 * Get tags for a section filtered by language
 * @param sectionId The section ID
 * @param language The language to filter by ('en' or 'ja')
 * @returns Array of tags in the specified language
 */
export function getTagsForLanguage(
  sectionId: string,
  language: CvLanguage,
): string[] {
  const def = SECTION_DEFINITIONS.find((d) => d.id === sectionId);
  if (!def) return [];

  return def.tags.filter((tag) => {
    const isJapanese = isJapaneseText(tag);
    return language === 'ja' ? isJapanese : !isJapanese;
  });
}

/**
 * Education entry structure (resume:education block)
 */
export interface EducationEntry {
  readonly school: string;
  readonly degree?: string;
  readonly start: Date;
  readonly end: Date;
  readonly location?: string;
  readonly details?: readonly string[];
  /** Source line info for sync scroll */
  readonly sourceLines?: SourceLineInfo;
}

/**
 * Project entry within a role
 */
export interface ProjectEntry {
  readonly name: string;
  readonly start: Date;
  readonly end: Date;
  readonly bullets?: readonly string[];
}

/**
 * Role entry within experience
 */
export interface RoleEntry {
  readonly title: string;
  readonly start: Date;
  readonly end: Date | 'present';
  readonly team?: string;
  readonly summary?: readonly string[];
  readonly highlights?: readonly string[];
  readonly projects?: readonly ProjectEntry[];
  /** Source line info for sync scroll */
  readonly sourceLines?: SourceLineInfo;
}

/**
 * Experience entry structure (resume:experience block)
 */
export interface ExperienceEntry {
  readonly company: string;
  readonly roles: readonly RoleEntry[];
  readonly location?: string;
  /** Source line info for sync scroll */
  readonly sourceLines?: SourceLineInfo;
}

/**
 * Certification entry structure (resume:certifications block)
 */
export interface CertificationEntry {
  readonly name: string;
  readonly date: Date;
  readonly issuer?: string;
  readonly url?: string;
  /** Source line info for sync scroll */
  readonly sourceLines?: SourceLineInfo;
}

/**
 * Skill entry structure (resume:skills block)
 * Supports two formats:
 * 1. Flat list: items only (category is empty string)
 * 2. Categorized: category with items or description
 */
export interface SkillEntry {
  readonly category: string;
  readonly items?: readonly string[];
  readonly description?: string;
  readonly level?: string;
}

/**
 * Skills section options
 */
export interface SkillsOptions {
  readonly columns: number;
  readonly format: 'grid' | 'categorized';
}

/**
 * Competency entry structure (resume:competencies block)
 */
export interface CompetencyEntry {
  readonly header: string;
  readonly description: string;
}

/**
 * Language entry structure (resume:languages block)
 */
export interface LanguageEntry {
  readonly language: string;
  readonly level: string;
}

/**
 * Table row for rirekisho format
 */
export interface TableRow {
  readonly year: string;
  readonly month: string;
  readonly content: string;
}

// ============================================================================
// Content Block Types - Building blocks for composite content
// ============================================================================

/**
 * Markdown content block - paragraphs, lists, or mixed markdown content
 */
export interface MarkdownBlock {
  readonly type: 'markdown';
  readonly content: string; // Raw markdown text
}

/**
 * Education structured block
 */
export interface EducationBlock {
  readonly type: 'education';
  readonly entries: readonly EducationEntry[];
}

/**
 * Experience structured block
 */
export interface ExperienceBlock {
  readonly type: 'experience';
  readonly entries: readonly ExperienceEntry[];
}

/**
 * Certifications structured block
 */
export interface CertificationsBlock {
  readonly type: 'certifications';
  readonly entries: readonly CertificationEntry[];
}

/**
 * Skills structured block
 */
export interface SkillsBlock {
  readonly type: 'skills';
  readonly entries: readonly SkillEntry[];
  readonly options: SkillsOptions;
}

/**
 * Competencies structured block
 */
export interface CompetenciesBlock {
  readonly type: 'competencies';
  readonly entries: readonly CompetencyEntry[];
}

/**
 * Languages structured block
 */
export interface LanguagesBlock {
  readonly type: 'languages';
  readonly entries: readonly LanguageEntry[];
}

/**
 * Table block for rirekisho format
 */
export interface TableBlock {
  readonly type: 'table';
  readonly rows: readonly TableRow[];
}

/**
 * Content block - a single piece of content within a section
 * Can be either markdown text or a structured data block
 */
export type ContentBlock =
  | MarkdownBlock
  | EducationBlock
  | ExperienceBlock
  | CertificationsBlock
  | SkillsBlock
  | CompetenciesBlock
  | LanguagesBlock
  | TableBlock;

// ============================================================================
// Section Content Types
// ============================================================================

/**
 * Mixed content part for sections containing both paragraphs and lists
 * @deprecated Use ContentBlock[] instead for new code
 */
export type MixedContentPart =
  | { readonly type: 'paragraph'; readonly text: string }
  | { readonly type: 'list'; readonly items: readonly string[] };

/**
 * Legacy section content types (for backward compatibility during transition)
 * @deprecated Use CompositeContent for new code
 */
export type LegacySectionContent =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'list'; readonly items: readonly string[] }
  | { readonly type: 'mixed'; readonly parts: readonly MixedContentPart[] }
  | { readonly type: 'education'; readonly entries: readonly EducationEntry[] }
  | {
      readonly type: 'experience';
      readonly entries: readonly ExperienceEntry[];
    }
  | {
      readonly type: 'certifications';
      readonly entries: readonly CertificationEntry[];
    }
  | {
      readonly type: 'skills';
      readonly entries: readonly SkillEntry[];
      readonly options: SkillsOptions;
    }
  | {
      readonly type: 'competencies';
      readonly entries: readonly CompetencyEntry[];
    }
  | { readonly type: 'languages'; readonly entries: readonly LanguageEntry[] }
  | { readonly type: 'table'; readonly rows: readonly TableRow[] };

/**
 * Composite content - an ordered sequence of content blocks
 * Allows mixing markdown text with structured data blocks
 */
export interface CompositeContent {
  readonly type: 'composite';
  readonly blocks: readonly ContentBlock[];
}

/**
 * Parsed section content - supports both legacy and composite formats
 */
export type SectionContent = LegacySectionContent | CompositeContent;

/**
 * Source line information for sync scroll
 * Used to map HTML elements back to their source markdown lines
 */
export interface SourceLineInfo {
  /** Start line in the source markdown (0-based) */
  readonly startLine: number;
  /** End line in the source markdown (0-based) */
  readonly endLine: number;
}

/**
 * Parsed section
 */
export interface ParsedSection {
  readonly id: string;
  readonly title: string;
  readonly content: SectionContent;
  /** Source line information for sync scroll (optional for backward compatibility) */
  readonly sourceLines?: SourceLineInfo;
}

// ============================================================================
// Helper functions for content blocks
// ============================================================================

/**
 * Check if content is composite (new format)
 */
export function isCompositeContent(
  content: SectionContent,
): content is CompositeContent {
  return content.type === 'composite';
}

/**
 * Check if a content block is a markdown block
 */
export function isMarkdownBlock(block: ContentBlock): block is MarkdownBlock {
  return block.type === 'markdown';
}

/**
 * Check if a content block is a structured block (not markdown)
 */
export function isStructuredBlock(
  block: ContentBlock,
): block is Exclude<ContentBlock, MarkdownBlock> {
  return block.type !== 'markdown';
}

/**
 * Get all markdown blocks from composite content
 */
export function getMarkdownBlocks(
  content: CompositeContent,
): readonly MarkdownBlock[] {
  return content.blocks.filter(isMarkdownBlock);
}

/**
 * Get all structured blocks of a specific type from composite content
 */
export function getBlocksOfType<T extends ContentBlock['type']>(
  content: CompositeContent,
  type: T,
): readonly Extract<ContentBlock, { type: T }>[] {
  return content.blocks.filter(
    (block): block is Extract<ContentBlock, { type: T }> => block.type === type,
  );
}
