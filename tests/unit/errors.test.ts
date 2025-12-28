/**
 * Unit tests for error types and functions
 */

import { describe, expect, it } from 'vitest';

import {
  createConfigError,
  createLintError,
  createOutputError,
  createParseError,
  createTransformError,
  createValidationError,
  formatErrorForLogging,
} from '../../src/types/errors.js';

describe('Error creation functions', () => {
  describe('createParseError', () => {
    it('should create a parse error with all fields', () => {
      const error = createParseError('Syntax error', 10, 5, 'test.md', {
        extra: 'info',
      });

      expect(error.type).toBe('parse');
      expect(error.message).toBe('Syntax error');
      expect(error.line).toBe(10);
      expect(error.column).toBe(5);
      expect(error.source).toBe('test.md');
      expect(error.context).toEqual({ extra: 'info' });
      expect(error.stack).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });

    it('should create a parse error with default context', () => {
      const error = createParseError('Error', 1, 1, 'file.md');

      expect(error.context).toEqual({});
    });
  });

  describe('createValidationError', () => {
    it('should create a validation error with all fields', () => {
      const error = createValidationError(
        'Invalid field',
        'email',
        'string',
        'number',
        { field: 'email' },
      );

      expect(error.type).toBe('validation');
      expect(error.message).toBe('Invalid field');
      expect(error.field).toBe('email');
      expect(error.expected).toBe('string');
      expect(error.received).toBe('number');
      expect(error.context).toEqual({ field: 'email' });
    });

    it('should create a validation error with default context', () => {
      const error = createValidationError('Error', 'name', 'string', 'null');

      expect(error.context).toEqual({});
    });
  });

  describe('createTransformError', () => {
    it('should create a transform error with all fields', () => {
      const error = createTransformError(
        'Transform failed',
        'experience',
        'parse',
        { data: 'test' },
      );

      expect(error.type).toBe('transform');
      expect(error.message).toBe('Transform failed');
      expect(error.section).toBe('experience');
      expect(error.operation).toBe('parse');
      expect(error.context).toEqual({ data: 'test' });
    });

    it('should create a transform error with default context', () => {
      const error = createTransformError('Error', 'skills', 'convert');

      expect(error.context).toEqual({});
    });
  });

  describe('createOutputError', () => {
    it('should create an output error with cause', () => {
      const cause = new Error('IO error');
      const error = createOutputError('Write failed', 'pdf', cause, {
        path: '/tmp/out.pdf',
      });

      expect(error.type).toBe('output');
      expect(error.message).toBe('Write failed');
      expect(error.format).toBe('pdf');
      expect(error.cause).toBe(cause);
      expect(error.context).toEqual({ path: '/tmp/out.pdf' });
    });

    it('should create an output error without cause', () => {
      const error = createOutputError('Error', 'html');

      expect(error.cause).toBeUndefined();
      expect(error.context).toEqual({});
    });
  });

  describe('createConfigError', () => {
    it('should create a config error with all fields', () => {
      const error = createConfigError(
        'Invalid config',
        'format',
        'cv|rirekisho',
        'invalid',
        { file: 'config.json' },
      );

      expect(error.type).toBe('config');
      expect(error.message).toBe('Invalid config');
      expect(error.path).toBe('format');
      expect(error.expected).toBe('cv|rirekisho');
      expect(error.received).toBe('invalid');
      expect(error.context).toEqual({ file: 'config.json' });
    });

    it('should create a config error with default context', () => {
      const error = createConfigError('Error', 'key', 'string', 'number');

      expect(error.context).toEqual({});
    });
  });

  describe('createLintError', () => {
    it('should create a lint error with all fields', () => {
      const error = createLintError(
        'Lint warning',
        'test.md',
        5,
        10,
        'no-trailing-spaces',
        'warning',
        { fixable: true },
      );

      expect(error.type).toBe('lint');
      expect(error.message).toBe('Lint warning');
      expect(error.file).toBe('test.md');
      expect(error.line).toBe(5);
      expect(error.column).toBe(10);
      expect(error.ruleId).toBe('no-trailing-spaces');
      expect(error.severity).toBe('warning');
      expect(error.context).toEqual({ fixable: true });
    });

    it('should create a lint error with error severity', () => {
      const error = createLintError('Error', 'file.md', 1, 1, 'rule', 'error');

      expect(error.severity).toBe('error');
      expect(error.context).toEqual({});
    });
  });
});

