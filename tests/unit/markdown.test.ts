/**
 * Tests for markdown to HTML conversion
 */

import { describe, expect, it } from 'vitest';
import {
  inlineMarkdownToHtml,
  markdownToHtml,
} from '../../src/generator/index.js';

describe('markdownToHtml', () => {
  it('should convert bold text', () => {
    expect(markdownToHtml('**bold**')).toBe('<p><strong>bold</strong></p>');
  });

  it('should convert italic text', () => {
    expect(markdownToHtml('*italic*')).toBe('<p><em>italic</em></p>');
  });

  it('should convert bold and italic text', () => {
    expect(markdownToHtml('***bold and italic***')).toBe(
      '<p><em><strong>bold and italic</strong></em></p>',
    );
  });

  it('should convert links', () => {
    expect(markdownToHtml('[link](https://example.com)')).toBe(
      '<p><a href="https://example.com">link</a></p>',
    );
  });

  it('should convert inline code', () => {
    expect(markdownToHtml('`code`')).toBe('<p><code>code</code></p>');
  });

  it('should convert blockquotes', () => {
    expect(markdownToHtml('> quote')).toBe(
      '<blockquote>\n<p>quote</p>\n</blockquote>',
    );
  });

  it('should convert unordered lists', () => {
    const result = markdownToHtml('- item 1\n- item 2');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>item 1</li>');
    expect(result).toContain('<li>item 2</li>');
  });

  it('should convert ordered lists', () => {
    const result = markdownToHtml('1. first\n2. second');
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>first</li>');
    expect(result).toContain('<li>second</li>');
  });

  it('should convert horizontal rules', () => {
    expect(markdownToHtml('---')).toBe('<hr>');
  });

  it('should convert images', () => {
    expect(markdownToHtml('![alt](image.png)')).toBe(
      '<p><img src="image.png" alt="alt"></p>',
    );
  });

  it('should handle empty string', () => {
    expect(markdownToHtml('')).toBe('');
  });

  it('should handle plain text', () => {
    expect(markdownToHtml('plain text')).toBe('<p>plain text</p>');
  });

  it('should convert code blocks', () => {
    const result = markdownToHtml('```\ncode block\n```');
    expect(result).toContain('<pre>');
    expect(result).toContain('<code>');
  });

  it('should handle line breaks with double space', () => {
    const result = markdownToHtml('line 1  \nline 2');
    expect(result).toContain('<br>');
  });
});

describe('inlineMarkdownToHtml', () => {
  it('should convert bold text without paragraph wrapper', () => {
    expect(inlineMarkdownToHtml('**bold**')).toBe('<strong>bold</strong>');
  });

  it('should convert italic text without paragraph wrapper', () => {
    expect(inlineMarkdownToHtml('*italic*')).toBe('<em>italic</em>');
  });

  it('should convert links without paragraph wrapper', () => {
    expect(inlineMarkdownToHtml('[link](https://example.com)')).toBe(
      '<a href="https://example.com">link</a>',
    );
  });

  it('should convert inline code without paragraph wrapper', () => {
    expect(inlineMarkdownToHtml('`code`')).toBe('<code>code</code>');
  });

  it('should handle mixed inline formatting', () => {
    expect(inlineMarkdownToHtml('**bold** and *italic*')).toBe(
      '<strong>bold</strong> and <em>italic</em>',
    );
  });

  it('should handle empty string', () => {
    expect(inlineMarkdownToHtml('')).toBe('');
  });

  it('should handle plain text without wrapper', () => {
    expect(inlineMarkdownToHtml('plain text')).toBe('plain text');
  });
});
