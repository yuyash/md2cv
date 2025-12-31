/**
 * Unit tests for Japanese CV generator
 */

import { describe, expect, it } from 'vitest';

import {
  generateCVJaHTML,
  type CVInput,
} from '../../src/generator/resume_ja.js';

describe('generateCVJaHTML', () => {
  const createBasicCV = (): CVInput => ({
    metadata: {
      name: 'John Doe',
      name_ja: '山田太郎',
      email_address: 'taro@example.com',
      phone_number: '090-1234-5678',
    },
    sections: [],
  });

  it('should generate valid HTML document', () => {
    const cv = createBasicCV();
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain('</html>');
  });

  it('should include Japanese name in header', () => {
    const cv = createBasicCV();
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('山田太郎');
  });

  it('should use English name when Japanese name is not provided', () => {
    const cv: CVInput = {
      metadata: {
        name: 'John Doe',
        email_address: 'john@example.com',
        phone_number: '090-1234-5678',
      },
      sections: [],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('John Doe');
  });

  it('should include document title 職務経歴書', () => {
    const cv = createBasicCV();
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('職務経歴書');
    expect(html).toContain('<div class="document-title">職務経歴書</div>');
  });

  it('should include current date in Japanese format', () => {
    const cv = createBasicCV();
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    // Should contain date in format like "2024年12月28日現在"
    expect(html).toMatch(/\d{4}年\d{1,2}月\d{1,2}日現在/);
  });

  it('should render education section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'education',
          title: '学歴',
          content: {
            type: 'education',
            entries: [
              {
                school: '東京大学',
                degree: '工学部 情報工学科',
                start: new Date(2015, 3, 1), // April 2015 (month is 0-indexed)
                end: new Date(2019, 2, 1), // March 2019
              },
            ],
          },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('学歴');
    expect(html).toContain('東京大学');
    expect(html).toContain('工学部 情報工学科');
    expect(html).toContain('2015年4月');
    expect(html).toContain('2019年3月');
  });

  it('should render experience section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'experience',
          title: '職歴',
          content: {
            type: 'experience',
            entries: [
              {
                company: '株式会社テック',
                roles: [
                  {
                    title: 'シニアエンジニア',
                    start: new Date(2020, 3, 1), // April 2020
                    end: 'present',
                    summary: ['プラットフォーム開発をリード'],
                    highlights: ['パフォーマンスを50%改善'],
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('職歴');
    expect(html).toContain('株式会社テック');
    expect(html).toContain('シニアエンジニア');
    expect(html).toContain('プラットフォーム開発をリード');
    expect(html).toContain('パフォーマンスを50%改善');
    expect(html).toContain('現在');
  });

  it('should render skills section with grid format', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'skills',
          title: 'スキル',
          content: {
            type: 'skills',
            entries: [{ items: ['JavaScript', 'TypeScript', 'Python'] }],
            options: { format: 'grid' },
          },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('スキル');
    expect(html).toContain('JavaScript');
    expect(html).toContain('skills-grid');
  });

  it('should render skills section with categorized format', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'skills',
          title: 'スキル',
          content: {
            type: 'skills',
            entries: [
              { category: '言語', items: ['JavaScript', 'Python'] },
              {
                category: 'フレームワーク',
                description: 'React、Vue、Angular',
              },
            ],
            options: { format: 'categorized' },
          },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('言語');
    expect(html).toContain('フレームワーク');
    expect(html).toContain('React、Vue、Angular');
  });

  it('should render certifications section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'certifications',
          title: '資格',
          content: {
            type: 'certifications',
            entries: [
              { name: '基本情報技術者', date: new Date(2020, 3, 1) }, // April 2020
              { name: 'AWS認定ソリューションアーキテクト' },
            ],
          },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('資格');
    expect(html).toContain('基本情報技術者');
    expect(html).toContain('2020年4月');
    expect(html).toContain('AWS認定ソリューションアーキテクト');
  });

  it('should render languages section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'languages',
          title: '語学',
          content: {
            type: 'languages',
            entries: [
              { language: '日本語', level: 'ネイティブ' },
              { language: '英語', level: 'ビジネスレベル' },
            ],
          },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('語学');
    expect(html).toContain('日本語');
    expect(html).toContain('ネイティブ');
    expect(html).toContain('英語');
    expect(html).toContain('ビジネスレベル');
  });

  it('should render text content', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'summary',
          title: '概要',
          content: { type: 'text', text: '10年以上のソフトウェア開発経験' },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('概要');
    expect(html).toContain('10年以上のソフトウェア開発経験');
  });

  it('should render list content', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'summary',
          title: 'ハイライト',
          content: { type: 'list', items: ['項目1', '項目2'] },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('<li>項目1</li>');
    expect(html).toContain('<li>項目2</li>');
  });

  it('should render table content as list', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'experience',
          title: '職歴',
          content: {
            type: 'table',
            rows: [
              { date: '2020年', content: 'イベント1' },
              { date: '2021年', content: 'イベント2' },
            ],
          },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('<li>イベント1</li>');
    expect(html).toContain('<li>イベント2</li>');
  });

  it('should filter out rirekisho-only sections', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'motivation',
          title: '志望動機',
          content: { type: 'text', text: '御社を志望する理由' },
        },
        {
          id: 'experience',
          title: '職歴',
          content: {
            type: 'experience',
            entries: [
              {
                company: '株式会社テック',
                roles: [{ title: 'エンジニア', start: new Date(2020, 0, 1) }], // January 2020
              },
            ],
          },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    // motivation is rirekisho-only, should be filtered out
    expect(html).not.toContain('志望動機');
    expect(html).toContain('職歴');
  });

  it('should escape HTML special characters', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      metadata: {
        ...createBasicCV().metadata,
        name_ja: '山田<script>alert("XSS")</script>太郎',
      },
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should include custom stylesheet when provided', () => {
    const cv = createBasicCV();
    const customCSS = '.custom { color: red; }';
    const html = generateCVJaHTML(cv, {
      paperSize: 'a4',
      customStylesheet: customCSS,
    });

    expect(html).toContain('class="custom-styles"');
    expect(html).toContain('.custom { color: red; }');
  });

  it('should use different paper sizes', () => {
    const cv = createBasicCV();

    const htmlA4 = generateCVJaHTML(cv, { paperSize: 'a4' });
    expect(htmlA4).toContain('210mm 297mm');

    // B4 is portrait orientation (width < height)
    const htmlB4 = generateCVJaHTML(cv, { paperSize: 'b4' });
    expect(htmlB4).toContain('257mm 364mm');
  });

  it('should render skills list as grid for skills section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'skills',
          title: 'スキル',
          content: { type: 'list', items: ['JavaScript', 'Python', 'Go'] },
        },
      ],
    };
    const html = generateCVJaHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('skills-grid');
    expect(html).toContain('JavaScript');
  });
});
