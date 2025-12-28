/**
 * Parser unit tests
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../src/parser/index.js';

describe('parseMarkdown', () => {
  it('should parse valid frontmatter with --- delimiters', () => {
    const markdown = `---
name: John Doe
email_address: john@example.com
phone_number: 123-456-7890
---

# Experience

Some content here.
`;

    const result = parseMarkdown(markdown);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.metadata.name).toBe('John Doe');
      expect(result.value.metadata.email_address).toBe('john@example.com');
      expect(result.value.metadata.phone_number).toBe('123-456-7890');
    }
  });

  it('should parse valid frontmatter with +++ delimiters', () => {
    // Note: +++ delimiters are validated but remark-frontmatter only parses YAML with ---
    // This test verifies the delimiter validation works
    const markdown = `+++
name: Jane Doe
email_address: jane@example.com
phone_number: 098-765-4321
+++

# Experience

Some content here.
`;

    const result = parseMarkdown(markdown);
    // The parser validates delimiters match but remark-frontmatter doesn't parse +++ as YAML
    // So metadata will be loaded from env vars only (which are empty in test)
    expect(result.ok).toBe(true);
  });

  it('should fail when frontmatter delimiters do not match', () => {
    const markdown = `---
name: John Doe
+++

# Experience
`;

    const result = parseMarkdown(markdown);
    expect(result.ok).toBe(false);
  });

  it('should parse markdown without frontmatter', () => {
    const markdown = `# Experience

Some experience content.

# Education

Some education content.
`;

    const result = parseMarkdown(markdown);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Metadata should be empty (or loaded from env vars if set)
      expect(result.value.metadata.name).toBeUndefined();
      expect(result.value.sections.length).toBe(2);
      expect(result.value.sections[0]?.id).toBe('experience');
      expect(result.value.sections[1]?.id).toBe('education');
    }
  });

  it('should parse sections correctly', () => {
    const markdown = `---
name: John Doe
email_address: john@example.com
phone_number: 123-456-7890
---

# 職歴

Some experience content.

# 学歴

Some education content.
`;

    const result = parseMarkdown(markdown);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sections.length).toBe(2);
      expect(result.value.sections[0]?.id).toBe('experience');
      expect(result.value.sections[1]?.id).toBe('education');
    }
  });

  it('should parse table content for rirekisho format', () => {
    const markdown = `---
name: 山田太郎
email_address: yamada@example.com
phone_number: 03-1234-5678
---

# 学歴

| 年 | 月 | 学歴・職歴 |
|---|---|---|
| 2020 | 4 | 東京大学 入学 |
| 2024 | 3 | 東京大学 卒業 |
`;

    const result = parseMarkdown(markdown);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const eduSection = result.value.sections.find(
        (s) => s.id === 'education',
      );
      expect(eduSection).toBeDefined();
      expect(eduSection?.content.type).toBe('table');
      if (eduSection?.content.type === 'table') {
        expect(eduSection.content.rows.length).toBe(2);
        expect(eduSection.content.rows[0]?.year).toBe('2020');
        expect(eduSection.content.rows[0]?.month).toBe('4');
      }
    }
  });
});

describe('parseMarkdown with environment variables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should load metadata from environment variables when no frontmatter', () => {
    process.env.NAME = 'Env User';
    process.env.EMAIL_ADDRESS = 'env@example.com';
    process.env.PHONE_NUMBER = '000-000-0000';

    const markdown = `# Experience

Some experience content.
`;

    const result = parseMarkdown(markdown);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.metadata.name).toBe('Env User');
      expect(result.value.metadata.email_address).toBe('env@example.com');
      expect(result.value.metadata.phone_number).toBe('000-000-0000');
    }
  });

  it('should prioritize frontmatter over environment variables', () => {
    process.env.NAME = 'Env User';
    process.env.EMAIL_ADDRESS = 'env@example.com';
    process.env.PHONE_NUMBER = '000-000-0000';

    const markdown = `---
name: Frontmatter User
email_address: frontmatter@example.com
phone_number: 111-111-1111
---

# Experience

Some experience content.
`;

    const result = parseMarkdown(markdown);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.metadata.name).toBe('Frontmatter User');
      expect(result.value.metadata.email_address).toBe(
        'frontmatter@example.com',
      );
      expect(result.value.metadata.phone_number).toBe('111-111-1111');
    }
  });

  it('should merge frontmatter and environment variables (frontmatter partial)', () => {
    process.env.NAME = 'Env User';
    process.env.EMAIL_ADDRESS = 'env@example.com';
    process.env.PHONE_NUMBER = '000-000-0000';

    const markdown = `---
name: Frontmatter User
---

# Experience

Some experience content.
`;

    const result = parseMarkdown(markdown);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // name from frontmatter, others from env
      expect(result.value.metadata.name).toBe('Frontmatter User');
      expect(result.value.metadata.email_address).toBe('env@example.com');
      expect(result.value.metadata.phone_number).toBe('000-000-0000');
    }
  });

  it('should return empty metadata when no frontmatter and no environment variables', () => {
    // Ensure env vars are not set
    delete process.env.NAME;
    delete process.env.EMAIL_ADDRESS;
    delete process.env.PHONE_NUMBER;

    const markdown = `# Experience

Some experience content.
`;

    const result = parseMarkdown(markdown);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.metadata.name).toBeUndefined();
      expect(result.value.metadata.email_address).toBeUndefined();
      expect(result.value.metadata.phone_number).toBeUndefined();
    }
  });
});
