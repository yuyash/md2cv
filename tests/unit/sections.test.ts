/**
 * Unit tests for section types and functions
 */

import { describe, expect, it } from 'vitest';

import {
  findSectionByTag,
  getRequiredSectionsForFormat,
  getTagsForLanguage,
  getValidTagsForFormat,
  isJapaneseText,
  isSectionValidForFormat,
  SECTION_DEFINITIONS,
} from '../../src/types/sections.js';

describe('SECTION_DEFINITIONS', () => {
  it('should contain all expected sections', () => {
    const sectionIds = SECTION_DEFINITIONS.map((s) => s.id);

    expect(sectionIds).toContain('summary');
    expect(sectionIds).toContain('education');
    expect(sectionIds).toContain('experience');
    expect(sectionIds).toContain('certifications');
    expect(sectionIds).toContain('motivation');
    expect(sectionIds).toContain('competencies');
    expect(sectionIds).toContain('notes');
    expect(sectionIds).toContain('skills');
    expect(sectionIds).toContain('languages');
  });

  it('should have valid usage values', () => {
    for (const section of SECTION_DEFINITIONS) {
      expect(['cv', 'rirekisho', 'both']).toContain(section.usage);
    }
  });

  it('should have non-empty tags for each section', () => {
    for (const section of SECTION_DEFINITIONS) {
      expect(section.tags.length).toBeGreaterThan(0);
    }
  });
});

describe('findSectionByTag', () => {
  it('should find section by exact English tag', () => {
    const section = findSectionByTag('Summary');

    expect(section).toBeDefined();
    expect(section?.id).toBe('summary');
  });

  it('should find section by exact Japanese tag', () => {
    const section = findSectionByTag('職歴');

    expect(section).toBeDefined();
    expect(section?.id).toBe('experience');
  });

  it('should be case-insensitive', () => {
    const lower = findSectionByTag('summary');
    const upper = findSectionByTag('SUMMARY');
    const mixed = findSectionByTag('SuMmArY');

    expect(lower?.id).toBe('summary');
    expect(upper?.id).toBe('summary');
    expect(mixed?.id).toBe('summary');
  });

  it('should trim whitespace', () => {
    const section = findSectionByTag('  Summary  ');

    expect(section?.id).toBe('summary');
  });

  it('should return undefined for unknown tag', () => {
    const section = findSectionByTag('Unknown Section');

    expect(section).toBeUndefined();
  });

  it('should find all defined tags', () => {
    // Test a sample of tags from different sections
    expect(findSectionByTag('Professional Summary')?.id).toBe('summary');
    expect(findSectionByTag('Education')?.id).toBe('education');
    expect(findSectionByTag('Work Experience')?.id).toBe('experience');
    expect(findSectionByTag('免許・資格')?.id).toBe('certifications');
    expect(findSectionByTag('志望動機')?.id).toBe('motivation');
    expect(findSectionByTag('自己PR')?.id).toBe('competencies');
    expect(findSectionByTag('本人希望記入欄')?.id).toBe('notes');
    expect(findSectionByTag('Technical Skills')?.id).toBe('skills');
    expect(findSectionByTag('Language Skills')?.id).toBe('languages');
  });
});

describe('getValidTagsForFormat', () => {
  it('should return CV-only and both tags for cv format', () => {
    const tags = getValidTagsForFormat('cv');

    // Should include CV-only sections
    expect(tags).toContain('Summary');
    expect(tags).toContain('Languages');

    // Should include both sections
    expect(tags).toContain('Education');
    expect(tags).toContain('Experience');
    expect(tags).toContain('Skills');

    // Should NOT include rirekisho-only sections
    expect(tags).not.toContain('志望動機');
    expect(tags).not.toContain('本人希望記入欄');
  });

  it('should return rirekisho-only and both tags for rirekisho format', () => {
    const tags = getValidTagsForFormat('rirekisho');

    // Should include rirekisho-only sections
    expect(tags).toContain('志望動機');
    expect(tags).toContain('本人希望記入欄');

    // Should include both sections
    expect(tags).toContain('学歴');
    expect(tags).toContain('職歴');

    // Should NOT include CV-only sections
    expect(tags).not.toContain('Summary');
    expect(tags).not.toContain('Languages');
  });

  it('should return all tags for both format', () => {
    const tags = getValidTagsForFormat('both');

    // Should include all sections
    expect(tags).toContain('Summary');
    expect(tags).toContain('Languages');
    expect(tags).toContain('志望動機');
    expect(tags).toContain('本人希望記入欄');
    expect(tags).toContain('Education');
    expect(tags).toContain('Skills');
  });
});

describe('getRequiredSectionsForFormat', () => {
  it('should return required sections for cv format', () => {
    const required = getRequiredSectionsForFormat('cv');

    // Experience is required for CV
    expect(required).toContain('experience');
  });

  it('should return required sections for rirekisho format', () => {
    const required = getRequiredSectionsForFormat('rirekisho');

    // Experience is required for rirekisho
    expect(required).toContain('experience');
  });

  it('should return required sections for both format', () => {
    const required = getRequiredSectionsForFormat('both');

    // Experience is required for both
    expect(required).toContain('experience');
  });
});

