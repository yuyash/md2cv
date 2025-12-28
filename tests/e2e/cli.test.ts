/**
 * CLI E2E Tests - Full Pattern Coverage
 * Tests all CLI options and combinations
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const OUTPUT_DIR = path.join(__dirname, 'output');
const CLI_PATH = path.join(__dirname, '../../dist/bin.js');

// Helper to run CLI command
function runCLI(args: string): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  try {
    const result = spawnSync(
      'node',
      [CLI_PATH, ...args.split(' ').filter((a) => a)],
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      exitCode: result.status ?? 0,
    };
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
      exitCode: e.status ?? 1,
    };
  }
}

// Helper to check if file exists
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// Helper to clean output directory
function cleanOutput(): void {
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR);
    for (const file of files) {
      const filePath = path.join(OUTPUT_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

describe('CLI E2E Tests', () => {
  beforeAll(() => {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    // Build the project first
    execSync('npm run build', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'ignore',
    });
  });

  afterAll(() => {
    // cleanOutput();
  });

  describe('Basic Options', () => {
    it('should show version with --version', () => {
      const result = runCLI('--version');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should show help with --help', () => {
      const result = runCLI('--help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('md2cv');
      expect(result.stdout).toContain('generate');
      expect(result.stdout).toContain('init');
    });

    it('should show generate command help', () => {
      const result = runCLI('generate --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('-i, --input');
      expect(result.stdout).toContain('-o, --output');
      expect(result.stdout).toContain('-f, --format');
      expect(result.stdout).toContain('-t, --output-type');
      expect(result.stdout).toContain('-p, --paper-size');
      expect(result.stdout).toContain('-c, --config');
      expect(result.stdout).toContain('--log-format');
      expect(result.stdout).toContain('--verbose');
    });

    it('should fail without required -i option', () => {
      const result = runCLI('');
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('--input');
    });

    it('should fail with non-existent input file', () => {
      const result = runCLI('-i /non/existent/file.md');
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('not found');
    });
  });

  describe('Output Format (-f, --format)', () => {
    beforeAll(() => cleanOutput());

    it('should generate cv format (default)', () => {
      const output = path.join(OUTPUT_DIR, 'format-default');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output}`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });

    it('should generate cv format with -f cv', () => {
      const output = path.join(OUTPUT_DIR, 'format-cv');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} -f cv`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });

    it('should generate rirekisho format with -f rirekisho', () => {
      const output = path.join(OUTPUT_DIR, 'format-rirekisho');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const result = runCLI(`-i ${input} -o ${output} -f rirekisho -p a3`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);
    });

    it('should generate both formats with -f both', () => {
      const output = path.join(OUTPUT_DIR, 'format-both');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const result = runCLI(`-i ${input} -o ${output} -f both -p a3`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);
    });
  });

  describe('Output Type (-t, --output-type)', () => {
    beforeAll(() => cleanOutput());

    it('should generate PDF (default)', () => {
      const output = path.join(OUTPUT_DIR, 'type-default');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output}`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
      expect(fileExists(`${output}_cv.html`)).toBe(false);
    });

    it('should generate PDF with -t pdf', () => {
      const output = path.join(OUTPUT_DIR, 'type-pdf');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} -t pdf`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });

    it('should generate HTML with -t html', () => {
      const output = path.join(OUTPUT_DIR, 'type-html');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} -t html`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.html`)).toBe(true);
      expect(fileExists(`${output}_cv.pdf`)).toBe(false);
    });

    it('should generate both PDF and HTML with -t both', () => {
      const output = path.join(OUTPUT_DIR, 'type-both');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} -t both`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
      expect(fileExists(`${output}_cv.html`)).toBe(true);
    });
  });

  describe('Paper Size (-p, --paper-size)', () => {
    beforeAll(() => cleanOutput());

    it('should use A4 paper size (default)', () => {
      const output = path.join(OUTPUT_DIR, 'paper-default');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output}`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });

    it('should use A4 paper size with -p a4', () => {
      const output = path.join(OUTPUT_DIR, 'paper-a4');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} -p a4`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });

    it('should use A3 paper size with -p a3', () => {
      const output = path.join(OUTPUT_DIR, 'paper-a3');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const result = runCLI(`-i ${input} -o ${output} -f rirekisho -p a3`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);
    });

    it('should use B4 paper size with -p b4', () => {
      const output = path.join(OUTPUT_DIR, 'paper-b4');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const result = runCLI(`-i ${input} -o ${output} -f rirekisho -p b4`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);
    });

    it('should use B5 paper size with -p b5', () => {
      const output = path.join(OUTPUT_DIR, 'paper-b5');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} -p b5`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });

    it('should use Letter paper size with -p letter', () => {
      const output = path.join(OUTPUT_DIR, 'paper-letter');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} -p letter`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });
  });

  describe('Rirekisho Paper Sizes', () => {
    beforeAll(() => cleanOutput());

    const paperSizes = [
      { size: 'a3', width: '420mm', height: '297mm' },
      { size: 'a4', width: '297mm', height: '210mm' },
      { size: 'b4', width: '364mm', height: '257mm' },
      { size: 'b5', width: '257mm', height: '182mm' },
      { size: 'letter', width: '279.4mm', height: '215.9mm' },
    ];

    for (const { size, width, height } of paperSizes) {
      it(`should generate rirekisho with correct ${size.toUpperCase()} dimensions`, () => {
        const output = path.join(OUTPUT_DIR, `rirekisho-${size}`);
        const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
        const result = runCLI(
          `-i ${input} -o ${output} -f rirekisho -t html -p ${size}`,
        );

        expect(result.exitCode).toBe(0);
        expect(fileExists(`${output}_rirekisho.html`)).toBe(true);

        const html = fs.readFileSync(`${output}_rirekisho.html`, 'utf-8');
        // Check @page size is set correctly (landscape orientation)
        expect(html).toContain(`size: ${width} ${height} landscape`);
        // Check spread container has correct width
        expect(html).toContain(`width: ${width}`);
        // Check basic structure exists
        expect(html).toContain('class="spread"');
        expect(html).toContain('class="page page--left"');
        expect(html).toContain('class="page page--right"');
        expect(html).toContain('履歴書');
      });
    }
  });

  describe('Rirekisho Structure Validation', () => {
    beforeAll(() => cleanOutput());

    const paperSizes = ['a3', 'a4', 'b4', 'b5', 'letter'];

    for (const size of paperSizes) {
      it(`should have all required sections for ${size.toUpperCase()}`, () => {
        const output = path.join(OUTPUT_DIR, `rirekisho-sections-${size}`);
        const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
        const result = runCLI(
          `-i ${input} -o ${output} -f rirekisho -t html -p ${size}`,
        );

        expect(result.exitCode).toBe(0);

        const html = fs.readFileSync(`${output}_rirekisho.html`, 'utf-8');

        // Check required sections exist
        expect(html).toContain('履歴書'); // Title
        expect(html).toContain('ふりがな'); // Furigana label
        expect(html).toContain('氏'); // Name label (氏名)
        expect(html).toContain('学 歴 ・ 職 歴'); // Left page history table title
        expect(html).toContain('学歴・職歴'); // Right page history table title
        expect(html).toContain('免許・資格'); // License/certification table title
        expect(html).toContain('志望の動機'); // Motivation section
        expect(html).toContain('本人希望記入欄'); // Notes section
        expect(html).toContain('※「性別」欄'); // Gender note

        // Check table structure
        expect(html).toContain('class="table-wrapper"');
        expect(html).toContain('<table>');
        expect(html).toContain('<tr');
        expect(html).toContain('<td');

        // Check that table rows have height set (for consistent layout)
        const trWithHeight = (
          html.match(/<tr style="height: [\d.]+mm">/g) || []
        ).length;
        expect(trWithHeight).toBeGreaterThan(0);
      });
    }
  });

  describe('Hide Motivation Option (--hide-motivation)', () => {
    beforeAll(() => cleanOutput());

    it('should include motivation section by default', () => {
      const output = path.join(OUTPUT_DIR, 'motivation-default');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const result = runCLI(
        `-i ${input} -o ${output} -f rirekisho -t html -p a4`,
      );

      expect(result.exitCode).toBe(0);
      const html = fs.readFileSync(`${output}_rirekisho.html`, 'utf-8');
      expect(html).toContain('志望の動機');
    });

    it('should hide motivation section with --hide-motivation', () => {
      const output = path.join(OUTPUT_DIR, 'motivation-hidden');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const result = runCLI(
        `-i ${input} -o ${output} -f rirekisho -t html -p a4 --hide-motivation`,
      );

      expect(result.exitCode).toBe(0);
      const html = fs.readFileSync(`${output}_rirekisho.html`, 'utf-8');
      expect(html).not.toContain('志望の動機');
      // Notes section should still exist
      expect(html).toContain('本人希望記入欄');
    });
  });

  describe('Config File (-c, --config)', () => {
    beforeAll(() => cleanOutput());

    it('should load JSON config file with explicit format override', () => {
      const output = path.join(OUTPUT_DIR, 'config-json');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const config = path.join(FIXTURES_DIR, 'config-full.json');
      // Explicitly use -f both to test config file loading works
      const result = runCLI(
        `-i ${input} -o ${output} -c ${config} -f both -t both -p a3`,
      );

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
      expect(fileExists(`${output}_cv.html`)).toBe(true);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);
      expect(fileExists(`${output}_rirekisho.html`)).toBe(true);
    });

    it('should load YAML config file with explicit format override', () => {
      const output = path.join(OUTPUT_DIR, 'config-yaml');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const config = path.join(FIXTURES_DIR, 'config-full.yaml');
      // Explicitly use -f both to test config file loading works
      const result = runCLI(
        `-i ${input} -o ${output} -c ${config} -f both -t both -p a3`,
      );

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
      expect(fileExists(`${output}_cv.html`)).toBe(true);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);
      expect(fileExists(`${output}_rirekisho.html`)).toBe(true);
    });

    it('should fail with non-existent config file', () => {
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -c /non/existent/config.json`);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('not found');
    });

    it('should override config file with CLI options', () => {
      const output = path.join(OUTPUT_DIR, 'config-override');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const config = path.join(FIXTURES_DIR, 'config-full.json');
      // config has format: both, but CLI overrides to cv
      const result = runCLI(
        `-i ${input} -o ${output} -c ${config} -f cv -t pdf`,
      );

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(false);
    });
  });

  describe('Log Format (--log-format)', () => {
    beforeAll(() => cleanOutput());

    it('should output text format logs (default)', () => {
      const output = path.join(OUTPUT_DIR, 'log-text');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} --verbose`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('DEBUG');
      expect(result.stdout).toContain('INFO');
      // Text format has timestamps like [2025-12-23 14:00:00.000 -0800]
      expect(result.stdout).toMatch(/\[\d{4}-\d{2}-\d{2}/);
    });

    it('should output text format logs with --log-format text', () => {
      const output = path.join(OUTPUT_DIR, 'log-text-explicit');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(
        `-i ${input} -o ${output} --verbose --log-format text`,
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('DEBUG');
    });

    it('should output JSON format logs with --log-format json', () => {
      const output = path.join(OUTPUT_DIR, 'log-json');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(
        `-i ${input} -o ${output} --verbose --log-format json`,
      );

      expect(result.exitCode).toBe(0);
      // JSON format should have structured output
      expect(result.stdout).toContain('"level":"DEBUG"');
      expect(result.stdout).toContain('"timestamp"');
      expect(result.stdout).toContain('"msg"');
    });
  });

  describe('Debug Mode (--verbose)', () => {
    beforeAll(() => cleanOutput());

    it('should not show debug logs without --verbose', () => {
      const output = path.join(OUTPUT_DIR, 'debug-off');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} --log-format json`);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).not.toContain('"level":"DEBUG"');
      expect(result.stdout).toContain('"level":"INFO"');
    });

    it('should show debug logs with --verbose', () => {
      const output = path.join(OUTPUT_DIR, 'verbose-on');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(
        `-i ${input} -o ${output} --verbose --log-format json`,
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('"level":"DEBUG"');
    });
  });

  describe('Language Detection', () => {
    beforeAll(() => cleanOutput());

    it('should generate English CV for English input', () => {
      const output = path.join(OUTPUT_DIR, 'lang-en');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} -t html`);

      expect(result.exitCode).toBe(0);
      const html = fs.readFileSync(`${output}_cv.html`, 'utf-8');
      expect(html).toContain('lang="en"');
    });

    it('should generate Japanese CV for Japanese input', () => {
      const output = path.join(OUTPUT_DIR, 'lang-ja');
      const input = path.join(FIXTURES_DIR, 'resume-ja.md');
      const result = runCLI(`-i ${input} -o ${output} -t html`);

      expect(result.exitCode).toBe(0);
      const html = fs.readFileSync(`${output}_cv.html`, 'utf-8');
      expect(html).toContain('lang="ja"');
    });
  });

  describe('Combined Options', () => {
    beforeAll(() => cleanOutput());

    it('should handle all options combined', () => {
      const output = path.join(OUTPUT_DIR, 'combined');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const result = runCLI(
        `-i ${input} -o ${output} -f both -t both -p a3 --verbose --log-format json`,
      );

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
      expect(fileExists(`${output}_cv.html`)).toBe(true);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);
      expect(fileExists(`${output}_rirekisho.html`)).toBe(true);
      expect(result.stdout).toContain('"level":"DEBUG"');
    });
  });

  describe('Input Files', () => {
    beforeAll(() => cleanOutput());

    it('should process resume-en.md', () => {
      const output = path.join(OUTPUT_DIR, 'input-short-en');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output}`);

      expect(result.exitCode).toBe(0);
    });

    it('should process resume-ja.md', () => {
      const output = path.join(OUTPUT_DIR, 'input-short-ja');
      const input = path.join(FIXTURES_DIR, 'resume-ja.md');
      const result = runCLI(`-i ${input} -o ${output}`);

      expect(result.exitCode).toBe(0);
    });

    it('should process resume-en.md', () => {
      const output = path.join(OUTPUT_DIR, 'input-en');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output}`);

      expect(result.exitCode).toBe(0);
    });

    it('should process resume-ja.md', () => {
      const output = path.join(OUTPUT_DIR, 'input-ja');
      const input = path.join(FIXTURES_DIR, 'resume-ja.md');
      const result = runCLI(`-i ${input} -o ${output}`);

      expect(result.exitCode).toBe(0);
    });

    it('should process resume-rirekisho-ja.md as rirekisho', () => {
      const output = path.join(OUTPUT_DIR, 'input-rirekisho');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const result = runCLI(`-i ${input} -o ${output} -f rirekisho -p a3`);

      expect(result.exitCode).toBe(0);
    });

    it('should generate PDF for English CV', () => {
      const output = path.join(OUTPUT_DIR, 'pdf-en');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output} -t pdf`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });

    it('should generate PDF for Japanese CV', () => {
      const output = path.join(OUTPUT_DIR, 'pdf-ja');
      const input = path.join(FIXTURES_DIR, 'resume-ja.md');
      const result = runCLI(`-i ${input} -o ${output} -t pdf`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });
  });

  describe('Output Path', () => {
    beforeAll(() => cleanOutput());

    it('should use input directory when output not specified', () => {
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input}`);

      expect(result.exitCode).toBe(0);
      // Output should be in fixtures directory
      const expectedOutput = path.join(FIXTURES_DIR, 'resume-en_cv.pdf');
      expect(fileExists(expectedOutput)).toBe(true);
      // Clean up
      fs.unlinkSync(expectedOutput);
    });

    it('should create output directory if not exists', () => {
      const output = path.join(OUTPUT_DIR, 'nested/deep/output');
      const input = path.join(FIXTURES_DIR, 'resume-en.md');
      const result = runCLI(`-i ${input} -o ${output}`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
      // Clean up nested directories
      fs.rmSync(path.join(OUTPUT_DIR, 'nested'), { recursive: true });
    });
  });

  describe('Rirekisho Extreme Content', () => {
    beforeAll(() => cleanOutput());

    const paperSizes = ['a3', 'a4', 'b4', 'b5', 'letter'];

    for (const size of paperSizes) {
      it(`should handle extreme content on ${size.toUpperCase()} paper`, () => {
        const output = path.join(OUTPUT_DIR, `rirekisho-extreme-${size}`);
        const input = path.join(FIXTURES_DIR, 'resume-rirekisho-extreme-ja.md');
        const result = runCLI(
          `-i ${input} -o ${output} -f rirekisho -t both -p ${size}`,
        );

        expect(result.exitCode).toBe(0);
        expect(fileExists(`${output}_rirekisho.html`)).toBe(true);
        expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);

        const html = fs.readFileSync(`${output}_rirekisho.html`, 'utf-8');

        // Verify long name is present
        expect(html).toContain('山田 太郎之介左衛門尉源朝臣義経公');

        // Verify long address is present
        expect(html).toContain('グランドタワーマンション');

        // Verify long email is present (may be truncated in display)
        expect(html).toContain('taro.yamada.very.long.email');

        // Verify many education/work history entries
        expect(html).toContain('ハーバード大学');
        expect(html).toContain('長島・大野・常松法律事務所');

        // Verify many certifications
        expect(html).toContain('司法試験合格');
        expect(html).toContain('ニューヨーク州弁護士資格');

        // Verify long motivation text
        expect(html).toContain('デジタルトランスフォーメーション');

        // Verify long notes text
        expect(html).toContain('ハイブリッド形態');

        // Verify basic structure is intact
        expect(html).toContain('class="spread"');
        expect(html).toContain('class="page page--left"');
        expect(html).toContain('class="page page--right"');
      });
    }

    it('should generate PDF without errors for extreme content', () => {
      const output = path.join(OUTPUT_DIR, 'rirekisho-extreme-pdf');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-extreme-ja.md');
      const result = runCLI(
        `-i ${input} -o ${output} -f rirekisho -t pdf -p a4`,
      );

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);

      // Check PDF file size is reasonable (not empty, not corrupted)
      const stats = fs.statSync(`${output}_rirekisho.pdf`);
      expect(stats.size).toBeGreaterThan(10000); // At least 10KB
    });
  });

  describe('Rirekisho Overflow Handling', () => {
    beforeAll(() => cleanOutput());

    describe('Normal case (borderline-pass)', () => {
      const paperSizes = ['a3', 'a4', 'b4', 'b5', 'letter'];

      for (const size of paperSizes) {
        it(`should succeed on ${size.toUpperCase()} with normal data`, () => {
          const output = path.join(
            OUTPUT_DIR,
            `rirekisho-borderline-pass-${size}`,
          );
          const input = path.join(
            FIXTURES_DIR,
            'resume-rirekisho-borderline-pass-ja.md',
          );
          const result = runCLI(
            `-i ${input} -o ${output} -f rirekisho -t html -p ${size}`,
          );

          expect(result.exitCode).toBe(0);
          expect(fileExists(`${output}_rirekisho.html`)).toBe(true);
        });
      }
    });

    describe('Borderline case (borderline-fail)', () => {
      // This fixture has enough data to fail on most sizes but passes on letter
      // due to different preferred row counts and scale factors
      const failingSizes = ['a3', 'a4', 'b4', 'b5'];
      const passingSizes = ['letter'];

      for (const size of failingSizes) {
        it(`should fail on ${size.toUpperCase()} with borderline data`, () => {
          const output = path.join(
            OUTPUT_DIR,
            `rirekisho-borderline-fail-${size}`,
          );
          const input = path.join(
            FIXTURES_DIR,
            'resume-rirekisho-borderline-fail-ja.md',
          );
          const result = runCLI(
            `-i ${input} -o ${output} -f rirekisho -t html -p ${size}`,
          );

          expect(result.exitCode).toBe(1);
          expect(result.stderr).toContain(
            'データが多すぎてページに収まりません',
          );
          expect(fileExists(`${output}_rirekisho.html`)).toBe(false);
        });
      }

      for (const size of passingSizes) {
        it(`should succeed on ${size.toUpperCase()} with borderline data`, () => {
          const output = path.join(
            OUTPUT_DIR,
            `rirekisho-borderline-fail-${size}`,
          );
          const input = path.join(
            FIXTURES_DIR,
            'resume-rirekisho-borderline-fail-ja.md',
          );
          const result = runCLI(
            `-i ${input} -o ${output} -f rirekisho -t html -p ${size}`,
          );

          expect(result.exitCode).toBe(0);
          expect(fileExists(`${output}_rirekisho.html`)).toBe(true);
        });
      }
    });

    describe('Complete overflow case', () => {
      const paperSizes = ['a3', 'a4', 'b4', 'b5', 'letter'];

      for (const size of paperSizes) {
        it(`should fail on ${size.toUpperCase()} with overflow data`, () => {
          const output = path.join(OUTPUT_DIR, `rirekisho-overflow-${size}`);
          const input = path.join(
            FIXTURES_DIR,
            'resume-rirekisho-overflow-ja.md',
          );
          const result = runCLI(
            `-i ${input} -o ${output} -f rirekisho -t html -p ${size}`,
          );

          expect(result.exitCode).toBe(1);
          expect(result.stderr).toContain(
            'データが多すぎてページに収まりません',
          );
          expect(fileExists(`${output}_rirekisho.html`)).toBe(false);
        });
      }
    });

    it('should show Japanese error message for overflow', () => {
      const output = path.join(OUTPUT_DIR, 'rirekisho-overflow-error-msg');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-overflow-ja.md');
      const result = runCLI(
        `-i ${input} -o ${output} -f rirekisho -t html -p a3`,
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('データが多すぎてページに収まりません');
      expect(result.stderr).toContain(
        '学歴・職歴または免許・資格の数を減らしてください',
      );
    });
  });

  describe('Rirekisho Shokureki Label Adjustment', () => {
    beforeAll(() => cleanOutput());

    it('should move 職歴 label to right page when it falls on last row of left page', () => {
      const output = path.join(OUTPUT_DIR, 'rirekisho-shokureki-adjust');
      const input = path.join(
        FIXTURES_DIR,
        'resume-rirekisho-shokureki-adjust-ja.md',
      );
      const result = runCLI(
        `-i ${input} -o ${output} -f rirekisho -t html -p a4`,
      );

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_rirekisho.html`)).toBe(true);

      const html = fs.readFileSync(`${output}_rirekisho.html`, 'utf-8');

      // Split HTML into left and right pages
      const leftPageMatch = html.match(
        /class="page page--left"[\s\S]*?(?=class="page page--right")/,
      );
      const rightPageMatch = html.match(/class="page page--right"[\s\S]*/);

      expect(leftPageMatch).not.toBeNull();
      expect(rightPageMatch).not.toBeNull();

      const leftPage = leftPageMatch![0];
      const rightPage = rightPageMatch![0];

      // 職歴 label should NOT be on the left page (except in the header "学 歴 ・ 職 歴")
      // Count occurrences of 職歴 in left page - should only be in header
      const leftPageShokurekiCount = (leftPage.match(/職歴/g) || []).length;
      // The header contains "学 歴 ・ 職 歴" which has 職歴
      expect(leftPageShokurekiCount).toBeLessThanOrEqual(1);

      // 職歴 label should be on the right page (in the continuation table)
      expect(rightPage).toContain('>職歴<');
    });
  });

  describe('Rirekisho Photo Option', () => {
    beforeAll(() => cleanOutput());

    it('should fail with non-existent photo file', () => {
      const output = path.join(OUTPUT_DIR, 'rirekisho-photo-notfound');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const result = runCLI(
        `-i ${input} -o ${output} -f rirekisho -t html --photo /nonexistent/photo.png`,
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Photo file not found');
    });

    it('should fail with unsupported photo format', () => {
      const output = path.join(OUTPUT_DIR, 'rirekisho-photo-unsupported');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      // Use the markdown file itself as an invalid photo format
      const result = runCLI(
        `-i ${input} -o ${output} -f rirekisho -t html --photo ${input}`,
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Unsupported photo format');
    });

    it('should embed photo in rirekisho HTML output', () => {
      const output = path.join(OUTPUT_DIR, 'rirekisho-photo');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const photo = path.join(FIXTURES_DIR, 'test-photo.png');
      const result = runCLI(
        `-i ${input} -o ${output} -f rirekisho -t html -p a4 --photo ${photo}`,
      );

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_rirekisho.html`)).toBe(true);

      const html = fs.readFileSync(`${output}_rirekisho.html`, 'utf-8');

      // Should contain base64 encoded image
      expect(html).toContain('data:image/png;base64,');
      // Should have photo-box--with-image class
      expect(html).toContain('photo-box--with-image');
      // Should have img tag
      expect(html).toContain('<img');
      // Should NOT contain photo instructions
      expect(html).not.toContain('写真をはる位置');
    });

    it('should generate PDF with photo', () => {
      const output = path.join(OUTPUT_DIR, 'rirekisho-photo-pdf');
      const input = path.join(FIXTURES_DIR, 'resume-rirekisho-ja.md');
      const photo = path.join(FIXTURES_DIR, 'test-photo.png');
      const result = runCLI(
        `-i ${input} -o ${output} -f rirekisho -t pdf -p a4 --photo ${photo}`,
      );

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_rirekisho.pdf`)).toBe(true);
    });
  });

  describe('Skills Section Formats', () => {
    beforeAll(() => cleanOutput());

    it('should render skills in grid format', () => {
      const output = path.join(OUTPUT_DIR, 'skills-grid');
      const input = path.join(FIXTURES_DIR, 'resume-skills-grid-en.md');
      const result = runCLI(`-i ${input} -o ${output} -t html`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.html`)).toBe(true);

      const html = fs.readFileSync(`${output}_cv.html`, 'utf-8');

      // Should have skills-grid class
      expect(html).toContain('skills-grid');
      // Should have grid-template-columns with 3 columns (defined in CSS class)
      expect(html).toContain('skills-grid--cols-3');
      expect(html).toContain('grid-template-columns: 1fr 1fr 1fr');
      // Should have skill items with bullets
      expect(html).toContain('skill-item');
      expect(html).toContain('• JavaScript');
      expect(html).toContain('• TypeScript');
    });

    it('should render skills in categorized format with descriptions', () => {
      const output = path.join(OUTPUT_DIR, 'skills-categorized');
      const input = path.join(FIXTURES_DIR, 'resume-skills-categorized-en.md');
      const result = runCLI(`-i ${input} -o ${output} -t html`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.html`)).toBe(true);

      const html = fs.readFileSync(`${output}_cv.html`, 'utf-8');

      // Should have skill-category class
      expect(html).toContain('skill-category');
      // Should have category names with descriptions
      expect(html).toContain('Languages:');
      expect(html).toContain('JavaScript, TypeScript, Python, Go');
      expect(html).toContain('Frameworks:');
      expect(html).toContain('React, Vue.js, Node.js, Express');
      // Cloud category uses items array, should be joined with comma
      expect(html).toContain('Cloud:');
      expect(html).toContain('AWS, GCP, Azure');
    });

    it('should generate PDF for grid format skills', () => {
      const output = path.join(OUTPUT_DIR, 'skills-grid-pdf');
      const input = path.join(FIXTURES_DIR, 'resume-skills-grid-en.md');
      const result = runCLI(`-i ${input} -o ${output} -t pdf`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });

    it('should generate PDF for categorized format skills', () => {
      const output = path.join(OUTPUT_DIR, 'skills-categorized-pdf');
      const input = path.join(FIXTURES_DIR, 'resume-skills-categorized-en.md');
      const result = runCLI(`-i ${input} -o ${output} -t pdf`);

      expect(result.exitCode).toBe(0);
      expect(fileExists(`${output}_cv.pdf`)).toBe(true);
    });
  });

  describe('Init Command', () => {
    beforeAll(() => cleanOutput());

    describe('Template Generation', () => {
      it('should generate English CV template to stdout', () => {
        const result = runCLI('init -l en -f cv');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('name: John Doe');
        expect(result.stdout).toContain('# Summary');
        expect(result.stdout).toContain('# Experience');
        expect(result.stdout).toContain('# Education');
        expect(result.stdout).toContain('# Skills');
      });

      it('should generate Japanese CV template to stdout', () => {
        const result = runCLI('init -l ja -f cv');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('name: 山田 太郎');
        expect(result.stdout).toContain('# 職務要約');
        expect(result.stdout).toContain('# 職歴');
        expect(result.stdout).toContain('# 学歴');
      });

      it('should generate rirekisho template', () => {
        const result = runCLI('init -l ja -f rirekisho');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('# 職歴');
        expect(result.stdout).toContain('# 志望動機');
        expect(result.stdout).toContain('# 本人希望記入欄');
        expect(result.stdout).not.toContain('# 職務要約');
      });

      it('should generate both format template', () => {
        const result = runCLI('init -l en -f both');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('# Summary');
        expect(result.stdout).toContain('# Motivation');
        expect(result.stdout).toContain('# Notes');
      });

      it('should generate template to file', () => {
        const output = path.join(OUTPUT_DIR, 'init-template.md');
        const result = runCLI(`init -l en -f cv -o ${output}`);

        expect(result.exitCode).toBe(0);
        expect(result.stderr).toContain('Template created:');
        expect(fileExists(output)).toBe(true);

        const content = fs.readFileSync(output, 'utf-8');
        expect(content).toContain('name: John Doe');
        expect(content).toContain('# Summary');
      });

      it('should generate template without comments', () => {
        const result = runCLI('init -l en -f cv --no-comments');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).not.toContain('<!--');
        expect(result.stdout).not.toContain('-->');
        expect(result.stdout).not.toContain('md2cv Template');
      });

      it('should include comments by default', () => {
        const result = runCLI('init -l en -f cv');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('<!--');
        expect(result.stdout).toContain('-->');
        expect(result.stdout).toContain('md2cv Template');
      });
    });

    describe('List Templates', () => {
      it('should list available templates', () => {
        const result = runCLI('init --list-templates');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Available templates:');
        expect(result.stdout).toContain('en - English');
        expect(result.stdout).toContain('ja - 日本語 (Japanese)');
        expect(result.stdout).toContain('Formats:');
        expect(result.stdout).toContain('cv, rirekisho, both');
      });
    });

    describe('List Sections', () => {
      it('should list sections for English CV', () => {
        const result = runCLI('init -l en -f cv --list-sections');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Available sections (cv format):');
        expect(result.stdout).toContain('summary');
        expect(result.stdout).toContain('experience');
        expect(result.stdout).toContain('education');
        expect(result.stdout).toContain('skills');
        expect(result.stdout).toContain('Title:');
        expect(result.stdout).toContain('Usage:');
        expect(result.stdout).toContain('Description:');
      });

      it('should list sections for Japanese rirekisho', () => {
        const result = runCLI('init -l ja -f rirekisho --list-sections');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(
          '利用可能なセクション (rirekisho フォーマット):',
        );
        expect(result.stdout).toContain('experience');
        expect(result.stdout).toContain('motivation');
        expect(result.stdout).toContain('notes');
        expect(result.stdout).toContain('タイトル:');
        expect(result.stdout).toContain('用途:');
        expect(result.stdout).toContain('説明:');
      });
    });

    describe('Error Handling', () => {
      it('should fail with invalid language', () => {
        const result = runCLI('init -l fr -f cv');

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain('Invalid language');
        expect(result.stderr).toContain('Available: en, ja');
      });

      it('should fail with invalid format', () => {
        const result = runCLI('init -l en -f invalid');

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain('Invalid format');
        expect(result.stderr).toContain('Available: cv, rirekisho, both');
      });
    });

    describe('Default Values', () => {
      it('should use English as default language', () => {
        const result = runCLI('init -f cv');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('name: John Doe');
      });

      it('should use cv as default format', () => {
        const result = runCLI('init -l en');

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('# Summary');
        expect(result.stdout).not.toContain('# Motivation');
      });
    });
  });
});
