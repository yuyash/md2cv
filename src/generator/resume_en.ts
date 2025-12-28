/**
 * English CV Generator
 * Generates HTML for English CV format with Times font family
 */

import type { PaperSize } from '../types/config.js';
import type { CVMetadata } from '../types/metadata.js';
import type {
  CertificationEntry,
  CompetencyEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  ParsedSection,
  SectionContent,
  SkillEntry,
  SkillsOptions,
} from '../types/sections.js';

export interface CVEnOptions {
  readonly paperSize: PaperSize;
  readonly customStylesheet?: string | undefined;
}

/**
 * Input for CV generation
 */
export interface CVInput {
  readonly metadata: CVMetadata;
  readonly sections: readonly ParsedSection[];
}

/**
 * Page size dimensions in mm
 */
const PAGE_SIZES: Record<PaperSize, { width: number; height: number }> = {
  a3: { width: 420, height: 297 },
  a4: { width: 210, height: 297 },
  b4: { width: 364, height: 257 },
  b5: { width: 176, height: 250 },
  letter: { width: 215.9, height: 279.4 },
};

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format date for display
 */
function formatDate(date: Date | undefined): string {
  if (!date) return '';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format end date which can be Date or 'present'
 */
function formatEndDate(end: Date | 'present' | undefined): string {
  if (!end) return '';
  if (end === 'present') return 'Present';
  return formatDate(end);
}

/**
 * Format date range
 */
function formatDateRange(
  start: Date | undefined,
  end: Date | 'present' | undefined,
): string {
  const startStr = formatDate(start);
  const endStr = formatEndDate(end);
  if (startStr && endStr) return `${startStr} - ${endStr}`;
  if (startStr) return startStr;
  return '';
}

/**
 * Generate base CSS styles
 */
function generateStyles(paperSize: PaperSize): string {
  const size = PAGE_SIZES[paperSize];

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
      margin: 15mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: var(--cv-font-family);
      font-size: var(--cv-font-size-base);
      line-height: var(--cv-line-height);
      color: var(--cv-color-text);
      background: var(--cv-color-background);
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
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
      body {
        padding: 0;
        max-width: none;
      }
    }
  `;
}

/**
 * Render education section
 * Format:
 *   <school> —— <start - end>
 *   <degree> — <location>
 *   <details>
 */
function renderEducation(entries: readonly EducationEntry[]): string {
  return entries
    .map((entry) => {
      const dateRange = formatDateRange(entry.start, entry.end);
      let html = '<div class="entry">';

      // Title line: <school> —— <date range>
      html += '<div class="entry-header">';
      html += `<span class="entry-title">${escapeHtml(entry.school)}</span>`;
      if (dateRange) {
        html += `<span class="entry-date">${escapeHtml(dateRange)}</span>`;
      }
      html += '</div>';

      // Subtitle line: <degree> — <location>
      const subtitleParts: string[] = [];
      if (entry.degree) {
        subtitleParts.push(escapeHtml(entry.degree));
      }
      if (entry.location) {
        subtitleParts.push(escapeHtml(entry.location));
      }
      if (subtitleParts.length > 0) {
        html += `<div class="entry-subtitle">${subtitleParts.join(' — ')}</div>`;
      }

      // Details
      if (entry.details && entry.details.length > 0) {
        html += '<ul>';
        for (const detail of entry.details) {
          html += `<li>${escapeHtml(detail)}</li>`;
        }
        html += '</ul>';
      }
      html += '</div>';
      return html;
    })
    .join('\n');
}

/**
 * Render experience section
 * Format:
 *   <company name> -- <role>        <start - end>
 *   <team_name> -- <location>
 *   <summary>
 *   <highlights>
 */
function renderExperience(entries: readonly ExperienceEntry[]): string {
  return entries
    .flatMap((entry) => {
      return entry.roles.map((role) => {
        const dateRange = formatDateRange(role.start, role.end);
        let html = '<div class="entry">';

        // Section title: <company> —— <role>    <date range>
        html += '<div class="entry-header">';
        html += `<span class="entry-title">${escapeHtml(entry.company)} —— ${escapeHtml(role.title)}</span>`;
        if (dateRange) {
          html += `<span class="entry-date">${escapeHtml(dateRange)}</span>`;
        }
        html += '</div>';

        // Sub title: <team> — <location>
        const subtitleParts: string[] = [];
        if (role.team) {
          subtitleParts.push(escapeHtml(role.team));
        }
        if (entry.location) {
          subtitleParts.push(escapeHtml(entry.location));
        }
        if (subtitleParts.length > 0) {
          html += `<div class="entry-subtitle">${subtitleParts.join(' — ')}</div>`;
        }

        // Summary
        if (role.summary && role.summary.length > 0) {
          html += '<div class="entry-summary">';
          html += role.summary.map((s) => escapeHtml(s)).join(' ');
          html += '</div>';
        }

        // Highlights
        if (role.highlights && role.highlights.length > 0) {
          html += '<ul>';
          for (const highlight of role.highlights) {
            html += `<li>${escapeHtml(highlight)}</li>`;
          }
          html += '</ul>';
        }

        // Projects
        if (role.projects && role.projects.length > 0) {
          for (const project of role.projects) {
            const projDateRange = formatDateRange(project.start, project.end);
            html += '<div class="project">';
            html += `<span class="project-name">${escapeHtml(project.name)}</span>`;
            if (projDateRange) {
              html += ` <span class="entry-date">(${escapeHtml(projDateRange)})</span>`;
            }
            if (project.bullets && project.bullets.length > 0) {
              html += '<ul>';
              for (const bullet of project.bullets) {
                html += `<li>${escapeHtml(bullet)}</li>`;
              }
              html += '</ul>';
            }
            html += '</div>';
          }
        }

        html += '</div>';
        return html;
      });
    })
    .join('\n');
}

/**
 * Render certifications section
 */
function renderCertifications(entries: readonly CertificationEntry[]): string {
  return entries
    .map((entry) => {
      let html = `<div class="cert-item">• ${escapeHtml(entry.name)}`;
      if (entry.date) {
        html += ` (${escapeHtml(formatDate(entry.date))})`;
      }
      html += '</div>';
      return html;
    })
    .join('\n');
}

/**
 * Default number of columns for skills grid
 */
const DEFAULT_SKILLS_COLUMNS = 3;

/**
 * Render skills section - supports grid and categorized formats
 */
function renderSkills(
  entries: readonly SkillEntry[],
  options: SkillsOptions,
): string {
  // Check if categorized format (entries have non-empty category with description)
  const isCategorized =
    options.format === 'categorized' ||
    entries.some((e) => e.category && (e.description || e.items.length > 0));

  if (isCategorized && entries.some((e) => e.category)) {
    // Categorized format: • <category>: <description or items>
    return entries
      .filter((e) => e.category)
      .map((entry) => {
        const content = entry.description || entry.items.join(', ');
        return `<div class="skill-category">• <span class="skill-category-name">${escapeHtml(entry.category)}:</span> ${escapeHtml(content)}</div>`;
      })
      .join('\n');
  }

  // Grid format: flatten all items
  const allItems: string[] = [];
  for (const entry of entries) {
    for (const item of entry.items) {
      allItems.push(item);
    }
  }

  if (allItems.length === 0) {
    return '';
  }

  const columns = options.columns ?? DEFAULT_SKILLS_COLUMNS;
  const colsClass = columns === 3 ? 'skills-grid--cols-3' : '';
  const colsStyle =
    columns !== 3 ? `grid-template-columns: repeat(${columns}, 1fr);` : '';
  let html = `<div class="skills-grid ${colsClass}"${colsStyle ? ` style="${colsStyle}"` : ''}>`;
  for (const item of allItems) {
    html += `<div class="skill-item">• ${escapeHtml(item)}</div>`;
  }
  html += '</div>';
  return html;
}

/**
 * Render skills from list content as grid
 */
function renderSkillsList(
  items: readonly string[],
  columns: number = DEFAULT_SKILLS_COLUMNS,
): string {
  if (items.length === 0) {
    return '';
  }

  const colsClass = columns === 3 ? 'skills-grid--cols-3' : '';
  const colsStyle =
    columns !== 3 ? `grid-template-columns: repeat(${columns}, 1fr);` : '';
  let html = `<div class="skills-grid ${colsClass}"${colsStyle ? ` style="${colsStyle}"` : ''}>`;
  for (const item of items) {
    html += `<div class="skill-item">• ${escapeHtml(item)}</div>`;
  }
  html += '</div>';
  return html;
}

/**
 * Render core competencies section
 */
function renderCompetencies(entries: readonly CompetencyEntry[]): string {
  return entries
    .map((entry) => {
      return `<div class="competency-entry"><span class="competency-header">${escapeHtml(entry.header)}:</span> ${escapeHtml(entry.description)}</div>`;
    })
    .join('\n');
}

/**
 * Render languages section
 */
function renderLanguages(entries: readonly LanguageEntry[]): string {
  return entries
    .map((entry) => {
      let html = `<span class="lang-item">${escapeHtml(entry.language)}`;
      if (entry.level) {
        html += ` (${escapeHtml(entry.level)})`;
      }
      html += '</span>';
      return html;
    })
    .join(' • ');
}

/**
 * Render section content
 */
function renderSectionContent(
  content: SectionContent,
  sectionId: string,
): string {
  switch (content.type) {
    case 'text':
      return `<p>${escapeHtml(content.text)}</p>`;
    case 'list':
      // For skills section, render as grid
      if (sectionId === 'skills') {
        return renderSkillsList(content.items);
      }
      return (
        '<ul>' +
        content.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n') +
        '</ul>'
      );
    case 'education':
      return renderEducation(content.entries);
    case 'experience':
      return renderExperience(content.entries);
    case 'certifications':
      return renderCertifications(content.entries);
    case 'skills':
      return renderSkills(content.entries, content.options);
    case 'competencies':
      return renderCompetencies(content.entries);
    case 'languages':
      return renderLanguages(content.entries);
    case 'table':
      // Tables are mainly for rirekisho, render as list for resume
      return (
        '<ul>' +
        content.rows
          .map((row) => `<li>${escapeHtml(row.content)}</li>`)
          .join('\n') +
        '</ul>'
      );
    default:
      return '';
  }
}

/**
 * Render contact info line: home_address | phone_number | email | linkedin
 */
function renderContactInfo(cv: CVInput): string {
  const parts: string[] = [];

  if (cv.metadata.home_address) {
    parts.push(escapeHtml(cv.metadata.home_address));
  }

  parts.push(escapeHtml(cv.metadata.phone_number));

  parts.push(
    `<a href="mailto:${escapeHtml(cv.metadata.email_address)}">${escapeHtml(cv.metadata.email_address)}</a>`,
  );

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
export function generateCVEnHTML(cv: CVInput, options: CVEnOptions): string {
  const styles = generateStyles(options.paperSize);
  const name = cv.metadata.name;
  const contactHtml = renderContactInfo(cv);

  // Use sections in the order provided (already filtered and ordered by generator/index.ts)
  const sectionsHtml = cv.sections
    .map((section) => {
      return `
<section class="cv-section cv-section--${section.id}">
  <h2>${escapeHtml(section.title)}</h2>
  ${renderSectionContent(section.content, section.id)}
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
