/**
 * Template generator unit tests
 */

import { describe, expect, it } from 'vitest';
import { EN_TEMPLATE } from '../../src/template/definitions/en.js';
import { JA_TEMPLATE } from '../../src/template/definitions/ja.js';
import {
  filterSectionsForFormat,
  formatSectionList,
  formatTemplateList,
  generateFrontmatter,
  generateFrontmatterDescription,
  generateSection,
  generateTemplate,
  getAllTemplateInfos,
  getAvailableLanguages,
  getSectionInfos,
  getTemplateDefinition,
  getTemplateInfo,
  isValidLanguage,
} from '../../src/template/index.js';

describe('getTemplateDefinition', () => {
  it('should return English template for "en"', () => {
    const template = getTemplateDefinition('en');
    expect(template.language).toBe('en');
    expect(template.frontmatterFields.length).toBeGreaterThan(0);
    expect(template.sections.length).toBeGreaterThan(0);
  });

  it('should return Japanese template for "ja"', () => {
    const template = getTemplateDefinition('ja');
    expect(template.language).toBe('ja');
    expect(template.frontmatterFields.length).toBeGreaterThan(0);
    expect(template.sections.length).toBeGreaterThan(0);
  });

  it('should have required fields marked correctly', () => {
    const enTemplate = getTemplateDefinition('en');
    const requiredFields = enTemplate.frontmatterFields.filter(
      (f) => f.required,
    );
    expect(requiredFields.map((f) => f.key)).toContain('name');
    expect(requiredFields.map((f) => f.key)).toContain('email_address');
    expect(requiredFields.map((f) => f.key)).toContain('phone_number');
  });
});

describe('getTemplateInfo', () => {
  it('should return template info for English', () => {
    const info = getTemplateInfo('en');
    expect(info.language).toBe('en');
    expect(info.languageName).toBe('English');
    expect(info.formats).toContain('cv');
    expect(info.formats).toContain('rirekisho');
    expect(info.formats).toContain('both');
    expect(info.sectionCount).toBeGreaterThan(0);
    expect(info.frontmatterFieldCount).toBeGreaterThan(0);
  });

  it('should return template info for Japanese', () => {
    const info = getTemplateInfo('ja');
    expect(info.language).toBe('ja');
    expect(info.languageName).toBe('日本語 (Japanese)');
    expect(info.formats).toContain('cv');
    expect(info.sectionCount).toBeGreaterThan(0);
  });
});

describe('getAllTemplateInfos', () => {
  it('should return info for all available languages', () => {
    const infos = getAllTemplateInfos();
    expect(infos.length).toBe(2);
    expect(infos.map((i) => i.language)).toContain('en');
    expect(infos.map((i) => i.language)).toContain('ja');
  });
});

describe('getSectionInfos', () => {
  it('should return section infos for CV format', () => {
    const sections = getSectionInfos('en', 'cv');
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.map((s) => s.id)).toContain('summary');
    expect(sections.map((s) => s.id)).toContain('experience');
    expect(sections.map((s) => s.id)).not.toContain('motivation');
  });

  it('should return section infos for rirekisho format', () => {
    const sections = getSectionInfos('en', 'rirekisho');
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.map((s) => s.id)).toContain('motivation');
    expect(sections.map((s) => s.id)).toContain('notes');
    expect(sections.map((s) => s.id)).not.toContain('summary');
  });

  it('should return all sections for both format', () => {
    const sections = getSectionInfos('en', 'both');
    expect(sections.map((s) => s.id)).toContain('summary');
    expect(sections.map((s) => s.id)).toContain('motivation');
  });
});

describe('formatSectionList', () => {
  it('should format section list for English CV', () => {
    const output = formatSectionList('en', 'cv');
    expect(output).toContain('Available sections (cv format):');
    expect(output).toContain('summary');
    expect(output).toContain('Title:');
    expect(output).toContain('Usage:');
    expect(output).toContain('Description:');
  });

  it('should format section list for Japanese CV', () => {
    const output = formatSectionList('ja', 'cv');
    expect(output).toContain('利用可能なセクション (cv フォーマット):');
    expect(output).toContain('summary');
    expect(output).toContain('タイトル:');
    expect(output).toContain('用途:');
    expect(output).toContain('説明:');
  });
});

