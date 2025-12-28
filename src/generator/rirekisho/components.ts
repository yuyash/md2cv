/**
 * HTML components for Rirekisho (履歴書)
 */

import type {
  HistoryRow,
  LayoutDimensions,
  PersonalInfo,
  TodayDate,
} from './types.js';

// ============================================================================
// Utility Functions
// ============================================================================

function mm(value: number): string {
  return `${value}mm`;
}

function pt(value: number): string {
  return `${value}pt`;
}

/**
 * Calculate optimal font size for text to fit in cell
 * @param text - The text to fit
 * @param cellWidthMm - Available cell width in mm
 * @param scale - Scale factor for the paper size
 * @param options - Optional configuration
 */
function calculateFontSize(
  text: string,
  cellWidthMm: number,
  scale: number,
  options: {
    maxFontPt?: number;
    minFontPt?: number;
    paddingMm?: number;
    charWidthFactor?: number; // mm per character at 1pt font
  } = {},
): number {
  const {
    maxFontPt = 10 * scale,
    minFontPt = 6 * scale,
    paddingMm = 4,
    charWidthFactor = 0.35, // Japanese characters are wider
  } = options;

  if (!text || text.length === 0) {
    return maxFontPt;
  }

  const availableWidthMm = cellWidthMm - paddingMm;
  // Estimate: each character needs (charWidthFactor * fontSize) mm
  const requiredFontPt = availableWidthMm / (text.length * charWidthFactor);
  return Math.max(minFontPt, Math.min(maxFontPt, requiredFontPt));
}

// ============================================================================
// Header Components
// ============================================================================

export interface HeaderProps {
  readonly layout: LayoutDimensions;
  readonly today: TodayDate;
}

export function buildHeader({ layout, today }: HeaderProps): string {
  const { photoWidth, scale } = layout;
  return `
    <div class="flex flex--between flex--end" style="margin-bottom: ${mm(1.5 * scale)}">
      <span class="text--title">履歴書</span>
      <span style="margin-right: ${mm(photoWidth)}; font-size: ${pt(9 * scale)}">
        ${today.year} 年 ${today.month} 月 ${today.day} 日現在
      </span>
    </div>
  `;
}

// ============================================================================
// Name Section Components
// ============================================================================

export interface NameSectionProps {
  readonly layout: LayoutDimensions;
  readonly info: PersonalInfo;
}

export function buildNameSection({ layout, info }: NameSectionProps): string {
  const { photoWidth, nameMainHeight, scale, pageWidth } = layout;
  const nameRowStyle = `margin-right: ${mm(photoWidth)}`;

  // Calculate available width for name/furigana (pageWidth - photoWidth - label width - padding)
  const labelWidthMm = 14 * scale;
  const availableWidthMm = pageWidth - photoWidth - labelWidthMm - 4 * scale;

  // Calculate font sizes based on text length
  const furiganaFontSize = calculateFontSize(
    info.furigana,
    availableWidthMm,
    scale,
    {
      maxFontPt: 8 * scale,
      minFontPt: 5 * scale,
      paddingMm: 4 * scale,
    },
  );
  const nameFontSize = calculateFontSize(info.name, availableWidthMm, scale, {
    maxFontPt: 16 * scale,
    minFontPt: 10 * scale,
    paddingMm: 4 * scale,
  });

  return `
    <div class="cell" style="${nameRowStyle}; border-bottom: none">
      <div class="cell__label">ふりがな</div>
      <div class="cell__value" style="font-size: ${pt(furiganaFontSize)}">${info.furigana}</div>
    </div>
    <div class="cell" style="height: ${mm(nameMainHeight)}; ${nameRowStyle}; border-bottom: none">
      <div class="cell__label" style="align-self: flex-start; padding-top: ${mm(1 * scale)}">氏&#x3000;名</div>
      <div class="cell__value" style="font-size: ${pt(nameFontSize)}">${info.name}</div>
    </div>
  `;
}

// ============================================================================
// Birth/Gender Row Component
// ============================================================================

export interface BirthGenderRowProps {
  readonly layout: LayoutDimensions;
  readonly info: PersonalInfo;
}