describe('formatErrorForLogging', () => {
  it('should format parse error', () => {
    const error = createParseError('Syntax error', 10, 5, 'test.md');
    const formatted = formatErrorForLogging(error);

    expect(formatted).toContain('PARSE ERROR');
    expect(formatted).toContain('Syntax error');
    expect(formatted).toContain('Location: test.md:10:5');
  });

  it('should format validation error', () => {
    const error = createValidationError(
      'Invalid field',
      'email',
      'string',
      'number',
    );
    const formatted = formatErrorForLogging(error);

    expect(formatted).toContain('VALIDATION ERROR');
    expect(formatted).toContain('Invalid field');
    expect(formatted).toContain('Field: email');
    expect(formatted).toContain('Expected: string');
    expect(formatted).toContain('Received: number');
  });

  it('should format transform error', () => {
    const error = createTransformError(
      'Transform failed',
      'experience',
      'parse',
    );
    const formatted = formatErrorForLogging(error);

    expect(formatted).toContain('TRANSFORM ERROR');
    expect(formatted).toContain('Transform failed');
    expect(formatted).toContain('Section: experience');
    expect(formatted).toContain('Operation: parse');
  });

  it('should format output error with cause', () => {
    const cause = new Error('IO error');
    const error = createOutputError('Write failed', 'pdf', cause);
    const formatted = formatErrorForLogging(error);

    expect(formatted).toContain('OUTPUT ERROR');
    expect(formatted).toContain('Write failed');
    expect(formatted).toContain('Format: pdf');
    expect(formatted).toContain('Cause: IO error');
  });

  it('should format output error without cause', () => {
    const error = createOutputError('Write failed', 'html');
    const formatted = formatErrorForLogging(error);

    expect(formatted).toContain('OUTPUT ERROR');
    expect(formatted).toContain('Format: html');
    expect(formatted).not.toContain('Cause:');
  });

  it('should format config error', () => {
    const error = createConfigError(
      'Invalid config',
      'format',
      'cv|rirekisho',
      'invalid',
    );
    const formatted = formatErrorForLogging(error);

    expect(formatted).toContain('CONFIG ERROR');
    expect(formatted).toContain('Invalid config');
    expect(formatted).toContain('Path: format');
    expect(formatted).toContain('Expected: cv|rirekisho');
    expect(formatted).toContain('Received: invalid');
  });

  it('should format lint error', () => {
    const error = createLintError(
      'Lint warning',
      'test.md',
      5,
      10,
      'no-trailing-spaces',
      'warning',
    );
    const formatted = formatErrorForLogging(error);

    expect(formatted).toContain('LINT ERROR');
    expect(formatted).toContain('Lint warning');
    expect(formatted).toContain('File: test.md:5:10');
    expect(formatted).toContain('Rule: no-trailing-spaces');
    expect(formatted).toContain('Severity: warning');
  });

  it('should include context when present', () => {
    const error = createParseError('Error', 1, 1, 'file.md', { extra: 'data' });
    const formatted = formatErrorForLogging(error);

    expect(formatted).toContain('Context:');
    expect(formatted).toContain('"extra":"data"');
  });

  it('should include stack trace', () => {
    const error = createParseError('Error', 1, 1, 'file.md');
    const formatted = formatErrorForLogging(error);

    expect(formatted).toContain('Stack trace:');
  });
});
