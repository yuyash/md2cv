/**
 * Error types for the Resume Converter application
 * All errors include context information and stack trace for debugging
 * Validates: Requirements 8.1
 */

export interface BaseError {
  readonly message: string;
  readonly context: Record<string, unknown>;
  readonly stack: string | undefined;
  readonly timestamp: string;
}

export interface ParseError extends BaseError {
  readonly type: 'parse';
  readonly line: number;
  readonly column: number;
  readonly source: string;
}

export interface ValidationError extends BaseError {
  readonly type: 'validation';
  readonly field: string;
  readonly expected: string;
  readonly received: string;
}

export interface TransformError extends BaseError {
  readonly type: 'transform';
  readonly section: string;
  readonly operation: string;
}

export interface OutputError extends BaseError {
  readonly type: 'output';
  readonly format: 'pdf' | 'html';
  readonly cause: Error | undefined;
}

export interface ConfigError extends BaseError {
  readonly type: 'config';
  readonly path: string;
  readonly expected: string;
  readonly received: string;
}

export interface LintError extends BaseError {
  readonly type: 'lint';
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly ruleId: string;
  readonly severity: 'error' | 'warning';
}

export type ResumeConverterError =
  | ParseError
  | ValidationError
  | TransformError
  | OutputError
  | ConfigError
  | LintError;

/**
 * Creates a ParseError with full context
 */
export function createParseError(
  message: string,
  line: number,
  column: number,
  source: string,
  context: Record<string, unknown> = {},
): ParseError {
  return {
    type: 'parse',
    message,
    line,
    column,
    source,
    context,
    stack: new Error().stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a ValidationError with full context
 */
export function createValidationError(
  message: string,
  field: string,
  expected: string,
  received: string,
  context: Record<string, unknown> = {},
): ValidationError {
  return {
    type: 'validation',
    message,
    field,
    expected,
    received,
    context,
    stack: new Error().stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a TransformError with full context
 */
export function createTransformError(
  message: string,
  section: string,
  operation: string,
  context: Record<string, unknown> = {},
): TransformError {
  return {
    type: 'transform',
    message,
    section,
    operation,
    context,
    stack: new Error().stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an OutputError with full context
 */
export function createOutputError(
  message: string,
  format: 'pdf' | 'html',
  cause?: Error,
  context: Record<string, unknown> = {},
): OutputError {
  return {
    type: 'output',
    message,
    format,
    cause,
    context,
    stack: new Error().stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a ConfigError with full context
 */
export function createConfigError(
  message: string,
  path: string,
  expected: string,
  received: string,
  context: Record<string, unknown> = {},
): ConfigError {
  return {
    type: 'config',
    message,
    path,
    expected,
    received,
    context,
    stack: new Error().stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a LintError with full context
 */
export function createLintError(
  message: string,
  file: string,
  line: number,
  column: number,
  ruleId: string,
  severity: 'error' | 'warning',
  context: Record<string, unknown> = {},
): LintError {
  return {
    type: 'lint',
    message,
    file,
    line,
    column,
    ruleId,
    severity,
    context,
    stack: new Error().stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formats an error for logging with full context and stack trace
 * Validates: Requirements 8.1
 */
export function formatErrorForLogging(error: ResumeConverterError): string {
  const lines: string[] = [
    `[${error.timestamp}] ${error.type.toUpperCase()} ERROR: ${error.message}`,
  ];

  // Add type-specific details
  switch (error.type) {
    case 'parse':
      lines.push(`  Location: ${error.source}:${error.line}:${error.column}`);
      break;
    case 'validation':
      lines.push(`  Field: ${error.field}`);
      lines.push(`  Expected: ${error.expected}`);
      lines.push(`  Received: ${error.received}`);
      break;
    case 'transform':
      lines.push(`  Section: ${error.section}`);
      lines.push(`  Operation: ${error.operation}`);
      break;
    case 'output':
      lines.push(`  Format: ${error.format}`);
      if (error.cause) {
        lines.push(`  Cause: ${error.cause.message}`);
      }
      break;
    case 'config':
      lines.push(`  Path: ${error.path}`);
      lines.push(`  Expected: ${error.expected}`);
      lines.push(`  Received: ${error.received}`);
      break;
    case 'lint':
      lines.push(`  File: ${error.file}:${error.line}:${error.column}`);
      lines.push(`  Rule: ${error.ruleId}`);
      lines.push(`  Severity: ${error.severity}`);
      break;
  }

  // Add context if present
  if (Object.keys(error.context).length > 0) {
    lines.push(`  Context: ${JSON.stringify(error.context)}`);
  }

  // Add stack trace
  if (error.stack != null) {
    lines.push(`  Stack trace:`);
    lines.push(error.stack.split('\n').slice(1).join('\n'));
  }

  return lines.join('\n');
}
