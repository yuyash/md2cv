/**
 * Common utilities for CV/Resume generators
 * Shared between English and Japanese CV generators
 */

import type { PaperSize } from '../types/config.js';
import type { CVMetadata } from '../types/metadata.js';
import type {
  CertificationEntry,
  CompetencyEntry,
  ContentBlock,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  MixedContentPart,
  ParsedSection,
  SectionContent,
  SkillEntry,
  SkillsOptions,
} from '../types/sections.js';
import { inlineMarkdownToHtml, markdownToHtml } from './markdown.js';

/**
 * Input for CV generation
 */
export interface CVInput {
  readonly metadata: CVMetadata;
  readonly sections: readonly ParsedSection[];
}

/**
 * Page size dimensions in mm
 * CV uses portrait orientation (width < height)
 */
export const PAGE_SIZES: Record<PaperSize, { width: number; height: number }> =
  {
    a3: { width: 297, height: 420 },
    a4: { width: 210, height: 297 },
    b4: { width: 257, height: 364 },
    b5: { width: 182, height: 257 },
    letter: { width: 215.9, height: 279.4 },
  };

/**
 * Default number of columns for skills grid
 */
export const DEFAULT_SKILLS_COLUMNS = 3;

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  if (text == null) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Date formatter interface for language-specific formatting
 */
export interface DateFormatter {
  formatDate(date: Date | undefined): string;
  formatEndDate(end: Date | 'present' | undefined): string;
}

/**
 * Locale options for language-specific formatting
 */
export interface LocaleOptions {
  dateFormatter: DateFormatter;
  itemSeparator: string;
}

/**
 * English date formatter
 */
export const enDateFormatter: DateFormatter = {
  formatDate(date: Date | undefined): string {
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
  },
  formatEndDate(end: Date | 'present' | undefined): string {
    if (!end) return '';
    if (end === 'present') return 'Present';
    return this.formatDate(end);
  },
};

/**
 * Japanese date formatter
 */
export const jaDateFormatter: DateFormatter = {
  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  },
  formatEndDate(end: Date | 'present' | undefined): string {
    if (!end) return '';
    if (end === 'present') return '現在';
    return this.formatDate(end);
  },
};

/**
 * English locale options
 */
export const enLocale: LocaleOptions = {
  dateFormatter: enDateFormatter,
  itemSeparator: ', ',
};

/**
 * Japanese locale options
 */
export const jaLocale: LocaleOptions = {
  dateFormatter: jaDateFormatter,
  itemSeparator: ', ',
};

/**
 * Format date range using the provided formatter
 */
export function formatDateRange(
  start: Date | undefined,
  end: Date | 'present' | undefined,
  formatter: DateFormatter,
): string {
  const startStr = formatter.formatDate(start);
  const endStr = formatter.formatEndDate(end);
  if (startStr && endStr) return `${startStr} - ${endStr}`;
  if (startStr) return startStr;
  return '';
}

/**
 * Render education section
 */
export function renderEducation(
  entries: readonly EducationEntry[],
  formatter: DateFormatter,
): string {
  return entries
    .map((entry) => {
      const dateRange = formatDateRange(entry.start, entry.end, formatter);
      const sourceLineAttr = entry.sourceLines
        ? ` data-source-line="${entry.sourceLines.startLine}" data-source-end-line="${entry.sourceLines.endLine}"`
        : '';
      let html = `<div class="entry"${sourceLineAttr}>`;

      html += '<div class="entry-header">';
      html += `<span class="entry-title">${escapeHtml(entry.school)}</span>`;
      if (dateRange) {
        html += `<span class="entry-date">${escapeHtml(dateRange)}</span>`;
      }
      html += '</div>';

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

      const nonEmptyDetails = entry.details?.filter((d) => d && d.trim()) ?? [];
      if (nonEmptyDetails.length > 0) {
        html += '<ul>';
        for (const detail of nonEmptyDetails) {
          html += `<li>${inlineMarkdownToHtml(detail)}</li>`;
        }
        html += '</ul>';
      }
      html += '</div>';
      return html;
    })
    .join('\n');
}

/**
 * Render certifications section
 */
export function renderCertifications(
  entries: readonly CertificationEntry[],
  formatter: DateFormatter,
): string {
  return entries
    .map((entry) => {
      const sourceLineAttr = entry.sourceLines
        ? ` data-source-line="${entry.sourceLines.startLine}" data-source-end-line="${entry.sourceLines.endLine}"`
        : '';
      let html = `<div class="cert-item"${sourceLineAttr}>• ${escapeHtml(entry.name)}`;
      if (entry.date) {
        html += ` (${escapeHtml(formatter.formatDate(entry.date))})`;
      }
      html += '</div>';
      return html;
    })
    .join('\n');
}

/**
 * Render skills section - supports grid and categorized formats
 */
