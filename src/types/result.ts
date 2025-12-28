/**
 * Result type for error handling - represents either success or failure
 * This is a discriminated union that forces explicit error handling
 */

export type Result<T, E> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Failure<E> {
  readonly ok: false;
  readonly error: E;
}

/**
 * Creates a successful Result
 */
export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

/**
 * Creates a failed Result
 */
export function failure<E>(error: E): Failure<E> {
  return { ok: false, error };
}

/**
 * Type guard to check if a Result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok;
}

/**
 * Type guard to check if a Result is a failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.ok;
}

/**
 * Maps a successful Result's value using the provided function
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (result.ok) {
    return success(fn(result.value));
  }
  return result;
}

/**
 * Maps a failed Result's error using the provided function
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  if (!result.ok) {
    return failure(fn(result.error));
  }
  return result;
}

/**
 * Chains Result operations - flatMap/bind
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/**
 * Unwraps a Result, throwing if it's a failure
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Attempted to unwrap a failure: ${String(result.error)}`);
}

/**
 * Unwraps a Result with a default value for failures
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}
