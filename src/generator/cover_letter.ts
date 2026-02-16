/**
 * Cover Letter Generator
 * Generates HTML for cover letter format matching the CV header style
 */

import type { CVOptions, PageMargins, PaperSize } from '../types/config.js';
import { isSectionValidForFormat } from '../types/sections.js';
import type { CVInput } from './common.js';
import { PAGE_SIZES, escapeHtml } from './common.js';
import { markdownToHtml } from './markdown.js';

export type { CVInput };

/**
 * Generate CSS styles for cover letter
 */
function generateStyles(
  paperSize: PaperSize,
  marginMm?: PageMargins,
  lineHeight?: number,
): string {
  const size = PAGE_SIZES[paperSize];
  const margins = marginMm ?? { top: 30, right: 30, bottom: 30, left: 30 };
  const lh = lineHeight ?? 1.2;

  return `
    :root {
      --cl-font-family: "Noto Serif", "Times New Roman", Times, Georgia, serif;
      --cl-font-size-base: 11pt;
      --cl-font-size-name: 20pt;
      --cl-font-size-title: 11pt;
      --cl-font-size-small: 10pt;
      --cl-line-height: ${lh};
      --cl-color-text: #333;
      --cl-color-heading: #000;
      --cl-color-link: #1a0dab;
    }
    @page {
      size: ${size.width}mm ${size.height}mm;
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { background: #e0e0e0; }
    body {
      font-family: var(--cl-font-family);
      font-size: var(--cl-font-size-base);
      line-height: var(--cl-line-height);
      color: var(--cl-color-text);
      background: #fff;
      width: ${size.width}mm;
      min-height: ${size.height}mm;
      margin: 0 auto;
      padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }
    /* Header: name+title left, contact right */
    .cl-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      padding-bottom: 12px;
      border-bottom: 2px solid #000;
    }
    .cl-header-left h1 {
      font-family: "Noto Sans", "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
      font-size: var(--cl-font-size-name);
      font-weight: bold;
      color: var(--cl-color-heading);
      margin-bottom: 2px;
    }
    .cl-header-left .cl-job-title {
      font-family: "Noto Sans", "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;
      font-size: var(--cl-font-size-title);
      color: var(--cl-color-text);
    }
    .cl-header-right {
      text-align: right;
      font-size: var(--cl-font-size-small);
      line-height: 1.6;
    }
    .cl-header-right a {
      color: var(--cl-color-link);
      text-decoration: none;
    }
    .cl-header-right a:hover { text-decoration: underline; }
    /* Date */
    .cl-date {
      text-align: right;
      margin-bottom: 20px;
      font-size: var(--cl-font-size-base);
    }
    /* Recipient */
    .cl-recipient {
      margin-bottom: 16px;
      font-size: var(--cl-font-size-base);
    }
    .cl-recipient p { margin-bottom: 4px; }
    /* Subject */
    .cl-subject {
      font-weight: bold;
      margin-bottom: 16px;
      font-size: var(--cl-font-size-base);
    }
    /* Body */
    .cl-body p {
      margin-bottom: 12px;
      text-align: justify;
      font-size: var(--cl-font-size-base);
    }
    .cl-body ul, .cl-body ol {
      margin-left: 18px;
      margin-bottom: 12px;
    }
    .cl-body li { margin-bottom: 4px; }
    /* Closing */
    .cl-closing {
      margin-top: 24px;
      font-size: var(--cl-font-size-base);
    }
    .cl-closing .cl-sign-off { margin-bottom: 24px; }
    .cl-closing .cl-signature { font-weight: normal; }
    /* Markdown inline styles */
    strong, b { font-weight: bold; }
    em, i { font-style: italic; }
    a { color: var(--cl-color-link); text-decoration: underline; }
    @media print {
      html { background: none; }
      body { width: auto; min-height: auto; padding: 0; }
    }
  `;
}

/**
 * Render contact info block (right-aligned)
 */
