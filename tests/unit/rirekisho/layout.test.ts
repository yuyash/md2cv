/**
 * Unit tests for rirekisho/layout.ts
 */

import { describe, expect, it } from 'vitest';
import {
  calculateLayout,
  validateLayout,
} from '../../../src/generator/rirekisho/layout.js';
import type {
  LayoutDimensions,
  LayoutInput,
  PaperSize,
} from '../../../src/generator/rirekisho/types.js';
import {
  FIXED_DIMENSIONS,
  FONT_SIZE,
  PAPER_SIZES,
  PREFERRED_ROW_COUNTS,
  ROW_HEIGHT,
  SCALE_FACTORS,
} from '../../../src/generator/rirekisho/types.js';

describe('rirekisho/layout', () => {
  describe('calculateLayout', () => {
    const createInput = (
      paperSize: PaperSize,
      historyDataRows: number,
      licenseDataRows: number,
      hideMotivation = false,
    ): LayoutInput => ({
      paperSize,
      hideMotivation,
      dataCounts: { historyDataRows, licenseDataRows },
    });

    describe('paper dimensions', () => {
      it.each(['a3', 'a4', 'b4', 'b5', 'letter'] as PaperSize[])(
        'should return correct paper dimensions for %s',
        (paperSize) => {
          const input = createInput(paperSize, 0, 0);
          const layout = calculateLayout(input);

          expect(layout.paper).toEqual(PAPER_SIZES[paperSize]);
          expect(layout.scale).toBe(SCALE_FACTORS[paperSize]);
        },
      );
    });

    describe('page dimensions', () => {
      it('should calculate page dimensions correctly for A3', () => {
        const input = createInput('a3', 0, 0);
        const layout = calculateLayout(input);
        const scale = SCALE_FACTORS.a3;

        expect(layout.margin).toBe(FIXED_DIMENSIONS.margin * scale);
        expect(layout.marginBottom).toBe(FIXED_DIMENSIONS.marginBottom * scale);
        expect(layout.centerGap).toBe(FIXED_DIMENSIONS.centerGap * scale);
        expect(layout.footerHeight).toBe(FIXED_DIMENSIONS.footerHeight * scale);
      });

      it('should calculate page width as half of available width', () => {
        const input = createInput('a3', 0, 0);
        const layout = calculateLayout(input);

        const expectedPageWidth =
          (PAPER_SIZES.a3.width - layout.margin * 2 - layout.centerGap) / 2;
        expect(layout.pageWidth).toBeCloseTo(expectedPageWidth, 5);
      });

      it('should calculate page height correctly', () => {
        const input = createInput('a3', 0, 0);
        const layout = calculateLayout(input);

        const expectedPageHeight =
          PAPER_SIZES.a3.height - layout.margin - layout.marginBottom;
        expect(layout.pageHeight).toBeCloseTo(expectedPageHeight, 5);
      });
    });

    describe('header dimensions', () => {
      it('should scale header dimensions correctly', () => {
        const input = createInput('a4', 0, 0);
        const layout = calculateLayout(input);
        const scale = SCALE_FACTORS.a4;

        expect(layout.photoWidth).toBe(FIXED_DIMENSIONS.photoWidth * scale);
        expect(layout.contactWidth).toBe(FIXED_DIMENSIONS.contactWidth * scale);
        expect(layout.genderWidth).toBe(FIXED_DIMENSIONS.genderWidth * scale);
        expect(layout.headerHeight).toBe(FIXED_DIMENSIONS.headerHeight * scale);
        expect(layout.nameRowHeight).toBe(
          FIXED_DIMENSIONS.nameRowHeight * scale,
        );
        expect(layout.nameMainHeight).toBe(
          FIXED_DIMENSIONS.nameMainHeight * scale,
        );
        expect(layout.birthGenderHeight).toBe(
          FIXED_DIMENSIONS.birthGenderHeight * scale,
        );
        expect(layout.addressRowHeight).toBe(
          FIXED_DIMENSIONS.addressRowHeight * scale,
        );
        expect(layout.addressFuriganaHeight).toBe(
          FIXED_DIMENSIONS.addressFuriganaHeight * scale,
        );
      });
    });

    describe('table dimensions', () => {
      it('should use default row height when data fits', () => {
        const input = createInput('a3', 5, 3);
        const layout = calculateLayout(input);
        const scale = SCALE_FACTORS.a3;

        expect(layout.tableRowHeight).toBe(ROW_HEIGHT.default * scale);
        expect(layout.tableFontSize).toBe(FONT_SIZE.default * scale);
      });

      it('should scale column widths correctly', () => {
        const input = createInput('b4', 0, 0);
        const layout = calculateLayout(input);
        const scale = SCALE_FACTORS.b4;

        expect(layout.yearColumnWidth).toBe(
          FIXED_DIMENSIONS.yearColumnWidth * scale,
        );
        expect(layout.monthColumnWidth).toBe(
          FIXED_DIMENSIONS.monthColumnWidth * scale,
        );
      });
    });

    describe('row allocation', () => {
      it('should allocate preferred row counts when data is small', () => {
        const input = createInput('a3', 5, 3);
        const layout = calculateLayout(input);

        // With small data, should use preferred counts
        expect(layout.rightHistoryRows).toBeGreaterThanOrEqual(
          PREFERRED_ROW_COUNTS.a3.rightHistory,
        );
        expect(layout.licenseRows).toBeGreaterThanOrEqual(
          PREFERRED_ROW_COUNTS.a3.license,
        );
      });

      it('should calculate left history rows based on available space', () => {
        const input = createInput('a3', 0, 0);
        const layout = calculateLayout(input);

        // Left history rows should be positive
        expect(layout.leftHistoryRows).toBeGreaterThan(0);
      });

      it('should handle history overflow to right page', () => {
        // Large history data that overflows to right page
        const input = createInput('a4', 30, 3);
        const layout = calculateLayout(input);

        // Right history rows should accommodate overflow
        expect(layout.rightHistoryRows).toBeGreaterThan(0);
      });

      it('should handle large license data', () => {
        const input = createInput('a4', 5, 15);
        const layout = calculateLayout(input);

        // License rows should accommodate data
        expect(layout.licenseRows).toBeGreaterThanOrEqual(15);
      });
    });

    describe('section heights', () => {
      it('should calculate motivation height when not hidden', () => {
        const input = createInput('a3', 5, 3, false);
        const layout = calculateLayout(input);

        expect(layout.motivationMinHeight).toBeGreaterThan(0);
        expect(layout.hideMotivation).toBe(false);
      });

      it('should set motivation height to 0 when hidden', () => {
        const input = createInput('a3', 5, 3, true);
        const layout = calculateLayout(input);

        expect(layout.motivationMinHeight).toBe(0);
        expect(layout.hideMotivation).toBe(true);
      });

      it('should always have notes height', () => {
        const input = createInput('a3', 5, 3);
        const layout = calculateLayout(input);

        expect(layout.notesMinHeight).toBeGreaterThan(0);
      });
    });

    describe('table heights', () => {
      it('should calculate table heights based on row count and row height', () => {
        const input = createInput('a3', 5, 3);
        const layout = calculateLayout(input);

        // Table height = (dataRows + 1 header) * rowHeight
        const expectedLeftTableHeight =
          (layout.leftHistoryRows + 1) * layout.tableRowHeight;
        expect(layout.leftTableHeight).toBeCloseTo(expectedLeftTableHeight, 5);

        const expectedRightHistoryHeight =
          (layout.rightHistoryRows + 1) * layout.tableRowHeight;
        expect(layout.rightHistoryTableHeight).toBeCloseTo(
          expectedRightHistoryHeight,
          5,
        );

        const expectedLicenseHeight =
          (layout.licenseRows + 1) * layout.tableRowHeight;
        expect(layout.licenseTableHeight).toBeCloseTo(expectedLicenseHeight, 5);
      });
    });

    describe('overflow handling', () => {
      it('should not overflow with normal data', () => {
        const input = createInput('a3', 10, 5);
        const layout = calculateLayout(input);

        expect(layout.overflows).toBe(false);
      });

      it('should reduce row height for large data', () => {
        // Very large data that requires row height reduction
        const input = createInput('a4', 40, 15);
        const layout = calculateLayout(input);
        const scale = SCALE_FACTORS.a4;

        // Row height should be reduced from default
        expect(layout.tableRowHeight).toBeLessThanOrEqual(
          ROW_HEIGHT.default * scale,
        );
      });

      it('should reduce font size proportionally with row height', () => {
        const input = createInput('a4', 40, 15);
        const layout = calculateLayout(input);
        const scale = SCALE_FACTORS.a4;

        // If row height is reduced, font size should also be reduced
        if (layout.tableRowHeight < ROW_HEIGHT.default * scale) {
          expect(layout.tableFontSize).toBeLessThan(FONT_SIZE.default * scale);
        }
      });

      it('should set overflow flag when data exceeds capacity', () => {
        // Extremely large data that cannot fit even with minimum row height
        const input = createInput('b5', 100, 50);
        const layout = calculateLayout(input);

        // Should overflow with this much data on smallest paper
        expect(layout.overflows).toBe(true);
      });
    });

    describe('scale factors', () => {
      it('should apply scale factor to all dimensions', () => {
        const a3Layout = calculateLayout(createInput('a3', 5, 3));
        const a4Layout = calculateLayout(createInput('a4', 5, 3));

        // A4 dimensions should be smaller than A3
        expect(a4Layout.pageWidth).toBeLessThan(a3Layout.pageWidth);
        expect(a4Layout.pageHeight).toBeLessThan(a3Layout.pageHeight);
        expect(a4Layout.tableRowHeight).toBeLessThan(a3Layout.tableRowHeight);
      });
    });
  });

  describe('validateLayout', () => {
    const createLayout = (overflows: boolean): LayoutDimensions => {
      const input: LayoutInput = {
        paperSize: 'a3',
        hideMotivation: false,
        dataCounts: { historyDataRows: 5, licenseDataRows: 3 },
      };
      const layout = calculateLayout(input);
      return { ...layout, overflows };
    };

    it('should return null for valid layout', () => {
      const layout = createLayout(false);
      const result = validateLayout(layout);

      expect(result).toBeNull();
    });

    it('should return error message for overflow layout', () => {
      const layout = createLayout(true);
      const result = validateLayout(layout);

      expect(result).not.toBeNull();
      expect(result).toContain('データが多すぎて');
    });

    it('should return Japanese error message', () => {
      const layout = createLayout(true);
      const result = validateLayout(layout);

      expect(result).toBe(
        'データが多すぎてページに収まりません。学歴・職歴または免許・資格の数を減らしてください。',
      );
    });
  });
});
