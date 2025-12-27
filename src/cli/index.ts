/**
 * CLI Interface module
 * Command-line argument parsing and execution
 */

import { Command } from 'commander';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

import { generateOutput } from '../generator/index.js';
import { parseMarkdown } from '../parser/index.js';
import type {
    ChronologicalOrder,
    CLIOptions,
    ConfigFile,
    LogFormat,
    OutputFormat,
    OutputType,
    PaperSize,
    ResolvedConfig,
} from '../types/config.js';
import { METADATA_FIELDS } from '../types/metadata.js';
import { validateCV } from '../validator/index.js';

// Read version from package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findPackageJson(): string {
  const candidates = [
    path.resolve(__dirname, '../../../package.json'), // from dist/src/cli
    path.resolve(__dirname, '../../package.json'), // from src/cli
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('package.json not found');
}

const packageJsonPath = findPackageJson();
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { version: string };
const VERSION = packageJson.version;

/**
 * Log level names
 */
const LOG_LEVEL_NAMES: Record<number, string> = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL',
};

/**
 * Logger interface (compatible with pino)
 */
export interface Logger {
  info(msg: string): void;
  info(obj: object, msg?: string): void;
  debug(msg: string): void;
  debug(obj: object, msg?: string): void;
  warn(msg: string): void;
  warn(obj: object, msg?: string): void;
  error(msg: string): void;
  error(obj: object, msg?: string): void;
}

/**
 * Create pino logger instance
 */
export function createLogger(debug: boolean, logFormat: LogFormat = 'text'): Logger {
  const level = debug ? 'debug' : 'info';

  if (logFormat === 'json') {
    return pino({
      level,
      base: null,
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      formatters: {
        level(label, number) {
          return { level: LOG_LEVEL_NAMES[number] ?? label.toUpperCase() };
        },
      },
    });
  }

  // Text format using pino-pretty
  return pino({
    level,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  });
}

/**
 * Load configuration file (JSON or YAML)
 */
export function loadConfigFile(configPath: string): ConfigFile {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const ext = path.extname(configPath).toLowerCase();

  if (ext === '.json') {
    return JSON.parse(content) as ConfigFile;
  } else if (ext === '.yaml' || ext === '.yml') {
    return parseYaml(content) as ConfigFile;
  } else {
    throw new Error(`Unsupported config file format: ${ext}. Use .json, .yaml, or .yml`);
  }
}

/**
 * Load .env file from input directory and log loaded variables
 */
export function loadEnvFile(inputPath: string, logger: Logger, verbose: boolean): void {
  const inputDir = path.dirname(path.resolve(inputPath));
  const envPath = path.join(inputDir, '.env');

  if (!fs.existsSync(envPath)) {
    logger.debug({ path: envPath }, 'No .env file found');
    return;
  }

  // Load .env file (suppress dotenv's own logging)
  process.env.DOTENV_CONFIG_QUIET = 'true';
  const result = dotenvConfig({ path: envPath });

  if (result.error) {
    logger.warn({ error: result.error.message }, 'Failed to load .env file');
    return;
  }

  logger.info({ path: envPath }, 'Loaded .env file');

  // Collect all possible env var names from METADATA_FIELDS
  const allEnvVars = new Set<string>();
  for (const def of Object.values(METADATA_FIELDS)) {
    for (const envVar of def.envVars) {
      allEnvVars.add(envVar);
    }
  }

  // Log loaded environment variables
  const loadedVars: Record<string, string> = {};
  for (const envVar of allEnvVars) {
    const value = process.env[envVar];
    if (value !== undefined) {
      loadedVars[envVar] = verbose ? value : '***';
    }
  }

  if (Object.keys(loadedVars).length > 0) {
    if (verbose) {
      logger.debug({ variables: loadedVars }, 'Environment variables loaded from .env');
    } else {
      logger.info({ variables: Object.keys(loadedVars) }, 'Environment variables loaded from .env');
    }
  }
}

/**
 * Supported photo image extensions
 */
const SUPPORTED_PHOTO_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tiff', '.tif'];

/**
 * Validate photo file path
 */
