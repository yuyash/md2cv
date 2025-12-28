# Development Guide

[![Coverage](https://img.shields.io/endpoint?url=https://yuyash.github.io/md2cv/badge.json)](https://yuyash.github.io/md2cv/)
[![CI](https://github.com/yuyash/md2cv/actions/workflows/ci.yml/badge.svg)](https://github.com/yuyash/md2cv/actions/workflows/ci.yml)

This document describes the project structure, implementation details, and testing strategy for md2cv.

## Project Structure

```
md2cv/
├── src/
│   ├── bin.ts              # CLI entry point
│   ├── index.ts            # Library exports
│   ├── cli/
│   │   └── index.ts        # CLI implementation (Commander.js)
│   ├── generator/
│   │   ├── index.ts        # Output generation orchestration
│   │   ├── resume_en.ts    # English CV HTML generator
│   │   ├── resume_ja.ts    # Japanese CV HTML generator
│   │   └── rirekisho/      # Japanese rirekisho (履歴書) generator
│   │       ├── index.ts
│   │       ├── components.ts
│   │       ├── data.ts
│   │       ├── layout.ts
│   │       ├── styles.ts
│   │       └── types.ts
│   ├── parser/
│   │   └── index.ts        # Markdown parser (remark-based)
│   ├── template/
│   │   ├── index.ts
│   │   ├── generator.ts    # Template generation for `init` command
│   │   └── definitions/    # Language-specific template definitions
│   │       ├── en.ts
│   │       └── ja.ts
│   ├── types/
│   │   ├── config.ts       # CLI options and configuration types
│   │   ├── errors.ts       # Error types and factory functions
│   │   ├── metadata.ts     # CV metadata types
│   │   ├── result.ts       # Result type for error handling
│   │   ├── sections.ts     # Section definitions and utilities
│   │   └── template.ts     # Template types
│   └── validator/
│       └── index.ts        # CV validation logic
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── examples/               # Example CV files
└── dist/                   # Compiled output
```

## Architecture

### Data Flow

```
Markdown Input
     │
     ▼
┌─────────────┐
│   Parser    │  Parse frontmatter + sections
└─────────────┘
     │
     ▼
┌─────────────┐
│  Validator  │  Validate required fields
└─────────────┘
     │
     ▼
┌─────────────┐
│  Generator  │  Generate HTML/PDF
└─────────────┘
     │
     ▼
Output Files (HTML/PDF)
```

### Key Modules

#### Parser (`src/parser/`)
- Uses `unified` with `remark-parse` for Markdown parsing
- Extracts YAML frontmatter for metadata
- Parses sections based on H2 headings
- Supports structured content (education, experience, skills, etc.)

#### Generator (`src/generator/`)
- `resume_en.ts`: English CV format with Times font
- `resume_ja.ts`: Japanese CV format (職務経歴書) with Mincho font
- `rirekisho/`: Traditional Japanese resume format (履歴書)
- Uses Puppeteer for PDF generation

#### Types (`src/types/`)
- `Result<T, E>`: Discriminated union for error handling
- `ParsedSection`: Represents parsed CV sections
- `CVMetadata`: CV metadata (name, email, phone, etc.)
- Error types with factory functions for consistent error creation

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm

### Installation

```bash
git clone https://github.com/yuyash/md2cv.git
cd md2cv
npm install
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run check` | Run all checks (typecheck, lint, format, unit tests) |
| `npm run typecheck` | Type check with TypeScript |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |

## Testing

### Test Structure

```
tests/
├── unit/                    # Fast, isolated tests
│   ├── cli.test.ts          # CLI functions
│   ├── errors.test.ts       # Error utilities
│   ├── generator.test.ts    # Generator utilities
│   ├── parser.test.ts       # Markdown parser
│   ├── result.test.ts       # Result type utilities
│   ├── resume_en.test.ts    # English CV generator
│   ├── resume_ja.test.ts    # Japanese CV generator
│   ├── sections.test.ts     # Section definitions
│   ├── template.test.ts     # Template generator
│   ├── validator.test.ts    # CV validator
│   └── rirekisho/           # Rirekisho component tests
├── integration/             # Component integration tests
│   ├── rirekisho.test.ts    # Rirekisho generation
│   └── template.test.ts     # Template generation
└── e2e/                     # Full CLI tests
    ├── cli.test.ts          # CLI command tests
    └── fixtures/            # Test input files
```

### Running Tests

```bash
# Run all tests
npm run test

# Run unit tests only (fast)
npm run test:unit

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Coverage

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

**Coverage Thresholds:**
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

**View Coverage Report:**
- Local: Open `coverage/index.html` in a browser
- Online: [https://yuyash.github.io/md2cv/](https://yuyash.github.io/md2cv/)

### Writing Tests

#### Unit Test Example

```typescript
import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../src/generator/index.js';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });
});
```

#### Integration Test Example

```typescript
import { describe, expect, it } from 'vitest';
import { generateCVEnHTML } from '../../src/generator/resume_en.js';

describe('English CV Generation', () => {
  it('should generate valid HTML', () => {
    const cv = {
      metadata: { name: 'John Doe', email_address: 'john@example.com', phone_number: '123' },
      sections: [],
    };
    const html = generateCVEnHTML(cv, { paperSize: 'a4' });
    expect(html).toContain('<!DOCTYPE html>');
  });
});
```

## Code Style

### TypeScript
- Strict mode enabled
- ESLint with TypeScript rules
- Prettier for formatting

### Conventions
- Use `readonly` for immutable properties
- Use `Result<T, E>` for operations that can fail
- Factory functions for error creation (`createParseError`, etc.)
- Explicit return types for public functions

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

## CI/CD

### GitHub Actions

The CI pipeline (`.github/workflows/ci.yml`) runs:
1. **Test Job**: Runs on Node.js 18, 20, 22
   - Type checking
   - Linting
   - All tests

2. **Coverage Job**: Runs on main branch push
   - Generates coverage report
   - Deploys to GitHub Pages

### Release Process

Uses [Release Please](https://github.com/googleapis/release-please) for automated releases:
1. Merge PRs with conventional commits
2. Release Please creates a release PR
3. Merge the release PR to publish to npm

## Troubleshooting

### Common Issues

**Tests timeout:**
```bash
# Increase timeout in vitest.config.ts
testTimeout: 60000
```

**PDF generation fails:**
```bash
# Ensure Puppeteer dependencies are installed
npx puppeteer browsers install chrome
```

**Coverage below threshold:**
```bash
# Check uncovered lines
npm run test:coverage
# Open coverage/index.html to see details
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and add tests
4. Run `npm run check` to verify
5. Commit with conventional commit message
6. Push and create a Pull Request
