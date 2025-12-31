/**
 * Position and Range types for LSP integration
 * These types are compatible with VS Code's Position and Range
 */

/**
 * A position in a text document (0-based line and character)
 */
export interface Position {
  readonly line: number;
  readonly character: number;
}

/**
 * A range in a text document
 */
export interface Range {
  readonly start: Position;
  readonly end: Position;
}

/**
 * Create a Position
 */
export function createPosition(line: number, character: number): Position {
  return { line, character };
}

/**
 * Create a Range
 */
export function createRange(start: Position, end: Position): Range {
  return { start, end };
}

/**
 * Create a Range from line/character numbers
 */
export function createRangeFromNumbers(
  startLine: number,
  startChar: number,
  endLine: number,
  endChar: number,
): Range {
  return {
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar },
  };
}

/**
 * A located value - wraps a value with its position in the document
 */
export interface Located<T> {
  readonly value: T;
  readonly range: Range;
}

/**
 * Create a Located value
 */
export function located<T>(value: T, range: Range): Located<T> {
  return { value, range };
}
