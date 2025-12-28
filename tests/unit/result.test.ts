/**
 * Unit tests for Result type and utility functions
 */

import { describe, expect, it } from 'vitest';

import {
  failure,
  flatMap,
  isFailure,
  isSuccess,
  map,
  mapError,
  success,
  unwrap,
  unwrapOr,
  type Result,
} from '../../src/types/result.js';

describe('Result type', () => {
  describe('success', () => {
    it('should create a successful result', () => {
      const result = success(42);

      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should work with different types', () => {
      const stringResult = success('hello');
      const objectResult = success({ name: 'test' });
      const arrayResult = success([1, 2, 3]);

      expect(stringResult.value).toBe('hello');
      expect(objectResult.value).toEqual({ name: 'test' });
      expect(arrayResult.value).toEqual([1, 2, 3]);
    });
  });

  describe('failure', () => {
    it('should create a failed result', () => {
      const result = failure('error message');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('error message');
    });

    it('should work with different error types', () => {
      const stringError = failure('string error');
      const objectError = failure({ code: 404, message: 'Not found' });
      const errorInstance = failure(new Error('Error instance'));

      expect(stringError.error).toBe('string error');
      expect(objectError.error).toEqual({ code: 404, message: 'Not found' });
      expect(errorInstance.error).toBeInstanceOf(Error);
    });
  });

  describe('isSuccess', () => {
    it('should return true for successful results', () => {
      const result = success(42);

      expect(isSuccess(result)).toBe(true);
    });

    it('should return false for failed results', () => {
      const result = failure('error');

      expect(isSuccess(result)).toBe(false);
    });
  });

  describe('isFailure', () => {
    it('should return true for failed results', () => {
      const result = failure('error');

      expect(isFailure(result)).toBe(true);
    });

    it('should return false for successful results', () => {
      const result = success(42);

      expect(isFailure(result)).toBe(false);
    });
  });

  describe('map', () => {
    it('should transform successful result value', () => {
      const result = success(5);
      const mapped = map(result, (x) => x * 2);

      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(10);
      }
    });

    it('should not transform failed result', () => {
      const result = failure('error') as Result<number, string>;
      const mapped = map(result, (x) => x * 2);

      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe('error');
      }
    });

    it('should allow type transformation', () => {
      const result = success(42);
      const mapped = map(result, (x) => x.toString());

      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe('42');
      }
    });
  });

  describe('mapError', () => {
    it('should transform failed result error', () => {
      const result = failure('error');
      const mapped = mapError(result, (e) => ({ message: e }));

      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toEqual({ message: 'error' });
      }
    });

    it('should not transform successful result', () => {
      const result = success(42) as Result<number, string>;
      const mapped = mapError(result, (e) => ({ message: e }));

      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(42);
      }
    });
  });

  describe('flatMap', () => {
    it('should chain successful operations', () => {
      const result = success(5);
      const chained = flatMap(result, (x) => success(x * 2));

      expect(chained.ok).toBe(true);
      if (chained.ok) {
        expect(chained.value).toBe(10);
      }
    });

    it('should short-circuit on failure', () => {
      const result = failure('first error') as Result<number, string>;
      const chained = flatMap(result, (x) => success(x * 2));

      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe('first error');
      }
    });

    it('should propagate failure from chained operation', () => {
      const result = success(5);
      const chained = flatMap(result, () => failure('chained error'));

      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe('chained error');
      }
    });

    it('should allow multiple chained operations', () => {
      const result = success(2);
      const chained = flatMap(
        flatMap(result, (x) => success(x + 3)),
        (x) => success(x * 2),
      );

      expect(chained.ok).toBe(true);
      if (chained.ok) {
        expect(chained.value).toBe(10);
      }
    });
  });

  describe('unwrap', () => {
    it('should return value for successful result', () => {
      const result = success(42);
      const value = unwrap(result);

      expect(value).toBe(42);
    });

    it('should throw for failed result', () => {
      const result = failure('error message');

      expect(() => unwrap(result)).toThrow('Attempted to unwrap a failure');
    });

    it('should include error in thrown message', () => {
      const result = failure('specific error');

      expect(() => unwrap(result)).toThrow('specific error');
    });
  });

  describe('unwrapOr', () => {
    it('should return value for successful result', () => {
      const result = success(42);
      const value = unwrapOr(result, 0);

      expect(value).toBe(42);
    });

    it('should return default value for failed result', () => {
      const result = failure('error') as Result<number, string>;
      const value = unwrapOr(result, 0);

      expect(value).toBe(0);
    });

    it('should work with different default types', () => {
      const stringResult = failure('error') as Result<string, string>;
      const arrayResult = failure('error') as Result<number[], string>;

      expect(unwrapOr(stringResult, 'default')).toBe('default');
      expect(unwrapOr(arrayResult, [])).toEqual([]);
    });
  });
});
