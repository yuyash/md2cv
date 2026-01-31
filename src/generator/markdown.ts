/**
 * Markdown to HTML converter for CV content
 * Uses remark ecosystem for consistent parsing with the rest of the project
 */

import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

/**
 * Convert markdown text to HTML
 * Supports: bold, italic, links, code, blockquotes, lists, images, horizontal rules
 */
export function markdownToHtml(text: string): string {
  if (!text) return '';

  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .processSync(text);

  return String(result).trim();
}

/**
 * Convert inline markdown to HTML (strips block-level wrapper tags like <p>)
 * Use this for single-line content where you don't want paragraph wrapping
 */
export function inlineMarkdownToHtml(text: string): string {
  if (!text) return '';

  const html = markdownToHtml(text);

  // Remove wrapping <p> tags for inline content
  return html.replace(/^<p>(.*)<\/p>$/s, '$1');
}
