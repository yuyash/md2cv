/**
 * Data extraction and transformation for Rirekisho (履歴書)
 */

import type { ChronologicalOrder } from '../../types/config.js';
import type { CVMetadata } from '../../types/metadata.js';
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  ParsedSection,
  RoleEntry,
  SectionContent,
  TableRow,
} from '../../types/sections.js';
import type {
  DataCounts,
  FormattedDOB,
  HistoryRow,
  PersonalInfo,
  TodayDate,
} from './types.js';

// ============================================================================
// Utility Functions
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// Date Functions
// ============================================================================

function calculateAge(dob: Date, refDate: Date): number {
  let age = refDate.getFullYear() - dob.getFullYear();
  const monthDiff = refDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function formatDateOfBirth(dob: Date): FormattedDOB {
  return {
    year: String(dob.getFullYear()),
    month: String(dob.getMonth() + 1),
    day: String(dob.getDate()),
  };
}

function formatYearMonth(date: Date): { year: string; month: string } {
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1),
  };
}

export function getTodayDate(): TodayDate {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}

// ============================================================================
// Personal Information Extraction
// ============================================================================

export function extractPersonalInfo(
  metadata: CVMetadata,
  today: Date,
): PersonalInfo {
  const genderDisplay =
    metadata.gender === 'male'
      ? '男'
      : metadata.gender === 'female'
        ? '女'
        : '';

  return {
    name: escapeHtml(metadata.name_ja ?? metadata.name),
    furigana: escapeHtml(metadata.name_furigana ?? ''),
    phone: metadata.phone_number ? escapeHtml(metadata.phone_number) : '',
    phone2: metadata.phone_number2 ? escapeHtml(metadata.phone_number2) : '',
    address: metadata.home_address ? escapeHtml(metadata.home_address) : '',
    addressFurigana: escapeHtml(metadata.home_address_furigana ?? ''),
    postCode: escapeHtml(metadata.post_code ?? ''),
    address2: escapeHtml(metadata.home_address2 ?? ''),
    address2Furigana: escapeHtml(metadata.home_address2_furigana ?? ''),
    postCode2: escapeHtml(metadata.post_code2 ?? ''),
    email: escapeHtml(metadata.email_address),
    email2: escapeHtml(metadata.email_address2 ?? ''),
    gender: genderDisplay,
    dob: metadata.dob ? formatDateOfBirth(metadata.dob) : null,
    age: metadata.dob ? calculateAge(metadata.dob, today) : null,
  };
}

// ============================================================================
// Table Row Extraction
// ============================================================================

/**
 * Extract table rows from section content
 * For rirekisho: only extracts from structured table blocks, ignores markdown
 */
function extractTableRows(content: SectionContent): TableRow[] {
  if (content.type === 'table') return [...content.rows];
  if (content.type === 'composite') {
    // For rirekisho, only use structured table blocks
    const tableBlock = content.blocks.find((b) => b.type === 'table');
    if (tableBlock?.type === 'table') return [...tableBlock.rows];
  }
  return [];
}

/**
 * Extract education entries from section content
 * For rirekisho: only extracts from structured blocks, ignores markdown
 */
function extractEducationEntries(
  content: SectionContent,
): readonly EducationEntry[] {
  if (content.type === 'education') return content.entries;
  if (content.type === 'composite') {
    // For rirekisho, only use structured education blocks
    const eduBlock = content.blocks.find((b) => b.type === 'education');
    if (eduBlock?.type === 'education') return eduBlock.entries;
  }
  return [];
}

/**
 * Extract experience entries from section content
 * For rirekisho: only extracts from structured blocks, ignores markdown
 */
function extractExperienceEntries(
  content: SectionContent,
): readonly ExperienceEntry[] {
  if (content.type === 'experience') return content.entries;
  if (content.type === 'composite') {
    // For rirekisho, only use structured experience blocks
    const expBlock = content.blocks.find((b) => b.type === 'experience');
    if (expBlock?.type === 'experience') return expBlock.entries;
  }
  return [];
}

