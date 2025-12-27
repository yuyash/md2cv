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
}
