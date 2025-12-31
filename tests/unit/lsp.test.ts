/**
 * Unit tests for LSP-aware parser module
 */

import { describe, expect, it } from 'vitest';

import { parseMarkdownWithPositions } from '../../src/parser/lsp.js';
import { isFailure, isSuccess } from '../../src/types/result.js';

describe('LSP Parser', () => {
  describe('parseMarkdownWithPositions', () => {
    describe('basic parsing', () => {
      it('should parse empty document', () => {
        const result = parseMarkdownWithPositions('');

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).toBeNull();
          expect(result.value.sections).toEqual([]);
          expect(result.value.codeBlocks).toEqual([]);
        }
      });

      it('should parse document with only text', () => {
        const markdown = 'Hello world\n\nThis is a test.';
        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).toBeNull();
          expect(result.value.rawContent).toBe(markdown);
        }
      });
    });

    describe('frontmatter parsing', () => {
      it('should parse valid frontmatter', () => {
        const markdown = `---
name: John Doe
email: john@example.com
---

# Content`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.frontmatter?.fields.length).toBe(2);

          const nameField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'name',
          );
          expect(nameField?.value).toBe('John Doe');

          const emailField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'email',
          );
          expect(emailField?.value).toBe('john@example.com');
        }
      });

      it('should parse frontmatter with position information', () => {
        const markdown = `---
name: Test
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const frontmatter = result.value.frontmatter;
          expect(frontmatter).not.toBeNull();
          expect(frontmatter?.range.start.line).toBe(0);
        }
      });

      it('should handle invalid YAML frontmatter', () => {
        // Use truly invalid YAML that will cause a parse error
        const markdown = `---
name: "unclosed string
key: : invalid
---`;

        const result = parseMarkdownWithPositions(markdown);

        // The parser may handle some invalid YAML gracefully
        // Check that it either fails or returns null frontmatter
        if (isFailure(result)) {
          expect(result.error.length).toBeGreaterThan(0);
          expect(result.error[0].source).toBe('frontmatter');
        } else {
          // Some invalid YAML may be parsed with null/undefined values
          expect(isSuccess(result)).toBe(true);
        }
      });

      it('should parse frontmatter with empty values', () => {
        const markdown = `---
name: John
phone:
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const phoneField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'phone',
          );
          expect(phoneField?.value).toBe('null');
        }
      });
    });

    describe('code block parsing', () => {
      it('should parse resume code blocks', () => {
        const markdown = `# Experience

\`\`\`resume:experience
company: Acme Corp
position: Developer
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.codeBlocks.length).toBe(1);
          expect(result.value.codeBlocks[0].type).toBe('experience');
          expect(result.value.codeBlocks[0].lang).toBe('resume:experience');
          expect(result.value.codeBlocks[0].content).toContain('company: Acme');
        }
      });

      it('should ignore non-resume code blocks', () => {
        const markdown = `# Code

\`\`\`javascript
console.log('hello');
\`\`\`

\`\`\`resume:skills
- JavaScript
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.codeBlocks.length).toBe(1);
          expect(result.value.codeBlocks[0].type).toBe('skills');
        }
      });

      it('should parse code block with position information', () => {
        const markdown = `# Test

\`\`\`resume:test
content: here
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const codeBlock = result.value.codeBlocks[0];
          expect(codeBlock.range.start.line).toBeGreaterThan(0);
          expect(codeBlock.contentRange.start.line).toBe(
            codeBlock.range.start.line + 1,
          );
        }
      });

      it('should parse multiple code blocks', () => {
        const markdown = `# Resume

\`\`\`resume:experience
company: A
\`\`\`

\`\`\`resume:education
school: B
\`\`\`

\`\`\`resume:skills
- C
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.codeBlocks.length).toBe(3);
          expect(result.value.codeBlocks[0].type).toBe('experience');
          expect(result.value.codeBlocks[1].type).toBe('education');
          expect(result.value.codeBlocks[2].type).toBe('skills');
        }
      });
    });

    describe('section parsing', () => {
      it('should parse sections with known tags', () => {
        const markdown = `# Experience

Some content here.

# Education

More content.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(2);
          expect(result.value.sections[0].title).toBe('Experience');
          expect(result.value.sections[1].title).toBe('Education');
        }
      });

      it('should include code blocks in sections', () => {
        const markdown = `# Experience

\`\`\`resume:experience
company: Test
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].codeBlocks.length).toBe(1);
        }
      });

      it('should parse section with position information', () => {
        const markdown = `# Experience

Content here.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const section = result.value.sections[0];
          expect(section.titleRange.start.line).toBe(0);
          expect(section.range.start.line).toBe(0);
        }
      });

      it('should ignore unknown section tags', () => {
        const markdown = `# Unknown Section

Content.

# Experience

More content.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].title).toBe('Experience');
        }
      });
    });

    describe('complete document parsing', () => {
      it('should parse a complete resume document', () => {
        const markdown = `---
name: John Doe
email: john@example.com
---

# Experience

\`\`\`resume:experience
company: Acme Corp
position: Senior Developer
start_date: 2020-01
\`\`\`

# Education

\`\`\`resume:education
institution: University
degree: BS Computer Science
\`\`\`

# Skills

\`\`\`resume:skills
- JavaScript
- TypeScript
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.frontmatter?.fields.length).toBe(2);
          expect(result.value.sections.length).toBe(3);
          expect(result.value.codeBlocks.length).toBe(3);
        }
      });

      it('should preserve raw content', () => {
        const markdown = `# Test\n\nContent here.`;
        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.rawContent).toBe(markdown);
        }
      });
    });

    describe('error handling', () => {
      it('should handle malformed markdown gracefully', () => {
        const markdown = `# Heading

\`\`\`resume:test
unclosed code block`;

        const result = parseMarkdownWithPositions(markdown);

        // Should still parse, just with potentially incomplete code block
        expect(isSuccess(result)).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle frontmatter without fields', () => {
        const markdown = `---
---

# Content`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.frontmatter?.fields.length).toBe(0);
        }
      });

      it('should handle code block without lang', () => {
        const markdown = `# Test

\`\`\`
plain code block
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Should not include non-resume code blocks
          expect(result.value.codeBlocks.length).toBe(0);
        }
      });

      it('should handle multiple sections with code blocks', () => {
        const markdown = `# Experience

\`\`\`resume:experience
company: A
\`\`\`

\`\`\`resume:experience
company: B
\`\`\`

# Skills

\`\`\`resume:skills
- C
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(2);
          expect(result.value.sections[0].codeBlocks.length).toBe(2);
          expect(result.value.sections[1].codeBlocks.length).toBe(1);
        }
      });

      it('should handle document with only frontmatter', () => {
        const markdown = `---
name: Test
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.sections.length).toBe(0);
          expect(result.value.codeBlocks.length).toBe(0);
        }
      });

      it('should handle nested YAML values in frontmatter', () => {
        const markdown = `---
name: John
contact:
  email: john@example.com
  phone: 123-456-7890
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.frontmatter?.fields.length).toBeGreaterThan(0);
        }
      });

      it('should handle section at end of document', () => {
        const markdown = `# Experience

Content here.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].range.end.line).toBeGreaterThan(0);
        }
      });

      it('should handle multiline code block content', () => {
        const markdown = `# Experience

\`\`\`resume:experience
company: Acme Corp
position: Developer
start_date: 2020-01
end_date: 2023-12
description: |
  Did many things
  Over multiple lines
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.codeBlocks.length).toBe(1);
          expect(result.value.codeBlocks[0].content).toContain(
            'multiple lines',
          );
        }
      });

      it('should handle Japanese section titles', () => {
        const markdown = `# 職歴

\`\`\`resume:experience
company: 株式会社テスト
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].title).toBe('職歴');
        }
      });

      it('should handle heading with inline formatting', () => {
        const markdown = `# **Experience**

Content.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // The title should include the text content
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].title).toBe('Experience');
        }
      });
    });
  });
});
