/**
 * Metadata types for resume frontmatter and environment variables
 */

/**
 * Metadata field definition
 */
export interface MetadataFieldDef {
  readonly envVars: readonly string[];
  readonly frontmatterKeys: readonly string[];
  readonly required: boolean;
}

/**
 * All metadata field definitions
 * Priority: frontmatter > environment variables
 */
export const METADATA_FIELDS: Record<string, MetadataFieldDef> = {
  name: {
    envVars: ['NAME'],
    frontmatterKeys: ['name'],
    required: true,
  },
  name_ja: {
    envVars: ['NAME_JA'],
    frontmatterKeys: ['name_ja'],
    required: false,
  },
  name_furigana: {
    envVars: ['NAME_FURIGANA', 'NAME_HURIGANA'],
    frontmatterKeys: ['name_furigana', 'name_hurigana'],
    required: false,
  },
  email_address: {
    envVars: ['EMAIL_ADDRESS', 'EMAIL_ADDRESS1'],
    frontmatterKeys: ['email_address', 'email_address1'],
    required: true,
  },
  email_address2: {
    envVars: ['EMAIL_ADDRESS2'],
    frontmatterKeys: ['email_address2'],
    required: false,
  },
  phone_number: {
    envVars: ['PHONE_NUMBER', 'PHONE_NUMBER1'],
    frontmatterKeys: ['phone_number', 'phone_number1'],
    required: true,
  },
  phone_number2: {
    envVars: ['PHONE_NUMBER2'],
    frontmatterKeys: ['phone_number2'],
    required: false,
  },
  post_code: {
    envVars: ['POST_CODE', 'POST_CODE1'],
    frontmatterKeys: ['post_code', 'post_code1'],
    required: false,
  },
  home_address: {
    envVars: ['HOME_ADDRESS', 'HOME_ADDRESS1'],
    frontmatterKeys: ['home_address', 'home_address1'],
    required: false,
  },
  home_address_ja: {
    envVars: ['HOME_ADDRESS_JA', 'HOME_ADDRESS1_JA'],
    frontmatterKeys: ['home_address_ja', 'home_address1_ja'],
    required: false,
  },
  home_address_furigana: {
    envVars: [
      'HOME_ADDRESS_FURIGANA',
      'HOME_ADDRESS_HURIGANA',
      'HOME_ADDRESS1_FURIGANA',
      'HOME_ADDRESS1_HURIGANA',
    ],
    frontmatterKeys: [
      'home_address_furigana',
      'home_address_hurigana',
      'home_address1_furigana',
      'home_address1_hurigana',
    ],
    required: false,
  },
  post_code2: {
    envVars: ['POST_CODE2'],
    frontmatterKeys: ['post_code2'],
    required: false,
  },
  home_address2: {
    envVars: ['HOME_ADDRESS2'],
    frontmatterKeys: ['home_address2'],
    required: false,
  },
  home_address2_furigana: {
    envVars: ['HOME_ADDRESS2_FURIGANA', 'HOME_ADDRESS2_HURIGANA'],
    frontmatterKeys: ['home_address2_furigana', 'home_address2_hurigana'],
    required: false,
  },
  gender: {
    envVars: ['GENDER'],
    frontmatterKeys: ['gender'],
    required: false,
  },
  dob: {
    envVars: ['DOB', 'DATE_OF_BIRTH'],
    frontmatterKeys: ['dob', 'date_of_birth'],
    required: false,
  },
  linkedin: {
    envVars: ['LINKEDIN', 'LINKEDIN_URL'],
    frontmatterKeys: ['linkedin', 'linkedin_url'],
    required: false,
  },
  photo: {
    envVars: ['PHOTO', 'PHOTO_PATH'],
    frontmatterKeys: ['photo', 'photo_path'],
    required: false,
  },
} as const;

/**
 * Resolved metadata after merging env vars and frontmatter
 */
export interface CVMetadata {
  // Required fields
  readonly name: string;
  readonly email_address: string;
  readonly phone_number: string;

  // Optional name variants
  readonly name_ja?: string;
  readonly name_furigana?: string;

  // Optional contact info (primary)
  readonly post_code?: string;
  readonly home_address?: string;
  readonly home_address_ja?: string;
  readonly home_address_furigana?: string;

  // Optional contact info (secondary)
  readonly email_address2?: string;
  readonly phone_number2?: string;
  readonly post_code2?: string;
  readonly home_address2?: string;
  readonly home_address2_furigana?: string;

  // Optional personal info
  readonly gender?: Gender;
  readonly dob?: Date;

  // Optional social/professional links
  readonly linkedin?: string;

  // Optional photo for rirekisho format
  readonly photo?: string;
}

// Alias for backward compatibility
export type ResumeMetadata = CVMetadata;

/**
 * Gender type
 */
export type Gender = 'male' | 'female' | 'other' | undefined;

/**
 * Get required metadata field names
 */
export function getRequiredFields(): string[] {
  return Object.entries(METADATA_FIELDS)
    .filter(([, def]) => def.required)
    .map(([key]) => key);
}

/**
 * Load metadata value from environment variables
 */
export function loadFromEnv(fieldName: string): string | undefined {
  const def = METADATA_FIELDS[fieldName];
  if (!def) return undefined;

  for (const envVar of def.envVars) {
    const value = process.env[envVar];
    if (value) return value;
  }
  return undefined;
}

/**
 * Load metadata value from frontmatter
 */
export function loadFromFrontmatter(
  fieldName: string,
  frontmatter: Record<string, unknown>,
): string | undefined {
  const def = METADATA_FIELDS[fieldName];
  if (!def) return undefined;

  for (const key of def.frontmatterKeys) {
    const value = frontmatter[key];
    if (typeof value === 'string' && value) return value;
  }
  return undefined;
}
