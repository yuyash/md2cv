/**
 * Integration tests for rirekisho generator
 *
 * These tests verify the interaction between multiple modules:
 * - data.ts + layout.ts: Data counting affects layout calculation
 * - layout.ts + components.ts: Layout dimensions affect component rendering
 * - data.ts + components.ts: Extracted data is rendered correctly
 * - Full pipeline: data → layout → components → styles
 */

import { describe, expect, it } from 'vitest';
import {
  buildLeftPage,
  buildRightPage,
  getAdjustedHistoryData,
} from '../../src/generator/rirekisho/components.js';
import {
  buildHistoryData,
  buildLicenseData,
  countDataRows,
  extractPersonalInfo,
  getSectionText,
} from '../../src/generator/rirekisho/data.js';
import { generateRirekishoHTML } from '../../src/generator/rirekisho/index.js';
import {
  calculateLayout,
  validateLayout,
} from '../../src/generator/rirekisho/layout.js';
import { generateCSS } from '../../src/generator/rirekisho/styles.js';
import type {
  RirekishoInput,
  RirekishoOptions,
} from '../../src/generator/rirekisho/types.js';
import type { CVMetadata } from '../../src/types/metadata.js';
import type { ParsedSection } from '../../src/types/sections.js';

describe('rirekisho integration', () => {
  // Test fixtures
  const createMetadata = (): CVMetadata => ({
    name: 'Test User',
    name_ja: '山田 太郎',
    name_furigana: 'やまだ たろう',
    email_address: 'taro@example.com',
    phone_number: '090-1234-5678',
    home_address: '東京都渋谷区テスト町1-2-3',
    home_address_furigana: 'とうきょうと しぶやく',
    post_code: '150-0001',
    gender: 'male',
    dob: new Date('1990-06-15'),
  });

  const createEducationSection = (): ParsedSection => ({
    id: 'education',
    title: '学歴',
    content: {
      type: 'education',
      entries: [
        {
          school: '東京大学',
          degree: '工学部',
          location: undefined,
          start: new Date('2015-04-01'),
          end: new Date('2019-03-31'),
          details: undefined,
        },
      ],
    },
  });

  const createExperienceSection = (): ParsedSection => ({
    id: 'experience',
    title: '職歴',
    content: {
      type: 'experience',
      entries: [
        {
          company: '株式会社テスト',
          location: undefined,
          roles: [
            {
              title: 'エンジニア',
              team: undefined,
              start: new Date('2019-04-01'),
              end: 'present',
              summary: undefined,
              highlights: undefined,
              projects: undefined,
            },
          ],
        },
      ],
    },
  });

  const createCertificationsSection = (): ParsedSection => ({
    id: 'certifications',
    title: '資格',
    content: {
      type: 'certifications',
      entries: [
        {
          name: '基本情報技術者',
          issuer: undefined,
          date: new Date('2020-04-01'),
          url: undefined,
        },
      ],
    },
  });

  const createMotivationSection = (): ParsedSection => ({
    id: 'motivation',
    title: '志望動機',
    content: {
      type: 'text',
      text: 'テスト志望動機です。',
    },
  });

  const createNotesSection = (): ParsedSection => ({
    id: 'notes',
    title: '本人希望記入欄',
    content: {
      type: 'text',
      text: 'テスト備考です。',
    },
  });

  describe('data + layout integration', () => {
    it('should calculate layout based on data counts', () => {
      const sections = [
        createEducationSection(),
        createExperienceSection(),
        createCertificationsSection(),
      ];

      const dataCounts = countDataRows(sections);
      const layout = calculateLayout({
        paperSize: 'a4',
        hideMotivation: false,
        dataCounts,
      });

      // Layout should accommodate the data
      expect(layout.leftHistoryRows).toBeGreaterThan(0);
      expect(layout.licenseRows).toBeGreaterThanOrEqual(
        dataCounts.licenseDataRows,
      );
    });

    it('should adjust row height for large data', () => {
      // Create many education entries
      const manyEducationEntries = Array.from({ length: 10 }, (_, i) => ({
        school: `大学${i + 1}`,
        degree: '学部',
        location: undefined,
        start: new Date(`${2000 + i}-04-01`),
        end: new Date(`${2004 + i}-03-31`),
        details: undefined,
      }));

      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: { type: 'education', entries: manyEducationEntries },
        },
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'certifications',
            entries: Array.from({ length: 10 }, (_, i) => ({
              name: `資格${i + 1}`,
              issuer: undefined,
              date: new Date(`${2020 + i}-04-01`),
              url: undefined,
            })),
          },
        },
      ];

      const dataCounts = countDataRows(sections);
      const layout = calculateLayout({
        paperSize: 'b5', // Smallest paper
        hideMotivation: false,
        dataCounts,
      });

      // With large data on small paper, row height should be reduced
      expect(layout.tableRowHeight).toBeLessThanOrEqual(9.0 * 0.61); // default * b5 scale
    });

    it('should set overflow flag when data exceeds capacity', () => {
      // Create extremely large data
      const hugeEducationEntries = Array.from({ length: 50 }, (_, i) => ({
        school: `大学${i + 1}`,
        degree: '学部',
        location: undefined,
        start: new Date(`${1950 + i}-04-01`),
        end: new Date(`${1954 + i}-03-31`),
        details: undefined,
      }));

      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: { type: 'education', entries: hugeEducationEntries },
        },
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'certifications',
            entries: Array.from({ length: 30 }, (_, i) => ({
              name: `資格${i + 1}`,
              issuer: undefined,
              date: new Date(`${2020}-04-01`),
              url: undefined,
            })),
          },
        },
      ];

      const dataCounts = countDataRows(sections);
      const layout = calculateLayout({
        paperSize: 'b5',
        hideMotivation: false,
        dataCounts,
      });

      expect(layout.overflows).toBe(true);
      expect(validateLayout(layout)).not.toBeNull();
    });
  });

  describe('layout + components integration', () => {
    it('should render components with correct layout dimensions', () => {
      const sections = [createEducationSection(), createExperienceSection()];
      const dataCounts = countDataRows(sections);
      const layout = calculateLayout({
        paperSize: 'a4',
        hideMotivation: false,
        dataCounts,
      });

      const info = extractPersonalInfo(createMetadata(), new Date());
      const history = buildHistoryData(sections, 'asc');

      const leftPageHtml = buildLeftPage({
        layout,
        info,
        history,
        today: { year: 2024, month: 12, day: 25 },
      });

      // Should contain scaled dimensions in mm
      expect(leftPageHtml).toContain('mm');
      // Should contain the history table
      expect(leftPageHtml).toContain('学 歴 ・ 職 歴');
    });

    it('should hide motivation section when layout specifies', () => {
      const sections = [createEducationSection()];
      const dataCounts = countDataRows(sections);
      const layout = calculateLayout({
        paperSize: 'a4',
        hideMotivation: true,
        dataCounts,
      });

      const history = buildHistoryData(sections, 'asc');
      const license = buildLicenseData(sections, 'asc');

      const rightPageHtml = buildRightPage({
        layout,
        history,
        license,
        motivation: 'テスト志望動機',
        competencies: [],
        notes: 'テスト備考',
      });

      expect(rightPageHtml).not.toContain('志望の動機');
      expect(rightPageHtml).toContain('本人希望記入欄');
    });

    it('should adjust history data when 職歴 is at last row', () => {
      // Create data where 職歴 would be at the last row of left page
      const sections = [createEducationSection(), createExperienceSection()];
      const history = buildHistoryData(sections, 'asc');
      const dataCounts = countDataRows(sections);
      const layout = calculateLayout({
        paperSize: 'a4',
        hideMotivation: false,
        dataCounts,
      });

      // Find where 職歴 is in the history
      const shokurekiIndex = history.findIndex((row) => row[2] === '職歴');

      // If 職歴 would be at the last row of left page
      if (shokurekiIndex === layout.leftHistoryRows - 1) {
        const { leftData, rightData, shokurekiMovedToRight } =
          getAdjustedHistoryData(history, layout.leftHistoryRows);

        expect(shokurekiMovedToRight).toBe(true);
        expect(rightData[0][2]).toBe('職歴');
        expect(leftData.length).toBeLessThan(layout.leftHistoryRows);
      }
    });
  });

  describe('data + components integration', () => {
    it('should render extracted personal info correctly', () => {
      const metadata = createMetadata();
      const info = extractPersonalInfo(metadata, new Date('2024-12-25'));

      const sections = [createEducationSection()];
      const dataCounts = countDataRows(sections);
      const layout = calculateLayout({
        paperSize: 'a4',
        hideMotivation: false,
        dataCounts,
      });

      const leftPageHtml = buildLeftPage({
        layout,
        info,
        history: [],
        today: { year: 2024, month: 12, day: 25 },
      });

      expect(leftPageHtml).toContain('山田 太郎');
      expect(leftPageHtml).toContain('やまだ たろう');
      expect(leftPageHtml).toContain('090-1234-5678');
      expect(leftPageHtml).toContain('東京都渋谷区テスト町1-2-3');
      expect(leftPageHtml).toContain('男');
    });

    it('should render history data in correct order', () => {
      const sections = [createEducationSection(), createExperienceSection()];
      const historyAsc = buildHistoryData(sections, 'asc');
      const historyDesc = buildHistoryData(sections, 'desc');

      // Filter out label rows (学歴, 職歴, 現在に至る, 以上) and get years
      const getYearsFromSection = (
        history: typeof historyAsc,
        sectionLabel: string,
      ): number[] => {
        const startIdx = history.findIndex((row) => row[2] === sectionLabel);
        if (startIdx === -1) return [];

        const years: number[] = [];
        for (let i = startIdx + 1; i < history.length; i++) {
          const row = history[i];
          // Stop at next section label or special labels
          if (
            row[2] === '学歴' ||
            row[2] === '職歴' ||
            row[2] === '現在に至る' ||
            row[2] === '以上'
          ) {
            break;
          }
          if (row[0] !== '') {
            years.push(parseInt(row[0], 10));
          }
        }
        return years;
      };

      // Check education section is sorted correctly
      const eduYearsAsc = getYearsFromSection(historyAsc, '学歴');
      for (let i = 1; i < eduYearsAsc.length; i++) {
        expect(eduYearsAsc[i]).toBeGreaterThanOrEqual(eduYearsAsc[i - 1]);
      }

      const eduYearsDesc = getYearsFromSection(historyDesc, '学歴');
      for (let i = 1; i < eduYearsDesc.length; i++) {
        expect(eduYearsDesc[i]).toBeLessThanOrEqual(eduYearsDesc[i - 1]);
      }
    });

    it('should render section text content', () => {
      const sections = [createMotivationSection(), createNotesSection()];
      const motivation = getSectionText(sections, ['motivation']);
      const notes = getSectionText(sections, ['notes']);

      const dataCounts = countDataRows(sections);
      const layout = calculateLayout({
        paperSize: 'a4',
        hideMotivation: false,
        dataCounts,
      });

      const rightPageHtml = buildRightPage({
        layout,
        history: [],
        license: [],
        motivation,
        competencies: [],
        notes,
      });

      expect(rightPageHtml).toContain('テスト志望動機です。');
      expect(rightPageHtml).toContain('テスト備考です。');
    });
  });

  describe('layout + styles integration', () => {
    it('should generate CSS with correct layout dimensions', () => {
      const sections = [createEducationSection()];
      const dataCounts = countDataRows(sections);
      const layout = calculateLayout({
        paperSize: 'a4',
        hideMotivation: false,
        dataCounts,
      });

      const css = generateCSS(layout);

      // CSS should contain layout-specific dimensions
      expect(css).toContain(`${layout.pageWidth}mm`);
      expect(css).toContain(`${layout.yearColumnWidth}mm`);
      expect(css).toContain(`${layout.monthColumnWidth}mm`);
    });

    it('should generate different CSS for different paper sizes', () => {
      const sections = [createEducationSection()];
      const dataCounts = countDataRows(sections);

      const a4Layout = calculateLayout({
        paperSize: 'a4',
        hideMotivation: false,
        dataCounts,
      });
      const b4Layout = calculateLayout({
        paperSize: 'b4',
        hideMotivation: false,
        dataCounts,
      });

      const a4Css = generateCSS(a4Layout);
      const b4Css = generateCSS(b4Layout);

      // Different paper sizes should produce different CSS
      expect(a4Css).not.toBe(b4Css);
      expect(a4Css).toContain('297mm'); // A4 width
      expect(b4Css).toContain('364mm'); // B4 width
    });
  });

  describe('full pipeline integration', () => {
    it('should generate complete HTML document', () => {
      const input: RirekishoInput = {
        metadata: createMetadata(),
        sections: [
          createEducationSection(),
          createExperienceSection(),
          createCertificationsSection(),
          createMotivationSection(),
          createNotesSection(),
        ],
      };

      const options: RirekishoOptions = {
        paperSize: 'a4',
        chronologicalOrder: 'asc',
        hideMotivation: false,
      };

      const html = generateRirekishoHTML(input, options);

      // Should be valid HTML document
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="ja">');
      expect(html).toContain('</html>');

      // Should contain CSS (with optional class attribute)
      expect(html).toMatch(/<style[^>]*>/);
      expect(html).toContain('</style>');

      // Should contain personal info
      expect(html).toContain('山田 太郎');

      // Should contain history
      expect(html).toContain('学歴');
      expect(html).toContain('職歴');
      expect(html).toContain('東京大学');
      expect(html).toContain('株式会社テスト');

      // Should contain certifications
      expect(html).toContain('基本情報技術者');

      // Should contain motivation and notes
      expect(html).toContain('テスト志望動機です。');
      expect(html).toContain('テスト備考です。');

      // Should contain footer
      expect(html).toContain('※「性別」欄');
    });

    it('should throw error when data overflows', () => {
      const hugeEducationEntries = Array.from({ length: 50 }, (_, i) => ({
        school: `大学${i + 1}`,
        degree: '学部',
        location: undefined,
        start: new Date(`${1950 + i}-04-01`),
        end: new Date(`${1954 + i}-03-31`),
        details: undefined,
      }));

      const input: RirekishoInput = {
        metadata: createMetadata(),
        sections: [
          {
            id: 'education',
            title: '学歴',
            content: { type: 'education', entries: hugeEducationEntries },
          },
          {
            id: 'certifications',
            title: '資格',
            content: {
              type: 'certifications',
              entries: Array.from({ length: 30 }, (_, i) => ({
                name: `資格${i + 1}`,
                issuer: undefined,
                date: new Date(`${2020}-04-01`),
                url: undefined,
              })),
            },
          },
        ],
      };

      const options: RirekishoOptions = {
        paperSize: 'b5',
        chronologicalOrder: 'asc',
      };

      expect(() => generateRirekishoHTML(input, options)).toThrow();
    });

    it('should generate HTML with hideMotivation option', () => {
      const input: RirekishoInput = {
        metadata: createMetadata(),
        sections: [
          createEducationSection(),
          createMotivationSection(),
          createNotesSection(),
        ],
      };

      const options: RirekishoOptions = {
        paperSize: 'a4',
        hideMotivation: true,
      };

      const html = generateRirekishoHTML(input, options);

      // Should not contain motivation section
      expect(html).not.toContain('志望の動機');
      // Should still contain notes
      expect(html).toContain('本人希望記入欄');
    });

    it('should generate HTML with descending chronological order', () => {
      const input: RirekishoInput = {
        metadata: createMetadata(),
        sections: [
          {
            id: 'education',
            title: '学歴',
            content: {
              type: 'education',
              entries: [
                {
                  school: '大学A',
                  degree: undefined,
                  location: undefined,
                  start: new Date('2010-04-01'),
                  end: new Date('2014-03-31'),
                  details: undefined,
                },
                {
                  school: '大学B',
                  degree: undefined,
                  location: undefined,
                  start: new Date('2014-04-01'),
                  end: new Date('2018-03-31'),
                  details: undefined,
                },
              ],
            },
          },
        ],
      };

      const options: RirekishoOptions = {
        paperSize: 'a4',
        chronologicalOrder: 'desc',
      };

      const html = generateRirekishoHTML(input, options);

      // In descending order, 大学B (2018) should appear before 大学A (2014)
      const indexB = html.indexOf('大学B');
      const indexA = html.indexOf('大学A');
      expect(indexB).toBeLessThan(indexA);
    });

    it('should work with all paper sizes', () => {
      const input: RirekishoInput = {
        metadata: createMetadata(),
        sections: [createEducationSection()],
      };

      const paperSizes = ['a3', 'a4', 'b4', 'b5', 'letter'] as const;

      for (const paperSize of paperSizes) {
        const options: RirekishoOptions = { paperSize };
        const html = generateRirekishoHTML(input, options);

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('山田 太郎');
      }
    });
  });
});