export function buildBirthGenderRow({
  layout,
  info,
}: BirthGenderRowProps): string {
  const { photoWidth, scale, genderWidth } = layout;
  const rowStyle = `margin-right: ${mm(photoWidth)}`;

  const dobYear = info.dob?.year ?? '&#x3000;&#x3000;&#x3000;&#x3000;';
  const dobMonth = info.dob?.month ?? '&#x3000;&#x3000;';
  const dobDay = info.dob?.day ?? '&#x3000;&#x3000;';
  const ageDisplay = info.age !== null ? String(info.age) : '&#x3000;&#x3000;';

  return `
    <div class="cell flex" style="${rowStyle}; padding: 0; border-bottom: none">
      <div class="cell__label"></div>
      <div class="cell__value flex flex--center" style="font-size: ${pt(9 * scale)}">
        <span>${dobYear} 年 ${dobMonth} 月 ${dobDay} 日生（満 ${ageDisplay} 歳）</span>
      </div>
      <div style="width: ${mm(genderWidth)}; border-left: 0.5pt solid #000; display: flex; align-items: center; padding: 0 ${mm(2 * scale)}; align-self: stretch">
        <span class="text--xs">※性別</span>
        <span class="text--small" style="margin-left: ${mm(2 * scale)}">${info.gender}</span>
      </div>
    </div>
  `;
}

// ============================================================================
// Address Row Component
// ============================================================================

export interface AddressRowProps {
  readonly layout: LayoutDimensions;
  readonly info: PersonalInfo;
  readonly isPrimary: boolean;
}

