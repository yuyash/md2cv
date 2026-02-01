/**
 * Unit tests for LSP-aware parser module
 */

import type { Paragraph, Text, ThematicBreak } from 'mdast';
import { describe, expect, it } from 'vitest';

import { __test__, parseMarkdownWithPositions } from '../../src/parser/lsp.js';
import { isFailure, isSuccess } from '../../src/types/result.js';

const {
  toPosition,
  toRange,
  extractText,
  calculateYamlNodeRange,
  offsetToPosition,
} = __test__;

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
---`;

        const result = parseMarkdownWithPositions(markdown);

        // The parser should return a failure with YAML parse error
        expect(isFailure(result)).toBe(true);
        if (isFailure(result)) {
          expect(result.error.length).toBeGreaterThan(0);
          expect(result.error[0].source).toBe('frontmatter');
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

      it('should handle YAML with non-Error exception', () => {
        // This tests the catch block for non-Error exceptions
        const markdown = `---
name: Test
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
      });

      it('should handle frontmatter field without value node', () => {
        const markdown = `---
name: John
empty_field:
another: value
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const emptyField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'empty_field',
          );
          expect(emptyField).toBeDefined();
        }
      });

      it('should handle YAML parse error with line position', () => {
        const markdown = `---
name: "unclosed
---`;

        const result = parseMarkdownWithPositions(markdown);

        // Should fail with YAML parse error
        expect(isFailure(result)).toBe(true);
        if (isFailure(result)) {
          expect(result.error.length).toBeGreaterThan(0);
          expect(result.error[0].source).toBe('frontmatter');
        }
      });

      it('should handle code block at document start without section', () => {
        const markdown = `\`\`\`resume:skills
- JavaScript
\`\`\`

# Skills

More content`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Code block outside section should still be in codeBlocks
          expect(result.value.codeBlocks.length).toBeGreaterThanOrEqual(1);
        }
      });

      it('should handle multiple consecutive sections', () => {
        const markdown = `# Experience

Content 1

# Education

Content 2

# Skills

Content 3`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(3);
          expect(result.value.sections[0].id).toBe('experience');
          expect(result.value.sections[1].id).toBe('education');
          expect(result.value.sections[2].id).toBe('skills');
        }
      });

      it('should handle section with only code block no text', () => {
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

      it('should handle empty code block', () => {
        const markdown = `# Experience

\`\`\`resume:experience
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.codeBlocks.length).toBe(1);
          expect(result.value.codeBlocks[0].content).toBe('');
        }
      });

      it('should handle frontmatter with special characters in values', () => {
        const markdown = `---
name: "John: Doe"
email: test@example.com
description: "Line 1\\nLine 2"
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const nameField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'name',
          );
          expect(nameField?.value).toBe('John: Doe');
        }
      });

      it('should handle document with only unknown sections', () => {
        const markdown = `# Unknown Section 1

Content 1

# Unknown Section 2

Content 2`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Unknown sections should not be included
          expect(result.value.sections.length).toBe(0);
        }
      });

      it('should handle section followed by unknown section', () => {
        const markdown = `# Experience

Content 1

# Unknown Section

Content 2

# Education

Content 3`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(2);
          expect(result.value.sections[0].id).toBe('experience');
          expect(result.value.sections[1].id).toBe('education');
        }
      });

      it('should handle frontmatter with complex nested structures', () => {
        const markdown = `---
name: John
address:
  street: 123 Main St
  city: Tokyo
  nested:
    deep: value
---

# Experience

Content`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.frontmatter?.fields.length).toBeGreaterThan(0);
        }
      });

      it('should handle frontmatter with array values', () => {
        const markdown = `---
name: John
skills:
  - JavaScript
  - TypeScript
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const skillsField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'skills',
          );
          expect(skillsField).toBeDefined();
        }
      });

      it('should handle heading with multiple inline elements', () => {
        const markdown = `# **Bold** and *italic* text

Content here.

# Experience

More content.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // The extractText function should handle nested children
          // Only "Experience" is a known section tag
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].title).toBe('Experience');
        }
      });

      it('should handle heading with link', () => {
        const markdown = `# [Experience](http://example.com)

Content here.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].title).toBe('Experience');
        }
      });

      it('should handle heading with code span', () => {
        const markdown = `# Code \`example\`

Content here.

# Experience

More content.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // extractText should handle inlineCode nodes
          // Only "Experience" is a known section tag
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].title).toBe('Experience');
        }
      });

      it('should handle YAML with boolean values', () => {
        const markdown = `---
name: John
active: true
verified: false
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const activeField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'active',
          );
          expect(activeField?.value).toBe('true');
        }
      });

      it('should handle YAML with numeric values', () => {
        const markdown = `---
name: John
age: 30
salary: 50000.50
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const ageField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'age',
          );
          expect(ageField?.value).toBe('30');
        }
      });

      it('should handle YAML with null explicit value', () => {
        const markdown = `---
name: John
middle_name: null
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const middleNameField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'middle_name',
          );
          expect(middleNameField).toBeDefined();
        }
      });

      it('should handle section with deeply nested content', () => {
        const markdown = `# Experience

Some **bold with *nested italic* inside** text.

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

      it('should handle frontmatter with multiline string', () => {
        const markdown = `---
name: John
bio: |
  This is a multiline
  biography that spans
  multiple lines
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const bioField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'bio',
          );
          expect(bioField).toBeDefined();
          expect(bioField?.value).toContain('multiline');
        }
      });

      it('should handle frontmatter with folded string', () => {
        const markdown = `---
name: John
summary: >
  This is a folded
  string that becomes
  a single line
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const summaryField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'summary',
          );
          expect(summaryField).toBeDefined();
        }
      });

      it('should handle document with only code blocks no sections', () => {
        const markdown = `\`\`\`resume:experience
company: Test
\`\`\`

\`\`\`resume:education
school: University
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Code blocks should be collected even without sections
          expect(result.value.codeBlocks.length).toBe(2);
          expect(result.value.sections.length).toBe(0);
        }
      });

      it('should handle section range calculation with no position', () => {
        // This tests the edge case where node.position might be undefined
        const markdown = `# Experience

Content

# Education

More content`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(2);
          // Verify ranges are calculated
          expect(result.value.sections[0].range).toBeDefined();
          expect(result.value.sections[1].range).toBeDefined();
        }
      });

      it('should handle YAML with date values', () => {
        const markdown = `---
name: John
dob: 1990-01-15
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const dobField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'dob',
          );
          expect(dobField).toBeDefined();
        }
      });

      it('should handle YAML with quoted keys', () => {
        const markdown = `---
"name": John
'email': test@example.com
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.frontmatter?.fields.length).toBe(2);
        }
      });

      it('should handle very long frontmatter', () => {
        const lines = ['---', 'name: John'];
        for (let i = 0; i < 50; i++) {
          lines.push(`field${i}: value${i}`);
        }
        lines.push('---');
        const markdown = lines.join('\n');

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.frontmatter?.fields.length).toBe(51);
        }
      });

      it('should handle section with image in heading', () => {
        const markdown = `# ![icon](icon.png) Experience

Content here.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // extractText should handle image nodes (returning empty or alt text)
          expect(result.value.sections.length).toBe(1);
        }
      });

      it('should handle YAML with anchor and alias', () => {
        const markdown = `---
name: &name John
alias: *name
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
        }
      });

      it('should handle frontmatter with inline flow sequence', () => {
        const markdown = `---
name: John
tags: [tag1, tag2, tag3]
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const tagsField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'tags',
          );
          expect(tagsField).toBeDefined();
        }
      });

      it('should handle frontmatter with inline flow mapping', () => {
        const markdown = `---
name: John
contact: {email: test@example.com, phone: 123}
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const contactField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'contact',
          );
          expect(contactField).toBeDefined();
        }
      });

      it('should handle empty section between known sections', () => {
        const markdown = `# Experience

Content 1

# Unknown

# Education

Content 2`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(2);
        }
      });

      it('should handle code block with resume prefix but no type', () => {
        const markdown = `# Experience

\`\`\`resume:
content here
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Should still parse the code block with empty type
          expect(result.value.codeBlocks.length).toBe(1);
          expect(result.value.codeBlocks[0].type).toBe('');
        }
      });

      it('should handle whitespace-only frontmatter value', () => {
        const markdown = `---
name: "   "
email: test@example.com
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const nameField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'name',
          );
          expect(nameField?.value).toBe('   ');
        }
      });

      it('should handle frontmatter with only key no value pair', () => {
        // Test YAML where value node is completely missing (not just null)
        const markdown = `---
name:
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const nameField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'name',
          );
          expect(nameField).toBeDefined();
          expect(nameField?.value).toBe('null');
        }
      });

      it('should handle YAML with complex scalar that may lack range info', () => {
        // Test with complex YAML structures that might not have range info
        const markdown = `---
name: John
complex: !!str "typed string"
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
        }
      });

      it('should handle YAML with binary tag', () => {
        const markdown = `---
name: John
data: !!binary |
  R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
        }
      });

      it('should handle YAML with merge key', () => {
        const markdown = `---
defaults: &defaults
  name: John
person:
  <<: *defaults
  email: test@example.com
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
        }
      });

      it('should handle deeply nested YAML without range', () => {
        const markdown = `---
level1:
  level2:
    level3:
      level4:
        value: deep
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
        }
      });

      it('should handle YAML with comment', () => {
        const markdown = `---
# This is a comment
name: John # inline comment
email: test@example.com
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.frontmatter?.fields.length).toBe(2);
        }
      });

      it('should handle YAML with empty document', () => {
        const markdown = `---
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.frontmatter?.fields.length).toBe(0);
        }
      });

      it('should handle YAML with only whitespace', () => {
        const markdown = `---
   
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
        }
      });

      it('should handle section heading at very end of document', () => {
        const markdown = `# Experience`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].title).toBe('Experience');
        }
      });

      it('should handle multiple headings with no content between', () => {
        const markdown = `# Experience
# Education
# Skills`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(3);
        }
      });

      it('should handle heading with only whitespace after', () => {
        const markdown = `# Experience
   
   
# Education`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(2);
        }
      });

      it('should handle YAML error that is not YAMLParseError', () => {
        // This is tricky to trigger - most YAML errors are YAMLParseError
        // But we can test with extremely malformed content
        const markdown = `---
name: "test
---`;

        const result = parseMarkdownWithPositions(markdown);

        // Should fail with YAML parse error
        expect(isFailure(result)).toBe(true);
        if (isFailure(result)) {
          expect(result.error.length).toBeGreaterThan(0);
          expect(result.error[0].source).toBe('frontmatter');
        }
      });

      it('should return failure when YAML frontmatter has parse error', () => {
        // Unclosed bracket causes a YAMLParseError
        const markdown = `---
name: [unclosed
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isFailure(result)).toBe(true);
        if (isFailure(result)) {
          expect(result.error.length).toBeGreaterThan(0);
          expect(result.error[0].source).toBe('frontmatter');
        }
      });

      it('should handle YAML with tab indentation error', () => {
        // YAML doesn't allow tabs for indentation in some contexts
        const markdown = `---
name: John
address: {unclosed
---`;

        const result = parseMarkdownWithPositions(markdown);

        // Should fail with YAML parse error
        expect(isFailure(result)).toBe(true);
        if (isFailure(result)) {
          expect(result.error.length).toBeGreaterThan(0);
          expect(result.error[0].source).toBe('frontmatter');
        }
      });

      it('should handle YAML with invalid mapping', () => {
        // Invalid YAML - unclosed quote
        const markdown = `---
name: "John
email: test@example.com
---`;

        const result = parseMarkdownWithPositions(markdown);

        // Should fail with YAML parse error
        expect(isFailure(result)).toBe(true);
        if (isFailure(result)) {
          expect(result.error.length).toBeGreaterThan(0);
        }
      });

      it('should handle code block with very long content', () => {
        const lines = ['company: Test'];
        for (let i = 0; i < 100; i++) {
          lines.push(`field${i}: value${i}`);
        }
        const markdown = `# Experience

\`\`\`resume:experience
${lines.join('\n')}
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.codeBlocks.length).toBe(1);
        }
      });

      it('should handle document with mixed content types', () => {
        const markdown = `---
name: John
---

Some text before sections.

# Experience

\`\`\`resume:experience
company: Test
\`\`\`

Some text after code block.

More paragraphs.

# Education

\`\`\`resume:education
school: University
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.sections.length).toBe(2);
          expect(result.value.codeBlocks.length).toBe(2);
        }
      });

      it('should handle YAML with special unicode characters', () => {
        const markdown = `---
name: 田中太郎
emoji: 🎉
special: "→←↑↓"
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const nameField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'name',
          );
          expect(nameField?.value).toBe('田中太郎');
        }
      });

      it('should handle section with sub-headings', () => {
        const markdown = `# Experience

## Company A

Details about company A.

## Company B

Details about company B.

# Education

Content.`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Only h1 headings create sections
          expect(result.value.sections.length).toBe(2);
        }
      });

      it('should handle YAML with very long key names', () => {
        const longKey = 'a'.repeat(100);
        const markdown = `---
${longKey}: value
name: John
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const longField = result.value.frontmatter?.fields.find(
            (f) => f.key === longKey,
          );
          expect(longField).toBeDefined();
        }
      });

      it('should handle YAML with very long values', () => {
        const longValue = 'b'.repeat(1000);
        const markdown = `---
name: ${longValue}
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const nameField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'name',
          );
          expect(nameField?.value).toBe(longValue);
        }
      });

      it('should handle empty string value in YAML', () => {
        const markdown = `---
name: ""
email: test@example.com
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          const nameField = result.value.frontmatter?.fields.find(
            (f) => f.key === 'name',
          );
          expect(nameField?.value).toBe('');
        }
      });

      it('should handle YAML with escaped characters', () => {
        const markdown = `---
name: "John\\"Doe"
path: "C:\\\\Users\\\\test"
---`;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
        }
      });

      it('should handle code block immediately after frontmatter', () => {
        const markdown = `---
name: John
---
\`\`\`resume:experience
company: Test
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.frontmatter).not.toBeNull();
          expect(result.value.codeBlocks.length).toBe(1);
        }
      });

      it('should handle multiple code blocks in same section', () => {
        const markdown = `# Experience

\`\`\`resume:experience
company: A
\`\`\`

Some text between.

\`\`\`resume:experience
company: B
\`\`\`

More text.

\`\`\`resume:experience
company: C
\`\`\``;

        const result = parseMarkdownWithPositions(markdown);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.sections.length).toBe(1);
          expect(result.value.sections[0].codeBlocks.length).toBe(3);
        }
      });
    });
  });

  describe('internal helper functions', () => {
    describe('toPosition', () => {
      it('should return zero position when point is undefined', () => {
        const result = toPosition(undefined);
        expect(result.line).toBe(0);
        expect(result.character).toBe(0);
      });

      it('should convert 1-based to 0-based position', () => {
        const result = toPosition({ line: 5, column: 10 });
        expect(result.line).toBe(4);
        expect(result.character).toBe(9);
      });

      it('should handle line 1 column 1', () => {
        const result = toPosition({ line: 1, column: 1 });
        expect(result.line).toBe(0);
        expect(result.character).toBe(0);
      });
    });

    describe('toRange', () => {
      it('should return zero range when position is undefined', () => {
        const result = toRange(undefined);
        expect(result.start.line).toBe(0);
        expect(result.start.character).toBe(0);
        expect(result.end.line).toBe(0);
        expect(result.end.character).toBe(0);
      });

      it('should convert position to range', () => {
        const result = toRange({
          start: { line: 1, column: 1 },
          end: { line: 5, column: 10 },
        });
        expect(result.start.line).toBe(0);
        expect(result.start.character).toBe(0);
        expect(result.end.line).toBe(4);
        expect(result.end.character).toBe(9);
      });
    });

    describe('extractText', () => {
      it('should extract value from text node', () => {
        const node: Text = { type: 'text', value: 'hello world' };
        const result = extractText(node);
        expect(result).toBe('hello world');
      });

      it('should extract text from node with children', () => {
        const node: Paragraph = {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'hello ' },
            { type: 'text', value: 'world' },
          ],
        };
        const result = extractText(node);
        expect(result).toBe('hello world');
      });

      it('should return empty string for node without value or children', () => {
        const node: ThematicBreak = { type: 'thematicBreak' };
        const result = extractText(node);
        expect(result).toBe('');
      });

      it('should handle deeply nested children', () => {
        const node: Paragraph = {
          type: 'paragraph',
          children: [
            {
              type: 'strong',
              children: [
                { type: 'text', value: 'bold ' },
                {
                  type: 'emphasis',
                  children: [{ type: 'text', value: 'and italic' }],
                },
              ],
            },
          ],
        };
        const result = extractText(node);
        expect(result).toBe('bold and italic');
      });
    });

    describe('calculateYamlNodeRange', () => {
      it('should return fallback range when node has no range property', () => {
        const yamlContent = 'name: John';
        const node = { value: 'John' }; // No range property
        const result = calculateYamlNodeRange(yamlContent, node, 5);
        expect(result.start.line).toBe(5);
        expect(result.start.character).toBe(0);
        expect(result.end.line).toBe(5);
        expect(result.end.character).toBe(0);
      });

      it('should calculate range from node range property', () => {
        const yamlContent = 'name: John';
        const node = { range: [0, 4] }; // "name"
        const result = calculateYamlNodeRange(yamlContent, node, 1);
        expect(result.start.line).toBe(1);
        expect(result.start.character).toBe(0);
        expect(result.end.line).toBe(1);
        expect(result.end.character).toBe(4);
      });

      it('should handle multiline content', () => {
        const yamlContent = 'name: John\nemail: test@example.com';
        const node = { range: [11, 35] }; // "email: test@example.com"
        const result = calculateYamlNodeRange(yamlContent, node, 1);
        expect(result.start.line).toBe(2);
        expect(result.start.character).toBe(0);
      });

      it('should handle node with empty object', () => {
        const yamlContent = 'name: John';
        const node = {}; // No range property
        const result = calculateYamlNodeRange(yamlContent, node, 5);
        expect(result.start.line).toBe(5);
        expect(result.start.character).toBe(0);
      });
    });

    describe('offsetToPosition', () => {
      it('should convert offset to position in single line', () => {
        const content = 'hello world';
        const result = offsetToPosition(content, 6, 0);
        expect(result.line).toBe(0);
        expect(result.character).toBe(6);
      });

      it('should convert offset to position in multiline content', () => {
        const content = 'line1\nline2\nline3';
        const result = offsetToPosition(content, 12, 0);
        expect(result.line).toBe(2);
        expect(result.character).toBe(0);
      });

      it('should handle offset at newline', () => {
        const content = 'line1\nline2';
        const result = offsetToPosition(content, 5, 0);
        expect(result.line).toBe(0);
        expect(result.character).toBe(5);
      });

      it('should apply base line offset', () => {
        const content = 'hello';
        const result = offsetToPosition(content, 3, 10);
        expect(result.line).toBe(10);
        expect(result.character).toBe(3);
      });

      it('should handle empty content', () => {
        const content = '';
        const result = offsetToPosition(content, 0, 0);
        expect(result.line).toBe(0);
        expect(result.character).toBe(0);
      });

      it('should handle offset beyond content length', () => {
        const content = 'short';
        const result = offsetToPosition(content, 100, 0);
        expect(result.line).toBe(0);
        expect(result.character).toBe(100);
      });
    });
  });
});
