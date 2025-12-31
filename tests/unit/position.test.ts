/**
 * Unit tests for Position and Range types
 */

import { describe, expect, it } from 'vitest';

import {
    createPosition,
    createRange,
    createRangeFromNumbers,
    located,
} from '../../src/types/position.js';

describe('Position type', () => {
  describe('createPosition', () => {
    it('should create a position with line and character', () => {
      const pos = createPosition(5, 10);

      expect(pos.line).toBe(5);
      expect(pos.character).toBe(10);
    });

    it('should create a position at origin', () => {
      const pos = createPosition(0, 0);

      expect(pos.line).toBe(0);
      expect(pos.character).toBe(0);
    });

    it('should handle large line numbers', () => {
      const pos = createPosition(10000, 500);

      expect(pos.line).toBe(10000);
      expect(pos.character).toBe(500);
    });
  });

  describe('createRange', () => {
    it('should create a range from two positions', () => {
      const start = createPosition(1, 0);
      const end = createPosition(5, 20);
      const range = createRange(start, end);

      expect(range.start).toEqual(start);
      expect(range.end).toEqual(end);
    });

    it('should create a zero-width range', () => {
      const pos = createPosition(3, 10);
      const range = createRange(pos, pos);

      expect(range.start).toEqual(range.end);
    });

    it('should create a single-line range', () => {
      const start = createPosition(5, 0);
      const end = createPosition(5, 30);
      const range = createRange(start, end);

      expect(range.start.line).toBe(range.end.line);
      expect(range.end.character).toBeGreaterThan(range.start.character);
    });
  });

  describe('createRangeFromNumbers', () => {
    it('should create a range from four numbers', () => {
      const range = createRangeFromNumbers(1, 5, 10, 20);

      expect(range.start.line).toBe(1);
      expect(range.start.character).toBe(5);
      expect(range.end.line).toBe(10);
      expect(range.end.character).toBe(20);
    });

    it('should create a zero-width range', () => {
      const range = createRangeFromNumbers(3, 10, 3, 10);

      expect(range.start).toEqual(range.end);
    });

    it('should create a single-line range', () => {
      const range = createRangeFromNumbers(5, 0, 5, 30);

      expect(range.start.line).toBe(range.end.line);
    });
  });

  describe('located', () => {
    it('should wrap a string value with range', () => {
      const range = createRange(createPosition(0, 0), createPosition(0, 5));
      const loc = located('hello', range);

      expect(loc.value).toBe('hello');
      expect(loc.range).toEqual(range);
    });

    it('should wrap a number value with range', () => {
      const range = createRange(createPosition(1, 0), createPosition(1, 3));
      const loc = located(42, range);

      expect(loc.value).toBe(42);
      expect(loc.range).toEqual(range);
    });

    it('should wrap an object value with range', () => {
      const range = createRange(createPosition(0, 0), createPosition(5, 0));
      const obj = { name: 'test', count: 10 };
      const loc = located(obj, range);

      expect(loc.value).toEqual(obj);
      expect(loc.range).toEqual(range);
    });

    it('should wrap an array value with range', () => {
      const range = createRange(createPosition(2, 0), createPosition(4, 0));
      const arr = [1, 2, 3];
      const loc = located(arr, range);

      expect(loc.value).toEqual(arr);
      expect(loc.range).toEqual(range);
    });

    it('should wrap null value with range', () => {
      const range = createRange(createPosition(0, 0), createPosition(0, 4));
      const loc = located(null, range);

      expect(loc.value).toBeNull();
      expect(loc.range).toEqual(range);
    });

    it('should wrap undefined value with range', () => {
      const range = createRange(createPosition(0, 0), createPosition(0, 9));
      const loc = located(undefined, range);

      expect(loc.value).toBeUndefined();
      expect(loc.range).toEqual(range);
    });
  });
});
