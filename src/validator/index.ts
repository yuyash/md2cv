/**
 * Validator module
 * Validates parsed CV against requirements
 */

import type { Logger } from '../cli/index.js';
import type { ParsedCV } from '../parser/index.js';
import type { OutputFormat } from '../types/config.js';
import {
  createValidationError,
  failure,
  success,
  type Result,
  type ValidationError,
} from '../types/index.js';
import { METADATA_FIELDS, getRequiredFields } from '../types/metadata.js';
import {
  SECTION_DEFINITIONS,
  findSectionByTag,
  getRequiredSectionsForFormat,
} from '../types/sections.js';

/**
 * Validated CV (same structure, guaranteed valid)
 */
export interface ValidatedCV extends ParsedCV {
  readonly _validated: true;
}

/**
 * Validate metadata fields
 */
function validateMetadata(cv: ParsedCV, errors: ValidationError[]): void {
  const requiredFields = getRequiredFields();
  const metadata = cv.metadata as unknown as Record<string, unknown>;

  for (const fieldName of requiredFields) {
    const value = metadata[fieldName];
    if (!value || (typeof value === 'string' && !value.trim())) {
      const def = METADATA_FIELDS[fieldName];
      const envVars = def?.envVars.join(' or ') ?? fieldName.toUpperCase();
      errors.push(
        createValidationError(
          `Missing required field: ${fieldName}. Set via environment variable (${envVars}) or frontmatter.`,
          fieldName,
          'string',
          'undefined',
        ),
      );
    }
  }
}

/**
 * Validate sections for output format
 */
function validateSections(
  cv: ParsedCV,
  format: OutputFormat,
  errors: ValidationError[],
  logger: Logger,
): void {
  const requiredSectionIds = getRequiredSectionsForFormat(format);
  const presentSectionIds = cv.sections.map((s) => s.id);

  // Check required sections
  for (const requiredId of requiredSectionIds) {
    if (!presentSectionIds.includes(requiredId)) {
      const def = SECTION_DEFINITIONS.find((d) => d.id === requiredId);
      const tags = def?.tags.join(', ') ?? requiredId;
      errors.push(
        createValidationError(
          `Missing required section for ${format}: ${requiredId}. Use one of: ${tags}`,
          requiredId,
          'section',
          'missing',
        ),
      );
    }
  }

  // Warn about unknown sections
  // Get all H1 headings from raw content to check for unknown sections
  for (const line of cv.rawContent.split(/\r?\n/)) {
    if (!line.startsWith('#') || line.length < 2) continue;
    if (!/\s/.test(line[1])) continue;
    const title = line.slice(1).trim();
    if (!title) continue;
    const sectionDef = findSectionByTag(title);
    if (!sectionDef) {
      logger.warn(`Unknown section "${title}" will be ignored`);
    }
  }
}

/**
 * Validate CV
 */
export function validateCV(
  cv: ParsedCV,
  format: OutputFormat,
  logger: Logger,
): Result<ValidatedCV, ValidationError[]> {
  const errors: ValidationError[] = [];

  validateMetadata(cv, errors);
  validateSections(cv, format, errors, logger);

  if (errors.length > 0) {
    return failure(errors);
  }

  return success({
    ...cv,
    _validated: true as const,
  });
}

export default validateCV;