describe('formatTemplateList', () => {
  it('should format template list', () => {
    const output = formatTemplateList();
    expect(output).toContain('Available templates:');
    expect(output).toContain('en - English');
    expect(output).toContain('ja - 日本語 (Japanese)');
    expect(output).toContain('Formats:');
    expect(output).toContain('Sections:');
    expect(output).toContain('Frontmatter fields:');
  });
});

describe('filterSectionsForFormat', () => {
  it('should return all sections for "both" format', () => {
    const sections = filterSectionsForFormat(EN_TEMPLATE.sections, 'both');
    expect(sections.length).toBe(EN_TEMPLATE.sections.length);
  });

  it('should filter CV-only sections for "cv" format', () => {
    const sections = filterSectionsForFormat(EN_TEMPLATE.sections, 'cv');
    const sectionIds = sections.map((s) => s.id);

    // CV sections should be included
    expect(sectionIds).toContain('summary');
    expect(sectionIds).toContain('experience');
    expect(sectionIds).toContain('education');
    expect(sectionIds).toContain('skills');
    expect(sectionIds).toContain('languages');

    // Rirekisho-only sections should be excluded
    expect(sectionIds).not.toContain('motivation');
    expect(sectionIds).not.toContain('notes');
  });

  it('should filter rirekisho-only sections for "rirekisho" format', () => {
    const sections = filterSectionsForFormat(EN_TEMPLATE.sections, 'rirekisho');
    const sectionIds = sections.map((s) => s.id);

    // Rirekisho sections should be included
    expect(sectionIds).toContain('experience');
    expect(sectionIds).toContain('education');
    expect(sectionIds).toContain('motivation');
    expect(sectionIds).toContain('notes');

    // CV-only sections should be excluded
    expect(sectionIds).not.toContain('summary');
    expect(sectionIds).not.toContain('languages');
  });
});

describe('generateFrontmatter', () => {
  it('should generate frontmatter with YAML fields', () => {
    const frontmatter = generateFrontmatter(
      EN_TEMPLATE.frontmatterFields,
      true,
      'en',
    );

    expect(frontmatter).toContain('---');
    expect(frontmatter).toContain('name:');
    expect(frontmatter).toContain('email_address:');
    // Comments are NOT included inside YAML frontmatter to avoid parsing issues
    expect(frontmatter).not.toContain('# ');
  });

  it('should generate frontmatter without comments', () => {
    const frontmatter = generateFrontmatter(
      EN_TEMPLATE.frontmatterFields,
      false,
      'en',
    );

    expect(frontmatter).toContain('---');
    expect(frontmatter).toContain('name:');
    expect(frontmatter).not.toContain('# ');
  });

  it('should generate valid YAML frontmatter', () => {
    const frontmatter = generateFrontmatter(
      EN_TEMPLATE.frontmatterFields,
      true,
      'en',
    );

    // Should start and end with ---
    const lines = frontmatter.split('\n');
    expect(lines[0]).toBe('---');
    expect(lines[lines.length - 1]).toBe('---');

    // All lines between should be valid YAML key: value pairs
    for (let i = 1; i < lines.length - 1; i++) {
      expect(lines[i]).toMatch(/^[a-z_]+: .+$/);
    }
  });
});

describe('generateFrontmatterDescription', () => {
  it('should generate HTML comment with field descriptions for English', () => {
    const description = generateFrontmatterDescription(
      EN_TEMPLATE.frontmatterFields,
      'en',
    );

    expect(description).toContain('<!-- Frontmatter Field Descriptions:');
    expect(description).toContain('-->');
    expect(description).toContain('name:');
    expect(description).toContain('(required)');
    expect(description).toContain('(optional)');
  });

  it('should generate HTML comment with field descriptions for Japanese', () => {
    const description = generateFrontmatterDescription(
      JA_TEMPLATE.frontmatterFields,
      'ja',
    );

    expect(description).toContain('<!-- フロントマターフィールドの説明:');
    expect(description).toContain('-->');
    expect(description).toContain('name:');
    expect(description).toContain('(必須)');
    expect(description).toContain('(任意)');
  });

  it('should include all field keys', () => {
    const description = generateFrontmatterDescription(
      EN_TEMPLATE.frontmatterFields,
      'en',
    );

    for (const field of EN_TEMPLATE.frontmatterFields) {
      expect(description).toContain(`${field.key}:`);
    }
  });
});