function renderContactBlock(cv: CVInput): string {
  const lines: string[] = [];

  if (cv.metadata.home_address) {
    lines.push(escapeHtml(cv.metadata.home_address));
  }
  if (cv.metadata.phone_number) {
    lines.push(escapeHtml(cv.metadata.phone_number));
  }
  if (cv.metadata.email_address) {
    lines.push(
      `<a href="mailto:${escapeHtml(cv.metadata.email_address)}">${escapeHtml(cv.metadata.email_address)}</a>`,
    );
  }
  if (cv.metadata.linkedin) {
    const url = cv.metadata.linkedin;
    // Show short display text
    const display = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    lines.push(`<a href="${escapeHtml(url)}">${escapeHtml(display)}</a>`);
  }

  return lines.join('<br>');
}

/**
 * Format the date for the cover letter
 */
function formatLetterDate(dateStr?: string): string {
  if (dateStr) return escapeHtml(dateStr);
  // Default to current date
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Extract body content from sections
 * The cover letter body comes from the first section (typically "Cover Letter" or "Body")
 */
function extractBodyHtml(cv: CVInput): string {
  // Only use sections valid for cover_letter format
  const sections = cv.sections.filter((s) =>
    isSectionValidForFormat(s.id, 'cover_letter'),
  );
  const parts: string[] = [];
  for (const section of sections) {
    if (section.content.type === 'text') {
      parts.push(markdownToHtml(section.content.text));
    } else if (section.content.type === 'mixed') {
      for (const part of section.content.parts) {
        if (part.type === 'paragraph') {
          parts.push(markdownToHtml(part.text));
        } else if (part.type === 'list') {
          parts.push(
            '<ul>' +
              part.items
                .map((item) => `<li>${markdownToHtml(item)}</li>`)
                .join('') +
              '</ul>',
          );
        }
      }
    } else if (section.content.type === 'composite') {
      for (const block of section.content.blocks) {
        if (block.type === 'markdown') {
          parts.push(markdownToHtml(block.content));
        }
      }
    }
  }
  return parts.join('\n');
}

/**
 * Generate cover letter HTML
 */
export function generateCoverLetterHtml(
  cv: CVInput,
  options: CVOptions,
): string {
  const styles = generateStyles(
    options.paperSize,
    options.marginMm,
    options.lineHeight,
  );
  const name = cv.metadata.name;
  const jobTitle = cv.metadata.job_title ?? '';
  const contactHtml = renderContactBlock(cv);
  const dateStr = formatLetterDate(cv.metadata.date);
  const recipientName = cv.metadata.recipient_name ?? 'Hiring Manager';
  const recipientCompany = cv.metadata.recipient_company ?? '';
  const subject = cv.metadata.subject ?? '';
  const bodyHtml = extractBodyHtml(cv);

  const customStylesHtml = options.customStylesheet
    ? `<style class="custom-styles">${options.customStylesheet}</style>`
    : '';

  const headerSourceLineAttr = cv.frontmatterSourceLines
    ? ` data-source-line="${cv.frontmatterSourceLines.startLine}" data-source-end-line="${cv.frontmatterSourceLines.endLine}"`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)} - Cover Letter</title>
  <style class="default-styles">${styles}</style>
  ${customStylesHtml}
</head>
<body class="cover-letter">
  <header class="cl-header"${headerSourceLineAttr}>
    <div class="cl-header-left">
      <h1>${escapeHtml(name)}</h1>
      ${jobTitle ? `<div class="cl-job-title">${escapeHtml(jobTitle)}</div>` : ''}
    </div>
    <div class="cl-header-right">
      ${contactHtml}
    </div>
  </header>

  <div class="cl-date">${dateStr}</div>

  <div class="cl-recipient">
    <p>Dear ${escapeHtml(recipientName)},</p>
    ${recipientCompany ? `<p>${escapeHtml(recipientCompany)}</p>` : ''}
  </div>

  ${subject ? `<div class="cl-subject">Re: ${escapeHtml(subject)}</div>` : ''}

  <div class="cl-body">
    ${bodyHtml}
  </div>

  <div class="cl-closing">
    <p class="cl-sign-off">Sincerely,</p>
    <p class="cl-signature">${escapeHtml(name)}</p>
  </div>
</body>
</html>`;
}
