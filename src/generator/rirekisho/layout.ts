/**
 * Layout calculation for Rirekisho (履歴書)
 *
 * This module calculates the optimal layout for the rirekisho document,
 * ensuring that:
 * 1. All content fits within the page
 * 2. Left and right page bottoms align perfectly
 * 3. Font sizes don't go below minimum
 * 4. Each section has at least its minimum height
 */

import type {
  LayoutDimensions,
  LayoutInput,
  PaperDimensions,
  PaperSize,
} from './types.js';
import {
  FIXED_DIMENSIONS,
  FONT_SIZE,
  PAPER_SIZES,
  PREFERRED_ROW_COUNTS,
  ROW_HEIGHT,
  SCALE_FACTORS,
  SECTION_HEIGHTS,
} from './types.js';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the height of the left page header section
 * (title, name, birth/gender, addresses)
 */
function calculateLeftHeaderHeight(scale: number): number {
  const d = FIXED_DIMENSIONS;
  return (
    d.headerHeight * scale +
    d.nameRowHeight * scale +
    d.nameMainHeight * scale +
    d.birthGenderHeight * scale +
    d.addressRowHeight * scale * 2
  );
}

/**
 * Calculate table height from row count and row height
 * +1 for header row
 */
function calculateTableHeight(dataRowCount: number, rowHeight: number): number {
  return (dataRowCount + 1) * rowHeight;
}

// ============================================================================
// Layout Optimization
// ============================================================================

/**
 * Layout allocation result for right page sections
 */
interface RightPageAllocation {
  readonly rightHistoryRows: number;
  readonly licenseRows: number;
  readonly motivationHeight: number;
  readonly notesHeight: number;
  readonly totalHeight: number;
  /** Adjusted row height (may be smaller than default if content is large) */
  readonly adjustedRowHeight: number;
  /** Adjusted font size (may be smaller than default if content is large) */
  readonly adjustedFontSize: number;
  /** Whether the content overflows (doesn't fit even with minimum row height) */
  readonly overflows: boolean;
}

/**
 * Allocation input parameters
 */
interface AllocationParams {
  readonly availableHeight: number;
  readonly historyOverflow: number;
  readonly licenseDataRows: number;
  readonly tableRowHeight: number;
  readonly tableMargin: number;
  readonly scale: number;
  readonly paperSize: PaperSize;
  readonly hideMotivation: boolean;
  /** Total history data rows (education + work) */
  readonly totalHistoryDataRows: number;
  /** Available height for left page table area */
  readonly leftTableAreaHeight: number;
}

/**
 * Calculate optimal allocation of space on the right page
 *
 * Priority rules:
 * 1. When license data is large: reduce motivation/notes height first, then reduce history rows
 * 2. When history data is large: reduce license rows if possible, then reduce motivation/notes height
 * 3. When both are large: reduce motivation/notes to minimum height
 *    - If still doesn't fit: reduce row height and font size (applied to all tables on both pages)
 *
 * The algorithm starts with preferred row counts and reduces as needed while
 * maintaining minimum constraints.
 */