describe('generateSection', () => {
  it('should generate section with title and content', () => {
    const section = EN_TEMPLATE.sections.find((s) => s.id === 'experience')!;
    const output = generateSection(section, false, 'en');

    expect(output).toContain('# Experience');
    expect(output).toContain('resume:experience');
  });

  it('should include comments when enabled', () => {
    const section = EN_TEMPLATE.sections.find((s) => s.id === 'experience')!;
    const output = generateSection(section, true, 'en');

    expect(output).toContain('<!--');
    expect(output).toContain('-->');
  });

  it('should exclude comments when disabled', () => {
    const section = EN_TEMPLATE.sections.find((s) => s.id === 'experience')!;
    const output = generateSection(section, false, 'en');

    expect(output).not.toContain('<!--');
    expect(output).not.toContain('-->');
  });
});

describe('generateTemplate', () => {
  it('should generate complete English CV template', () => {
    const template = generateTemplate({
      language: 'en',
      format: 'cv',
      includeComments: true,
      outputPath: undefined,
    });

    expect(template).toContain('---');
    expect(template).toContain('name:');
    expect(template).toContain('# Summary');
    expect(template).toContain('# Experience');
    expect(template).toContain('# Education');
    expect(template).toContain('# Skills');
    expect(template).not.toContain('# Motivation');
    expect(template).not.toContain('# Notes');
  });

  it('should generate complete Japanese rirekisho template', () => {
    const template = generateTemplate({
      language: 'ja',
      format: 'rirekisho',
      includeComments: true,
      outputPath: undefined,
    });

    expect(template).toContain('---');
    expect(template).toContain('name:');
    expect(template).toContain('# 職歴');
    expect(template).toContain('# 学歴');
    expect(template).toContain('# 志望動機');
    expect(template).toContain('# 本人希望記入欄');
    expect(template).not.toContain('# 職務要約');
    expect(template).not.toContain('# 語学');
  });

  it('should generate template for "both" format', () => {
    const template = generateTemplate({
      language: 'en',
      format: 'both',
      includeComments: false,
      outputPath: undefined,
    });

    // Should include all sections
    expect(template).toContain('# Summary');
    expect(template).toContain('# Experience');
    expect(template).toContain('# Motivation');
    expect(template).toContain('# Notes');
    expect(template).toContain('# Languages');
  });

  it('should include header comment when comments enabled', () => {
    const template = generateTemplate({
      language: 'en',
      format: 'cv',
      includeComments: true,
      outputPath: undefined,
    });

    expect(template).toContain('md2cv Template');
    expect(template).toContain('Format: cv');
  });

  it('should exclude header comment when comments disabled', () => {
    const template = generateTemplate({
      language: 'en',
      format: 'cv',
      includeComments: false,
      outputPath: undefined,
    });

    expect(template).not.toContain('md2cv Template');
  });
});

describe('getAvailableLanguages', () => {
  it('should return available languages', () => {
    const languages = getAvailableLanguages();
    expect(languages).toContain('en');
    expect(languages).toContain('ja');
  });
});

describe('isValidLanguage', () => {
  it('should return true for valid languages', () => {
    expect(isValidLanguage('en')).toBe(true);
    expect(isValidLanguage('ja')).toBe(true);
  });

  it('should return false for invalid languages', () => {
    expect(isValidLanguage('fr')).toBe(false);
    expect(isValidLanguage('de')).toBe(false);
    expect(isValidLanguage('')).toBe(false);
  });
});

describe('Template definitions', () => {
  describe('English template', () => {
    it('should have detailed descriptions for all sections', () => {
      for (const section of EN_TEMPLATE.sections) {
        expect(section.description.length).toBeGreaterThan(50);
      }
    });

    it('should have github and website fields', () => {
      const fieldKeys = EN_TEMPLATE.frontmatterFields.map((f) => f.key);
      expect(fieldKeys).toContain('github');
      expect(fieldKeys).toContain('website');
    });
  });

  describe('Japanese template', () => {
    it('should have detailed descriptions for all sections', () => {
      for (const section of JA_TEMPLATE.sections) {
        expect(section.description.length).toBeGreaterThan(30);
      }
    });

    it('should have github and website fields', () => {
      const fieldKeys = JA_TEMPLATE.frontmatterFields.map((f) => f.key);
      expect(fieldKeys).toContain('github');
      expect(fieldKeys).toContain('website');
    });
  });
});
