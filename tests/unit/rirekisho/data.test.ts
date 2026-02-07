/**
 * Unit tests for rirekisho/data.ts
 */

import { describe, expect, it } from 'vitest';
import {
  buildHistoryData,
  buildLicenseData,
  countDataRows,
  extractPersonalInfo,
  getSectionList,
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

    it('should prefer home_address_ja over home_address', () => {
      const metadata: CVMetadata = {
        ...baseMetadata,
        home_address: '123 Main Street, Tokyo',
        home_address_ja: '東京都渋谷区テスト町1-2-3',
        home_address_furigana: 'とうきょうと しぶやく てすとちょう',
        post_code: '1500001',
      };
      const result = extractPersonalInfo(metadata, new Date());

      expect(result.address).toBe('東京都渋谷区テスト町1-2-3');
      expect(result.addressFurigana).toBe('とうきょうと しぶやく てすとちょう');
      expect(result.postCode).toBe('1500001');
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

    it('should return text content from matching section as HTML paragraph', () => {
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

      expect(result).toBe('<p>テスト志望動機</p>');
    });

    it('should convert markdown lists to HTML lists', () => {
      const sections: ParsedSection[] = [
        {
          id: 'notes',
          title: '本人希望記入欄',
          content: {
            type: 'text',
            text: '希望事項：\n- 希望勤務地：東京\n- 入社可能日：即日',
          },
        },
      ];
      const result = getSectionText(sections, ['notes']);

      expect(result).toContain('<p>希望事項：</p>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>希望勤務地：東京</li>');
      expect(result).toContain('<li>入社可能日：即日</li>');
      expect(result).toContain('</ul>');
    });

    it('should handle multiple paragraphs', () => {
      const sections: ParsedSection[] = [
        {
          id: 'motivation',
          title: '志望動機',
          content: {
            type: 'text',
            text: '第一段落\n\n第二段落',
          },
        },
      ];
      const result = getSectionText(sections, ['motivation']);

      expect(result).toContain('<p>第一段落</p>');
      expect(result).toContain('<p>第二段落</p>');
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

      expect(result).toBe('<p>テスト備考</p>');
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
        '<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>',
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

    it('should count composite education entries', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'composite',
            blocks: [
              {
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
                ],
              },
            ],
          },
        },
      ];
      const result = countDataRows(sections);

      expect(result.historyDataRows).toBe(2); // 1 entry * 2 rows
    });

    it('should count composite experience entries', () => {
      const sections: ParsedSection[] = [
        {
          id: 'experience',
          title: '職歴',
          content: {
            type: 'composite',
            blocks: [
              {
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
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ];
      const result = countDataRows(sections);

      expect(result.historyDataRows).toBe(2); // 入社 + 退社
    });

    it('should count composite certification entries', () => {
      const sections: ParsedSection[] = [
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'certifications',
                entries: [
                  {
                    name: '資格A',
                    issuer: undefined,
                    date: new Date(),
                    url: undefined,
                  },
                  {
                    name: '資格B',
                    issuer: undefined,
                    date: new Date(),
                    url: undefined,
                  },
                ],
              },
            ],
          },
        },
      ];
      const result = countDataRows(sections);

      expect(result.licenseDataRows).toBe(2);
    });

    it('should count table rows from composite content', () => {
      const sections: ParsedSection[] = [
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'table',
                rows: [
                  { year: '2020', month: '4', content: '資格A' },
                  { year: '2021', month: '6', content: '資格B' },
                ],
              },
            ],
          },
        },
      ];
      const result = countDataRows(sections);

      expect(result.licenseDataRows).toBe(2);
    });
  });

  describe('buildHistoryData with composite content', () => {
    it('should build education history from composite content', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'education',
                entries: [
                  {
                    school: '東京大学',
                    degree: '工学部',
                    location: undefined,
                    start: new Date(Date.UTC(2015, 3, 1)),
                    end: new Date(Date.UTC(2019, 2, 31)),
                    details: undefined,
                  },
                ],
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      expect(result[0]).toEqual(['', '', '学歴']);
      expect(result[1][2]).toContain('東京大学 工学部 入学');
      expect(result[2][2]).toContain('東京大学 工学部 卒業');
    });

    it('should build work history from composite content', () => {
      const sections: ParsedSection[] = [
        {
          id: 'experience',
          title: '職歴',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'experience',
                entries: [
                  {
                    company: '株式会社テスト',
                    location: undefined,
                    roles: [
                      {
                        title: 'エンジニア',
                        team: undefined,
                        start: new Date(Date.UTC(2019, 3, 1)),
                        end: new Date(Date.UTC(2021, 2, 31)),
                        summary: undefined,
                        highlights: undefined,
                        projects: undefined,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      expect(result[0]).toEqual(['', '', '職歴']);
      expect(result[1][2]).toContain('株式会社テスト 入社');
      expect(result[2][2]).toContain('株式会社テスト 退社');
    });

    it('should use table rows from composite content when no structured entries', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'table',
                rows: [
                  { year: '2015', month: '4', content: '大学 入学' },
                  { year: '2019', month: '3', content: '大学 卒業' },
                ],
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      expect(result[0]).toEqual(['', '', '学歴']);
      expect(result[1]).toEqual(['2015', '4', '大学 入学']);
      expect(result[2]).toEqual(['2019', '3', '大学 卒業']);
    });

    it('should handle experience with multiple roles finding earliest start', () => {
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
                    title: 'シニアエンジニア',
                    team: undefined,
                    start: new Date(Date.UTC(2021, 5, 15)), // June 15, 2021
                    end: new Date(Date.UTC(2023, 5, 15)), // June 15, 2023
                    summary: undefined,
                    highlights: undefined,
                    projects: undefined,
                  },
                  {
                    title: 'エンジニア',
                    team: undefined,
                    start: new Date(Date.UTC(2019, 5, 15)), // June 15, 2019
                    end: new Date(Date.UTC(2021, 5, 14)), // June 14, 2021
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

      // Should use earliest start date (2019-06)
      expect(result[1][0]).toBe('2019');
      expect(result[1][2]).toContain('株式会社テスト 入社');
      // Should use latest end date (2023-06)
      expect(result[2][0]).toBe('2023');
      expect(result[2][2]).toContain('株式会社テスト 退社');
    });

    it('should skip experience entries with no roles', () => {
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
                roles: [],
              },
            ],
          },
        },
      ];
      const result = buildHistoryData(sections, 'asc');

      // 職歴 label is added because entries exist, but no data rows since roles are empty
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(['', '', '職歴']);
      expect(result[1]).toEqual(['', '', '現在に至る']);
      expect(result[2]).toEqual(['', '', '以上']);
    });
  });

  describe('buildLicenseData with composite content', () => {
    it('should build license data from composite certifications', () => {
      const sections: ParsedSection[] = [
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'certifications',
                entries: [
                  {
                    name: '基本情報技術者',
                    issuer: undefined,
                    date: new Date(Date.UTC(2020, 3, 1)),
                    url: undefined,
                  },
                ],
              },
            ],
          },
        },
      ];
      const result = buildLicenseData(sections, 'asc');

      expect(result).toHaveLength(1);
      expect(result[0][0]).toBe('2020');
      expect(result[0][2]).toBe('基本情報技術者');
    });

    it('should use table rows from composite content when no certifications', () => {
      const sections: ParsedSection[] = [
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'table',
                rows: [{ year: '2020', month: '4', content: '資格A' }],
              },
            ],
          },
        },
      ];
      const result = buildLicenseData(sections, 'asc');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(['2020', '4', '資格A']);
    });
  });

  describe('getSectionText with composite content', () => {
    it('should return markdown content from composite text-only section', () => {
      const sections: ParsedSection[] = [
        {
          id: 'motivation',
          title: '志望動機',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'markdown',
                content: 'テスト志望動機',
              },
            ],
          },
        },
      ];
      const result = getSectionText(sections, ['motivation']);

      expect(result).toBe('<p>テスト志望動機</p>');
    });

    it('should combine multiple markdown blocks', () => {
      const sections: ParsedSection[] = [
        {
          id: 'motivation',
          title: '志望動機',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'markdown',
                content: '第一段落',
              },
              {
                type: 'markdown',
                content: '第二段落',
              },
            ],
          },
        },
      ];
      const result = getSectionText(sections, ['motivation']);

      expect(result).toContain('<p>第一段落</p>');
      expect(result).toContain('<p>第二段落</p>');
    });

    it('should return empty for composite with structured blocks', () => {
      const sections: ParsedSection[] = [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'education',
                entries: [],
              },
            ],
          },
        },
      ];
      const result = getSectionText(sections, ['education']);

      expect(result).toBe('');
    });

    it('should handle list content type', () => {
      const sections: ParsedSection[] = [
        {
          id: 'notes',
          title: '本人希望記入欄',
          content: {
            type: 'list',
            items: ['希望1', '希望2'],
          },
        },
      ];
      const result = getSectionText(sections, ['notes']);

      expect(result).toContain('<ul>');
      expect(result).toContain('<li>希望1</li>');
      expect(result).toContain('<li>希望2</li>');
      expect(result).toContain('</ul>');
    });

    it('should handle markdown with asterisk list markers', () => {
      const sections: ParsedSection[] = [
        {
          id: 'notes',
          title: '本人希望記入欄',
          content: {
            type: 'text',
            text: '希望事項：\n* 希望勤務地：東京\n* 入社可能日：即日',
          },
        },
      ];
      const result = getSectionText(sections, ['notes']);

      expect(result).toContain('<ul>');
      expect(result).toContain('<li>希望勤務地：東京</li>');
      expect(result).toContain('<li>入社可能日：即日</li>');
    });
  });

  describe('getSectionList', () => {
    it('should return empty array for no matching section', () => {
      const result = getSectionList([], ['competencies']);
      expect(result).toEqual([]);
    });

    it('should return list items from list content', () => {
      const sections: ParsedSection[] = [
        {
          id: 'competencies',
          title: '自己PR',
          content: {
            type: 'list',
            items: ['スキル1', 'スキル2'],
          },
        },
      ];
      const result = getSectionList(sections, ['competencies']);

      expect(result).toEqual(['スキル1', 'スキル2']);
    });

    it('should return competency entries formatted', () => {
      const sections: ParsedSection[] = [
        {
          id: 'competencies',
          title: '自己PR',
          content: {
            type: 'competencies',
            entries: [
              { header: 'リーダーシップ', description: 'チームを率いた経験' },
              { header: '問題解決', description: '複雑な問題を解決' },
            ],
          },
        },
      ];
      const result = getSectionList(sections, ['competencies']);

      expect(result).toEqual([
        'リーダーシップ: チームを率いた経験',
        '問題解決: 複雑な問題を解決',
      ]);
    });

    it('should return competency entries from composite content', () => {
      const sections: ParsedSection[] = [
        {
          id: 'competencies',
          title: '自己PR',
          content: {
            type: 'composite',
            blocks: [
              {
                type: 'competencies',
                entries: [{ header: 'スキル', description: '説明' }],
              },
            ],
          },
        },
      ];
      const result = getSectionList(sections, ['competencies']);

      expect(result).toEqual(['スキル: 説明']);
    });

    it('should escape HTML in list items', () => {
      const sections: ParsedSection[] = [
        {
          id: 'competencies',
          title: '自己PR',
          content: {
            type: 'list',
            items: ['<script>alert("xss")</script>'],
          },
        },
      ];
      const result = getSectionList(sections, ['competencies']);

      expect(result[0]).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('should try multiple section IDs', () => {
      const sections: ParsedSection[] = [
        {
          id: 'notes',
          title: '備考',
          content: {
            type: 'list',
            items: ['備考1'],
          },
        },
      ];
      const result = getSectionList(sections, ['competencies', 'notes']);

      expect(result).toEqual(['備考1']);
    });
  });
});
