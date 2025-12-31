/**
 * Type definitions for Rirekisho (履歴書) generator
 * Based on 厚生労働省 履歴書様式例 format
 */

import type { ChronologicalOrder, PaperSize } from '../../types/config.js';
import type { CVMetadata } from '../../types/metadata.js';
import type { ParsedSection } from '../../types/sections.js';

// Re-export PaperSize for use in other modules
export type { PaperSize } from '../../types/config.js';

// ============================================================================
// Input Types
// ============================================================================

/** Options for Rirekisho generation */
export interface RirekishoOptions {
  readonly paperSize: PaperSize;
  readonly chronologicalOrder?: ChronologicalOrder;
  readonly hideMotivation?: boolean;
  /** Base64 encoded photo data URI (e.g., "data:image/png;base64,...") */
  readonly photoDataUri?: string;
  /** Custom CSS stylesheet content to append after default styles */
  readonly customStylesheet?: string;
}

/** Input data for the Rirekisho generator */
export interface RirekishoInput {
  readonly metadata: CVMetadata;
  readonly sections: readonly ParsedSection[];
}

// ============================================================================
// Paper & Dimensions
// ============================================================================

/** Paper dimensions in mm (landscape orientation) */
export interface PaperDimensions {
  readonly width: number;
  readonly height: number;
}

/** Paper sizes in mm (landscape orientation: width > height) */
export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  a3: { width: 420, height: 297 },
  a4: { width: 297, height: 210 },
  b4: { width: 364, height: 257 },
  b5: { width: 257, height: 182 },
  letter: { width: 279.4, height: 215.9 },
};

/** Scale factors relative to A3 base size */
export const SCALE_FACTORS: Record<PaperSize, number> = {
  a3: 1.0,
  a4: 0.71,
  b4: 0.86,
  b5: 0.61,
  letter: 0.67,
};

/** Minimum row counts per paper size */
export interface MinRowCounts {
  readonly rightHistory: number;
  readonly license: number;
}

/** Minimum row counts for each paper size */
export const MIN_ROW_COUNTS: Record<PaperSize, MinRowCounts> = {
  a3: { rightHistory: 1, license: 1 },
  a4: { rightHistory: 1, license: 1 },
  b4: { rightHistory: 1, license: 1 },
  b5: { rightHistory: 1, license: 1 },
  letter: { rightHistory: 1, license: 1 },
};

/** Preferred row counts per paper size (used when space allows) */
export interface PreferredRowCounts {
  readonly rightHistory: number;
  readonly license: number;
}

/** Preferred row counts for each paper size */
export const PREFERRED_ROW_COUNTS: Record<PaperSize, PreferredRowCounts> = {
  a3: { rightHistory: 9, license: 7 },
  a4: { rightHistory: 7, license: 6 },
  b4: { rightHistory: 8, license: 7 },
  b5: { rightHistory: 6, license: 5 },
  letter: { rightHistory: 7, license: 6 },
};

/** Section height constraints for right page (at scale 1.0) */
export const SECTION_HEIGHTS = {
  /** Minimum height for motivation section (mm) */
  motivationMin: 25,
  /** Minimum height for notes section (mm) */
  notesMin: 20,
  /** Section header height (mm) */
  sectionHeader: 8,
} as const;

// ============================================================================
// Layout Configuration
// ============================================================================

/** Row height constraints in mm (at scale 1.0) */
export const ROW_HEIGHT = {
  default: 9.0,
  min: 5.0,
  max: 11.0,
} as const;

/** Font size constraints in pt (at scale 1.0) */
export const FONT_SIZE = {
  default: 11,
  min: 6,
} as const;

/** Fixed layout dimensions in mm (at scale 1.0) */
export const FIXED_DIMENSIONS = {
  margin: 25,
  marginBottom: 20,
  centerGap: 12,
  photoWidth: 62,
  contactWidth: 45,
  genderWidth: 33,
  headerHeight: 11, // title row + margin
  nameRowHeight: 8,
  nameMainHeight: 25,
  birthGenderHeight: 8.5,
  addressRowHeight: 21,
  addressFuriganaHeight: 7.2,
  footerHeight: 4,
  tableMargin: 3,
  sectionHeaderHeight: 8,
  yearColumnWidth: 18.75,
  monthColumnWidth: 10.5,
} as const;

// ============================================================================
// Layout Result Types
// ============================================================================

/** Calculated layout dimensions */
export interface LayoutDimensions {
  // Paper & scale
  readonly paper: PaperDimensions;
  readonly scale: number;

  // Page dimensions
  readonly margin: number;
  readonly marginBottom: number;
  readonly centerGap: number;
  readonly pageWidth: number;
  readonly pageHeight: number;

  // Header section
  readonly photoWidth: number;
  readonly contactWidth: number;
  readonly genderWidth: number;
  readonly headerHeight: number;
  readonly nameRowHeight: number;
  readonly nameMainHeight: number;
  readonly birthGenderHeight: number;
  readonly addressRowHeight: number;
  readonly addressFuriganaHeight: number;

  // Table dimensions
  readonly tableRowHeight: number;
  readonly tableFontSize: number;
  readonly tableMargin: number;
  readonly yearColumnWidth: number;
  readonly monthColumnWidth: number;

  // Row counts
  readonly leftHistoryRows: number;
  readonly rightHistoryRows: number;
  readonly licenseRows: number;

  // Section heights (minimum heights, actual determined by CSS flex)
  readonly leftTableHeight: number;
  readonly rightHistoryTableHeight: number;
  readonly licenseTableHeight: number;
  readonly motivationMinHeight: number;
  readonly notesMinHeight: number;

  // Footer
  readonly footerHeight: number;

  // Options
  readonly hideMotivation: boolean;

  // Overflow flag
  readonly overflows: boolean;
}

/** Data counts for layout calculation */
export interface DataCounts {
  readonly historyDataRows: number;
  readonly licenseDataRows: number;
}

/** Layout calculation input */
export interface LayoutInput {
  readonly paperSize: PaperSize;
  readonly hideMotivation: boolean;
  readonly dataCounts: DataCounts;
}

// ============================================================================
// Personal Information
// ============================================================================

/** Formatted date of birth */
export interface FormattedDOB {
  readonly year: string;
  readonly month: string;
  readonly day: string;
}

/** Personal information extracted from metadata */
export interface PersonalInfo {
  readonly name: string;
  readonly furigana: string;
  readonly phone: string;
  readonly phone2: string;
  readonly address: string;
  readonly addressFurigana: string;
  readonly postCode: string;
  readonly address2: string;
  readonly address2Furigana: string;
  readonly postCode2: string;
  readonly email: string;
  readonly email2: string;
  readonly gender: string;
  readonly dob: FormattedDOB | null;
  readonly age: number | null;
}

// ============================================================================
// History Data
// ============================================================================

/** History row data [year, month, content] */
export type HistoryRow = readonly [string, string, string];

/** Today's date for display */
export interface TodayDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}
