/**
 * Rirekisho (履歴書) Generator
 * Based on 厚生労働省 履歴書様式例 format
 *
 * This module generates a two-page rirekisho in landscape orientation.
 * The layout is calculated to ensure the bottom edges of the left and right
 * pages align perfectly.
 */

import { buildLeftPage, buildRightPage } from './components.js';
import {
  buildHistoryData,
  buildLicenseData,
  countDataRows,
  extractPersonalInfo,
  getSectionList,
  getSectionText,
  getTodayDate,
} from './data.js';
import { calculateLayout, validateLayout } from './layout.js';
import { generateCSS } from './styles.js';
import type { RirekishoInput, RirekishoOptions } from './types.js';

// Re-export types for external use
export type { RirekishoInput, RirekishoOptions } from './types.js';

/**
 * Generate HTML for a rirekisho document
 *
 * @param input - The input data containing metadata and sections
 * @param options - Generation options including paper size and chronological order
 * @returns Complete HTML document string
 * @throws Error if the data cannot fit on the page
 */
export function generateRirekishoHTML(
  input: RirekishoInput,
  options: RirekishoOptions,
): string {
  const order = options.chronologicalOrder ?? 'asc';
  const hideMotivation = options.hideMotivation ?? false;
  const today = new Date();
  const todayDate = getTodayDate();

  // Count data rows for layout calculation
  const dataCounts = countDataRows(input.sections);

  // Calculate layout dimensions
  const layout = calculateLayout({
    paperSize: options.paperSize,
    hideMotivation,
    dataCounts,
  });

  // Validate layout can fit the data
  const validationError = validateLayout(layout);
  if (validationError) {
    throw new Error(validationError);
  }

  // Extract data
  const info = extractPersonalInfo(input.metadata, today);
  const history = buildHistoryData(input.sections, order);
  const license = buildLicenseData(input.sections, order);
  const motivation = getSectionText(input.sections, ['motivation']);
  const competencies = getSectionList(input.sections, ['competencies']);
  const notes = getSectionText(input.sections, ['notes']);

  // Generate HTML with full-width footer
  const customStylesHtml = options.customStylesheet
    ? `<style class="custom-styles">${options.customStylesheet}</style>`
    : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${info.name} - 履歴書</title>
  <style class="default-styles">${generateCSS(layout)}</style>
  ${customStylesHtml}
</head>
<body class="rirekisho">
  <div class="spread">
    <main class="spread-content">
      ${buildLeftPage({ layout, info, history, today: todayDate, photoDataUri: options.photoDataUri })}
      ${buildRightPage({ layout, history, license, motivation, competencies, notes })}
    </main>
    <footer class="spread-footer">
      ※「性別」欄：記載は任意です。未記載とすることも可能です。
    </footer>
  </div>
</body>
</html>`;
}
