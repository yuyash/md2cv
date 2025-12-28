/**
 * Validator unit tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Logger } from '../../src/cli/index.js';
import type { ParsedCV } from '../../src/parser/index.js';
import type { ValidationError } from '../../src/types/index.js';
import { validateCV } from '../../src/validator/index.js';

const mockLogger: Logger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Helper to reset mocks
function resetMocks(): void {
  vi.clearAllMocks();
}

describe('validateCV', () => {
  it('should pass validation with all required fields', () => {
    const cv: ParsedCV = {
      metadata: {
        name: 'John Doe',
        email_address: 'john@example.com',
        phone_number: '123-456-7890',
      },
      sections: [
        {
          id: 'experience',
          title: '職歴',
          content: { type: 'text', text: 'Some experience' },
        },
      ],
      rawContent: '',
    };

    const result = validateCV(cv, 'cv', mockLogger);
    expect(result.ok).toBe(true);
  });

  it('should fail validation when required metadata is missing', () => {
    const cv: ParsedCV = {
      metadata: {
        name: 'John Doe',
        email_address: '',
        phone_number: '123-456-7890',
      },
      sections: [],
      rawContent: '',
    };

    const result = validateCV(cv, 'cv', mockLogger);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.error.some((e: ValidationError) =>
          e.message.includes('email_address'),
        ),
      ).toBe(true);
    }
  });

  it('should fail validation when required section is missing', () => {
    const cv: ParsedCV = {
      metadata: {
        name: 'John Doe',
        email_address: 'john@example.com',
        phone_number: '123-456-7890',
      },
      sections: [],
      rawContent: '',
    };

    const result = validateCV(cv, 'cv', mockLogger);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.error.some((e: ValidationError) =>
          e.message.includes('experience'),
        ),
      ).toBe(true);
    }
  });

  it('should warn about unknown sections', () => {
    resetMocks();
    const cv: ParsedCV = {
      metadata: {
        name: 'John Doe',
        email_address: 'john@example.com',
        phone_number: '123-456-7890',
      },
      sections: [
        {
          id: 'experience',
          title: '職歴',
          content: { type: 'text', text: 'Some experience' },
        },
      ],
      rawContent: '# Unknown Section\n\nSome content',
    };

    validateCV(cv, 'cv', mockLogger);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(vi.mocked(mockLogger.warn)).toHaveBeenCalled();
  });
});

describe('validateCV metadata sources', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should pass when all required fields come from frontmatter only', () => {
    // Pattern 2: frontmatter only, no env vars
    delete process.env.NAME;
    delete process.env.EMAIL_ADDRESS;
    delete process.env.PHONE_NUMBER;

    const cv: ParsedCV = {
      metadata: {
        name: 'Frontmatter User',
        email_address: 'frontmatter@example.com',
        phone_number: '111-111-1111',
      },
      sections: [
        {
          id: 'experience',
          title: 'Experience',
          content: { type: 'text', text: 'Some experience' },
        },
      ],
      rawContent: '',
    };

    const result = validateCV(cv, 'cv', mockLogger);
    expect(result.ok).toBe(true);
  });

  it('should fail when no frontmatter and no env vars (pattern 4)', () => {
    // Pattern 4: no frontmatter, no env vars
    delete process.env.NAME;
    delete process.env.EMAIL_ADDRESS;
    delete process.env.PHONE_NUMBER;

    const cv: ParsedCV = {
      metadata: {
        name: undefined as unknown as string,
        email_address: undefined as unknown as string,
        phone_number: undefined as unknown as string,
      },
      sections: [
        {
          id: 'experience',
          title: 'Experience',
          content: { type: 'text', text: 'Some experience' },
        },
      ],
      rawContent: '',
    };

    const result = validateCV(cv, 'cv', mockLogger);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Should report all three missing required fields
      expect(
        result.error.some((e: ValidationError) => e.message.includes('name')),
      ).toBe(true);
      expect(
        result.error.some((e: ValidationError) =>
          e.message.includes('email_address'),
        ),
      ).toBe(true);
      expect(
        result.error.some((e: ValidationError) =>
          e.message.includes('phone_number'),
        ),
      ).toBe(true);
    }
  });

  it('should fail with specific error messages indicating how to set missing fields', () => {
    const cv: ParsedCV = {
      metadata: {
        name: undefined as unknown as string,
        email_address: 'test@example.com',
        phone_number: undefined as unknown as string,
      },
      sections: [
        {
          id: 'experience',
          title: 'Experience',
          content: { type: 'text', text: 'Some experience' },
        },
      ],
      rawContent: '',
    };

    const result = validateCV(cv, 'cv', mockLogger);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Error messages should mention both env var and frontmatter options
      const nameError = result.error.find(
        (e: ValidationError) => e.field === 'name',
      );
      expect(nameError).toBeDefined();
      expect(nameError?.message).toContain('NAME');
      expect(nameError?.message).toContain('frontmatter');

      const phoneError = result.error.find(
        (e: ValidationError) => e.field === 'phone_number',
      );
      expect(phoneError).toBeDefined();
      expect(phoneError?.message).toContain('PHONE_NUMBER');
      expect(phoneError?.message).toContain('frontmatter');
    }
  });

  it('should pass when partial frontmatter is supplemented by env vars (pattern 1)', () => {
    // Pattern 1: both frontmatter and env vars
    // This is tested at parser level, but validator should pass if metadata is complete
    const cv: ParsedCV = {
      metadata: {
        name: 'Mixed User',
        email_address: 'mixed@example.com',
        phone_number: '222-222-2222',
      },
      sections: [
        {
          id: 'experience',
          title: 'Experience',
          content: { type: 'text', text: 'Some experience' },
        },
      ],
      rawContent: '',
    };

    const result = validateCV(cv, 'cv', mockLogger);
    expect(result.ok).toBe(true);
  });
});
