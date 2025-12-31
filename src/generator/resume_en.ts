/**
 * English CV Generator
 * Generates HTML for English CV format with Times font family
 */

import type { CVOptions, PaperSize } from '../types/config.js';
import type { CVInput } from './common.js';
import {
  PAGE_SIZES,
  enDateFormatter,
  escapeHtml,
  renderSectionContent,
} from './common.js';

export type { CVInput };

/**
 * Generate base CSS styles for English CV
 */
function generateStyles(paperSize: PaperSize): string {
  const size = PAGE_SIZES[paperSize];
  const pageMargin = 15; // mm

  return `
    :root {
      --cv-font-family: "Noto Serif", "Times New Roman", Times, Georgia, serif;
      --cv-font-size-base: 11pt;
      --cv-font-size-title: 20pt;
      --cv-font-size-section: 12pt;
      --cv-font-size-small: 10pt;
      --cv-font-size-xs: 9pt;
      --cv-line-height: 1.4;
      --cv-color-text: #333;
      --cv-color-heading: #000;
      --cv-color-muted: #555;
      --cv-color-border: #333;
      --cv-color-background: #fff;
      --cv-spacing-section: 14px;
      --cv-spacing-entry: 10px;
    }
    @page {
      size: ${size.width}mm ${size.height}mm;
      margin: ${pageMargin}mm;
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
      padding: ${pageMargin}mm;
    }
    header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
    }
    h1 {
      font-size: var(--cv-font-size-title);
      font-weight: bold;
      margin-bottom: 6px;
      color: var(--cv-color-heading);
    }
    .contact-info {
      font-size: var(--cv-font-size-small);
      color: var(--cv-color-text);
    }
    .contact-info a {
      color: var(--cv-color-text);
      text-decoration: none;
    }
    .contact-info a:hover {
      text-decoration: underline;
    }
    section {
      margin-bottom: var(--cv-spacing-section);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .entry {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    h2 {
      font-size: var(--cv-font-size-section);
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid var(--cv-color-border);
      padding-bottom: 2px;
      margin-bottom: 8px;
      color: var(--cv-color-heading);
    }
    .entry {
      margin-bottom: var(--cv-spacing-entry);
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
    .entry-subtitle {
      font-style: italic;
      color: var(--cv-color-text);
      font-size: var(--cv-font-size-small);
    }
    .entry-date {
      color: var(--cv-color-text);
      font-size: var(--cv-font-size-small);
    }
    .entry-location {
      color: var(--cv-color-muted);
      font-size: var(--cv-font-size-small);
    }
    .entry-summary {
      margin-top: 3px;
      font-size: var(--cv-font-size-small);
    }
    ul {
      margin-left: 18px;
      margin-top: 3px;
    }
    li {
      margin-bottom: 2px;
      font-size: var(--cv-font-size-small);
    }
    p {
      margin-bottom: 6px;
      font-size: var(--cv-font-size-small);
    }
    .role {
      margin-bottom: 8px;
    }
    .role-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .project {
      margin-left: 15px;
      margin-top: 4px;
    }
    .project-name {
      font-weight: 500;
      font-size: var(--cv-font-size-small);
    }
    .competency-entry {
      margin-bottom: 4px;
      font-size: var(--cv-font-size-small);
    }
    .competency-header {
      font-weight: bold;
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
    .cert-item {
      font-size: var(--cv-font-size-xs);
      color: var(--cv-color-heading);
      margin-bottom: 2px;
    }
    .lang-item {
      font-size: var(--cv-font-size-xs);
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
 * Render contact info line: home_address | phone_number | email | linkedin
 */
function renderContactInfo(cv: CVInput): string {
  const parts: string[] = [];

  if (cv.metadata.home_address) {
    parts.push(escapeHtml(cv.metadata.home_address));
  }

  if (cv.metadata.phone_number) {
    parts.push(escapeHtml(cv.metadata.phone_number));
  }

  if (cv.metadata.email_address) {
    parts.push(
      `<a href="mailto:${escapeHtml(cv.metadata.email_address)}">${escapeHtml(cv.metadata.email_address)}</a>`,
    );
  }

  if (cv.metadata.linkedin) {
    const linkedinUrl = cv.metadata.linkedin;
    parts.push(
      `<a href="${escapeHtml(linkedinUrl)}">${escapeHtml(linkedinUrl)}</a>`,
    );
  }

  return parts.join(' | ');
}

/**
 * Generate English HTML CV
 */
export function generateEnHtml(cv: CVInput, options: CVOptions): string {
  const styles = generateStyles(options.paperSize);
  const name = cv.metadata.name;
  const contactHtml = renderContactInfo(cv);

  // Use sections in the order provided (already filtered and ordered by generator/index.ts)
  const sectionsHtml = cv.sections
    .map((section) => {
      return `
<section class="cv-section cv-section--${section.id}">
  <h2>${escapeHtml(section.title)}</h2>
  ${renderSectionContent(section.content, section.id, enDateFormatter)}
</section>`;
    })
    .join('\n');

  // Include custom stylesheet if provided
  const customStylesHtml = options.customStylesheet
    ? `<style class="custom-styles">${options.customStylesheet}</style>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)} - CV</title>
  <style class="default-styles">${styles}</style>
  ${customStylesHtml}
</head>
<body class="cv cv--en">
  <header class="cv-header">
    <h1 class="cv-name">${escapeHtml(name)}</h1>
    <div class="contact-info">${contactHtml}</div>
  </header>
  <main class="cv-content">
${sectionsHtml}
  </main>
</body>
</html>`;
}