function validatePhotoPath(photoPath: string): void {
  if (!fs.existsSync(photoPath)) {
    throw new Error(`Photo file not found: ${photoPath}`);
  }

  const ext = path.extname(photoPath).toLowerCase();
  if (!SUPPORTED_PHOTO_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported photo format: ${ext}. Supported formats: ${SUPPORTED_PHOTO_EXTENSIONS.join(', ')}`,
    );
  }
}

/**
 * Resolve configuration from CLI options and config file
 */
export function resolveConfig(cliOptions: CLIOptions): ResolvedConfig {
  let configFile: ConfigFile = {};

  if (cliOptions.config) {
    configFile = loadConfigFile(cliOptions.config);
  }

  // Determine output path
  const inputDir = path.dirname(cliOptions.input);
  const inputBasename = path.basename(cliOptions.input, path.extname(cliOptions.input));
  const defaultOutput = path.join(inputDir, inputBasename);

  // Resolve photo path (CLI takes precedence over config file)
  const photoPath = cliOptions.photo ?? configFile.photo;

  // Validate photo path if provided
  if (photoPath) {
    validatePhotoPath(photoPath);
  }

  return {
    input: cliOptions.input,
    output: cliOptions.output ?? configFile.output ?? defaultOutput,
    format: cliOptions.format ?? configFile.format ?? 'cv',
    outputType: cliOptions.outputType ?? configFile.outputType ?? 'pdf',
    paperSize: cliOptions.paperSize ?? configFile.paperSize ?? 'a4',
    debug: cliOptions.debug,
    logFormat: cliOptions.logFormat ?? configFile.logFormat ?? 'text',
    chronologicalOrder: cliOptions.chronologicalOrder ?? configFile.chronologicalOrder,
    hideMotivation: cliOptions.hideMotivation || configFile.hideMotivation || false,
    photo: photoPath,
    sectionOrder: cliOptions.sectionOrder 
      ? cliOptions.sectionOrder.split(',').map(s => s.trim())
      : configFile.sectionOrder,
  };
}

/**
 * Main CLI execution
 */
export async function runCLI(options: CLIOptions): Promise<void> {
  const config = resolveConfig(options);
  const logger = createLogger(config.debug, config.logFormat);

  // Load .env file from input directory (before parsing markdown)
  loadEnvFile(config.input, logger, config.debug);

  logger.debug({ config }, 'Resolved configuration');

  // Read input file
  if (!fs.existsSync(config.input)) {
    throw new Error(`Input file not found: ${config.input}`);
  }
  const markdown = fs.readFileSync(config.input, 'utf-8');
  logger.debug({ file: config.input }, 'Input file read successfully');

  // Parse markdown
  const parseResult = parseMarkdown(markdown);
  if (!parseResult.ok) {
    for (const error of parseResult.error) {
      logger.error({ error }, error.message);
    }
    throw new Error('Failed to parse markdown');
  }
  logger.debug('Markdown parsed successfully');

  // Validate
  const validationResult = validateCV(parseResult.value, config.format, logger);
  if (!validationResult.ok) {
    for (const error of validationResult.error) {
      logger.error({ error }, error.message);
    }
    throw new Error('Validation failed');
  }
  logger.debug('Validation passed');

  // Generate output
  const generatedFiles = await generateOutput(validationResult.value, config, logger);

  logger.info({ files: generatedFiles, count: generatedFiles.length }, 'Generation complete');
}

/**
 * Create CLI program
 */
export function createCLIProgram(): Command {
  const program = new Command();

  program
    .name('md2cv')
    .description('CV/Resume Generator - transforms Markdown CVs into PDF and HTML')
    .version(VERSION, '--version', 'Show version info')
    .requiredOption('-i, --input <filepath>', 'Input markdown file path')
    .option('-o, --output <filepath>', 'Output filepath (default: input directory)')
    .option('-f, --format <format>', 'Output format (cv, rirekisho, or both)', 'cv')
    .option('-t, --output-type <type>', 'Output type (html, pdf, or both)', 'pdf')
    .option('-p, --paper-size <size>', 'Paper size (a3, a4, b4, b5, letter)')
    .option('-c, --config <file>', 'Configuration file (JSON or YAML)')
    .option(
      '--order <order>',
      'Chronological order for CV format only (asc: oldest first, desc: newest first). Default: desc. Rirekisho always uses oldest first.',
    )
    .option(
      '--hide-motivation',
      'Hide motivation section in rirekisho format (increases history/license rows)',
      false,
    )
    .option(
      '--photo <filepath>',
      'Photo image file for rirekisho format (png, jpg, tiff). Only used with rirekisho format.',
    )
    .option(
      '--section-order <sections>',
      'Comma-separated list of section IDs to include in CV output (e.g., "summary,experience,education,skills"). Sections not listed will be skipped. Only applies to CV format.',
    )
    .option('--log-format <format>', 'Log format (json or text)', 'text')
    .option('--verbose', 'Enable verbose logging', false)
    .action(async (opts: Record<string, unknown>) => {
      try {
        const cliOptions: CLIOptions = {
          input: String(opts.input),
          output: typeof opts.output === 'string' ? opts.output : undefined,
          format: (opts.format as OutputFormat) ?? 'cv',
          outputType: (opts.outputType as OutputType) ?? 'pdf',
          paperSize: typeof opts.paperSize === 'string' ? (opts.paperSize as PaperSize) : undefined,
          config: typeof opts.config === 'string' ? opts.config : undefined,
          debug: opts.verbose === true,
          logFormat: (opts.logFormat as LogFormat) ?? 'text',
          chronologicalOrder:
            typeof opts.order === 'string' ? (opts.order as ChronologicalOrder) : undefined,
          hideMotivation: opts.hideMotivation === true,
          photo: typeof opts.photo === 'string' ? opts.photo : undefined,
          sectionOrder: typeof opts.sectionOrder === 'string' ? opts.sectionOrder : undefined,
        };

        await runCLI(cliOptions);
        process.exit(0);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  return program;
}

/**
 * Main entry point
 */
export async function main(): Promise<void> {
  const program = createCLIProgram();
  await program.parseAsync(process.argv);
}

export { Command };

    export type { CLIOptions };