function allocateRightPageSpace(params: AllocationParams): RightPageAllocation {
  const {
    availableHeight,
    historyOverflow,
    licenseDataRows,
    tableRowHeight,
    tableMargin,
    scale,
    paperSize,
    hideMotivation,
    totalHistoryDataRows,
    leftTableAreaHeight,
  } = params;

  const preferred = PREFERRED_ROW_COUNTS[paperSize];
  const motivationMinHeight = hideMotivation
    ? 0
    : SECTION_HEIGHTS.motivationMin * scale;
  const notesMinHeight = SECTION_HEIGHTS.notesMin * scale;

  // Row height and font size constraints
  const minRowHeight = ROW_HEIGHT.min * scale;
  const defaultFontSize = FONT_SIZE.default * scale;
  const minFontSize = FONT_SIZE.min * scale;

  // History extra rows (学歴, 職歴, 現在に至る, 以上)
  const historyExtraRows = 4;

  // Minimum row counts: must show all data, at least 1 row
  const minHistoryRows = Math.max(1, historyOverflow);
  const minLicenseRows = Math.max(1, licenseDataRows);

  // Start with preferred row counts (but at least enough for data)
  let rightHistoryRows = Math.max(preferred.rightHistory, minHistoryRows);
  let licenseRows = Math.max(preferred.license, minLicenseRows);
  let currentRowHeight = tableRowHeight;
  let currentFontSize = defaultFontSize;

  // Calculate how many left history rows fit with a given row height
  const calcLeftHistoryRows = (rowHeight: number): number => {
    return Math.floor(leftTableAreaHeight / rowHeight) - 2; // -1 for header, -1 for safety
  };

  // Calculate history overflow with a given row height
  const calcHistoryOverflow = (rowHeight: number): number => {
    const leftRows = calcLeftHistoryRows(rowHeight);
    const totalNeeded = totalHistoryDataRows + historyExtraRows;
    return Math.max(0, totalNeeded - leftRows);
  };

  // Calculate initial heights with preferred 6:4 ratio for motivation/notes
  const calcMotivationNotesHeights = (
    remaining: number,
  ): { motivation: number; notes: number } => {
    if (hideMotivation) {
      return { motivation: 0, notes: Math.max(notesMinHeight, remaining) };
    }
    const totalMin = motivationMinHeight + notesMinHeight;
    if (remaining >= totalMin) {
      const extra = remaining - totalMin;
      return {
        motivation: motivationMinHeight + extra * 0.6,
        notes: notesMinHeight + extra * 0.4,
      };
    }
    // Below minimum - proportionally reduce
    const ratio = Math.max(0, remaining / totalMin);
    return {
      motivation: motivationMinHeight * ratio,
      notes: notesMinHeight * ratio,
    };
  };

  // Calculate remaining space for motivation/notes (with variable row height)
  const calcRemainingForSections = (
    histRows: number,
    licRows: number,
    rowHeight: number,
  ): number => {
    const histHeight = calculateTableHeight(histRows, rowHeight);
    const licHeight = calculateTableHeight(licRows, rowHeight);
    const marginCount = hideMotivation ? 2 : 3;
    return availableHeight - histHeight - licHeight - marginCount * tableMargin;
  };

  // Calculate total height (with variable row height)
  const calcTotalHeight = (
    histRows: number,
    licRows: number,
    motHeight: number,
    notHeight: number,
    rowHeight: number,
  ): number => {
    const histHeight = calculateTableHeight(histRows, rowHeight);
    const licHeight = calculateTableHeight(licRows, rowHeight);
    const marginCount = hideMotivation ? 2 : 3;
    return (
      histHeight + licHeight + motHeight + notHeight + marginCount * tableMargin
    );
  };

  // Check if current allocation fits (with variable row height)
  const fitsInAvailable = (
    histRows: number,
    licRows: number,
    motHeight: number,
    notHeight: number,
    rowHeight: number,
  ): boolean => {
    const total = calcTotalHeight(
      histRows,
      licRows,
      motHeight,
      notHeight,
      rowHeight,
    );
    return total <= availableHeight + 0.1; // Small tolerance for floating point
  };

  // Determine which data is "large" (exceeds preferred)
  const historyIsLarge = historyOverflow > preferred.rightHistory;
  const licenseIsLarge = licenseDataRows > preferred.license;

  // Initial calculation with preferred rows
  let remaining = calcRemainingForSections(
    rightHistoryRows,
    licenseRows,
    currentRowHeight,
  );
  let { motivation: motivationHeight, notes: notesHeight } =
    calcMotivationNotesHeights(remaining);

  // If everything fits, we're done
  if (
    fitsInAvailable(
      rightHistoryRows,
      licenseRows,
      motivationHeight,
      notesHeight,
      currentRowHeight,
    )
  ) {
    return {
      rightHistoryRows,
      licenseRows,
      motivationHeight,
      notesHeight,
      totalHeight: availableHeight,
      adjustedRowHeight: currentRowHeight,
      adjustedFontSize: currentFontSize,
      overflows: false,
    };
  }

  // Need to reduce - apply priority rules

  if (licenseIsLarge && !historyIsLarge) {
    // Priority 1: License is large
    // Step 1: Reduce motivation/notes to minimum
    motivationHeight = motivationMinHeight;
    notesHeight = notesMinHeight;

    if (
      !fitsInAvailable(
        rightHistoryRows,
        licenseRows,
        motivationHeight,
        notesHeight,
        currentRowHeight,
      )
    ) {
      // Step 2: Reduce history rows (empty rows first)
      while (rightHistoryRows > minHistoryRows) {
        rightHistoryRows--;
        if (
          fitsInAvailable(
            rightHistoryRows,
            licenseRows,
            motivationHeight,
            notesHeight,
            currentRowHeight,
          )
        )
          break;
      }
    }
  } else if (historyIsLarge && !licenseIsLarge) {
    // Priority 2: History is large
    // Step 1: Reduce license rows (empty rows first)
    while (licenseRows > minLicenseRows) {
      licenseRows--;
      remaining = calcRemainingForSections(
        rightHistoryRows,
        licenseRows,
        currentRowHeight,
      );
      ({ motivation: motivationHeight, notes: notesHeight } =
        calcMotivationNotesHeights(remaining));
      if (
        fitsInAvailable(
          rightHistoryRows,
          licenseRows,
          motivationHeight,
          notesHeight,
          currentRowHeight,
        )
      )
        break;
    }

    if (
      !fitsInAvailable(
        rightHistoryRows,
        licenseRows,
        motivationHeight,
        notesHeight,
        currentRowHeight,
      )
    ) {
      // Step 2: Reduce motivation/notes to minimum
      motivationHeight = motivationMinHeight;
      notesHeight = notesMinHeight;
    }
  } else {
    // Priority 3: Both are large (or neither but still doesn't fit)
    // Reduce motivation/notes to minimum first
    motivationHeight = motivationMinHeight;
    notesHeight = notesMinHeight;

    // If still doesn't fit, reduce empty rows from both tables
    while (
      !fitsInAvailable(
        rightHistoryRows,
        licenseRows,
        motivationHeight,
        notesHeight,
        currentRowHeight,
      )
    ) {
      // Alternate reducing license and history empty rows
      let reduced = false;

      if (licenseRows > minLicenseRows) {
        licenseRows--;
        reduced = true;
      }

      if (
        !fitsInAvailable(
          rightHistoryRows,
          licenseRows,
          motivationHeight,
          notesHeight,
          currentRowHeight,
        ) &&
        rightHistoryRows > minHistoryRows
      ) {
        rightHistoryRows--;
        reduced = true;
      }

      if (!reduced) break; // Can't reduce anymore
    }

    // If still doesn't fit after reducing rows, reduce row height and font size
    // This affects all tables on both left and right pages
    if (
      !fitsInAvailable(
        rightHistoryRows,
        licenseRows,
        motivationHeight,
        notesHeight,
        currentRowHeight,
      )
    ) {
      // Calculate the optimal row height that fits all content
      // We need to find a row height where:
      // 1. Left page can fit leftHistoryRows (calculated from row height)
      // 2. Right page can fit rightHistoryRows + licenseRows + motivation + notes

      // Binary search for optimal row height
      let lowHeight = minRowHeight;
      let highHeight = tableRowHeight;
      let bestRowHeight = minRowHeight;

      for (let i = 0; i < 20; i++) {
        // Max 20 iterations for precision
        const midHeight = (lowHeight + highHeight) / 2;

        // Recalculate overflow with this row height
        const newOverflow = calcHistoryOverflow(midHeight);
        const newRightHistoryRows = Math.max(1, newOverflow);

        // Check if right page fits
        const marginCount = hideMotivation ? 2 : 3;
        const rightTableRows = newRightHistoryRows + 1 + licenseRows + 1; // +1 for headers
        const rightTablesHeight = rightTableRows * midHeight;
        const rightTotalHeight =
          rightTablesHeight +
          motivationMinHeight +
          notesMinHeight +
          marginCount * tableMargin;

        if (rightTotalHeight <= availableHeight + 0.1) {
          // This height works, try larger
          bestRowHeight = midHeight;
          lowHeight = midHeight;
        } else {
          // Too large, try smaller
          highHeight = midHeight;
        }

        // Stop if converged
        if (highHeight - lowHeight < 0.01) break;
      }

      // Use the best row height found
      if (bestRowHeight >= minRowHeight) {
        currentRowHeight = bestRowHeight;

        // Recalculate right history rows with new row height
        const newOverflow = calcHistoryOverflow(currentRowHeight);
        rightHistoryRows = Math.max(1, newOverflow);

        // Scale font size proportionally
        const heightRatio = currentRowHeight / tableRowHeight;
        currentFontSize = Math.max(minFontSize, defaultFontSize * heightRatio);
      } else {
        // Use minimum row height - content may overflow but we can't go smaller
        currentRowHeight = minRowHeight;
        currentFontSize = minFontSize;

        // Recalculate right history rows with minimum row height
        const newOverflow = calcHistoryOverflow(currentRowHeight);
        rightHistoryRows = Math.max(1, newOverflow);
      }
    }
  }

  // Final recalculation - distribute any remaining space to motivation/notes
  remaining = calcRemainingForSections(
    rightHistoryRows,
    licenseRows,
    currentRowHeight,
  );
  ({ motivation: motivationHeight, notes: notesHeight } =
    calcMotivationNotesHeights(remaining));

  // Check if content still overflows after all adjustments
  const finalFits = fitsInAvailable(
    rightHistoryRows,
    licenseRows,
    motivationHeight,
    notesHeight,
    currentRowHeight,
  );

  return {
    rightHistoryRows,
    licenseRows,
    motivationHeight,
    notesHeight,
    totalHeight: calcTotalHeight(
      rightHistoryRows,
      licenseRows,
      motivationHeight,
      notesHeight,
      currentRowHeight,
    ),
    adjustedRowHeight: currentRowHeight,
    adjustedFontSize: currentFontSize,
    overflows: !finalFits,
  };
}

