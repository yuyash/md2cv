/**
 * Template integration tests
 * Tests the template generation and parsing flow
 */

import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../src/parser/index.js';
import {
  formatSectionList,
  formatTemplateList,
  generateTemplate,
  getSectionInfos,
} from '../../src/template/index.js';

describe('Template Integration', () => {
  describe('Generated templates should be parseable', () => {
    it('should parse English CV template', () => {
      const template = generateTemplate({
        language: 'en',
        format: 'cv',
        includeComments: true,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should have metadata from template
        expect(result.value.metadata.name).toBe('John Doe');
        expect(result.value.metadata.email_address).toBe(
          'john.doe@example.com',
        );
        expect(result.value.metadata.phone_number).toBe('+1-555-123-4567');

        // Should have CV sections
        const sectionIds = result.value.sections.map((s) => s.id);
        expect(sectionIds).toContain('summary');
        expect(sectionIds).toContain('experience');
        expect(sectionIds).toContain('education');
        expect(sectionIds).toContain('skills');
      }
    });

    it('should parse Japanese CV template', () => {
      const template = generateTemplate({
        language: 'ja',
        format: 'cv',
        includeComments: true,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.name).toBe('山田 太郎');
        expect(result.value.metadata.email_address).toBe(
          'taro.yamada@example.com',
        );

        const sectionIds = result.value.sections.map((s) => s.id);
        expect(sectionIds).toContain('summary');
        expect(sectionIds).toContain('experience');
      }
    });

    it('should parse English rirekisho template', () => {
      const template = generateTemplate({
        language: 'en',
        format: 'rirekisho',
        includeComments: true,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const sectionIds = result.value.sections.map((s) => s.id);
        expect(sectionIds).toContain('experience');
        expect(sectionIds).toContain('education');
        expect(sectionIds).toContain('motivation');
        expect(sectionIds).toContain('notes');
        // CV-only sections should not be present
        expect(sectionIds).not.toContain('summary');
        expect(sectionIds).not.toContain('languages');
      }
    });

    it('should parse Japanese rirekisho template', () => {
      const template = generateTemplate({
        language: 'ja',
        format: 'rirekisho',
        includeComments: true,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const sectionIds = result.value.sections.map((s) => s.id);
        expect(sectionIds).toContain('experience');
        expect(sectionIds).toContain('motivation');
        expect(sectionIds).toContain('notes');
      }
    });

    it('should parse "both" format template', () => {
      const template = generateTemplate({
        language: 'en',
        format: 'both',
        includeComments: false,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const sectionIds = result.value.sections.map((s) => s.id);
        // Should have all sections
        expect(sectionIds).toContain('summary');
        expect(sectionIds).toContain('experience');
        expect(sectionIds).toContain('motivation');
        expect(sectionIds).toContain('notes');
        expect(sectionIds).toContain('languages');
      }
    });
  });

  describe('Template without comments should be parseable', () => {
    it('should parse template without comments', () => {
      const template = generateTemplate({
        language: 'en',
        format: 'cv',
        includeComments: false,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);

      // Should not contain HTML comments
      expect(template).not.toContain('<!--');
      expect(template).not.toContain('-->');
    });
  });

  describe('Experience section should have correct structure', () => {
    it('should parse experience entries from template', () => {
      const template = generateTemplate({
        language: 'en',
        format: 'cv',
        includeComments: false,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const expSection = result.value.sections.find(
          (s) => s.id === 'experience',
        );
        expect(expSection).toBeDefined();
        expect(expSection?.content.type).toBe('experience');
        if (expSection?.content.type === 'experience') {
          expect(expSection.content.entries.length).toBeGreaterThan(0);
          expect(expSection.content.entries[0]?.company).toBe('Company Name');
        }
      }
    });
  });

  describe('Education section should have correct structure', () => {
    it('should parse education entries from template', () => {
      const template = generateTemplate({
        language: 'en',
        format: 'cv',
        includeComments: false,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const eduSection = result.value.sections.find(
          (s) => s.id === 'education',
        );
        expect(eduSection).toBeDefined();
        expect(eduSection?.content.type).toBe('education');
        if (eduSection?.content.type === 'education') {
          expect(eduSection.content.entries.length).toBeGreaterThan(0);
          expect(eduSection.content.entries[0]?.school).toBe('University Name');
        }
      }
    });
  });

  describe('Skills section should have correct structure', () => {
    it('should parse skills entries from template', () => {
      const template = generateTemplate({
        language: 'en',
        format: 'cv',
        includeComments: false,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const skillsSection = result.value.sections.find(
          (s) => s.id === 'skills',
        );
        expect(skillsSection).toBeDefined();
        expect(skillsSection?.content.type).toBe('skills');
        if (skillsSection?.content.type === 'skills') {
          expect(skillsSection.content.entries.length).toBeGreaterThan(0);
          expect(skillsSection.content.entries[0]?.category).toBe(
            'Programming Languages',
          );
        }
      }
    });
  });

  describe('Section info and template list integration', () => {
    it('should have consistent section counts between getSectionInfos and generated template', () => {
      const sectionInfos = getSectionInfos('en', 'cv');
      const template = generateTemplate({
        language: 'en',
        format: 'cv',
        includeComments: false,
        outputPath: undefined,
      });

      const result = parseMarkdown(template);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Section count should match
        expect(result.value.sections.length).toBe(sectionInfos.length);
      }
    });

    it('should format section list with all required information', () => {
      const output = formatSectionList('en', 'cv');
      const sectionInfos = getSectionInfos('en', 'cv');

      // All section IDs should be in the output
      for (const info of sectionInfos) {
        expect(output).toContain(info.id);
        expect(output).toContain(info.title);
      }
    });

    it('should format template list with all languages', () => {
      const output = formatTemplateList();

      expect(output).toContain('en');
      expect(output).toContain('ja');
      expect(output).toContain('English');
      expect(output).toContain('日本語');
    });
  });
});
