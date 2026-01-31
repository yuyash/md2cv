/**
 * Integration tests for markdown-to-HTML conversion
 *
 * These tests verify the full pipeline from markdown input to HTML output:
 * - Parser preserves markdown formatting in section content
 * - Generator converts markdown to proper HTML tags
 * - Various markdown syntax types are correctly handled
 */

import { describe, expect, it } from 'vitest';
import { generateEnHtml } from '../../src/generator/resume_en.js';
import { generateJaHtml } from '../../src/generator/resume_ja.js';
import { parseMarkdown } from '../../src/parser/index.js';

describe('markdown conversion integration', () => {
  /**
   * Helper to generate HTML from markdown content
   */
  function generateHtmlFromMarkdown(markdown: string): string {
    const result = parseMarkdown(markdown);
    if (!result.ok) {
      throw new Error(`Parse failed: ${JSON.stringify(result.error)}`);
    }
    return generateEnHtml(
      { metadata: result.value.metadata, sections: result.value.sections },
      { paperSize: 'a4' },
    );
  }

  describe('emphasis formatting', () => {
    it('should convert **bold** to <strong> tags', () => {
      const markdown = `---
name: John Doe
---

# Summary

This is **bold text** in the summary.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<strong>bold text</strong>');
    });

    it('should convert *italic* to <em> tags', () => {
      const markdown = `---
name: John Doe
---

# Summary

This is *italic text* in the summary.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<em>italic text</em>');
    });

    it('should convert ***bold and italic*** to nested tags', () => {
      const markdown = `---
name: John Doe
---

# Summary

This is ***bold and italic*** text.
`;
      const html = generateHtmlFromMarkdown(markdown);
      // Can be either <strong><em> or <em><strong>
      expect(html).toMatch(
        /<(strong|em)><(strong|em)>bold and italic<\/(strong|em)><\/(strong|em)>/,
      );
    });

    it('should handle __bold__ with underscores', () => {
      const markdown = `---
name: John Doe
---

# Summary

This is __bold with underscores__ text.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<strong>bold with underscores</strong>');
    });

    it('should handle _italic_ with underscores', () => {
      const markdown = `---
name: John Doe
---

# Summary

This is _italic with underscores_ text.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<em>italic with underscores</em>');
    });
  });

  describe('links', () => {
    it('should convert [text](url) to <a> tags', () => {
      const markdown = `---
name: John Doe
---

# Summary

Check out [my website](https://example.com) for more info.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<a href="https://example.com">my website</a>');
    });

    it('should handle links with titles', () => {
      const markdown = `---
name: John Doe
---

# Summary

Visit [GitHub](https://github.com "GitHub Homepage") for code.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('href="https://github.com"');
      expect(html).toContain('>GitHub</a>');
    });

    it('should handle multiple links in one paragraph', () => {
      const markdown = `---
name: John Doe
---

# Summary

Contact me via [email](mailto:test@example.com) or [LinkedIn](https://linkedin.com/in/test).
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<a href="mailto:test@example.com">email</a>');
      expect(html).toContain(
        '<a href="https://linkedin.com/in/test">LinkedIn</a>',
      );
    });
  });

  describe('inline code', () => {
    it('should convert `code` to <code> tags', () => {
      const markdown = `---
name: John Doe
---

# Summary

I work with \`JavaScript\` and \`TypeScript\` daily.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<code>JavaScript</code>');
      expect(html).toContain('<code>TypeScript</code>');
    });

    it('should handle code with special characters', () => {
      const markdown = `---
name: John Doe
---

# Summary

Use \`npm install --save-dev\` to install dependencies.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<code>npm install --save-dev</code>');
    });
  });

  describe('experience section with markdown', () => {
    it('should convert markdown in summary field', () => {
      const markdown = `---
name: John Doe
---

# Experience

\`\`\`resume:experience
- company: Tech Corp
  role: Senior Engineer
  start: 2020-01
  end: present
  summary: Led **critical** projects using *cutting-edge* technology
\`\`\`
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<strong>critical</strong>');
      expect(html).toContain('<em>cutting-edge</em>');
    });

    it('should convert markdown in highlights', () => {
      const markdown = `---
name: John Doe
---

# Experience

\`\`\`resume:experience
- company: Tech Corp
  role: Engineer
  start: 2020-01
  end: present
  highlights:
    - Built **scalable** microservices with \`Node.js\`
    - Improved *performance* by 50%
    - Collaborated with [design team](https://design.example.com)
\`\`\`
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<strong>scalable</strong>');
      expect(html).toContain('<code>Node.js</code>');
      expect(html).toContain('<em>performance</em>');
      expect(html).toContain(
        '<a href="https://design.example.com">design team</a>',
      );
    });

    it('should convert markdown in project bullets', () => {
      const markdown = `---
name: John Doe
---

# Experience

\`\`\`resume:experience
- company: Tech Corp
  role: Engineer
  start: 2020-01
  end: present
  projects:
    - name: API Gateway
      start: 2021-01
      end: 2021-06
      bullets:
        - Implemented **authentication** using \`OAuth2\`
        - Achieved *99.9%* uptime
\`\`\`
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<strong>authentication</strong>');
      expect(html).toContain('<code>OAuth2</code>');
      expect(html).toContain('<em>99.9%</em>');
    });
  });

  describe('education section with markdown', () => {
    it('should convert markdown in education details', () => {
      const markdown = `---
name: John Doe
---

# Education

\`\`\`resume:education
- school: MIT
  degree: BS Computer Science
  start: 2015-09
  end: 2019-05
  details:
    - "**GPA**: 3.9/4.0"
    - "Focus on *machine learning* and \`distributed systems\`"
\`\`\`
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<strong>GPA</strong>');
      expect(html).toContain('<em>machine learning</em>');
      expect(html).toContain('<code>distributed systems</code>');
    });
  });

  describe('competencies section with markdown', () => {
    it('should convert markdown in competency descriptions', () => {
      const markdown = `---
name: John Doe
---

# Core Competencies

\`\`\`resume:competencies
- header: Technical Leadership
  description: Led **cross-functional** teams using *agile* methodologies
- header: Cloud Architecture
  description: Designed systems on [AWS](https://aws.amazon.com) with \`Kubernetes\`
\`\`\`
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<strong>cross-functional</strong>');
      expect(html).toContain('<em>agile</em>');
      expect(html).toContain('<a href="https://aws.amazon.com">AWS</a>');
      expect(html).toContain('<code>Kubernetes</code>');
    });
  });

  describe('list content with markdown', () => {
    it('should convert markdown in list items', () => {
      const markdown = `---
name: John Doe
---

# Summary

Key achievements:

- Developed **scalable** microservices
- Improved *performance* by 50%
- Implemented \`CI/CD\` pipelines
- Collaborated with [design team](https://design.example.com)
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<strong>scalable</strong>');
      expect(html).toContain('<em>performance</em>');
      expect(html).toContain('<code>CI/CD</code>');
      expect(html).toContain(
        '<a href="https://design.example.com">design team</a>',
      );
    });
  });

  describe('mixed content with markdown', () => {
    it('should convert markdown in paragraphs and lists', () => {
      const markdown = `---
name: John Doe
---

# Summary

I am a **senior engineer** with expertise in *cloud computing*.

- Built **scalable** systems
- Expert in \`AWS\` and \`GCP\`
`;
      const html = generateHtmlFromMarkdown(markdown);
      // Paragraph content
      expect(html).toContain('<strong>senior engineer</strong>');
      expect(html).toContain('<em>cloud computing</em>');
      // List content
      expect(html).toContain('<strong>scalable</strong>');
      expect(html).toContain('<code>AWS</code>');
      expect(html).toContain('<code>GCP</code>');
    });
  });

  describe('Japanese CV with markdown', () => {
    it('should convert markdown in Japanese CV', () => {
      const markdown = [
        '---',
        'name: 山田太郎',
        '---',
        '',
        '# 概要',
        '',
        '**優秀な**エンジニアとして*革新的な*プロジェクトに従事。',
        '',
        '# 職歴',
        '',
        '```resume:experience',
        '- company: テック株式会社',
        '  role: シニアエンジニア',
        '  start: 2020-01',
        '  end: present',
        '  summary: "**重要な**プロジェクトをリード"',
        '  highlights:',
        '    - "`TypeScript`を使用した開発"',
        '    - "*高品質*なコードの実装"',
        '```',
      ].join('\n');

      const result = parseMarkdown(markdown);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const html = generateJaHtml(
        { metadata: result.value.metadata, sections: result.value.sections },
        { paperSize: 'a4' },
      );

      expect(html).toContain('<strong>優秀な</strong>');
      expect(html).toContain('<em>革新的な</em>');
      expect(html).toContain('<strong>重要な</strong>');
      expect(html).toContain('<code>TypeScript</code>');
      expect(html).toContain('<em>高品質</em>');
    });
  });

  describe('complex markdown combinations', () => {
    it('should handle nested formatting', () => {
      const markdown = `---
name: John Doe
---

# Summary

Check out my **[portfolio](https://portfolio.example.com)** for examples.
`;
      const html = generateHtmlFromMarkdown(markdown);
      // Bold link
      expect(html).toMatch(
        /<strong>.*<a href="https:\/\/portfolio\.example\.com">portfolio<\/a>.*<\/strong>/,
      );
    });

    it('should handle code inside bold', () => {
      const markdown = `---
name: John Doe
---

# Summary

Use the **\`npm start\`** command to run.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toMatch(/<strong>.*<code>npm start<\/code>.*<\/strong>/);
    });

    it('should handle multiple formatting in one line', () => {
      const markdown = `---
name: John Doe
---

# Summary

I use **React**, *Vue*, and \`Angular\` for [frontend](https://frontend.dev) development.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<strong>React</strong>');
      expect(html).toContain('<em>Vue</em>');
      expect(html).toContain('<code>Angular</code>');
      expect(html).toContain('<a href="https://frontend.dev">frontend</a>');
    });
  });

  describe('strikethrough (GFM)', () => {
    it('should convert ~~strikethrough~~ to <del> tags', () => {
      const markdown = `---
name: John Doe
---

# Summary

This feature is ~~deprecated~~ and should not be used.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain('<del>deprecated</del>');
    });
  });

  describe('edge cases', () => {
    it('should handle empty markdown content', () => {
      const markdown = `---
name: John Doe
---

# Summary

`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain(
        '<section class="cv-section cv-section--summary">',
      );
    });

    it('should handle markdown with special HTML characters', () => {
      const markdown = `---
name: John Doe
---

# Summary

Working with **<script>** tags and *&amp;* entities safely.
`;
      const html = generateHtmlFromMarkdown(markdown);
      // The markdown should be converted, and HTML entities should be handled
      expect(html).toContain('<strong>');
      expect(html).toContain('<em>');
    });

    it('should preserve plain text without markdown', () => {
      const markdown = `---
name: John Doe
---

# Summary

This is plain text without any markdown formatting.
`;
      const html = generateHtmlFromMarkdown(markdown);
      expect(html).toContain(
        'This is plain text without any markdown formatting.',
      );
      expect(html).not.toContain('<strong>');
      expect(html).not.toContain('<em>');
      expect(html).not.toContain('<code>');
    });
  });
});