/**
 * Extract certification entries from section content
 * For rirekisho: only extracts from structured blocks, ignores markdown
 */
function extractCertificationEntries(
  content: SectionContent,
): readonly CertificationEntry[] {
  if (content.type === 'certifications') return content.entries;
  if (content.type === 'composite') {
    // For rirekisho, only use structured certification blocks
    const certBlock = content.blocks.find((b) => b.type === 'certifications');
    if (certBlock?.type === 'certifications') return certBlock.entries;
  }
  return [];
}

/**
/**
 * Extract competency entries from section content
 * For rirekisho: only extracts from structured blocks
 */
function extractCompetencyEntries(
  content: SectionContent,
): readonly { header: string; description: string }[] {
  if (content.type === 'competencies') return content.entries;
  if (content.type === 'composite') {
    const compBlock = content.blocks.find((b) => b.type === 'competencies');
    if (compBlock?.type === 'competencies') return compBlock.entries;
  }
  return [];
}

function educationToTableRows(entries: readonly EducationEntry[]): TableRow[] {
  const rows: TableRow[] = [];
  for (const entry of entries) {
    if (entry.start) {
      const formatted = formatYearMonth(entry.start);
      rows.push({
        year: formatted.year,
        month: formatted.month,
        content: `${entry.school}${entry.degree ? ' ' + entry.degree : ''} 入学`,
      });
    }
    if (entry.end) {
      const formatted = formatYearMonth(entry.end);
      const degree = entry.degree ?? '';
      const isGraduateSchool =
        degree.includes('修士') || degree.includes('博士');
      const suffix = isGraduateSchool ? '修了' : '卒業';
      rows.push({
        year: formatted.year,
        month: formatted.month,
        content: `${entry.school}${entry.degree ? ' ' + entry.degree : ''} ${suffix}`,
      });
    }
  }
  return rows;
}

function experienceToTableRows(
  entries: readonly ExperienceEntry[],
): TableRow[] {
  const rows: TableRow[] = [];
  for (const entry of entries) {
    if (entry.roles.length === 0) continue;

    // Find the earliest start date across all roles
    const earliestRole = entry.roles.reduce((earliest, role) => {
      if (!earliest || role.start < earliest.start) {
        return role;
      }
      return earliest;
    });

    // Add entry row (入社) with the earliest start date
    const formattedStart = formatYearMonth(earliestRole.start);
    rows.push({
      year: formattedStart.year,
      month: formattedStart.month,
      content: `${entry.company} 入社`,
    });

    // Check if any role is still ongoing (present)
    const hasOngoingRole = entry.roles.some((role) => role.end === 'present');

    // Add exit row (退社) only if no role is ongoing
    if (!hasOngoingRole) {
      // Find the latest end date across all roles
      const latestEndRole = entry.roles.reduce<RoleEntry | null>(
        (latest, role) => {
          if (role.end === 'present') return latest;
          if (!latest || latest.end === 'present' || role.end > latest.end) {
            return role;
          }
          return latest;
        },
        null,
      );

      if (latestEndRole && latestEndRole.end !== 'present') {
        const formattedEnd = formatYearMonth(latestEndRole.end);
        rows.push({
          year: formattedEnd.year,
          month: formattedEnd.month,
          content: `${entry.company} 退社`,
        });
      }
    }
  }
  return rows;
}

function certificationsToTableRows(
  entries: readonly CertificationEntry[],
): TableRow[] {
  const rows: TableRow[] = [];
  for (const entry of entries) {
    if (entry.date) {
      const formatted = formatYearMonth(entry.date);
      rows.push({
        year: formatted.year,
        month: formatted.month,
        content: entry.name,
      });
    } else {
      rows.push({ year: '', month: '', content: entry.name });
    }
  }
  return rows;
}