export function renderSkills(
  entries: readonly SkillEntry[],
  options: SkillsOptions,
  locale: LocaleOptions,
): string {
  const isCategorized =
    options.format === 'categorized' ||
    entries.some(
      (e) => e.category && (e.description || (e.items && e.items.length > 0)),
    );

  if (isCategorized && entries.some((e) => e.category)) {
    return entries
      .filter((e) => e.category)
      .map((entry) => {
        const content =
          entry.description || (entry.items?.join(locale.itemSeparator) ?? '');
        return `<div class="skill-category">• <span class="skill-category-name">${escapeHtml(entry.category)}:</span> ${escapeHtml(content)}</div>`;
      })
      .join('\n');
  }

  const allItems: string[] = [];
  for (const entry of entries) {
    if (entry.items) {
      for (const item of entry.items) {
        allItems.push(item);
      }
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
export function renderSkillsList(
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
 * Render languages section
 */
export function renderLanguages(entries: readonly LanguageEntry[]): string {
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
 * Render core competencies section
 */
export function renderCompetencies(
  entries: readonly CompetencyEntry[],
): string {
  return entries
    .map((entry) => {
      return `<div class="competency-entry"><span class="competency-header">${escapeHtml(entry.header)}:</span> ${inlineMarkdownToHtml(entry.description)}</div>`;
    })
    .join('\n');
}

/**
 * Render experience section
 */
export function renderExperience(
  entries: readonly ExperienceEntry[],
  formatter: DateFormatter,
  options?: { includeTeam?: boolean; includeProjects?: boolean },
): string {
  const includeTeam = options?.includeTeam ?? true;
  const includeProjects = options?.includeProjects ?? true;

  return entries
    .map((entry) => {
      const sourceLineAttr = entry.sourceLines
        ? ` data-source-line="${entry.sourceLines.startLine}" data-source-end-line="${entry.sourceLines.endLine}"`
        : '';
      let html = `<div class="entry"${sourceLineAttr}>`;

      // Company header
      html += '<div class="entry-header">';
      html += `<span class="entry-title">${escapeHtml(entry.company)}</span>`;
      html += '</div>';

      // Location
      if (entry.location) {
        html += `<div class="entry-location">${escapeHtml(entry.location)}</div>`;
      }

      // Roles
      for (const role of entry.roles) {
        const dateRange = formatDateRange(role.start, role.end, formatter);
        html += '<div class="role">';

        html += '<div class="role-header">';
        html += `<span class="role-title">${escapeHtml(role.title)}</span>`;
        if (dateRange) {
          html += `<span class="entry-date">${escapeHtml(dateRange)}</span>`;
        }
        html += '</div>';

        if (includeTeam && role.team) {
          html += `<div class="entry-subtitle">${escapeHtml(role.team)}</div>`;
        }

        if (role.summary && role.summary.length > 0) {
          html += '<div class="entry-summary">';
          html += role.summary.map((s) => inlineMarkdownToHtml(s)).join(' ');
          html += '</div>';
        }

        if (role.highlights && role.highlights.length > 0) {
          html += '<ul>';
          for (const highlight of role.highlights) {
            html += `<li>${inlineMarkdownToHtml(highlight)}</li>`;
          }
          html += '</ul>';
        }

        if (includeProjects && role.projects && role.projects.length > 0) {
          for (const project of role.projects) {
            const projDateRange = formatDateRange(
              project.start,
              project.end,
              formatter,
            );
            html += '<div class="project">';
            html += `<span class="project-name">${escapeHtml(project.name)}</span>`;
            if (projDateRange) {
              html += ` <span class="entry-date">(${escapeHtml(projDateRange)})</span>`;
            }
            if (project.bullets && project.bullets.length > 0) {
              html += '<ul>';
              for (const bullet of project.bullets) {
                html += `<li>${inlineMarkdownToHtml(bullet)}</li>`;
              }
              html += '</ul>';
            }
            html += '</div>';
          }
        }

        html += '</div>';
      }

      html += '</div>';
      return html;
    })
    .join('\n');
}

/**
 * Render mixed content part (legacy)
 */
function renderMixedContentPart(part: MixedContentPart): string {
  if (part.type === 'paragraph') {
    return markdownToHtml(part.text);
  }
  return (
    '<ul>' +
    part.items
      .map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`)
      .join('\n') +
    '</ul>'
  );
}

/**
 * Render a single content block
 */
export function renderContentBlock(
  block: ContentBlock,
  _sectionId: string,
  locale: LocaleOptions,
): string {
  switch (block.type) {
    case 'markdown':
      return markdownToHtml(block.content);
    case 'education':
      return renderEducation(block.entries, locale.dateFormatter);
    case 'experience':
      return renderExperience(block.entries, locale.dateFormatter);
    case 'certifications':
      return renderCertifications(block.entries, locale.dateFormatter);
    case 'skills':
      return renderSkills(block.entries, block.options, locale);
    case 'competencies':
      return renderCompetencies(block.entries);
    case 'languages':
      return renderLanguages(block.entries);
    case 'table':
      return (
        '<ul>' +
        block.rows
          .map((row) => `<li>${inlineMarkdownToHtml(row.content)}</li>`)
          .join('\n') +
        '</ul>'
      );
    default:
      return '';
  }
}

/**
 * Render section content - supports both legacy and composite formats
 */
export function renderSectionContent(
  content: SectionContent,
  sectionId: string,
  locale: LocaleOptions,
): string {
  // Handle composite content (new format)
  if (content.type === 'composite') {
    return content.blocks
      .map((block) => renderContentBlock(block, sectionId, locale))
      .join('\n');
  }

  // Handle legacy content types
  switch (content.type) {
    case 'text':
      return markdownToHtml(content.text);
    case 'list':
      if (sectionId === 'skills') {
        return renderSkillsList(content.items);
      }
      return (
        '<ul>' +
        content.items
          .map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`)
          .join('\n') +
        '</ul>'
      );
    case 'mixed':
      return content.parts.map(renderMixedContentPart).join('\n');
    case 'education':
      return renderEducation(content.entries, locale.dateFormatter);
    case 'experience':
      return renderExperience(content.entries, locale.dateFormatter);
    case 'certifications':
      return renderCertifications(content.entries, locale.dateFormatter);
    case 'skills':
      return renderSkills(content.entries, content.options, locale);
    case 'competencies':
      return renderCompetencies(content.entries);
    case 'languages':
      return renderLanguages(content.entries);
    case 'table':
      return (
        '<ul>' +
        content.rows
          .map((row) => `<li>${inlineMarkdownToHtml(row.content)}</li>`)
          .join('\n') +
        '</ul>'
      );
    default:
      return '';
  }
}