// ============================================================================
// Main Layout Calculation
// ============================================================================

/**
 * Calculate complete layout dimensions for the rirekisho document
 */
export function calculateLayout(input: LayoutInput): LayoutDimensions {
  const { paperSize, hideMotivation, dataCounts } = input;
  const { historyDataRows, licenseDataRows } = dataCounts;

  // Paper and scale
  const paper: PaperDimensions = PAPER_SIZES[paperSize];
  const scale = SCALE_FACTORS[paperSize];

  // Page dimensions
  const margin = FIXED_DIMENSIONS.margin * scale;
  const marginBottom = FIXED_DIMENSIONS.marginBottom * scale;
  const centerGap = FIXED_DIMENSIONS.centerGap * scale;
  const pageWidth = (paper.width - margin * 2 - centerGap) / 2;
  const pageHeight = paper.height - margin - marginBottom;
  const footerHeight = FIXED_DIMENSIONS.footerHeight * scale;
  const tableMargin = FIXED_DIMENSIONS.tableMargin * scale;

  // Table dimensions (default values, may be adjusted by allocation)
  const defaultTableRowHeight = ROW_HEIGHT.default * scale;

  // Left page layout
  const leftHeaderHeight = calculateLeftHeaderHeight(scale);
  const leftContentHeight = pageHeight - footerHeight;
  const leftTableAreaHeight =
    leftContentHeight - leftHeaderHeight - tableMargin;

  // Calculate how many rows fit on left page (using default row height initially)
  // -1 for header row, -1 for safety margin
  const defaultLeftHistoryRows =
    Math.floor(leftTableAreaHeight / defaultTableRowHeight) - 2;

  // Calculate history overflow to right page (with default row height)
  const historyExtraRows = 4; // 学歴, 職歴, 現在に至る, 以上
  const totalHistoryNeeded = historyDataRows + historyExtraRows;
  const historyOverflow = Math.max(
    0,
    totalHistoryNeeded - defaultLeftHistoryRows,
  );

  // Right page layout - allocate space optimally
  const rightContentHeight = pageHeight - footerHeight;
  const allocation = allocateRightPageSpace({
    availableHeight: rightContentHeight,
    historyOverflow,
    licenseDataRows,
    tableRowHeight: defaultTableRowHeight,
    tableMargin,
    scale,
    paperSize,
    hideMotivation,
    totalHistoryDataRows: historyDataRows,
    leftTableAreaHeight,
  });

  // Use adjusted row height and font size from allocation
  const tableRowHeight = allocation.adjustedRowHeight;
  const tableFontSize = allocation.adjustedFontSize;

  // Recalculate left history rows with the (possibly adjusted) row height
  const leftHistoryRows = Math.floor(leftTableAreaHeight / tableRowHeight) - 2;

  // Calculate table heights with the (possibly adjusted) row height
  const leftTableHeight = calculateTableHeight(leftHistoryRows, tableRowHeight);
  const rightHistoryTableHeight = calculateTableHeight(
    allocation.rightHistoryRows,
    tableRowHeight,
  );
  const licenseTableHeight = calculateTableHeight(
    allocation.licenseRows,
    tableRowHeight,
  );

  return {
    paper,
    scale,
    margin,
    marginBottom,
    centerGap,
    pageWidth,
    pageHeight,
    photoWidth: FIXED_DIMENSIONS.photoWidth * scale,
    contactWidth: FIXED_DIMENSIONS.contactWidth * scale,
    genderWidth: FIXED_DIMENSIONS.genderWidth * scale,
    headerHeight: FIXED_DIMENSIONS.headerHeight * scale,
    nameRowHeight: FIXED_DIMENSIONS.nameRowHeight * scale,
    nameMainHeight: FIXED_DIMENSIONS.nameMainHeight * scale,
    birthGenderHeight: FIXED_DIMENSIONS.birthGenderHeight * scale,
    addressRowHeight: FIXED_DIMENSIONS.addressRowHeight * scale,
    addressFuriganaHeight: FIXED_DIMENSIONS.addressFuriganaHeight * scale,
    tableRowHeight,
    tableFontSize,
    tableMargin,
    yearColumnWidth: FIXED_DIMENSIONS.yearColumnWidth * scale,
    monthColumnWidth: FIXED_DIMENSIONS.monthColumnWidth * scale,
    leftHistoryRows,
    rightHistoryRows: allocation.rightHistoryRows,
    licenseRows: allocation.licenseRows,
    leftTableHeight,
    rightHistoryTableHeight,
    licenseTableHeight,
    motivationMinHeight: allocation.motivationHeight,
    notesMinHeight: allocation.notesHeight,
    footerHeight,
    hideMotivation,
    overflows: allocation.overflows,
  };
}

/**
 * Validate that the layout can accommodate the data
 */
export function validateLayout(layout: LayoutDimensions): string | null {
  if (layout.overflows) {
    return 'データが多すぎてページに収まりません。学歴・職歴または免許・資格の数を減らしてください。';
  }
  return null;
}