function sortTableRows(
  rows: TableRow[],
  order: ChronologicalOrder,
): TableRow[] {
  return [...rows].sort((a, b) => {
    const yearA = parseInt(a.year, 10) || 0;
    const monthA = parseInt(a.month, 10) || 0;
    const yearB = parseInt(b.year, 10) || 0;
    const monthB = parseInt(b.month, 10) || 0;
    const dateA = yearA * 100 + monthA;
    const dateB = yearB * 100 + monthB;
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

// ============================================================================
// History Data Building
// ============================================================================

export function buildHistoryData(
  sections: readonly ParsedSection[],
  order: ChronologicalOrder,
): HistoryRow[] {
  const rows: HistoryRow[] = [];

  const edu = sections.find((s) => s.id === 'education');
  if (edu) {
    const eduEntries = extractEducationEntries(edu.content);
    const tableRows = extractTableRows(edu.content);

    if (eduEntries.length > 0 || tableRows.length > 0) {
      rows.push(['', '', '学歴']);
      let dataRows =
        eduEntries.length > 0 ? educationToTableRows(eduEntries) : tableRows;
      dataRows = sortTableRows(dataRows, order);
      for (const row of dataRows) {
        rows.push([row.year, row.month, row.content]);
      }
    }
  }

  const work = sections.find((s) => s.id === 'experience');
  if (work) {
    const expEntries = extractExperienceEntries(work.content);
    const tableRows = extractTableRows(work.content);

    if (expEntries.length > 0 || tableRows.length > 0) {
      rows.push(['', '', '職歴']);
      let dataRows =
        expEntries.length > 0 ? experienceToTableRows(expEntries) : tableRows;
      dataRows = sortTableRows(dataRows, order);
      for (const row of dataRows) {
        rows.push([row.year, row.month, row.content]);
      }
    }
  }

  if (!rows.some((r) => r[2] === '現在に至る'))
    rows.push(['', '', '現在に至る']);
  if (!rows.some((r) => r[2] === '以上')) rows.push(['', '', '以上']);

  return rows;
}

export function buildLicenseData(
  sections: readonly ParsedSection[],
  order: ChronologicalOrder,
): HistoryRow[] {
  const sec = sections.find((s) => s.id === 'certifications');
  if (!sec) return [];

  const certEntries = extractCertificationEntries(sec.content);
  const tableRows = extractTableRows(sec.content);

  let dataRows =
    certEntries.length > 0 ? certificationsToTableRows(certEntries) : tableRows;
  dataRows = sortTableRows(dataRows, order);

  return dataRows.map((row) => [row.year, row.month, row.content]);
}

/**
 * Convert markdown text to HTML, handling lists and paragraphs
 */
function markdownToHtml(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inList = false;
  let currentParagraph: string[] = [];

  const flushParagraph = (): void => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(' ').trim();
      if (content) {
        result.push(`<p>${escapeHtml(content)}</p>`);
      }
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is a list item (starts with - or * followed by space)
    const listMatch = trimmed.match(/^[-*] (.*)$/);

    if (listMatch) {
      // Flush any pending paragraph before starting list
      flushParagraph();

      // Start list if not already in one
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }

      // Add list item
      result.push(`<li>${escapeHtml(listMatch[1])}</li>`);
    } else if (trimmed === '') {
      // Empty line - flush paragraph and close list if needed
      flushParagraph();
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
    } else {
      // Regular text line
      // Check if next line is a list item
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      const nextIsListItem = /^[-*] /.test(nextLine);

      if (nextIsListItem) {
        // This line is a label/header before a list, keep it as paragraph
        flushParagraph();
        result.push(`<p>${escapeHtml(trimmed)}</p>`);
      } else {
        // Regular paragraph line
        if (inList) {
          // Close list before starting paragraph
          result.push('</ul>');
          inList = false;
        }
        currentParagraph.push(trimmed);
      }
    }
  }

  // Flush any remaining content
  flushParagraph();
  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

export function getSectionText(
  sections: readonly ParsedSection[],
  ids: string[],
): string {
  for (const id of ids) {
    const sec = sections.find((s) => s.id === id);
    if (sec) {
      if (sec.content.type === 'text') {
        return markdownToHtml(sec.content.text);
      }
      // Handle list type sections (when markdown lists are parsed as list content)
      if (sec.content.type === 'list') {
        const listItems = sec.content.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('\n');
        return `<ul>\n${listItems}\n</ul>`;
      }
      // For composite content in rirekisho:
      // - Text-only sections (motivation, notes) should render markdown content
      // - Sections with structured blocks should only use structured data
      if (sec.content.type === 'composite') {
        // Check if there are any structured blocks (non-markdown)
        const hasStructuredBlocks = sec.content.blocks.some(
          (b) => b.type !== 'markdown',
        );

        // If no structured blocks, this is a text-only section - render markdown
        if (!hasStructuredBlocks) {
          const markdownBlocks = sec.content.blocks.filter(
            (b) => b.type === 'markdown',
          );
          if (markdownBlocks.length > 0) {
            const combinedText = markdownBlocks
              .map((b) => (b.type === 'markdown' ? b.content : ''))
              .join('\n\n');
            return markdownToHtml(combinedText);
          }
        }
        // If there are structured blocks, return empty (rirekisho uses structured data only)
        return '';
      }
    }
  }
  return '';
}

/**
 * Get list items from a section (for competencies)
 * For rirekisho: only extracts from structured blocks
 */
export function getSectionList(
  sections: readonly ParsedSection[],
  ids: string[],
): string[] {
  for (const id of ids) {
    const sec = sections.find((s) => s.id === id);
    if (sec) {
      if (sec.content.type === 'list') {
        return sec.content.items.map((item) => escapeHtml(item));
      }
      if (sec.content.type === 'competencies') {
        return sec.content.entries.map((entry) =>
          escapeHtml(`${entry.header}: ${entry.description}`),
        );
      }
      // For composite content, extract from structured competencies block only
      if (sec.content.type === 'composite') {
        const compEntries = extractCompetencyEntries(sec.content);
        if (compEntries.length > 0) {
          return compEntries.map((entry) =>
            escapeHtml(`${entry.header}: ${entry.description}`),
          );
        }
      }
    }
  }
  return [];
}

// ============================================================================
// Data Counting
// ============================================================================

export function countDataRows(sections: readonly ParsedSection[]): DataCounts {
  // Count history rows (education + experience entries)
  let historyDataRows = 0;

  const edu = sections.find((s) => s.id === 'education');
  if (edu) {
    const eduEntries = extractEducationEntries(edu.content);
    const tableRows = extractTableRows(edu.content);

    if (eduEntries.length > 0) {
      // Each education entry generates 2 rows (入学 + 卒業/修了)
      historyDataRows += eduEntries.length * 2;
    } else if (tableRows.length > 0) {
      historyDataRows += tableRows.length;
    }
  }

  const work = sections.find((s) => s.id === 'experience');
  if (work) {
    const expEntries = extractExperienceEntries(work.content);
    const tableRows = extractTableRows(work.content);

    if (expEntries.length > 0) {
      // Each company generates 1-2 rows (入社 + optional 退社)
      for (const entry of expEntries) {
        historyDataRows += 1; // 入社

        // Check if any role is still ongoing (present)
        const hasOngoingRole = entry.roles.some(
          (role) => role.end === 'present',
        );
        if (!hasOngoingRole) {
          historyDataRows += 1; // 退社
        }
      }
    } else if (tableRows.length > 0) {
      historyDataRows += tableRows.length;
    }
  }

  // Count license rows
  let licenseDataRows = 0;
  const cert = sections.find((s) => s.id === 'certifications');
  if (cert) {
    const certEntries = extractCertificationEntries(cert.content);
    const tableRows = extractTableRows(cert.content);

    if (certEntries.length > 0) {
      licenseDataRows = certEntries.length;
    } else if (tableRows.length > 0) {
      licenseDataRows = tableRows.length;
    }
  }

  return { historyDataRows, licenseDataRows };
}
