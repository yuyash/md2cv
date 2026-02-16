/**
 * Configuration types for CLI and frontmatter
 */

/**
 * Output format types
 */
export type OutputFormat = 'cv' | 'rirekisho' | 'both' | 'cover_letter';
export type OutputType = 'html' | 'pdf' | 'both';
export type PaperSize = 'a3' | 'a4' | 'b4' | 'b5' | 'letter';
export type LogFormat = 'json' | 'text';

/**
 * Page margins in mm
 */
export interface PageMargins {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/**
 * Chronological order for history entries
 * - asc: oldest first (default for rirekisho)
 * - desc: newest first (default for CV)
 */
export type ChronologicalOrder = 'asc' | 'desc';

/**
 * CLI option definition
 */
export interface CLIOptionDefinition {
  readonly flags: string;
  readonly description: string;
  readonly defaultValue?: string | boolean;
  readonly required?: boolean;
}

/**
 * Generate command CLI option definitions
 */
export const GENERATE_OPTIONS = {
  input: {
    flags: '-i, --input <filepath>',
    description: 'Input markdown file path',
    required: true,
  },
  output: {
    flags: '-o, --output <filepath>',
    description: 'Output filepath (default: input directory)',
  },
  format: {
    flags: '-f, --format <format>',
    description: 'Output format (cv, rirekisho, both, or cover_letter)',
    defaultValue: 'cv',
  },
  outputType: {
    flags: '-t, --output-type <type>',
    description: 'Output type (html, pdf, or both)',
    defaultValue: 'pdf',
  },
  paperSize: {
    flags: '-p, --paper-size <size>',
    description: 'Paper size (a3, a4, b4, b5, letter)',
  },
  config: {
    flags: '-c, --config <file>',
    description: 'Configuration file (JSON or YAML)',
  },
  order: {
    flags: '--order <order>',
    description:
      'Chronological order for CV format only (asc: oldest first, desc: newest first). Default: desc. Rirekisho always uses oldest first.',
  },
  hideMotivation: {
    flags: '--hide-motivation',
    description:
      'Hide motivation section in rirekisho format (increases history/license rows)',
    defaultValue: false,
  },
  sectionOrder: {
    flags: '--section-order <sections>',
    description:
      'Comma-separated list of section IDs to include in CV output (e.g., "summary,experience,education,skills"). Sections not listed will be skipped. Only applies to CV format.',
  },
  stylesheet: {
    flags: '--stylesheet <filepath>',
    description:
      'Custom CSS stylesheet file to apply additional styles. The stylesheet is appended after default styles, allowing you to override fonts, colors, spacing, etc.',
  },
  marginMm: {
    flags: '--margin-mm <margins>',
    description:
      'Page margins in mm for CV format. Format: "top,right,bottom,left" (e.g., "10,15,10,15") or single value for all sides (e.g., "10"). Default: 30mm. Not applicable to rirekisho format.',
  },
  logFormat: {
    flags: '--log-format <format>',
    description: 'Log format (json or text)',
    defaultValue: 'text',
  },
  verbose: {
    flags: '--verbose',
    description: 'Enable verbose logging',
    defaultValue: false,
  },
} satisfies Record<string, CLIOptionDefinition>;

/**
 * Init command CLI option definitions
 */
export const INIT_OPTIONS = {
  output: {
    flags: '-o, --output <filepath>',
    description: 'Output file path (default: stdout)',
  },
  lang: {
    flags: '-l, --lang <language>',
    description: 'Template language',
    defaultValue: 'en',
  },
  format: {
    flags: '-f, --format <format>',
    description: 'Output format (cv, rirekisho, both, or cover_letter)',
    defaultValue: 'cv',
  },
  noComments: {
    flags: '--no-comments',
    description: 'Exclude explanatory comments from template',
  },
  listTemplates: {
    flags: '--list-templates',
    description: 'List available templates and their details',
  },
  listSections: {
    flags: '--list-sections',
    description:
      'List available sections for the specified language and format',
  },
} satisfies Record<string, CLIOptionDefinition>;

/**
 * CLI options parsed from command line
 * Optional fields use `?:` syntax since CLI parser may not provide all values
 */
export interface CLIOptions {
  readonly input: string;
  readonly output?: string;
  readonly format?: OutputFormat;
  readonly outputType?: OutputType;
  readonly paperSize?: PaperSize;
  readonly config?: string;
  readonly debug: boolean;
  readonly logFormat?: LogFormat;
  readonly chronologicalOrder?: ChronologicalOrder;
  readonly hideMotivation?: boolean;
  readonly sectionOrder?: string;
  readonly stylesheet?: string;
  readonly marginMm?: string;
}

/**
 * Configuration file schema (JSON or YAML)
 */
export interface ConfigFile {
  readonly format?: OutputFormat;
  readonly outputType?: OutputType;
  readonly paperSize?: PaperSize;
  readonly output?: string;
  readonly logFormat?: LogFormat;
  readonly chronologicalOrder?: ChronologicalOrder;
  readonly hideMotivation?: boolean;
  readonly sectionOrder?: string[];
  readonly stylesheet?: string;
  readonly marginMm?: PageMargins;
}

/**
 * Merged configuration from CLI, config file, and defaults
 */
export interface ResolvedConfig {
  readonly input: string;
  readonly output: string;
  readonly format: OutputFormat;
  readonly outputType: OutputType;
  readonly paperSize: PaperSize;
  readonly debug: boolean;
  readonly logFormat: LogFormat;
  readonly chronologicalOrder?: ChronologicalOrder;
  readonly hideMotivation: boolean;
  readonly sectionOrder?: string[];
  readonly stylesheet?: string;
  readonly marginMm?: PageMargins;
}

/**
 * Options for CV/Resume HTML generation
 */
export interface CVOptions {
  readonly paperSize: PaperSize;
  readonly customStylesheet?: string;
  readonly marginMm?: PageMargins;
  readonly lineHeight?: number;
}
