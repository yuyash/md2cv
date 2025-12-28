/**
 * Unit tests for English CV generator
 */

import { describe, expect, it } from 'vitest';

import {
  generateCVEnHTML,
  type CVInput,
} from '../../src/generator/resume_en.js';

describe('generateCVEnHTML', () => {
  const createBasicCV = (): CVInput => ({
    metadata: {
      name: 'John Doe',
      email_address: 'john@example.com',
      phone_number: '+1-555-1234',
    },
    sections: [],
  });

  it('should generate valid HTML document', () => {
    const cv = createBasicCV();
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('</html>');
  });

  it('should include name in header', () => {
    const cv = createBasicCV();
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('John Doe');
    expect(html).toContain('<h1 class="cv-name">John Doe</h1>');
  });

  it('should include contact information', () => {
    const cv = createBasicCV();
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('john@example.com');
    expect(html).toContain('+1-555-1234');
  });

  it('should include LinkedIn when provided', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      metadata: {
        ...createBasicCV().metadata,
        linkedin: 'https://linkedin.com/in/johndoe',
      },
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('https://linkedin.com/in/johndoe');
  });

  it('should include home address when provided', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      metadata: {
        ...createBasicCV().metadata,
        home_address: 'Tokyo, Japan',
      },
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Tokyo, Japan');
  });

  it('should render summary section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'summary',
          title: 'Summary',
          content: { type: 'text', text: 'Experienced software engineer' },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Summary');
    expect(html).toContain('Experienced software engineer');
  });

  it('should render education section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'education',
          title: 'Education',
          content: {
            type: 'education',
            entries: [
              {
                school: 'MIT',
                degree: 'BS Computer Science',
                location: 'Cambridge, MA',
                start: new Date(2015, 8, 1), // September 2015
                end: new Date(2019, 4, 1), // May 2019
                details: ['GPA: 3.9'],
              },
            ],
          },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Education');
    expect(html).toContain('MIT');
    expect(html).toContain('BS Computer Science');
    expect(html).toContain('Cambridge, MA');
    expect(html).toContain('GPA: 3.9');
  });

  it('should render experience section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'experience',
          title: 'Experience',
          content: {
            type: 'experience',
            entries: [
              {
                company: 'Tech Corp',
                location: 'San Francisco, CA',
                roles: [
                  {
                    title: 'Senior Engineer',
                    team: 'Platform Team',
                    start: new Date(2020, 0, 1), // January 2020
                    end: 'present',
                    summary: ['Led development of core platform'],
                    highlights: ['Improved performance by 50%'],
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Experience');
    expect(html).toContain('Tech Corp');
    expect(html).toContain('Senior Engineer');
    expect(html).toContain('Platform Team');
    expect(html).toContain('Led development of core platform');
    expect(html).toContain('Improved performance by 50%');
    expect(html).toContain('Present');
  });

  it('should render experience with projects', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'experience',
          title: 'Experience',
          content: {
            type: 'experience',
            entries: [
              {
                company: 'Tech Corp',
                roles: [
                  {
                    title: 'Engineer',
                    start: new Date(2020, 0, 1), // January 2020
                    projects: [
                      {
                        name: 'Project Alpha',
                        start: new Date(2020, 5, 1), // June 2020
                        end: new Date(2021, 0, 1), // January 2021
                        bullets: ['Built new feature'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Project Alpha');
    expect(html).toContain('Built new feature');
  });

  it('should render skills section with grid format', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'skills',
          title: 'Skills',
          content: {
            type: 'skills',
            entries: [{ items: ['JavaScript', 'TypeScript', 'Python'] }],
            options: { format: 'grid' },
          },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Skills');
    expect(html).toContain('JavaScript');
    expect(html).toContain('TypeScript');
    expect(html).toContain('Python');
    expect(html).toContain('skills-grid');
  });

  it('should render skills section with categorized format', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'skills',
          title: 'Skills',
          content: {
            type: 'skills',
            entries: [
              { category: 'Languages', items: ['JavaScript', 'Python'] },
              { category: 'Frameworks', description: 'React, Vue, Angular' },
            ],
            options: { format: 'categorized' },
          },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Languages');
    expect(html).toContain('Frameworks');
    expect(html).toContain('React, Vue, Angular');
  });

  it('should render certifications section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'certifications',
          title: 'Certifications',
          content: {
            type: 'certifications',
            entries: [
              { name: 'AWS Solutions Architect', date: new Date(2023, 5, 1) }, // June 2023
              { name: 'PMP' },
            ],
          },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Certifications');
    expect(html).toContain('AWS Solutions Architect');
    expect(html).toContain('Jun 2023');
    expect(html).toContain('PMP');
  });

  it('should render languages section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'languages',
          title: 'Languages',
          content: {
            type: 'languages',
            entries: [
              { language: 'English', level: 'Native' },
              { language: 'Japanese', level: 'Business' },
            ],
          },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Languages');
    expect(html).toContain('English');
    expect(html).toContain('Native');
    expect(html).toContain('Japanese');
    expect(html).toContain('Business');
  });

  it('should render competencies section', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'competencies',
          title: 'Core Competencies',
          content: {
            type: 'competencies',
            entries: [
              {
                header: 'Leadership',
                description: 'Led teams of 10+ engineers',
              },
            ],
          },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('Core Competencies');
    expect(html).toContain('Leadership');
    expect(html).toContain('Led teams of 10+ engineers');
  });

  it('should render list content', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'summary',
          title: 'Highlights',
          content: { type: 'list', items: ['Item 1', 'Item 2'] },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
  });

  it('should render table content as list', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      sections: [
        {
          id: 'experience',
          title: 'Experience',
          content: {
            type: 'table',
            rows: [
              { date: '2020', content: 'Event 1' },
              { date: '2021', content: 'Event 2' },
            ],
          },
        },
      ],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).toContain('<li>Event 1</li>');
    expect(html).toContain('<li>Event 2</li>');
  });

  it('should escape HTML special characters', () => {
    const cv: CVInput = {
      ...createBasicCV(),
      metadata: {
        ...createBasicCV().metadata,
        name: 'John <script>alert("XSS")</script> Doe',
      },
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should include custom stylesheet when provided', () => {
    const cv = createBasicCV();
    const customCSS = '.custom { color: red; }';
    const html = generateCVEnHTML(cv, {
      paperSize: 'a4',
      customStylesheet: customCSS,
    });

    expect(html).toContain('class="custom-styles"');
    expect(html).toContain('.custom { color: red; }');
  });

  it('should use different paper sizes', () => {
    const cv = createBasicCV();

    const htmlA4 = generateCVEnHTML(cv, { paperSize: 'a4' });
    expect(htmlA4).toContain('210mm 297mm');

    const htmlLetter = generateCVEnHTML(cv, { paperSize: 'letter' });
    expect(htmlLetter).toContain('215.9mm 279.4mm');
  });
});
