/**
 * Unit tests for generator module
 */

import { describe, expect, it } from 'vitest';

import { escapeHtml, PAGE_SIZES } from '../../src/generator/index.js';

describe('escapeHtml', () => {
  it('should escape ampersand', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape less than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('should escape greater than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('should escape multiple special characters', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
    );
  });

  it('should return empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not modify text without special characters', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('PAGE_SIZES', () => {
  it('should have correct A4 dimensions', () => {
    expect(PAGE_SIZES.a4).toEqual({ width: 210, height: 297 });
  });

  it('should have correct A3 dimensions', () => {
    expect(PAGE_SIZES.a3).toEqual({ width: 420, height: 297 });
  });

  it('should have correct B4 dimensions', () => {
    expect(PAGE_SIZES.b4).toEqual({ width: 364, height: 257 });
  });

  it('should have correct B5 dimensions', () => {
    expect(PAGE_SIZES.b5).toEqual({ width: 176, height: 250 });
  });

  it('should have correct letter dimensions', () => {
    expect(PAGE_SIZES.letter).toEqual({ width: 215.9, height: 279.4 });
  });

  it('should have all supported paper sizes', () => {
    const sizes = Object.keys(PAGE_SIZES);
    expect(sizes).toContain('a3');
    expect(sizes).toContain('a4');
    expect(sizes).toContain('b4');
    expect(sizes).toContain('b5');
    expect(sizes).toContain('letter');
  });
});
