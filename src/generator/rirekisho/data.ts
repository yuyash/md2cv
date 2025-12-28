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

function extractTableRows(content: SectionContent): TableRow[] {
  if (content.type === 'table') return [...content.rows];
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
    for (const role of entry.roles) {
      if (role.start) {
        const formatted = formatYearMonth(role.start);
        rows.push({
          year: formatted.year,
          month: formatted.month,
          content: `${entry.company} 入社`,
        });
      }
      if (role.end && role.end !== 'present') {
        const formatted = formatYearMonth(role.end);
        rows.push({
          year: formatted.year,
          month: formatted.month,
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
    rows.push(['', '', '学歴']);
    let tableRows =
      edu.content.type === 'education'
        ? educationToTableRows(edu.content.entries)
        : extractTableRows(edu.content);
    tableRows = sortTableRows(tableRows, order);
    for (const row of tableRows) {
      rows.push([row.year, row.month, row.content]);
    }
  }

  const work = sections.find((s) => s.id === 'experience');
  if (work) {
    rows.push(['', '', '職歴']);
    let tableRows =
      work.content.type === 'experience'
        ? experienceToTableRows(work.content.entries)
        : extractTableRows(work.content);
    tableRows = sortTableRows(tableRows, order);
    for (const row of tableRows) {
      rows.push([row.year, row.month, row.content]);
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

  let tableRows =
    sec.content.type === 'certifications'
      ? certificationsToTableRows(sec.content.entries)
      : extractTableRows(sec.content);
  tableRows = sortTableRows(tableRows, order);

  return tableRows.map((row) => [row.year, row.month, row.content]);
}

export function getSectionText(
  sections: readonly ParsedSection[],
  ids: string[],
): string {
  for (const id of ids) {
    const sec = sections.find((s) => s.id === id);
    if (sec && sec.content.type === 'text') {
      return escapeHtml(sec.content.text);
    }
  }
  return '';
}

/**
 * Get list items from a section (for competencies)
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
    if (edu.content.type === 'education') {
      // Each education entry generates 2 rows (入学 + 卒業/修了)
      historyDataRows += edu.content.entries.length * 2;
    } else if (edu.content.type === 'table') {
      historyDataRows += edu.content.rows.length;
    }
  }

  const work = sections.find((s) => s.id === 'experience');
  if (work) {
    if (work.content.type === 'experience') {
      // Each role generates 1-2 rows (入社 + optional 退職)
      for (const entry of work.content.entries) {
        for (const role of entry.roles) {
          historyDataRows += 1; // 入社
          if (role.end && role.end !== 'present') {
            historyDataRows += 1; // 退職
          }
        }
      }
    } else if (work.content.type === 'table') {
      historyDataRows += work.content.rows.length;
    }
  }

  // Count license rows
  let licenseDataRows = 0;
  const cert = sections.find((s) => s.id === 'certifications');
  if (cert) {
    if (cert.content.type === 'certifications') {
      licenseDataRows = cert.content.entries.length;
    } else if (cert.content.type === 'table') {
      licenseDataRows = cert.content.rows.length;
    }
  }

  return { historyDataRows, licenseDataRows };
}