describe('isSectionValidForFormat', () => {
  describe('CV format', () => {
    it('should accept CV-only sections', () => {
      expect(isSectionValidForFormat('summary', 'cv')).toBe(true);
      expect(isSectionValidForFormat('languages', 'cv')).toBe(true);
    });

    it('should accept both sections', () => {
      expect(isSectionValidForFormat('education', 'cv')).toBe(true);
      expect(isSectionValidForFormat('experience', 'cv')).toBe(true);
      expect(isSectionValidForFormat('skills', 'cv')).toBe(true);
      expect(isSectionValidForFormat('certifications', 'cv')).toBe(true);
      expect(isSectionValidForFormat('competencies', 'cv')).toBe(true);
    });

    it('should reject rirekisho-only sections', () => {
      expect(isSectionValidForFormat('motivation', 'cv')).toBe(false);
      expect(isSectionValidForFormat('notes', 'cv')).toBe(false);
    });
  });

  describe('Rirekisho format', () => {
    it('should accept rirekisho-only sections', () => {
      expect(isSectionValidForFormat('motivation', 'rirekisho')).toBe(true);
      expect(isSectionValidForFormat('notes', 'rirekisho')).toBe(true);
    });

    it('should accept both sections', () => {
      expect(isSectionValidForFormat('education', 'rirekisho')).toBe(true);
      expect(isSectionValidForFormat('experience', 'rirekisho')).toBe(true);
      expect(isSectionValidForFormat('skills', 'rirekisho')).toBe(true);
      expect(isSectionValidForFormat('certifications', 'rirekisho')).toBe(true);
      expect(isSectionValidForFormat('competencies', 'rirekisho')).toBe(true);
    });

    it('should reject CV-only sections', () => {
      expect(isSectionValidForFormat('summary', 'rirekisho')).toBe(false);
      expect(isSectionValidForFormat('languages', 'rirekisho')).toBe(false);
    });
  });

  describe('Both format', () => {
    it('should accept all sections', () => {
      expect(isSectionValidForFormat('summary', 'both')).toBe(true);
      expect(isSectionValidForFormat('languages', 'both')).toBe(true);
      expect(isSectionValidForFormat('motivation', 'both')).toBe(true);
      expect(isSectionValidForFormat('notes', 'both')).toBe(true);
      expect(isSectionValidForFormat('education', 'both')).toBe(true);
      expect(isSectionValidForFormat('experience', 'both')).toBe(true);
    });
  });

  describe('Unknown sections', () => {
    it('should return false for unknown section IDs', () => {
      expect(isSectionValidForFormat('unknown', 'cv')).toBe(false);
      expect(isSectionValidForFormat('invalid', 'rirekisho')).toBe(false);
      expect(isSectionValidForFormat('nonexistent', 'both')).toBe(false);
    });
  });
});

describe('isJapaneseText', () => {
  it('should return true for Hiragana', () => {
    expect(isJapaneseText('あいうえお')).toBe(true);
  });

  it('should return true for Katakana', () => {
    expect(isJapaneseText('アイウエオ')).toBe(true);
  });

  it('should return true for Kanji', () => {
    expect(isJapaneseText('漢字')).toBe(true);
    expect(isJapaneseText('職歴')).toBe(true);
  });

  it('should return true for mixed Japanese and English', () => {
    expect(isJapaneseText('Hello 世界')).toBe(true);
    expect(isJapaneseText('自己PR')).toBe(true);
  });

  it('should return false for English only', () => {
    expect(isJapaneseText('Experience')).toBe(false);
    expect(isJapaneseText('Work Experience')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isJapaneseText('')).toBe(false);
  });
});

describe('getTagsForLanguage', () => {
  it('should return English tags for experience section', () => {
    const tags = getTagsForLanguage('experience', 'en');

    expect(tags).toContain('Experience');
    expect(tags).toContain('Work Experience');
    expect(tags).toContain('Professional Experience');
    expect(tags).not.toContain('職歴');
    expect(tags).not.toContain('職務経歴');
  });

  it('should return Japanese tags for experience section', () => {
    const tags = getTagsForLanguage('experience', 'ja');

    expect(tags).toContain('職歴');
    expect(tags).toContain('職務経歴');
    expect(tags).toContain('職務履歴');
    expect(tags).not.toContain('Experience');
    expect(tags).not.toContain('Work Experience');
  });

  it('should return English tags for education section', () => {
    const tags = getTagsForLanguage('education', 'en');

    expect(tags).toContain('Education');
    expect(tags).not.toContain('学歴');
  });

  it('should return Japanese tags for education section', () => {
    const tags = getTagsForLanguage('education', 'ja');

    expect(tags).toContain('学歴');
    expect(tags).not.toContain('Education');
  });

  it('should return empty array for unknown section', () => {
    const tags = getTagsForLanguage('unknown', 'en');

    expect(tags).toEqual([]);
  });

  it('should handle sections with only one language', () => {
    // Notes section has both Japanese and English tags
    const enTags = getTagsForLanguage('notes', 'en');
    const jaTags = getTagsForLanguage('notes', 'ja');

    expect(enTags).toContain('Notes');
    expect(jaTags).toContain('本人希望記入欄');
  });
});
