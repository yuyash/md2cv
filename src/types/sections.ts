/**
 * Section types and definitions for CV/rirekisho
 */

import type { OutputFormat } from './config.js';

/**
 * Section usage context
 */
export type SectionUsage = 'cv' | 'rirekisho' | 'both';

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
    if (format === 'both' || def.usage === 'both' || def.usage === format) {
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
  if (format === 'both') return true;
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
}

/**
 * Experience entry structure (resume:experience block)
 */
export interface ExperienceEntry {
  readonly company: string;
  readonly roles: readonly RoleEntry[];
  readonly location?: string;
}

/**
 * Certification entry structure (resume:certifications block)
 */
export interface CertificationEntry {
  readonly name: string;
  readonly date: Date;
  readonly issuer?: string;
  readonly url?: string;
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
 * Parsed section content
 */
export type SectionContent =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'list'; readonly items: readonly string[] }
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
 * Table row for rirekisho format
 */
export interface TableRow {
  readonly year: string;
  readonly month: string;
  readonly content: string;
}

/**
 * Parsed section
 */
export interface ParsedSection {
  readonly id: string;
  readonly title: string;
  readonly content: SectionContent;
}
