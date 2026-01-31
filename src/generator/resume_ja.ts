/**
 * Japanese CV Generator (職務経歴書スタイル)
 * Generates HTML for Japanese CV format with Mincho font
 */

import type { CVOptions, PageMargins, PaperSize } from '../types/config.js';
import type { ParsedSection } from '../types/sections.js';
import { isSectionValidForFormat } from '../types/sections.js';
import type { CVInput } from './common.js';
import {
  PAGE_SIZES,
  escapeHtml,
  jaDateFormatter,
  renderSectionContent,
} from './common.js';

export type { CVInput };

/**
 * Get current date in Japanese format (yyyy年mm月dd日現在)
 */
function getCurrentDateJa(): string {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日現在`;
}

/**
 * Generate base CSS styles for Japanese CV
 */
function generateStyles(paperSize: PaperSize, marginMm?: PageMargins): string {
  const size = PAGE_SIZES[paperSize];
  // Default to 30mm margins if not specified
  const margins = marginMm ?? { top: 30, right: 30, bottom: 30, left: 30 };

  return `
    :root {
      --cv-font-family: "Noto Serif JP", "Hiragino Mincho Pro", "Yu Mincho", "MS Mincho", serif;
      --cv-font-size-base: 10pt;
      --cv-font-size-title: 18pt;
      --cv-font-size-section: 12pt;
      --cv-font-size-small: 9pt;
      --cv-line-height: 1.6;
      --cv-color-text: #333;
      --cv-color-heading: #000;
      --cv-color-border: #333;
      --cv-color-background: #fff;
      --cv-spacing-section: 16px;
      --cv-spacing-entry: 12px;
    }
    @page {
      size: ${size.width}mm ${size.height}mm;
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html {
      background: #e0e0e0;
    }
    body {
      font-family: var(--cv-font-family);
      font-size: var(--cv-font-size-base);
      line-height: var(--cv-line-height);
      color: var(--cv-color-text);
      background: var(--cv-color-background);
      width: ${size.width}mm;
      min-height: ${size.height}mm;
      margin: 0 auto;
      padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }
    header {
      margin-bottom: 20px;
      padding-bottom: 15px;
    }
    .document-title {
      text-align: center;
      font-size: var(--cv-font-size-title);
      font-weight: bold;
      margin-bottom: 12px;
      color: var(--cv-color-heading);
    }
    .header-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .header-name {
      font-size: var(--cv-font-size-base);
      color: var(--cv-color-heading);
    }
    .header-date {
      font-size: var(--cv-font-size-base);
      color: var(--cv-color-text);
    }
    section {
      margin-bottom: var(--cv-spacing-section);
    }
    h2 {
      font-size: var(--cv-font-size-section);
      font-weight: bold;
      border-bottom: 1px solid var(--cv-color-border);
      padding-bottom: 3px;
      margin-bottom: 10px;
      color: var(--cv-color-heading);
      page-break-after: avoid;
      break-after: avoid;
    }
    .entry {
      margin-bottom: var(--cv-spacing-entry);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
    }
    .entry-title {
      font-weight: bold;
      color: var(--cv-color-heading);
    }
    .cert-item {
      font-size: var(--cv-font-size-small);
      color: var(--cv-color-heading);
      margin-bottom: 2px;
    }
    .lang-item {
      font-size: var(--cv-font-size-small);
    }
    .entry-subtitle {
      font-size: var(--cv-font-size-small);
      color: var(--cv-color-text);
    }
    .entry-date {
      color: var(--cv-color-text);
      font-size: var(--cv-font-size-small);
    }
    .entry-summary {
      margin-top: 4px;
      font-size: var(--cv-font-size-small);
    }
    ul {
      margin-left: 18px;
      margin-top: 4px;
    }
    li {
      margin-bottom: 2px;
      font-size: var(--cv-font-size-small);
    }
    p {
      margin-bottom: 8px;
      font-size: var(--cv-font-size-base);
    }
    .skills-grid {
      display: grid;
      gap: 2px 20px;
    }
    .skills-grid--cols-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .skill-item {
      font-size: var(--cv-font-size-small);
    }
    .skill-category {
      margin-bottom: 4px;
      font-size: var(--cv-font-size-small);
    }
    .skill-category-name {
      font-weight: bold;
    }
    /* Markdown inline styles */
    strong, b {
      font-weight: bold;
    }
    em, i {
      font-style: italic;
    }
    a {
      color: var(--cv-color-text);
      text-decoration: underline;
    }
    a:hover {
      color: var(--cv-color-heading);
    }
    code {
      font-family: "SF Mono", "Monaco", "Consolas", monospace;
      font-size: 0.9em;
      background: #f5f5f5;
      padding: 1px 4px;
      border-radius: 3px;
    }
    pre {
      font-family: "SF Mono", "Monaco", "Consolas", monospace;
      font-size: var(--cv-font-size-xs);
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 6px 0;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 3px solid var(--cv-color-border);
      padding-left: 12px;
      margin: 6px 0;
      color: var(--cv-color-muted);
      font-style: italic;
    }
    hr {
      border: none;
      border-top: 1px solid var(--cv-color-border);
      margin: 12px 0;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    @media print {
      html {
        background: none;
      }
      body {
        width: auto;
        min-height: auto;
        padding: 0;
      }
    }
  `;
}

/**
 * Filter sections by format validity, preserving input order
 * Note: Section ordering is now handled by filterAndOrderSections in generator/index.ts
 */
function filterSections(sections: readonly ParsedSection[]): ParsedSection[] {
  return sections.filter((section) =>
    isSectionValidForFormat(section.id, 'cv'),
  );
}

/**
 * Generate Japanese HTML CV
 */
export function generateJaHtml(cv: CVInput, options: CVOptions): string {
  const styles = generateStyles(options.paperSize, options.marginMm);
  const name = cv.metadata.name_ja ?? cv.metadata.name;
  const currentDate = getCurrentDateJa();

  // Filter sections (order is preserved from input)
  const filteredSections = filterSections(cv.sections);

  const sectionsHtml = filteredSections
    .map((section) => {
      return `
<section class="cv-section cv-section--${section.id}">
  <h2>${escapeHtml(section.title)}</h2>
  ${renderSectionContent(section.content, section.id, jaDateFormatter)}
</section>`;
    })
    .join('\n');

  // Include custom stylesheet if provided
  const customStylesHtml = options.customStylesheet
    ? `<style class="custom-styles">${options.customStylesheet}</style>`
    : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)} - 職務経歴書</title>
  <style class="default-styles">${styles}</style>
  ${customStylesHtml}
</head>
<body class="cv cv--ja">
  <header class="cv-header">
    <div class="document-title">職務経歴書</div>
    <div class="header-info">
      <div class="header-name">${escapeHtml(name)}</div>
      <div class="header-date">${escapeHtml(currentDate)}</div>
    </div>
  </header>
  <main class="cv-content">
${sectionsHtml}
  </main>
</body>
</html>`;
}
