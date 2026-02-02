/**
 * Unit tests for generator/common.ts
 */

import { describe, expect, it } from 'vitest';

import {
  enDateFormatter,
  enLocale,
  escapeHtml,
  formatDateRange,
  jaDateFormatter,
  jaLocale,
  renderCertifications,
  renderCompetencies,
  renderContentBlock,
  renderEducation,
  renderExperience,
  renderLanguages,
  renderSectionContent,
  renderSkills,
  renderSkillsList,
} from '../../src/generator/common.js';
import type {
  CertificationEntry,
  CompetencyEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  SectionContent,
  SkillEntry,
  SkillsOptions,
} from '../../src/types/sections.js';

describe('generator/common', () => {
  describe('escapeHtml', () => {
    it('should return empty string for null/undefined', () => {
      // @ts-expect-error testing null input
      expect(escapeHtml(null)).toBe('');
      // @ts-expect-error testing undefined input
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('enDateFormatter', () => {
    it('should format date correctly', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(enDateFormatter.formatDate(date)).toBe('Jan 2024');
    });

    it('should return empty string for undefined date', () => {
      expect(enDateFormatter.formatDate(undefined)).toBe('');
    });

    it('should format end date as Present', () => {
      expect(enDateFormatter.formatEndDate('present')).toBe('Present');
    });

    it('should format end date as date', () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      expect(enDateFormatter.formatEndDate(date)).toBe('Jun 2024');
    });

    it('should return empty string for undefined end date', () => {
      expect(enDateFormatter.formatEndDate(undefined)).toBe('');
    });
  });

  describe('enLocale', () => {
    it('should have comma separator', () => {
      expect(enLocale.itemSeparator).toBe(', ');
    });
  });

  describe('jaDateFormatter', () => {
    it('should format date in Japanese', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(jaDateFormatter.formatDate(date)).toBe('2024年1月');
    });

    it('should return empty string for undefined date', () => {
      expect(jaDateFormatter.formatDate(undefined)).toBe('');
    });

    it('should format end date as 現在', () => {
      expect(jaDateFormatter.formatEndDate('present')).toBe('現在');
    });

    it('should format end date as date', () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      expect(jaDateFormatter.formatEndDate(date)).toBe('2024年6月');
    });

    it('should return empty string for undefined end date', () => {
      expect(jaDateFormatter.formatEndDate(undefined)).toBe('');
    });
  });

  describe('jaLocale', () => {
    it('should have comma separator', () => {
      expect(jaLocale.itemSeparator).toBe(', ');
    });
  });

  describe('formatDateRange', () => {
    it('should format full date range', () => {
      const start = new Date(2020, 0, 1);
      const end = new Date(2024, 0, 1);
      expect(formatDateRange(start, end, enDateFormatter)).toBe(
        'Jan 2020 - Jan 2024',
      );
    });

    it('should format range with present', () => {
      const start = new Date(2020, 0, 1);
      expect(formatDateRange(start, 'present', enDateFormatter)).toBe(
        'Jan 2020 - Present',
      );
    });

    it('should format start only', () => {
      const start = new Date(2020, 0, 1);
      expect(formatDateRange(start, undefined, enDateFormatter)).toBe(
        'Jan 2020',
      );
    });

    it('should return empty string for no dates', () => {
      expect(formatDateRange(undefined, undefined, enDateFormatter)).toBe('');
    });
  });

  describe('renderEducation', () => {
    it('should render education entry with all fields', () => {
      const entries: EducationEntry[] = [
        {
          school: 'MIT',
          degree: 'BS Computer Science',
          location: 'Cambridge, MA',
          start: new Date(2016, 8, 1),
          end: new Date(2020, 5, 1),
          details: ['GPA: 3.9', "Dean's List"],
        },
      ];
      const html = renderEducation(entries, enDateFormatter);

      expect(html).toContain('MIT');
      expect(html).toContain('BS Computer Science');
      expect(html).toContain('Cambridge, MA');
      expect(html).toContain('Sep 2016 - Jun 2020');
      expect(html).toContain('GPA: 3.9');
      expect(html).toContain("Dean's List");
    });

    it('should render education without optional fields', () => {
      const entries: EducationEntry[] = [
        {
          school: 'University',
          start: new Date(2016, 8, 1),
          end: new Date(2020, 5, 1),
        },
      ];
      const html = renderEducation(entries, enDateFormatter);

      expect(html).toContain('University');
      expect(html).not.toContain('entry-subtitle');
    });

    it('should filter empty details', () => {
      const entries: EducationEntry[] = [
        {
          school: 'University',
          start: new Date(2016, 8, 1),
          end: new Date(2020, 5, 1),
          details: ['Valid detail', '', '  ', 'Another detail'],
        },
      ];
      const html = renderEducation(entries, enDateFormatter);

      expect(html).toContain('Valid detail');
      expect(html).toContain('Another detail');
    });

    it('should render without date range', () => {
      const entries: EducationEntry[] = [
        {
          school: 'University',
          start: new Date(2016, 8, 1),
          end: new Date(2020, 5, 1),
        },
      ];
      // Create a formatter that returns empty strings
      const noDateFormatter = {
        formatDate: () => '',
        formatEndDate: () => '',
        itemSeparator: ', ',
      };
      const html = renderEducation(entries, noDateFormatter);

      expect(html).toContain('University');
      expect(html).not.toContain('entry-date');
    });
  });

  describe('renderCertifications', () => {
    it('should render certification with date', () => {
      const entries: CertificationEntry[] = [
        {
          name: 'AWS Solutions Architect',
          date: new Date(2023, 5, 15),
        },
      ];
      const html = renderCertifications(entries, enDateFormatter);

      expect(html).toContain('AWS Solutions Architect');
      expect(html).toContain('Jun 2023');
    });

    it('should render certification without date', () => {
      const entries: CertificationEntry[] = [
        {
          name: 'AWS Solutions Architect',
          date: undefined as unknown as Date,
        },
      ];
      const html = renderCertifications(entries, enDateFormatter);

      expect(html).toContain('AWS Solutions Architect');
      expect(html).not.toContain('(');
    });
  });

  describe('renderSkills', () => {
    it('should render categorized skills', () => {
      const entries: SkillEntry[] = [
        {
          category: 'Languages',
          items: ['JavaScript', 'TypeScript'],
        },
        {
          category: 'Frameworks',
          description: 'React, Vue, Angular',
        },
      ];
      const options: SkillsOptions = { columns: 3, format: 'categorized' };
      const html = renderSkills(entries, options, enLocale);

      expect(html).toContain('Languages');
      expect(html).toContain('JavaScript, TypeScript');
      expect(html).toContain('Frameworks');
      expect(html).toContain('React, Vue, Angular');
    });

    it('should render grid skills', () => {
      const entries: SkillEntry[] = [
        {
          category: '',
          items: ['JavaScript', 'TypeScript', 'Python'],
        },
      ];
      const options: SkillsOptions = { columns: 3, format: 'grid' };
      const html = renderSkills(entries, options, enLocale);

      expect(html).toContain('skills-grid');
      expect(html).toContain('JavaScript');
      expect(html).toContain('TypeScript');
      expect(html).toContain('Python');
    });

    it('should return empty string for no items', () => {
      const entries: SkillEntry[] = [{ category: '', items: [] }];
      const options: SkillsOptions = { columns: 3, format: 'grid' };
      const html = renderSkills(entries, options, enLocale);

      expect(html).toBe('');
    });

    it('should use custom column count', () => {
      const entries: SkillEntry[] = [
        { category: '', items: ['A', 'B', 'C', 'D'] },
      ];
      const options: SkillsOptions = { columns: 4, format: 'grid' };
      const html = renderSkills(entries, options, enLocale);

      expect(html).toContain('grid-template-columns: repeat(4, 1fr)');
    });

    it('should use default 3 columns class', () => {
      const entries: SkillEntry[] = [{ category: '', items: ['A', 'B', 'C'] }];
      const options: SkillsOptions = { columns: 3, format: 'grid' };
      const html = renderSkills(entries, options, enLocale);

      expect(html).toContain('skills-grid--cols-3');
    });

    it('should auto-detect categorized format', () => {
      const entries: SkillEntry[] = [
        {
          category: 'Programming',
          description: 'JavaScript, Python',
        },
      ];
      const options: SkillsOptions = { columns: 3, format: 'grid' };
      const html = renderSkills(entries, options, enLocale);

      expect(html).toContain('skill-category');
      expect(html).toContain('Programming');
    });
  });

  describe('renderSkillsList', () => {
    it('should render skills list as grid', () => {
      const items = ['JavaScript', 'TypeScript', 'Python'];
      const html = renderSkillsList(items);

      expect(html).toContain('skills-grid');
      expect(html).toContain('JavaScript');
      expect(html).toContain('TypeScript');
      expect(html).toContain('Python');
    });

    it('should return empty string for empty list', () => {
      const html = renderSkillsList([]);
      expect(html).toBe('');
    });

    it('should use custom column count', () => {
      const html = renderSkillsList(['A', 'B'], 4);
      expect(html).toContain('grid-template-columns: repeat(4, 1fr)');
    });

    it('should use default 3 columns', () => {
      const html = renderSkillsList(['A', 'B']);
      expect(html).toContain('skills-grid--cols-3');
    });
  });

  describe('renderLanguages', () => {
    it('should render languages with levels', () => {
      const entries: LanguageEntry[] = [
        { language: 'English', level: 'Native' },
        { language: 'Japanese', level: 'Business' },
      ];
      const html = renderLanguages(entries);

      expect(html).toContain('English');
      expect(html).toContain('Native');
      expect(html).toContain('Japanese');
      expect(html).toContain('Business');
      expect(html).toContain(' • ');
    });

    it('should render language without level', () => {
      const entries: LanguageEntry[] = [{ language: 'English', level: '' }];
      const html = renderLanguages(entries);

      expect(html).toContain('English');
      expect(html).not.toContain('()');
    });
  });

  describe('renderCompetencies', () => {
    it('should render competencies', () => {
      const entries: CompetencyEntry[] = [
        { header: 'Leadership', description: 'Led teams of 10+ engineers' },
        { header: 'Problem Solving', description: 'Resolved complex issues' },
      ];
      const html = renderCompetencies(entries);

      expect(html).toContain('Leadership');
      expect(html).toContain('Led teams of 10+ engineers');
      expect(html).toContain('Problem Solving');
      expect(html).toContain('Resolved complex issues');
    });
  });

  describe('renderExperience', () => {
    it('should render experience with all fields', () => {
      const entries: ExperienceEntry[] = [
        {
          company: 'Tech Corp',
          location: 'San Francisco, CA',
          roles: [
            {
              title: 'Senior Engineer',
              team: 'Platform Team',
              start: new Date(2020, 0, 1),
              end: 'present',
              summary: ['Built scalable systems'],
              highlights: ['Reduced latency by 50%', 'Led migration project'],
              projects: [
                {
                  name: 'Project X',
                  start: new Date(2021, 0, 1),
                  end: new Date(2022, 0, 1),
                  bullets: ['Implemented feature A', 'Optimized performance'],
                },
              ],
            },
          ],
        },
      ];
      const html = renderExperience(entries, enDateFormatter);

      expect(html).toContain('Tech Corp');
      expect(html).toContain('Senior Engineer');
      expect(html).toContain('Platform Team');
      expect(html).toContain('San Francisco, CA');
      expect(html).toContain('Built scalable systems');
      expect(html).toContain('Reduced latency by 50%');
      expect(html).toContain('Project X');
      expect(html).toContain('Implemented feature A');
    });

    it('should render experience without optional fields', () => {
      const entries: ExperienceEntry[] = [
        {
          company: 'Tech Corp',
          roles: [
            {
              title: 'Engineer',
              start: new Date(2020, 0, 1),
              end: new Date(2022, 0, 1),
            },
          ],
        },
      ];
      const html = renderExperience(entries, enDateFormatter);

      expect(html).toContain('Tech Corp');
      expect(html).toContain('Engineer');
    });

    it('should exclude team when includeTeam is false', () => {
      const entries: ExperienceEntry[] = [
        {
          company: 'Tech Corp',
          location: 'SF',
          roles: [
            {
              title: 'Engineer',
              team: 'Platform',
              start: new Date(2020, 0, 1),
              end: new Date(2022, 0, 1),
            },
          ],
        },
      ];
      const html = renderExperience(entries, enDateFormatter, {
        includeTeam: false,
      });

      expect(html).not.toContain('Platform');
      expect(html).not.toContain('entry-subtitle');
    });

    it('should exclude projects when includeProjects is false', () => {
      const entries: ExperienceEntry[] = [
        {
          company: 'Tech Corp',
          roles: [
            {
              title: 'Engineer',
              start: new Date(2020, 0, 1),
              end: new Date(2022, 0, 1),
              projects: [
                {
                  name: 'Project X',
                  start: new Date(2021, 0, 1),
                  end: new Date(2022, 0, 1),
                },
              ],
            },
          ],
        },
      ];
      const html = renderExperience(entries, enDateFormatter, {
        includeProjects: false,
      });

      expect(html).not.toContain('Project X');
    });

    it('should render project without date range', () => {
      const entries: ExperienceEntry[] = [
        {
          company: 'Tech Corp',
          roles: [
            {
              title: 'Engineer',
              start: new Date(2020, 0, 1),
              end: new Date(2022, 0, 1),
              projects: [
                {
                  name: 'Project X',
                  start: new Date(2021, 0, 1),
                  end: new Date(2022, 0, 1),
                },
              ],
            },
          ],
        },
      ];
      // Create a formatter that returns empty strings for project dates
      const noDateFormatter = {
        formatDate: () => '',
        formatEndDate: () => '',
        itemSeparator: ', ',
      };
      const html = renderExperience(entries, noDateFormatter);

      expect(html).toContain('Project X');
    });
  });

  describe('renderContentBlock', () => {
    it('should render markdown block', () => {
      const html = renderContentBlock(
        { type: 'markdown', content: '**Bold** text' },
        'test',
        enLocale,
      );

      expect(html).toContain('<strong>Bold</strong>');
    });

    it('should render education block', () => {
      const html = renderContentBlock(
        {
          type: 'education',
          entries: [
            {
              school: 'MIT',
              start: new Date(2016, 8, 1),
              end: new Date(2020, 5, 1),
            },
          ],
        },
        'education',
        enLocale,
      );

      expect(html).toContain('MIT');
    });

    it('should render experience block', () => {
      const html = renderContentBlock(
        {
          type: 'experience',
          entries: [
            {
              company: 'Tech Corp',
              roles: [
                {
                  title: 'Engineer',
                  start: new Date(2020, 0, 1),
                  end: new Date(2022, 0, 1),
                },
              ],
            },
          ],
        },
        'experience',
        enLocale,
      );

      expect(html).toContain('Tech Corp');
    });

    it('should render certifications block', () => {
      const html = renderContentBlock(
        {
          type: 'certifications',
          entries: [{ name: 'AWS', date: new Date(2023, 0, 1) }],
        },
        'certifications',
        enLocale,
      );

      expect(html).toContain('AWS');
    });

    it('should render skills block', () => {
      const html = renderContentBlock(
        {
          type: 'skills',
          entries: [{ category: '', items: ['JS'] }],
          options: { columns: 3, format: 'grid' },
        },
        'skills',
        enLocale,
      );

      expect(html).toContain('JS');
    });

    it('should render competencies block', () => {
      const html = renderContentBlock(
        {
          type: 'competencies',
          entries: [{ header: 'Leadership', description: 'Led teams' }],
        },
        'competencies',
        enLocale,
      );

      expect(html).toContain('Leadership');
    });

    it('should render languages block', () => {
      const html = renderContentBlock(
        {
          type: 'languages',
          entries: [{ language: 'English', level: 'Native' }],
        },
        'languages',
        enLocale,
      );

      expect(html).toContain('English');
    });

    it('should render table block', () => {
      const html = renderContentBlock(
        {
          type: 'table',
          rows: [{ year: '2020', month: '1', content: 'Event' }],
        },
        'table',
        enLocale,
      );

      expect(html).toContain('Event');
    });

    it('should return empty string for unknown block type', () => {
      const html = renderContentBlock(
        // @ts-expect-error testing unknown type
        { type: 'unknown' },
        'test',
        enLocale,
      );

      expect(html).toBe('');
    });
  });

  describe('renderSectionContent', () => {
    it('should render composite content', () => {
      const content: SectionContent = {
        type: 'composite',
        blocks: [
          { type: 'markdown', content: 'Hello' },
          { type: 'markdown', content: 'World' },
        ],
      };
      const html = renderSectionContent(content, 'test', enLocale);

      expect(html).toContain('Hello');
      expect(html).toContain('World');
    });

    it('should render text content', () => {
      const content: SectionContent = {
        type: 'text',
        text: '**Bold** text',
      };
      const html = renderSectionContent(content, 'test', enLocale);

      expect(html).toContain('<strong>Bold</strong>');
    });

    it('should render list content', () => {
      const content: SectionContent = {
        type: 'list',
        items: ['Item 1', 'Item 2'],
      };
      const html = renderSectionContent(content, 'test', enLocale);

      expect(html).toContain('<ul>');
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
    });

    it('should render skills list for skills section', () => {
      const content: SectionContent = {
        type: 'list',
        items: ['JavaScript', 'TypeScript'],
      };
      const html = renderSectionContent(content, 'skills', enLocale);

      expect(html).toContain('skills-grid');
      expect(html).toContain('JavaScript');
    });

    it('should render mixed content', () => {
      const content: SectionContent = {
        type: 'mixed',
        parts: [
          { type: 'paragraph', text: 'Intro paragraph' },
          { type: 'list', items: ['Item 1', 'Item 2'] },
        ],
      };
      const html = renderSectionContent(content, 'test', enLocale);

      expect(html).toContain('Intro paragraph');
      expect(html).toContain('Item 1');
    });

    it('should render education content', () => {
      const content: SectionContent = {
        type: 'education',
        entries: [
          {
            school: 'MIT',
            start: new Date(2016, 8, 1),
            end: new Date(2020, 5, 1),
          },
        ],
      };
      const html = renderSectionContent(content, 'education', enLocale);

      expect(html).toContain('MIT');
    });

    it('should render experience content', () => {
      const content: SectionContent = {
        type: 'experience',
        entries: [
          {
            company: 'Tech Corp',
            roles: [
              {
                title: 'Engineer',
                start: new Date(2020, 0, 1),
                end: new Date(2022, 0, 1),
              },
            ],
          },
        ],
      };
      const html = renderSectionContent(content, 'experience', enLocale);

      expect(html).toContain('Tech Corp');
    });

    it('should render certifications content', () => {
      const content: SectionContent = {
        type: 'certifications',
        entries: [{ name: 'AWS', date: new Date(2023, 0, 1) }],
      };
      const html = renderSectionContent(content, 'certifications', enLocale);

      expect(html).toContain('AWS');
    });

    it('should render skills content', () => {
      const content: SectionContent = {
        type: 'skills',
        entries: [{ category: '', items: ['JS'] }],
        options: { columns: 3, format: 'grid' },
      };
      const html = renderSectionContent(content, 'skills', enLocale);

      expect(html).toContain('JS');
    });

    it('should render competencies content', () => {
      const content: SectionContent = {
        type: 'competencies',
        entries: [{ header: 'Leadership', description: 'Led teams' }],
      };
      const html = renderSectionContent(content, 'competencies', enLocale);

      expect(html).toContain('Leadership');
    });

    it('should render languages content', () => {
      const content: SectionContent = {
        type: 'languages',
        entries: [{ language: 'English', level: 'Native' }],
      };
      const html = renderSectionContent(content, 'languages', enLocale);

      expect(html).toContain('English');
    });

    it('should render table content', () => {
      const content: SectionContent = {
        type: 'table',
        rows: [{ year: '2020', month: '1', content: 'Event' }],
      };
      const html = renderSectionContent(content, 'table', enLocale);

      expect(html).toContain('Event');
    });

    it('should return empty string for unknown content type', () => {
      const content = {
        type: 'unknown',
      } as unknown as SectionContent;
      const html = renderSectionContent(content, 'test', enLocale);

      expect(html).toBe('');
    });
  });
});
