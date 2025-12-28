/**
 * Unit tests for rirekisho/components.ts
 */

import { describe, expect, it } from 'vitest';
import {
  buildAddressRow,
  buildBirthGenderRow,
  buildHeader,
  buildHistoryTable,
  buildLeftPage,
  buildLicenseTable,
  buildNameSection,
  buildPhotoBox,
  buildRightPage,
  buildSectionBox,
  getAdjustedHistoryData,
} from '../../../src/generator/rirekisho/components.js';
import { calculateLayout } from '../../../src/generator/rirekisho/layout.js';
import type {
  HistoryRow,
  LayoutDimensions,
  PersonalInfo,
  TodayDate,
} from '../../../src/generator/rirekisho/types.js';

describe('rirekisho/components', () => {
  // Helper to create a basic layout for testing
  const createTestLayout = (): LayoutDimensions =>
    calculateLayout({
      paperSize: 'a4',
      hideMotivation: false,
      dataCounts: { historyDataRows: 10, licenseDataRows: 5 },
    });

  const createTestPersonalInfo = (): PersonalInfo => ({
    name: '山田 太郎',
    furigana: 'やまだ たろう',
    phone: '090-1234-5678',
    phone2: '03-1234-5678',
    address: '東京都渋谷区テスト町1-2-3',
    addressFurigana: 'とうきょうと しぶやく てすとちょう',
    postCode: '150-0001',
    address2: '大阪府大阪市テスト区4-5-6',
    address2Furigana: 'おおさかふ おおさかし てすとく',
    postCode2: '530-0001',
    email: 'taro@example.com',
    email2: 'taro2@example.com',
    gender: '男',
    dob: { year: '1990', month: '6', day: '15' },
    age: 34,
  });

  const createTestToday = (): TodayDate => ({
    year: 2024,
    month: 12,
    day: 25,
  });

  describe('buildHeader', () => {
    it('should render 履歴書 title', () => {
      const layout = createTestLayout();
      const today = createTestToday();
      const html = buildHeader({ layout, today });

      expect(html).toContain('履歴書');
    });

    it('should render current date', () => {
      const layout = createTestLayout();
      const today = createTestToday();
      const html = buildHeader({ layout, today });

      expect(html).toContain('2024 年 12 月 25 日現在');
    });

    it('should have flex layout classes', () => {
      const layout = createTestLayout();
      const today = createTestToday();
      const html = buildHeader({ layout, today });

      expect(html).toContain('class="flex flex--between flex--end"');
    });
  });

  describe('buildNameSection', () => {
    it('should render name', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildNameSection({ layout, info });

      expect(html).toContain('山田 太郎');
    });

    it('should render furigana', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildNameSection({ layout, info });

      expect(html).toContain('やまだ たろう');
    });

    it('should have ふりがな label', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildNameSection({ layout, info });

      expect(html).toContain('ふりがな');
    });

    it('should have 氏名 label', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildNameSection({ layout, info });

      expect(html).toContain('氏');
      expect(html).toContain('名');
    });
  });

  describe('buildBirthGenderRow', () => {
    it('should render date of birth', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildBirthGenderRow({ layout, info });

      expect(html).toContain('1990 年 6 月 15 日生');
    });

    it('should render age', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildBirthGenderRow({ layout, info });

      expect(html).toContain('満 34 歳');
    });

    it('should render gender', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildBirthGenderRow({ layout, info });

      expect(html).toContain('※性別');
      expect(html).toContain('男');
    });

    it('should handle missing dob', () => {
      const layout = createTestLayout();
      const info: PersonalInfo = {
        ...createTestPersonalInfo(),
        dob: null,
        age: null,
      };
      const html = buildBirthGenderRow({ layout, info });

      // Should render with placeholder spaces
      expect(html).toContain('年');
      expect(html).toContain('月');
      expect(html).toContain('日生');
    });
  });

  describe('buildAddressRow', () => {
    it('should render primary address', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildAddressRow({ layout, info, isPrimary: true });

      expect(html).toContain('東京都渋谷区テスト町1-2-3');
      expect(html).toContain('150-0001');
      expect(html).toContain('現住所');
    });

    it('should render secondary address', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildAddressRow({ layout, info, isPrimary: false });

      expect(html).toContain('大阪府大阪市テスト区4-5-6');
      expect(html).toContain('530-0001');
      expect(html).toContain('連絡先');
    });

    it('should render phone number', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildAddressRow({ layout, info, isPrimary: true });

      expect(html).toContain('090-1234-5678');
      expect(html).toContain('電話');
    });

    it('should render email', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildAddressRow({ layout, info, isPrimary: true });

      expect(html).toContain('taro@example.com');
      expect(html).toContain('E-mail');
    });

    it('should render furigana', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildAddressRow({ layout, info, isPrimary: true });

      expect(html).toContain('とうきょうと しぶやく てすとちょう');
    });

    it('should show note for secondary address', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const html = buildAddressRow({ layout, info, isPrimary: false });

      expect(html).toContain('現住所以外に連絡を希望する場合のみ記入');
    });
  });

  describe('buildPhotoBox', () => {
    it('should render photo box instructions when no photo provided', () => {
      const layout = createTestLayout();
      const html = buildPhotoBox({ layout });

      expect(html).toContain('写真をはる位置');
      expect(html).toContain('縦 36〜40mm');
      expect(html).toContain('横 24〜30mm');
    });

    it('should have photo-box class when no photo provided', () => {
      const layout = createTestLayout();
      const html = buildPhotoBox({ layout });

      expect(html).toContain('class="photo-box"');
      expect(html).not.toContain('photo-box--with-image');
    });

    it('should render image when photoDataUri is provided', () => {
      const layout = createTestLayout();
      const photoDataUri =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = buildPhotoBox({ layout, photoDataUri });

      expect(html).toContain('<img');
      expect(html).toContain(`src="${photoDataUri}"`);
      expect(html).toContain('alt="証明写真"');
      expect(html).toContain('object-fit: cover');
    });

    it('should have photo-box--with-image class when photo provided', () => {
      const layout = createTestLayout();
      const photoDataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const html = buildPhotoBox({ layout, photoDataUri });

      expect(html).toContain('photo-box--with-image');
    });

    it('should not show instructions when photo is provided', () => {
      const layout = createTestLayout();
      const photoDataUri = 'data:image/png;base64,test';
      const html = buildPhotoBox({ layout, photoDataUri });

      expect(html).not.toContain('写真をはる位置');
      expect(html).not.toContain('縦 36〜40mm');
    });
  });

  describe('buildHistoryTable', () => {
    const testData: HistoryRow[] = [
      ['', '', '学歴'],
      ['2015', '4', '東京大学 入学'],
      ['2019', '3', '東京大学 卒業'],
    ];

    it('should render table header', () => {
      const layout = createTestLayout();
      const html = buildHistoryTable({
        layout,
        data: testData,
        rowCount: 5,
        title: '学 歴 ・ 職 歴',
      });

      expect(html).toContain('年');
      expect(html).toContain('月');
      expect(html).toContain('学 歴 ・ 職 歴');
    });

    it('should render data rows', () => {
      const layout = createTestLayout();
      const html = buildHistoryTable({
        layout,
        data: testData,
        rowCount: 5,
        title: '学歴・職歴',
      });

      expect(html).toContain('学歴');
      expect(html).toContain('2015');
      expect(html).toContain('東京大学 入学');
    });

    it('should render empty rows when rowCount exceeds data', () => {
      const layout = createTestLayout();
      const html = buildHistoryTable({
        layout,
        data: testData,
        rowCount: 10,
        title: '学歴・職歴',
      });

      // Should have 10 data rows + 1 header row = 11 <tr> tags
      const trCount = (html.match(/<tr/g) || []).length;
      expect(trCount).toBe(11);
    });

    it('should center-align 学歴 and 職歴 labels', () => {
      const layout = createTestLayout();
      const html = buildHistoryTable({
        layout,
        data: [['', '', '学歴']],
        rowCount: 1,
        title: '学歴・職歴',
      });

      expect(html).toContain('align--center');
    });

    it('should right-align 以上 and 現在に至る', () => {
      const layout = createTestLayout();
      const html = buildHistoryTable({
        layout,
        data: [['', '', '以上']],
        rowCount: 1,
        title: '学歴・職歴',
      });

      expect(html).toContain('align--right');
    });

    it('should apply height style when provided', () => {
      const layout = createTestLayout();
      const html = buildHistoryTable({
        layout,
        data: testData,
        rowCount: 5,
        title: '学歴・職歴',
        height: 100,
      });

      expect(html).toContain('height: 100mm');
    });
  });

  describe('buildLicenseTable', () => {
    const testData: HistoryRow[] = [
      ['2020', '4', '基本情報技術者'],
      ['2021', '6', 'TOEIC 800点'],
    ];

    it('should render table header', () => {
      const layout = createTestLayout();
      const html = buildLicenseTable({ layout, data: testData });

      expect(html).toContain('年');
      expect(html).toContain('月');
      expect(html).toContain('免許・資格');
    });

    it('should render license data', () => {
      const layout = createTestLayout();
      const html = buildLicenseTable({ layout, data: testData });

      expect(html).toContain('基本情報技術者');
      expect(html).toContain('TOEIC 800点');
    });

    it('should apply height style when provided', () => {
      const layout = createTestLayout();
      const html = buildLicenseTable({ layout, data: testData, height: 80 });

      expect(html).toContain('height: 80mm');
    });
  });

  describe('buildSectionBox', () => {
    it('should render title', () => {
      const layout = createTestLayout();
      const html = buildSectionBox({
        layout,
        title: '志望動機',
        content: 'テスト内容',
      });

      expect(html).toContain('志望動機');
    });

    it('should render subtitle when provided', () => {
      const layout = createTestLayout();
      const html = buildSectionBox({
        layout,
        title: '本人希望記入欄',
        subtitle: '（特に給料・職種について）',
        content: 'テスト内容',
      });

      expect(html).toContain('（特に給料・職種について）');
    });

    it('should render content', () => {
      const layout = createTestLayout();
      const html = buildSectionBox({
        layout,
        title: '志望動機',
        content: 'テスト志望動機の内容です',
      });

      expect(html).toContain('テスト志望動機の内容です');
    });

    it('should apply height style when provided', () => {
      const layout = createTestLayout();
      const html = buildSectionBox({
        layout,
        title: '志望動機',
        content: 'テスト',
        height: 50,
      });

      expect(html).toContain('height: 50mm');
    });

    it('should apply minHeight style when provided', () => {
      const layout = createTestLayout();
      const html = buildSectionBox({
        layout,
        title: '志望動機',
        content: 'テスト',
        minHeight: 30,
      });

      expect(html).toContain('min-height: 30mm');
    });

    it('should have section-box class', () => {
      const layout = createTestLayout();
      const html = buildSectionBox({
        layout,
        title: '志望動機',
        content: 'テスト',
      });

      expect(html).toContain('class="section-box"');
    });
  });

  describe('getAdjustedHistoryData', () => {
    it('should split data normally when 職歴 is not at last row', () => {
      const history: HistoryRow[] = [
        ['', '', '学歴'],
        ['2015', '4', '大学 入学'],
        ['2019', '3', '大学 卒業'],
        ['', '', '職歴'],
        ['2019', '4', '会社 入社'],
        ['2021', '3', '会社 退社'],
      ];
      const leftHistoryRows = 5; // 職歴 is at index 3, not at last row (index 4)

      const result = getAdjustedHistoryData(history, leftHistoryRows);

      expect(result.shokurekiMovedToRight).toBe(false);
      expect(result.leftData).toHaveLength(5);
      expect(result.rightData).toHaveLength(1);
    });

    it('should move 職歴 to right page when at last row of left page', () => {
      const history: HistoryRow[] = [
        ['', '', '学歴'],
        ['2015', '4', '大学 入学'],
        ['2019', '3', '大学 卒業'],
        ['', '', '職歴'],
        ['2019', '4', '会社 入社'],
      ];
      const leftHistoryRows = 4; // 職歴 is at index 3 = last row (0-indexed)

      const result = getAdjustedHistoryData(history, leftHistoryRows);

      expect(result.shokurekiMovedToRight).toBe(true);
      expect(result.leftData).toHaveLength(3); // Everything before 職歴
      expect(result.rightData).toHaveLength(2); // 職歴 and after
      expect(result.rightData[0][2]).toBe('職歴');
    });

    it('should handle empty history', () => {
      const result = getAdjustedHistoryData([], 10);

      expect(result.shokurekiMovedToRight).toBe(false);
      expect(result.leftData).toHaveLength(0);
      expect(result.rightData).toHaveLength(0);
    });

    it('should handle history without 職歴', () => {
      const history: HistoryRow[] = [
        ['', '', '学歴'],
        ['2015', '4', '大学 入学'],
        ['2019', '3', '大学 卒業'],
      ];

      const result = getAdjustedHistoryData(history, 2);

      expect(result.shokurekiMovedToRight).toBe(false);
      expect(result.leftData).toHaveLength(2);
      expect(result.rightData).toHaveLength(1);
    });
  });

  describe('buildLeftPage', () => {
    it('should render all left page components', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const today = createTestToday();
      const history: HistoryRow[] = [
        ['', '', '学歴'],
        ['2015', '4', '大学 入学'],
      ];

      const html = buildLeftPage({ layout, info, history, today });

      // Should contain header
      expect(html).toContain('履歴書');
      // Should contain name section
      expect(html).toContain('山田 太郎');
      // Should contain birth/gender row
      expect(html).toContain('1990 年 6 月 15 日生');
      // Should contain address rows
      expect(html).toContain('現住所');
      expect(html).toContain('連絡先');
      // Should contain photo box
      expect(html).toContain('写真をはる位置');
      // Should contain history table
      expect(html).toContain('学 歴 ・ 職 歴');
    });

    it('should have page--left class', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const today = createTestToday();
      const history: HistoryRow[] = [];

      const html = buildLeftPage({ layout, info, history, today });

      expect(html).toContain('class="page page--left"');
    });

    it('should render photo when photoDataUri is provided', () => {
      const layout = createTestLayout();
      const info = createTestPersonalInfo();
      const today = createTestToday();
      const history: HistoryRow[] = [];
      const photoDataUri = 'data:image/png;base64,testphoto';

      const html = buildLeftPage({
        layout,
        info,
        history,
        today,
        photoDataUri,
      });

      expect(html).toContain('<img');
      expect(html).toContain(`src="${photoDataUri}"`);
      expect(html).not.toContain('写真をはる位置');
    });
  });

  describe('buildRightPage', () => {
    it('should render all right page components', () => {
      const layout = createTestLayout();
      const history: HistoryRow[] = [
        ['', '', '学歴'],
        ['2015', '4', '大学 入学'],
      ];
      const license: HistoryRow[] = [['2020', '4', '資格A']];

      const html = buildRightPage({
        layout,
        history,
        license,
        motivation: 'テスト志望動機',
        competencies: [],
        notes: 'テスト備考',
      });

      // Should contain license table
      expect(html).toContain('免許・資格');
      // Should contain motivation section
      expect(html).toContain('志望の動機');
      // Should contain notes section
      expect(html).toContain('本人希望記入欄');
    });

    it('should have page--right class', () => {
      const layout = createTestLayout();
      const html = buildRightPage({
        layout,
        history: [],
        license: [],
        motivation: '',
        competencies: [],
        notes: '',
      });

      expect(html).toContain('class="page page--right"');
    });

    it('should hide motivation section when hideMotivation is true', () => {
      const layout = calculateLayout({
        paperSize: 'a4',
        hideMotivation: true,
        dataCounts: { historyDataRows: 10, licenseDataRows: 5 },
      });

      const html = buildRightPage({
        layout,
        history: [],
        license: [],
        motivation: 'テスト志望動機',
        competencies: [],
        notes: 'テスト備考',
      });

      // Should not contain motivation section title
      expect(html).not.toContain('志望の動機');
      // Should still contain notes
      expect(html).toContain('本人希望記入欄');
    });

    it('should render competencies as bullet list', () => {
      const layout = createTestLayout();
      const html = buildRightPage({
        layout,
        history: [],
        license: [],
        motivation: 'テスト志望動機',
        competencies: ['スキル1', 'スキル2', 'スキル3'],
        notes: '',
      });

      expect(html).toContain('<ul');
      expect(html).toContain('<li>スキル1</li>');
      expect(html).toContain('<li>スキル2</li>');
      expect(html).toContain('<li>スキル3</li>');
    });
  });
});