export function buildAddressRow({
  layout,
  info,
  isPrimary,
}: AddressRowProps): string {
  const {
    contactWidth,
    scale,
    addressRowHeight,
    addressFuriganaHeight,
    pageWidth,
    photoWidth,
  } = layout;
  const address = isPrimary ? info.address : info.address2;
  const addressFurigana = isPrimary
    ? info.addressFurigana
    : info.address2Furigana;
  const postCode = isPrimary ? info.postCode : info.postCode2;
  const phone = isPrimary ? info.phone : info.phone2;
  const email = isPrimary ? info.email : info.email2;

  // Calculate available width for address (pageWidth - contactWidth - label - padding)
  const addressAvailableWidth =
    pageWidth - photoWidth - contactWidth - 12 * scale;

  // Calculate font sizes
  const addressFuriganaFontSize = calculateFontSize(
    addressFurigana || '',
    addressAvailableWidth,
    scale,
    {
      maxFontPt: 8 * scale,
      minFontPt: 5 * scale,
      paddingMm: 4 * scale,
    },
  );
  const addressFontSize = calculateFontSize(
    address || '',
    addressAvailableWidth,
    scale,
    {
      maxFontPt: 12 * scale,
      minFontPt: 7 * scale,
      paddingMm: 4 * scale,
    },
  );
  const phoneFontSize = calculateFontSize(phone || '', contactWidth, scale, {
    maxFontPt: 8 * scale,
    minFontPt: 5 * scale,
    paddingMm: 4 * scale,
    charWidthFactor: 0.22,
  });
  const emailFontSize = calculateFontSize(email || '', contactWidth, scale, {
    maxFontPt: 9 * scale,
    minFontPt: 3 * scale, // Allow smaller font for long emails
    paddingMm: 4 * scale, // Left/right padding
    charWidthFactor: 0.22, // Slightly larger factor for better fit estimation
  });

  const label = isPrimary ? '現住所' : '連絡先';

  const note = isPrimary
    ? ''
    : `<span class="text--xxs" style="position: absolute; top: ${mm(1 * scale)}; right: ${mm(2 * scale)}">（現住所以外に連絡を希望する場合のみ記入）</span>`;

  // 現住所は下の罫線なし（連絡先と重複を避ける）、連絡先は下の罫線あり
  const bottomBorder = isPrimary ? 'border-bottom: none' : '';

  return `
    <div class="flex" style="height: ${mm(addressRowHeight)}">
      <div style="flex: 1; display: flex; flex-direction: column; border: 0.5pt solid #000; ${bottomBorder}">
        <div class="flex" style="width: 100%; height: ${mm(addressFuriganaHeight)}; border-bottom: 0.5pt solid #ccc; align-items: center">
          <div class="cell__label text--xs" style="padding-left: ${mm(2 * scale)}; align-items: center; justify-content: flex-start">ふりがな</div>
          <div class="cell__value" style="font-size: ${pt(addressFuriganaFontSize)}">${addressFurigana}</div>
        </div>
        <div class="flex flex--col" style="width: 100%; flex: 1; position: relative">
          <div class="flex flex--center" style="padding: ${mm(1 * scale)} 0 0 ${mm(2 * scale)}">
            <span class="text--xs">${label}</span>
            <span class="text--xs" style="margin-left: ${mm(4 * scale)}">〒${postCode}</span>
            ${note}
          </div>
          <div class="flex--1 flex flex--center" style="padding: 0 ${mm(2 * scale)} 0 ${mm(10 * scale)}; font-size: ${pt(addressFontSize)}">${address}</div>
        </div>
      </div>
      <div style="width: ${mm(contactWidth)}; border: 0.5pt solid #000; border-left: none; ${bottomBorder}; display: flex; flex-direction: column">
        <div style="height: ${mm(addressFuriganaHeight)}; border-bottom: 0.5pt solid #ccc; display: flex; align-items: center; justify-content: center; position: relative">
          <span class="text--xs" style="position: absolute; top: 50%; left: ${mm(1 * scale)}; transform: translateY(-50%)">電話</span>
          <span style="font-size: ${pt(phoneFontSize)}">${phone}</span>
        </div>
        <div class="flex--1 flex flex--center" style="justify-content: center; position: relative; padding: 0 ${mm(2 * scale)}">
          <span class="text--xs" style="position: absolute; top: ${mm(1 * scale)}; left: ${mm(1 * scale)}">E-mail</span>
          <span style="font-size: ${pt(emailFontSize)}; text-align: center; word-break: break-all; padding-top: ${mm(3 * scale)}">${email}</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// Photo Box Component
// ============================================================================

export interface PhotoBoxProps {
  readonly layout: LayoutDimensions;
  /** Base64 encoded photo data URI */
  readonly photoDataUri?: string | undefined;
}

export function buildPhotoBox({ layout, photoDataUri }: PhotoBoxProps): string {
  const { photoWidth, scale } = layout;

  // If photo is provided, show the image
  if (photoDataUri) {
    return `
      <div style="position: absolute; right: 0; top: ${mm(-9 * scale)}; width: ${mm(photoWidth)}">
        <div class="photo-box photo-box--with-image" style="margin: 0 auto">
          <img src="${photoDataUri}" alt="証明写真" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      </div>
    `;
  }

  // Default: show instructions
  return `
    <div style="position: absolute; right: 0; top: ${mm(-9 * scale)}; width: ${mm(photoWidth)}">
      <div class="photo-box" style="margin: 0 auto">
        <div style="margin-bottom: ${mm(1 * scale)}">写真をはる位置</div>
        <div style="font-size: ${pt(5.5 * scale)}; line-height: 1.5">
          写真を貼る必要が<br>ある場合<br>
          1. 縦 36〜40mm<br>横 24〜30mm<br>
          2. 本人単身胸から上<br>
          3. 裏面のりづけ
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// History Table Component
// ============================================================================

export interface HistoryTableProps {
  readonly layout: LayoutDimensions;
  readonly data: readonly HistoryRow[];
  readonly rowCount: number;
  readonly title: string;
  readonly height?: number;
}

export function buildHistoryTable({
  layout,
  data,
  rowCount,
  title,
  height,
}: HistoryTableProps): string {
  const { tableRowHeight, tableFontSize } = layout;

  const headerRow = `
    <tr style="height: ${mm(tableRowHeight)}">
      <td class="align--center" style="font-size: ${pt(tableFontSize)}">年</td>
      <td class="align--center" style="font-size: ${pt(tableFontSize)}">月</td>
      <td class="align--center" style="font-size: ${pt(tableFontSize)}">${title}</td>
    </tr>
  `;

  const dataRows = Array.from({ length: rowCount }, (_, i) => {
    const d = data[i];
    const content = d?.[2] ?? '';

    let alignClass = 'align--left pad';
    if (content === '学歴' || content === '職歴') {
      alignClass = 'align--center';
    } else if (content === '以上' || content === '現在に至る') {
      alignClass = 'align--right pad';
    }

    return `
      <tr style="height: ${mm(tableRowHeight)}">
        <td class="col--year align--center valign--middle" style="font-size: ${pt(tableFontSize)}">${d?.[0] ?? ''}</td>
        <td class="col--month align--center valign--middle" style="font-size: ${pt(tableFontSize)}">${d?.[1] ?? ''}</td>
        <td class="${alignClass} valign--middle" style="font-size: ${pt(tableFontSize)}">${content}</td>
      </tr>
    `;
  }).join('');

  const heightStyle = height !== undefined ? `height: ${mm(height)};` : '';

  return `
    <div class="table-wrapper" style="${heightStyle}">
      <table>
        <colgroup>
          <col class="col--year">
          <col class="col--month">
          <col>
        </colgroup>
        ${headerRow}
        ${dataRows}
      </table>
    </div>
  `;
}

// ============================================================================
// License Table Component
// ============================================================================

export interface LicenseTableProps {
  readonly layout: LayoutDimensions;
  readonly data: readonly HistoryRow[];
  readonly height?: number;
}

export function buildLicenseTable({
  layout,
  data,
  height,
}: LicenseTableProps): string {
  const { licenseRows: rowCount, tableRowHeight, tableFontSize } = layout;

  const headerRow = `
    <tr style="height: ${mm(tableRowHeight)}">
      <td class="align--center" style="font-size: ${pt(tableFontSize)}">年</td>
      <td class="align--center" style="font-size: ${pt(tableFontSize)}">月</td>
      <td class="align--center" style="font-size: ${pt(tableFontSize)}">免許・資格</td>
    </tr>
  `;

  const dataRows = Array.from({ length: rowCount }, (_, i) => {
    const d = data[i];

    return `
      <tr style="height: ${mm(tableRowHeight)}">
        <td class="col--year align--center valign--middle" style="font-size: ${pt(tableFontSize)}">${d?.[0] ?? ''}</td>
        <td class="col--month align--center valign--middle" style="font-size: ${pt(tableFontSize)}">${d?.[1] ?? ''}</td>
        <td class="align--left pad valign--middle" style="font-size: ${pt(tableFontSize)}">${d?.[2] ?? ''}</td>
      </tr>
    `;
  }).join('');

  const heightStyle = height !== undefined ? `height: ${mm(height)};` : '';

  return `
    <div class="table-wrapper" style="${heightStyle}">
      <table>
        <colgroup>
          <col class="col--year">
          <col class="col--month">
          <col>
        </colgroup>
        ${headerRow}
        ${dataRows}
      </table>
    </div>
  `;
}

// ============================================================================
// Section Box Component
// ============================================================================

export interface SectionBoxProps {
  readonly layout: LayoutDimensions;
  readonly title: string;
  readonly subtitle?: string;
  readonly content: string;
  readonly listItems?: readonly string[];
  readonly height?: number;
  readonly minHeight?: number;
}

export function buildSectionBox({
  layout,
  title,
  subtitle,
  content,
  listItems,
  height,
  minHeight,
}: SectionBoxProps): string {
  const { scale } = layout;
  const subtitleHtml = subtitle
    ? `<span style="font-size: ${pt(8 * scale)}">${subtitle}</span>`
    : '';

  let containerStyle = '';
  if (height !== undefined) {
    containerStyle = `height: ${mm(height)}`;
  } else if (minHeight !== undefined) {
    containerStyle = `min-height: ${mm(minHeight)}`;
  }

  // Build list HTML if listItems provided
  let listHtml = '';
  if (listItems && listItems.length > 0) {
    const items = listItems.map((item) => `<li>${item}</li>`).join('');
    listHtml = `<ul style="margin: ${mm(1 * scale)} 0 0 ${mm(8 * scale)}; padding: 0; list-style-type: disc;">${items}</ul>`;
  }

  return `
    <div class="section-box" style="${containerStyle}">
      <div class="section-box__header">${title}${subtitleHtml}</div>
      <div class="section-box__content text--small">${content}${listHtml}</div>
    </div>
  `;
}

// ============================================================================
// Page Components
// ============================================================================

export interface LeftPageProps {
  readonly layout: LayoutDimensions;
  readonly info: PersonalInfo;
  readonly history: readonly HistoryRow[];
  readonly today: TodayDate;
  /** Base64 encoded photo data URI */
  readonly photoDataUri?: string | undefined;
}

/**
 * Check if "職歴" label is at the last row of left page
 * If so, we need to move it to the right page
 */
function shouldMoveShokurekiToRightPage(
  history: readonly HistoryRow[],
  leftHistoryRows: number,
): boolean {
  // Get the data that would be on the left page
  const leftPageData = history.slice(0, leftHistoryRows);
  if (leftPageData.length === 0) return false;

  // Check if the last row is "職歴"
  const lastRow = leftPageData[leftPageData.length - 1];
  return lastRow?.[2] === '職歴';
}

/**
 * Get adjusted history data for left and right pages
 * If "職歴" is at the last row of left page, leave an empty row instead
 */
export function getAdjustedHistoryData(
  history: readonly HistoryRow[],
  leftHistoryRows: number,
): {
  leftData: readonly HistoryRow[];
  rightData: readonly HistoryRow[];
  shokurekiMovedToRight: boolean;
} {
  const shouldMove = shouldMoveShokurekiToRightPage(history, leftHistoryRows);

  if (shouldMove) {
    // Find the index of "職歴" in the history
    const shokurekiIndex = history.findIndex((row) => row[2] === '職歴');
    if (shokurekiIndex >= 0 && shokurekiIndex < leftHistoryRows) {
      // Left page: everything before "職歴" (leave empty row at the end)
      const leftData = history.slice(0, shokurekiIndex);
      // Right page: "職歴" and everything after
      const rightData = history.slice(shokurekiIndex);
      return { leftData, rightData, shokurekiMovedToRight: true };
    }
  }

  // Normal case: split at leftHistoryRows
  return {
    leftData: history.slice(0, leftHistoryRows),
    rightData: history.slice(leftHistoryRows),
    shokurekiMovedToRight: false,
  };
}

export function buildLeftPage({
  layout,
  info,
  history,
  today,
  photoDataUri,
}: LeftPageProps): string {
  const { leftHistoryRows, tableMargin } = layout;

  // Get adjusted data (may have "職歴" moved to right page)
  const { leftData } = getAdjustedHistoryData(history, leftHistoryRows);

  return `
    <div class="page page--left">
      ${buildHeader({ layout, today })}
      <div class="flex" style="position: relative">
        <div style="flex: 1">
          ${buildNameSection({ layout, info })}
          ${buildBirthGenderRow({ layout, info })}
          ${buildAddressRow({ layout, info, isPrimary: true })}
          ${buildAddressRow({ layout, info, isPrimary: false })}
        </div>
        ${buildPhotoBox({ layout, photoDataUri })}
      </div>
      <div class="history-container" style="margin-top: ${mm(tableMargin)}">
        ${buildHistoryTable({
          layout,
          data: leftData,
          rowCount: leftHistoryRows,
          title: '学 歴 ・ 職 歴',
        })}
      </div>
    </div>
  `;
}

export interface RightPageProps {
  readonly layout: LayoutDimensions;
  readonly history: readonly HistoryRow[];
  readonly license: readonly HistoryRow[];
  readonly motivation: string;
  readonly competencies: readonly string[];
  readonly notes: string;
}

export function buildRightPage({
  layout,
  history,
  license,
  motivation,
  competencies,
  notes,
}: RightPageProps): string {
  const {
    leftHistoryRows,
    rightHistoryRows,
    rightHistoryTableHeight,
    licenseTableHeight,
    motivationMinHeight,
    hideMotivation,
    tableMargin,
  } = layout;

  // Get adjusted data (may have "職歴" moved to right page)
  const { rightData, shokurekiMovedToRight } = getAdjustedHistoryData(
    history,
    leftHistoryRows,
  );

  // Build history continuation section (only if there are rows to show)
  const historySection =
    rightHistoryRows > 0 || shokurekiMovedToRight
      ? `<div style="margin-bottom: ${mm(tableMargin)}">
          ${buildHistoryTable({
            layout,
            data: rightData,
            rowCount: Math.max(rightHistoryRows, rightData.length),
            title: '学歴・職歴',
            height: rightHistoryTableHeight,
          })}
        </div>`
      : '';

  // Build motivation section with calculated height
  const motivationSection = hideMotivation
    ? ''
    : `
      <div style="margin-bottom: ${mm(tableMargin)}; height: ${mm(motivationMinHeight)}">
        ${buildSectionBox({
          layout,
          title: '志望の動機、特技、自己PR、アピールポイントなど',
          content: motivation,
          listItems: competencies,
          height: motivationMinHeight,
        })}
      </div>
    `;

  // License table margin: use margin-top only when history section doesn't exist
  const licenseMarginTop =
    rightHistoryRows > 0 || shokurekiMovedToRight ? 0 : tableMargin;

  return `
    <div class="page page--right">
      ${historySection}
      <div style="margin-top: ${mm(licenseMarginTop)}; margin-bottom: ${mm(tableMargin)}">
        ${buildLicenseTable({
          layout,
          data: license,
          height: licenseTableHeight,
        })}
      </div>
      ${motivationSection}
      <div class="notes-container">
        ${buildSectionBox({
          layout,
          title: '本人希望記入欄',
          subtitle:
            '（特に給料・職種・勤務時間・勤務地・その他についての希望などがあれば記入）',
          content: notes,
        })}
      </div>
    </div>
  `;
}
