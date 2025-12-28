/**
 * Unit tests for rirekisho/data.ts
 */

import { describe, expect, it } from 'vitest';
import {
  buildHistoryData,
  buildLicenseData,
  countDataRows,
  extractPersonalInfo,
  getSectionText,
  getTodayDate,
} from '../../../src/generator/rirekisho/data.js';
import type { CVMetadata } from '../../../src/types/metadata.js';
import type { ParsedSection } from '../../../src/types/sections.js';

describe('rirekisho/data', () => {
  describe('getTodayDate', () => {
    it('should return current date components', () => {
      const result = getTodayDate();
      const now = new Date();

      expect(result.year).toBe(now.getFullYear());
      expect(result.month).toBe(now.getMonth() + 1);
      expect(result.day).toBe(now.getDate());
    });
  });

  describe('extractPersonalInfo', () => {
    const baseMetadata: CVMetadata = {
      name: 'Taro Yamada',
      email_address: 'taro@example.com',
      phone_number: '090-1234-5678',
    };

    it('should extract basic personal info', () => {
      const result = extractPersonalInfo(baseMetadata, new Date('2024-01-15'));

      expect(result.name).toBe('Taro Yamada');
      expect(result.email).toBe('taro@example.com');
      expect(result.furigana).toBe('');
      expect(result.gender).toBe('');
      expect(result.dob).toBeNull();
      expect(result.age).toBeNull();
    });

    it('should prefer name_ja over name', () => {
      const metadata: CVMetadata = {
        ...baseMetadata,
        name_ja: '山田 太郎',
      };
      const result = extractPersonalInfo(metadata, new Date('2024-01-15'));

      expect(result.name).toBe('山田 太郎');
    });

    it('should extract furigana', () => {
      const metadata: CVMetadata = {
        ...baseMetadata,
        name_furigana: 'やまだ たろう',
      };
      const result = extractPersonalInfo(metadata, new Date('2024-01-15'));

      expect(result.furigana).toBe('やまだ たろう');
    });

    it('should convert gender to Japanese', () => {
      expect(
        extractPersonalInfo({ ...baseMetadata, gender: 'male' }, new Date())
          .gender,
      ).toBe('男');
      expect(
        extractPersonalInfo({ ...baseMetadata, gender: 'female' }, new Date())
          .gender,
      ).toBe('女');
      expect(
        extractPersonalInfo({ ...baseMetadata, gender: undefined }, new Date())
          .gender,
      ).toBe('');
    });

    it('should calculate age correctly', () => {
      const metadata: CVMetadata = {
        ...baseMetadata,
        dob: new Date('1990-06-15'),
      };

      // Before birthday
      const beforeBirthday = extractPersonalInfo(
        metadata,
        new Date('2024-06-14'),
      );
      expect(beforeBirthday.age).toBe(33);

      // On birthday
      const onBirthday = extractPersonalInfo(metadata, new Date('2024-06-15'));
      expect(onBirthday.age).toBe(34);

      // After birthday
      const afterBirthday = extractPersonalInfo(
        metadata,
        new Date('2024-06-16'),
      );
      expect(afterBirthday.age).toBe(34);
    });

    it('should format date of birth', () => {
      // Use UTC date to avoid timezone issues
      const dob = new Date(Date.UTC(1990, 5, 15)); // June 15, 1990
      const metadata: CVMetadata = {
        ...baseMetadata,
        dob,
      };
      const result = extractPersonalInfo(metadata, new Date('2024-01-15'));

      // The day may vary by timezone, so just check year and month
      expect(result.dob?.year).toBe('1990');
      expect(result.dob?.month).toBe('6');
      expect(result.dob?.day).toBeDefined();
    });

    it('should extract address information', () => {
      const metadata: CVMetadata = {
        ...baseMetadata,
        home_address: '東京都渋谷区',
        home_address_furigana: 'とうきょうと しぶやく',
        post_code: '150-0001',
      };
      const result = extractPersonalInfo(metadata, new Date());

      expect(result.address).toBe('東京都渋谷区');
      expect(result.addressFurigana).toBe('とうきょうと しぶやく');
      expect(result.postCode).toBe('150-0001');
      expect(result.phone).toBe('090-1234-5678');
    });

    it('should extract secondary contact information', () => {
      const metadata: CVMetadata = {
        ...baseMetadata,
        home_address2: '大阪府大阪市',
        home_address2_furigana: 'おおさかふ おおさかし',
        post_code2: '530-0001',
        phone_number2: '06-1234-5678',
        email_address2: 'taro2@example.com',
      };
      const result = extractPersonalInfo(metadata, new Date());

      expect(result.address2).toBe('大阪府大阪市');
      expect(result.address2Furigana).toBe('おおさかふ おおさかし');
      expect(result.postCode2).toBe('530-0001');
      expect(result.phone2).toBe('06-1234-5678');
      expect(result.email2).toBe('taro2@example.com');
    });

    it('should escape HTML characters', () => {
      const metadata: CVMetadata = {
        ...baseMetadata,
        name: '<script>alert("xss")</script>',
        home_address: 'Test & Co.',
      };
      const result = extractPersonalInfo(metadata, new Date());

      expect(result.name).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
      expect(result.address).toBe('Test &amp; Co.');
    });
  });

  describe('buildHistoryData', () => {
    it('should return empty array with labels for empty sections', () => {
      const result = buildHistoryData([], 'asc');

      expect(result).toContainEqual(['', '', '現在に至る']);
      expect(result).toContainEqual(['', '', '以上']);
    });

    it('should build education history with 学歴 label', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'education',
            entries: [
              {
                school: '東京大学',
                degree: '工学部',
                location: undefined,
                start: new Date(Date.UTC(2015, 3, 1)), // April 1, 2015
                end: new Date(Date.UTC(2019, 2, 31)), // March 31, 2019
                details: undefined,
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      expect(result[0]).toEqual(['', '', '学歴']);
      // Check that the entry contains expected content (month may vary by timezone)
      expect(result[1][0]).toBe('2015');
      expect(result[1][2]).toContain('東京大学 工学部 入学');
      expect(result[2][0]).toBe('2019');
      expect(result[2][2]).toContain('東京大学 工学部 卒業');
    });

    it('should use 修了 for graduate school', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'education',
            entries: [
              {
                school: '東京大学大学院',
                degree: '修士課程',
                location: undefined,
                start: new Date('2019-04-01'),
                end: new Date('2021-03-31'),
                details: undefined,
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      expect(result[2]).toEqual(['2021', '3', '東京大学大学院 修士課程 修了']);
    });

    it('should build work history with 職歴 label', () => {
      const sections: ParsedSection[] = [
        {
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
                    start: new Date(Date.UTC(2019, 3, 1)), // April 1, 2019
                    end: new Date(Date.UTC(2021, 2, 31)), // March 31, 2021
                    summary: undefined,
                    highlights: undefined,
                    projects: undefined,
                  },
                ],
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      expect(result[0]).toEqual(['', '', '職歴']);
      expect(result[1][0]).toBe('2019');
      expect(result[1][2]).toContain('株式会社テスト 入社');
      expect(result[2][0]).toBe('2021');
      expect(result[2][2]).toContain('株式会社テスト 退社');
    });

    it('should not add 退社 for present employment', () => {
      const sections: ParsedSection[] = [
        {
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
                    start: new Date(Date.UTC(2019, 3, 1)), // April 1, 2019
                    end: 'present',
                    summary: undefined,
                    highlights: undefined,
                    projects: undefined,
                  },
                ],
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      // Should have 入社 entry
      const hasNyusha = result.some((row) =>
        row[2].includes('株式会社テスト 入社'),
      );
      expect(hasNyusha).toBe(true);
      // Should NOT have 退社 entry
      const hasTaisha = result.some((row) =>
        row[2].includes('株式会社テスト 退社'),
      );
      expect(hasTaisha).toBe(false);
    });

    it('should sort entries in ascending order', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'education',
            entries: [
              {
                school: '大学',
                degree: undefined,
                location: undefined,
                start: new Date('2015-04-01'),
                end: new Date('2019-03-31'),
                details: undefined,
              },
              {
                school: '高校',
                degree: undefined,
                location: undefined,
                start: new Date('2012-04-01'),
                end: new Date('2015-03-31'),
                details: undefined,
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      // After 学歴 label, entries should be sorted by date
      const eduEntries = result.slice(1, 5);
      expect(eduEntries[0][0]).toBe('2012'); // 高校 入学
      expect(eduEntries[2][0]).toBe('2015'); // 大学 入学
    });

    it('should sort entries in descending order', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'education',
            entries: [
              {
                school: '高校',
                degree: undefined,
                location: undefined,
                start: new Date('2012-04-01'),
                end: new Date('2015-03-31'),
                details: undefined,
              },
              {
                school: '大学',
                degree: undefined,
                location: undefined,
                start: new Date('2015-04-01'),
                end: new Date('2019-03-31'),
                details: undefined,
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'desc');

      // After 学歴 label, entries should be sorted by date descending
      const eduEntries = result.slice(1, 5);
      expect(eduEntries[0][0]).toBe('2019'); // 大学 卒業
      expect(eduEntries[2][0]).toBe('2015'); // 高校 卒業
    });

    it('should add 現在に至る and 以上 at the end', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'education',
            entries: [
              {
                school: '大学',
                degree: undefined,
                location: undefined,
                start: new Date('2015-04-01'),
                end: new Date('2019-03-31'),
                details: undefined,
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      expect(result[result.length - 2]).toEqual(['', '', '現在に至る']);
      expect(result[result.length - 1]).toEqual(['', '', '以上']);
    });
  });

  describe('buildLicenseData', () => {
    it('should return empty array for no certifications', () => {
      const result = buildLicenseData([], 'asc');
      expect(result).toEqual([]);
    });

    it('should build license data from certifications', () => {
      const sections: ParsedSection[] = [
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'certifications',
            entries: [
              {
                name: '基本情報技術者',
                issuer: undefined,
                date: new Date(Date.UTC(2020, 3, 1)), // April 1, 2020
                url: undefined,
              },
              {
                name: 'TOEIC 800点',
                issuer: undefined,
                date: new Date(Date.UTC(2021, 5, 1)), // June 1, 2021
                url: undefined,
              },
            ],
          },
        },
      ];
      const result = buildLicenseData(sections, 'asc');

      expect(result).toHaveLength(2);
      expect(result[0][0]).toBe('2020');
      expect(result[0][2]).toBe('基本情報技術者');
      expect(result[1][0]).toBe('2021');
      expect(result[1][2]).toBe('TOEIC 800点');
    });

    it('should handle certifications without date', () => {
      const sections: ParsedSection[] = [
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'certifications',
            entries: [
              {
                name: '普通自動車免許',
                issuer: undefined,
                date: undefined,
                url: undefined,
              },
            ],
          },
        },
      ];
      const result = buildLicenseData(sections, 'asc');

      expect(result[0]).toEqual(['', '', '普通自動車免許']);
    });

    it('should sort certifications by date', () => {
      const sections: ParsedSection[] = [
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'certifications',
            entries: [
              {
                name: '資格B',
                issuer: undefined,
                date: new Date('2021-06-01'),
                url: undefined,
              },
              {
                name: '資格A',
                issuer: undefined,
                date: new Date('2020-04-01'),
                url: undefined,
              },
            ],
          },
        },
      ];

      const ascResult = buildLicenseData(sections, 'asc');
      expect(ascResult[0][2]).toBe('資格A');
      expect(ascResult[1][2]).toBe('資格B');

      const descResult = buildLicenseData(sections, 'desc');
      expect(descResult[0][2]).toBe('資格B');
      expect(descResult[1][2]).toBe('資格A');
    });
  });

  describe('getSectionText', () => {
    it('should return empty string for no matching section', () => {
      const result = getSectionText([], ['motivation']);
      expect(result).toBe('');
    });

    it('should return text content from matching section', () => {
      const sections: ParsedSection[] = [
        {
          id: 'motivation',
          title: '志望動機',
          content: {
            type: 'text',
            text: 'テスト志望動機',
          },
        },
      ];
      const result = getSectionText(sections, ['motivation']);

      expect(result).toBe('テスト志望動機');
    });

    it('should try multiple section IDs', () => {
      const sections: ParsedSection[] = [
        {
          id: 'notes',
          title: '備考',
          content: {
            type: 'text',
            text: 'テスト備考',
          },
        },
      ];
      const result = getSectionText(sections, ['motivation', 'notes']);

      expect(result).toBe('テスト備考');
    });

    it('should escape HTML in text content', () => {
      const sections: ParsedSection[] = [
        {
          id: 'motivation',
          title: '志望動機',
          content: {
            type: 'text',
            text: '<script>alert("xss")</script>',
          },
        },
      ];
      const result = getSectionText(sections, ['motivation']);

      expect(result).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('should return empty string for non-text content', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'education',
            entries: [],
          },
        },
      ];
      const result = getSectionText(sections, ['education']);

      expect(result).toBe('');
    });
  });

  describe('countDataRows', () => {
    it('should return zero counts for empty sections', () => {
      const result = countDataRows([]);

      expect(result.historyDataRows).toBe(0);
      expect(result.licenseDataRows).toBe(0);
    });

    it('should count education entries (2 rows each)', () => {
      const sections: ParsedSection[] = [
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
                start: new Date(),
                end: new Date(),
                details: undefined,
              },
              {
                school: '大学B',
                degree: undefined,
                location: undefined,
                start: new Date(),
                end: new Date(),
                details: undefined,
              },
            ],
          },
        },
      ];
      const result = countDataRows(sections);

      expect(result.historyDataRows).toBe(4); // 2 entries * 2 rows each
    });

    it('should count experience entries correctly', () => {
      const sections: ParsedSection[] = [
        {
          id: 'experience',
          title: '職歴',
          content: {
            type: 'experience',
            entries: [
              {
                company: '会社A',
                location: undefined,
                roles: [
                  {
                    title: '役職',
                    team: undefined,
                    start: new Date(),
                    end: new Date(),
                    summary: undefined,
                    highlights: undefined,
                    projects: undefined,
                  }, // 2 rows
                ],
              },
              {
                company: '会社B',
                location: undefined,
                roles: [
                  {
                    title: '役職',
                    team: undefined,
                    start: new Date(),
                    end: 'present',
                    summary: undefined,
                    highlights: undefined,
                    projects: undefined,
                  }, // 1 row (no 退社)
                ],
              },
            ],
          },
        },
      ];
      const result = countDataRows(sections);

      expect(result.historyDataRows).toBe(3); // 2 + 1
    });

    it('should count certification entries', () => {
      const sections: ParsedSection[] = [
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'certifications',
            entries: [
              {
                name: '資格A',
                issuer: undefined,
                date: undefined,
                url: undefined,
              },
              {
                name: '資格B',
                issuer: undefined,
                date: undefined,
                url: undefined,
              },
              {
                name: '資格C',
                issuer: undefined,
                date: undefined,
                url: undefined,
              },
            ],
          },
        },
      ];
      const result = countDataRows(sections);

      expect(result.licenseDataRows).toBe(3);
    });

    it('should count table rows for table content type', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'table',
            rows: [
              { year: '2020', month: '4', content: 'テスト' },
              { year: '2021', month: '3', content: 'テスト' },
            ],
          },
        },
      ];
      const result = countDataRows(sections);

      expect(result.historyDataRows).toBe(2);
    });
  });
});
