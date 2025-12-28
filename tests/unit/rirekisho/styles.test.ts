/**
 * Unit tests for rirekisho/styles.ts
 */

import { describe, expect, it } from 'vitest';
import { calculateLayout } from '../../../src/generator/rirekisho/layout.js';
import { generateCSS } from '../../../src/generator/rirekisho/styles.js';
import type {
  LayoutDimensions,
  PaperSize,
} from '../../../src/generator/rirekisho/types.js';
import {
  PAPER_SIZES,
  SCALE_FACTORS,
} from '../../../src/generator/rirekisho/types.js';

describe('rirekisho/styles', () => {
  // Helper to create layout for testing
  const createTestLayout = (paperSize: PaperSize = 'a4'): LayoutDimensions =>
    calculateLayout({
      paperSize,
      hideMotivation: false,
      dataCounts: { historyDataRows: 10, licenseDataRows: 5 },
    });

  describe('generateCSS', () => {
    describe('@page rule', () => {
      it('should set correct page size for A3', () => {
        const layout = createTestLayout('a3');
        const css = generateCSS(layout);

        expect(css).toContain(
          `size: ${PAPER_SIZES.a3.width}mm ${PAPER_SIZES.a3.height}mm landscape`,
        );
      });

      it('should set correct page size for A4', () => {
        const layout = createTestLayout('a4');
        const css = generateCSS(layout);

        expect(css).toContain(
          `size: ${PAPER_SIZES.a4.width}mm ${PAPER_SIZES.a4.height}mm landscape`,
        );
      });

      it('should set margin to 0', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('@page');
        expect(css).toContain('margin: 0');
      });
    });

    describe('reset styles', () => {
      it('should include box-sizing border-box', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('box-sizing: border-box');
      });

      it('should include print color adjust', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('-webkit-print-color-adjust: exact');
        expect(css).toContain('print-color-adjust: exact');
      });
    });

    describe('body styles', () => {
      it('should set font family', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('font-family:');
        expect(css).toContain('Noto Serif JP');
      });

      it('should set scaled font size via CSS variable', () => {
        const layout = createTestLayout('a4');
        const css = generateCSS(layout);
        const scale = SCALE_FACTORS.a4;

        // Font size is now defined as CSS variable
        expect(css).toContain(`--rirekisho-font-size-base: ${10 * scale}pt`);
        expect(css).toContain('font-size: var(--rirekisho-font-size-base)');
      });
    });

    describe('spread layout', () => {
      it('should set spread dimensions', () => {
        const layout = createTestLayout('a4');
        const css = generateCSS(layout);

        expect(css).toContain(`width: ${PAPER_SIZES.a4.width}mm`);
        expect(css).toContain(`height: ${PAPER_SIZES.a4.height}mm`);
      });

      it('should set spread padding', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.spread {');
        expect(css).toContain('padding:');
      });

      it('should use flexbox for spread', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('display: flex');
        expect(css).toContain('flex-direction: column');
      });
    });

    describe('page styles', () => {
      it('should set page width', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.page {');
        expect(css).toContain(`width: ${layout.pageWidth}mm`);
      });

      it('should set page margins for left and right', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.page--left {');
        expect(css).toContain('.page--right {');
        expect(css).toContain(`margin-right: ${layout.centerGap / 2}mm`);
        expect(css).toContain(`margin-left: ${layout.centerGap / 2}mm`);
      });
    });

    describe('typography classes', () => {
      it('should define text size classes', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.text--title');
        expect(css).toContain('.text--name');
        expect(css).toContain('.text--address');
        expect(css).toContain('.text--normal');
        expect(css).toContain('.text--small');
        expect(css).toContain('.text--xs');
        expect(css).toContain('.text--xxs');
      });

      it('should scale typography sizes via CSS variables', () => {
        const layout = createTestLayout('a4');
        const css = generateCSS(layout);
        const scale = SCALE_FACTORS.a4;

        // Typography sizes are now defined as CSS variables
        expect(css).toContain(`--rirekisho-font-size-title: ${22 * scale}pt`);
        expect(css).toContain(`--rirekisho-font-size-name: ${16 * scale}pt`);
        expect(css).toContain('font-size: var(--rirekisho-font-size-title)');
        expect(css).toContain('font-size: var(--rirekisho-font-size-name)');
      });
    });

    describe('alignment classes', () => {
      it('should define alignment classes', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.align--center');
        expect(css).toContain('.align--left');
        expect(css).toContain('.align--right');
        expect(css).toContain('.valign--top');
        expect(css).toContain('.valign--middle');
      });

      it('should set correct text-align values', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('text-align: center');
        expect(css).toContain('text-align: left');
        expect(css).toContain('text-align: right');
      });
    });

    describe('flex utilities', () => {
      it('should define flex utility classes', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.flex {');
        expect(css).toContain('.flex--col');
        expect(css).toContain('.flex--1');
        expect(css).toContain('.flex--center');
        expect(css).toContain('.flex--start');
        expect(css).toContain('.flex--between');
        expect(css).toContain('.flex--end');
      });
    });

    describe('table styles', () => {
      it('should define table wrapper', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.table-wrapper');
      });

      it('should set table width to 100%', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('table {');
        expect(css).toContain('width: 100%');
      });

      it('should collapse table borders', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('border-collapse: collapse');
      });

      it('should define column width classes', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.col--year');
        expect(css).toContain('.col--month');
        expect(css).toContain(`width: ${layout.yearColumnWidth}mm`);
        expect(css).toContain(`width: ${layout.monthColumnWidth}mm`);
      });
    });

    describe('cell component styles', () => {
      it('should define cell styles', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.cell {');
        expect(css).toContain('.cell__label');
        expect(css).toContain('.cell__value');
      });

      it('should use flexbox for cell', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        // Check that .cell uses flex
        const cellMatch = css.match(/\.cell \{[^}]+\}/);
        expect(cellMatch).not.toBeNull();
        expect(cellMatch![0]).toContain('display: flex');
      });
    });

    describe('photo box styles', () => {
      it('should define photo box', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.photo-box');
      });

      it('should set photo box dimensions', () => {
        const layout = createTestLayout('a4');
        const css = generateCSS(layout);
        const scale = SCALE_FACTORS.a4;

        expect(css).toContain(`width: ${30 * scale}mm`);
        expect(css).toContain(`height: ${40 * scale}mm`);
      });

      it('should use dashed border via CSS variable', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        // Border uses CSS variable for width
        expect(css).toContain(
          'var(--rirekisho-border-width) dashed var(--rirekisho-color-border)',
        );
      });

      it('should define photo-box--with-image class', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.photo-box--with-image');
      });

      it('should use solid border for photo-box--with-image via CSS variable', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        // Check that photo-box--with-image has solid border using CSS variable
        expect(css).toContain('.photo-box--with-image');
        expect(css).toContain(
          'var(--rirekisho-border-width) solid var(--rirekisho-color-border)',
        );
      });
    });

    describe('section box styles', () => {
      it('should define section box', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.section-box');
        expect(css).toContain('.section-box__header');
        expect(css).toContain('.section-box__content');
      });

      it('should use flexbox for section box', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        // Check section-box uses flex column
        expect(css).toContain('flex-direction: column');
      });
    });

    describe('container styles', () => {
      it('should define history container', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.history-container');
      });

      it('should define motivation container', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.motivation-container');
      });

      it('should define notes container', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('.notes-container');
      });
    });

    describe('print media query', () => {
      it('should include print media query', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('@media print');
      });

      it('should set page break rules', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('page-break-inside: avoid');
        expect(css).toContain('page-break-after: always');
      });

      it('should set overflow hidden for print', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('overflow: hidden');
      });
    });

    describe('screen media query', () => {
      it('should include screen media query', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('@media screen');
      });

      it('should set background color for screen', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('background: #888');
      });

      it('should add box shadow for screen', () => {
        const layout = createTestLayout();
        const css = generateCSS(layout);

        expect(css).toContain('box-shadow:');
      });
    });

    describe('scale consistency', () => {
      it('should scale all dimensions consistently for different paper sizes', () => {
        const a3Css = generateCSS(createTestLayout('a3'));
        const a4Css = generateCSS(createTestLayout('a4'));
        const b4Css = generateCSS(createTestLayout('b4'));

        // Each should have different page sizes
        expect(a3Css).toContain(`${PAPER_SIZES.a3.width}mm`);
        expect(a4Css).toContain(`${PAPER_SIZES.a4.width}mm`);
        expect(b4Css).toContain(`${PAPER_SIZES.b4.width}mm`);
      });
    });
  });
});
