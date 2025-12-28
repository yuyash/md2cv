/**
 * Configuration types for CLI and frontmatter
 */

/**
 * Output format types
 */
export type OutputFormat = 'cv' | 'rirekisho' | 'both';
export type OutputType = 'html' | 'pdf' | 'both';
export type PaperSize = 'a3' | 'a4' | 'b4' | 'b5' | 'letter';
export type LogFormat = 'json' | 'text';

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
    description: 'Output format (cv, rirekisho, or both)',
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
  photo: {
    flags: '--photo <filepath>',
    description:
      'Photo image file for rirekisho format (png, jpg, tiff). Only used with rirekisho format.',
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
    description: 'Output format (cv, rirekisho, or both)',
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
 */
export interface CLIOptions {
  readonly input: string;
  readonly output: string | undefined;
  readonly format: OutputFormat;
  readonly outputType: OutputType;
  readonly paperSize: PaperSize | undefined;
  readonly config: string | undefined;
  readonly debug: boolean;
  readonly logFormat: LogFormat;
  readonly chronologicalOrder: ChronologicalOrder | undefined;
  readonly hideMotivation: boolean;
  readonly photo: string | undefined;
  readonly sectionOrder: string | undefined;
  readonly stylesheet: string | undefined;
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
  readonly photo?: string;
  readonly sectionOrder?: string[];
  readonly stylesheet?: string;
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
  readonly chronologicalOrder: ChronologicalOrder | undefined;
  readonly hideMotivation: boolean;
  readonly photo: string | undefined;
  readonly sectionOrder: string[] | undefined;
  readonly stylesheet: string | undefined;
}
