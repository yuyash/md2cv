/**
 * CSS styles for Rirekisho (履歴書)
 */

import type { LayoutDimensions } from './types.js';

// ============================================================================
// Utility Functions
// ============================================================================

function mm(value: number): string {
  return `${value}mm`;
}

function pt(value: number): string {
  return `${value}pt`;
}

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Generate complete CSS for the rirekisho document
 */
export function generateCSS(layout: LayoutDimensions): string {
  const {
    paper,
    scale,
    margin,
    marginBottom,
    centerGap,
    pageWidth,
    pageHeight,
    footerHeight,
  } = layout;

  // Content area height (excluding footer)
  const contentHeight = pageHeight - footerHeight;

  return `
/* CSS Custom Properties for external customization */
:root {
  --rirekisho-font-family: "Noto Serif JP", "Hiragino Mincho Pro", "Yu Mincho", "MS Mincho", serif;
  --rirekisho-font-size-base: ${pt(10 * scale)};
  --rirekisho-font-size-title: ${pt(22 * scale)};
  --rirekisho-font-size-name: ${pt(16 * scale)};
  --rirekisho-font-size-address: ${pt(12 * scale)};
  --rirekisho-font-size-normal: ${pt(10 * scale)};
  --rirekisho-font-size-small: ${pt(8 * scale)};
  --rirekisho-font-size-xs: ${pt(7 * scale)};
  --rirekisho-font-size-xxs: ${pt(6 * scale)};
  --rirekisho-color-text: #000;
  --rirekisho-color-background: #fff;
  --rirekisho-color-border: #000;
  --rirekisho-border-width: 0.5pt;
}

/* Reset & Base */
@page {
  size: ${mm(paper.width)} ${mm(paper.height)} landscape;
  margin: 0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  font-family: var(--rirekisho-font-family);
  font-size: var(--rirekisho-font-size-base);
  color: var(--rirekisho-color-text);
  background: transparent;
}

/* Layout - landscape orientation */
.spread {
  width: ${mm(paper.width)};
  height: ${mm(paper.height)};
  display: flex;
  flex-direction: column;
  padding: ${mm(margin)} ${mm(margin)} ${mm(marginBottom)} ${mm(margin)};
  overflow: hidden;
  background: var(--rirekisho-color-background);
  box-shadow: 0 2mm 12mm rgba(0, 0, 0, 0.5);
}

.spread-content {
  display: flex;
  flex: 1;
  height: ${mm(contentHeight)};
}

.spread-footer {
  height: ${mm(footerHeight)};
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: var(--rirekisho-font-size-xxs);
}

.page {
  width: ${mm(pageWidth)};
  height: ${mm(contentHeight)};
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.page--left {
  margin-right: ${mm(centerGap / 2)};
}

.page--right {
  margin-left: ${mm(centerGap / 2)};
}

/* History container on left page - fills remaining space */
.history-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.history-container .table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.history-container table {
  flex: 1;
}

/* Typography */
.text--title {
  font-size: var(--rirekisho-font-size-title);
  letter-spacing: ${mm(6 * scale)};
  font-weight: bold;
}

.text--name {
  font-size: var(--rirekisho-font-size-name);
}

.text--address {
  font-size: var(--rirekisho-font-size-address);
}

.text--normal {
  font-size: var(--rirekisho-font-size-normal);
}

.text--small {
  font-size: var(--rirekisho-font-size-small);
}

.text--xs {
  font-size: var(--rirekisho-font-size-xs);
}

.text--xxs {
  font-size: var(--rirekisho-font-size-xxs);
}

.text--bold {
  font-weight: bold;
}

/* Alignment */
.align--center {
  text-align: center;
}

.align--left {
  text-align: left;
}

.align--right {
  text-align: right;
}

.valign--top {
  vertical-align: top;
}

.valign--middle {
  vertical-align: middle;
}

/* Borders */
.border {
  border: var(--rirekisho-border-width) solid var(--rirekisho-color-border);
}

/* Spacing */
.pad {
  padding: ${mm(1 * scale)} ${mm(2 * scale)};
}

.pad--sm {
  padding: ${mm(1 * scale)};
}

.mt--sm {
  margin-top: ${mm(layout.tableMargin)};
}

/* Flex utilities */
.flex {
  display: flex;
}

.flex--col {
  flex-direction: column;
}

.flex--1 {
  flex: 1;
}

.flex--center {
  align-items: center;
}

.flex--start {
  align-items: flex-start;
}

.flex--between {
  justify-content: space-between;
}

.flex--end {
  align-items: flex-end;
}

/* Tables */
.table-wrapper {
  display: block;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td, th {
  border: var(--rirekisho-border-width) solid var(--rirekisho-color-border);
  padding: 0;
  vertical-align: middle;
  font-weight: normal;
}

.col--year {
  width: ${mm(layout.yearColumnWidth)};
}

.col--month {
  width: ${mm(layout.monthColumnWidth)};
}

/* Cell component */
.cell {
  display: flex;
  align-items: center;
  border: var(--rirekisho-border-width) solid var(--rirekisho-color-border);
  min-height: ${mm(7 * scale)};
}

.cell__label {
  width: ${mm(14 * scale)};
  font-size: var(--rirekisho-font-size-xs);
  text-align: center;
  flex-shrink: 0;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell__value {
  flex: 1;
  padding: ${mm(1 * scale)} ${mm(2 * scale)};
}

/* Photo box */
.photo-box {
  width: ${mm(30 * scale)};
  height: ${mm(40 * scale)};
  border: var(--rirekisho-border-width) dashed var(--rirekisho-color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: var(--rirekisho-font-size-xxs);
  line-height: 1.4;
  text-align: center;
  padding-top: ${mm(2 * scale)};
  overflow: hidden;
}

/* Photo box with image */
.photo-box--with-image {
  padding: 0;
  border: var(--rirekisho-border-width) solid var(--rirekisho-color-border);
}

.photo-box--with-image img {
  display: block;
}

/* Section boxes */
.section-box {
  border: var(--rirekisho-border-width) solid var(--rirekisho-color-border);
  display: flex;
  flex-direction: column;
}

.section-box__header {
  padding: ${mm(1 * scale)};
  border-bottom: var(--rirekisho-border-width) solid var(--rirekisho-color-border);
  font-size: var(--rirekisho-font-size-normal);
  flex-shrink: 0;
}

.section-box__content {
  padding: ${mm(2 * scale)};
  flex: 1;
}

/* Motivation container - 60% of flexible space */
.motivation-container {
  flex: 6;
  display: flex;
  flex-direction: column;
}

.motivation-container .section-box {
  flex: 1;
}

/* Notes container - 40% of flexible space to align with left page */
.notes-container {
  flex: 4;
  display: flex;
  flex-direction: column;
}

.notes-container .section-box {
  flex: 1;
}

/* Print & Screen media */
@media print {
  html, body {
    width: ${mm(paper.width)};
    height: ${mm(paper.height)};
    overflow: hidden !important;
    max-height: ${mm(paper.height)} !important;
  }

  * {
    page-break-inside: avoid;
  }

  .spread {
    page-break-after: always;
    page-break-before: avoid;
    box-shadow: none;
  }
}

@media screen {
  html {
    background: #888;
  }

  body {
    background: transparent;
    display: inline-block;
    margin: 0;
    padding: 0;
  }
}
`;
}
