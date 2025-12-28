/**
 * Unit tests for CLI module
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createCLIProgram,
  createLogger,
  loadConfigFile,
  resolveConfig,
  runInit,
  type InitOptions,
} from '../../src/cli/index.js';
import type { CLIOptions } from '../../src/types/config.js';

describe('createLogger', () => {
  it('should create a logger with info level by default', () => {
    const logger = createLogger(false);

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should create a logger with debug level when debug is true', () => {
    const logger = createLogger(true);

    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
  });

  it('should create a JSON format logger', () => {
    const logger = createLogger(false, 'json');

    expect(logger).toBeDefined();
  });

  it('should create a text format logger', () => {
    const logger = createLogger(false, 'text');

    expect(logger).toBeDefined();
  });
});

describe('loadConfigFile', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2cv-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should load JSON config file', () => {
    const configPath = path.join(tempDir, 'config.json');
    const config = { format: 'cv', outputType: 'pdf' };
    fs.writeFileSync(configPath, JSON.stringify(config));

    const loaded = loadConfigFile(configPath);

    expect(loaded).toEqual(config);
  });

  it('should load YAML config file', () => {
    const configPath = path.join(tempDir, 'config.yaml');
    const yamlContent = 'format: cv\noutputType: pdf';
    fs.writeFileSync(configPath, yamlContent);

    const loaded = loadConfigFile(configPath);

    expect(loaded.format).toBe('cv');
    expect(loaded.outputType).toBe('pdf');
  });

  it('should load YML config file', () => {
    const configPath = path.join(tempDir, 'config.yml');
    const yamlContent = 'format: rirekisho\npaperSize: b4';
    fs.writeFileSync(configPath, yamlContent);

    const loaded = loadConfigFile(configPath);

    expect(loaded.format).toBe('rirekisho');
    expect(loaded.paperSize).toBe('b4');
  });

  it('should throw error for non-existent file', () => {
    expect(() => loadConfigFile('/non/existent/path.json')).toThrow(
      'Configuration file not found',
    );
  });

  it('should throw error for unsupported format', () => {
    const configPath = path.join(tempDir, 'config.txt');
    fs.writeFileSync(configPath, 'some content');

    expect(() => loadConfigFile(configPath)).toThrow(
      'Unsupported config file format',
    );
  });
});

describe('resolveConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2cv-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should use CLI options as primary source', () => {
    const inputPath = path.join(tempDir, 'input.md');
    fs.writeFileSync(inputPath, '# Test');

    const cliOptions: CLIOptions = {
      input: inputPath,
      format: 'rirekisho',
      outputType: 'html',
      paperSize: 'b4',
      debug: true,
      logFormat: 'json',
    };

    const config = resolveConfig(cliOptions);

    expect(config.format).toBe('rirekisho');
    expect(config.outputType).toBe('html');
    expect(config.paperSize).toBe('b4');
    expect(config.debug).toBe(true);
    expect(config.logFormat).toBe('json');
  });

  it('should use default values when not specified', () => {
    const inputPath = path.join(tempDir, 'input.md');
    fs.writeFileSync(inputPath, '# Test');

    const cliOptions: CLIOptions = {
      input: inputPath,
      debug: false,
    };

    const config = resolveConfig(cliOptions);

    expect(config.format).toBe('cv');
    expect(config.outputType).toBe('pdf');
    expect(config.paperSize).toBe('a4');
    expect(config.logFormat).toBe('text');
    expect(config.hideMotivation).toBe(false);
  });

  it('should derive output path from input path', () => {
    const inputPath = path.join(tempDir, 'my-resume.md');
    fs.writeFileSync(inputPath, '# Test');

    const cliOptions: CLIOptions = {
      input: inputPath,
      debug: false,
    };

    const config = resolveConfig(cliOptions);

    expect(config.output).toBe(path.join(tempDir, 'my-resume'));
  });

  it('should use explicit output path when provided', () => {
    const inputPath = path.join(tempDir, 'input.md');
    const outputPath = path.join(tempDir, 'output', 'result');
    fs.writeFileSync(inputPath, '# Test');

    const cliOptions: CLIOptions = {
      input: inputPath,
      output: outputPath,
      debug: false,
    };

    const config = resolveConfig(cliOptions);

    expect(config.output).toBe(outputPath);
  });

  it('should load config from file when specified', () => {
    const inputPath = path.join(tempDir, 'input.md');
    const configPath = path.join(tempDir, 'config.json');
    fs.writeFileSync(inputPath, '# Test');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        format: 'both',
        outputType: 'both',
        paperSize: 'letter',
      }),
    );

    const cliOptions: CLIOptions = {
      input: inputPath,
      config: configPath,
      debug: false,
    };

    const config = resolveConfig(cliOptions);

    expect(config.format).toBe('both');
    expect(config.outputType).toBe('both');
    expect(config.paperSize).toBe('letter');
  });

  it('should prioritize CLI options over config file', () => {
    const inputPath = path.join(tempDir, 'input.md');
    const configPath = path.join(tempDir, 'config.json');
    fs.writeFileSync(inputPath, '# Test');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        format: 'rirekisho',
        outputType: 'html',
      }),
    );

    const cliOptions: CLIOptions = {
      input: inputPath,
      config: configPath,
      format: 'cv',
      debug: false,
    };

    const config = resolveConfig(cliOptions);

    expect(config.format).toBe('cv');
    expect(config.outputType).toBe('html'); // from config file
  });

  it('should parse section order from comma-separated string', () => {
    const inputPath = path.join(tempDir, 'input.md');
    fs.writeFileSync(inputPath, '# Test');

    const cliOptions: CLIOptions = {
      input: inputPath,
      sectionOrder: 'experience, education, skills',
      debug: false,
    };

    const config = resolveConfig(cliOptions);

    expect(config.sectionOrder).toEqual(['experience', 'education', 'skills']);
  });

  it('should throw error for invalid photo path', () => {
    const inputPath = path.join(tempDir, 'input.md');
    fs.writeFileSync(inputPath, '# Test');

    const cliOptions: CLIOptions = {
      input: inputPath,
      photo: '/non/existent/photo.png',
      debug: false,
    };

    expect(() => resolveConfig(cliOptions)).toThrow('Photo file not found');
  });

  it('should throw error for unsupported photo format', () => {
    const inputPath = path.join(tempDir, 'input.md');
    const photoPath = path.join(tempDir, 'photo.gif');
    fs.writeFileSync(inputPath, '# Test');
    fs.writeFileSync(photoPath, 'fake image');

    const cliOptions: CLIOptions = {
      input: inputPath,
      photo: photoPath,
      debug: false,
    };

    expect(() => resolveConfig(cliOptions)).toThrow('Unsupported photo format');
  });

  it('should accept valid photo path', () => {
    const inputPath = path.join(tempDir, 'input.md');
    const photoPath = path.join(tempDir, 'photo.png');
    fs.writeFileSync(inputPath, '# Test');
    fs.writeFileSync(photoPath, 'fake image');

    const cliOptions: CLIOptions = {
      input: inputPath,
      photo: photoPath,
      debug: false,
    };

    const config = resolveConfig(cliOptions);

    expect(config.photo).toBe(photoPath);
  });

  it('should throw error for invalid stylesheet path', () => {
    const inputPath = path.join(tempDir, 'input.md');
    fs.writeFileSync(inputPath, '# Test');

    const cliOptions: CLIOptions = {
      input: inputPath,
      stylesheet: '/non/existent/style.css',
      debug: false,
    };

    expect(() => resolveConfig(cliOptions)).toThrow(
      'Stylesheet file not found',
    );
  });

  it('should accept valid stylesheet path', () => {
    const inputPath = path.join(tempDir, 'input.md');
    const stylesheetPath = path.join(tempDir, 'style.css');
    fs.writeFileSync(inputPath, '# Test');
    fs.writeFileSync(stylesheetPath, 'body { color: red; }');

    const cliOptions: CLIOptions = {
      input: inputPath,
      stylesheet: stylesheetPath,
      debug: false,
    };

    const config = resolveConfig(cliOptions);

    expect(config.stylesheet).toBe(stylesheetPath);
  });
});

describe('runInit', () => {
  let tempDir: string;
  let consoleSpy: Mock;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2cv-test-'));
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as Mock;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    consoleSpy.mockRestore();
  });

  it('should generate English CV template to stdout', () => {
    const options: InitOptions = {
      language: 'en',
      format: 'cv',
      output: undefined,
      noComments: false,
      listTemplates: false,
      listSections: false,
    };

    const result = runInit(options);

    expect(result).toBe('');
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('name:');
  });

  it('should generate Japanese template to stdout', () => {
    const options: InitOptions = {
      language: 'ja',
      format: 'cv',
      output: undefined,
      noComments: false,
      listTemplates: false,
      listSections: false,
    };

    const result = runInit(options);

    expect(result).toBe('');
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('name:');
  });

  it('should write template to file when output is specified', () => {
    const outputPath = path.join(tempDir, 'template.md');
    const options: InitOptions = {
      language: 'en',
      format: 'cv',
      output: outputPath,
      noComments: false,
      listTemplates: false,
      listSections: false,
    };

    const result = runInit(options);

    expect(result).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('name:');
  });

  it('should create directory if it does not exist', () => {
    const outputPath = path.join(tempDir, 'subdir', 'template.md');
    const options: InitOptions = {
      language: 'en',
      format: 'cv',
      output: outputPath,
      noComments: false,
      listTemplates: false,
      listSections: false,
    };

    const result = runInit(options);

    expect(result).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('should list templates when listTemplates is true', () => {
    const options: InitOptions = {
      language: 'en',
      format: 'cv',
      output: undefined,
      noComments: false,
      listTemplates: true,
      listSections: false,
    };

    const result = runInit(options);

    expect(result).toBe('');
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('en');
    expect(output).toContain('ja');
  });

  it('should list sections when listSections is true', () => {
    const options: InitOptions = {
      language: 'en',
      format: 'cv',
      output: undefined,
      noComments: false,
      listTemplates: false,
      listSections: true,
    };

    const result = runInit(options);

    expect(result).toBe('');
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('Summary');
    expect(output).toContain('Experience');
  });

  it('should generate template without comments when noComments is true', () => {
    const options: InitOptions = {
      language: 'en',
      format: 'cv',
      output: undefined,
      noComments: true,
      listTemplates: false,
      listSections: false,
    };

    runInit(options);

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    // Comments typically start with <!-- or # in markdown
    expect(output).not.toContain('<!--');
  });
});

describe('createCLIProgram', () => {
  it('should create a Commander program', () => {
    const program = createCLIProgram();

    expect(program).toBeDefined();
    expect(program.name()).toBe('md2cv');
  });

  it('should have generate command', () => {
    const program = createCLIProgram();
    const commands = program.commands.map((c) => c.name());

    expect(commands).toContain('generate');
  });

  it('should have init command', () => {
    const program = createCLIProgram();
    const commands = program.commands.map((c) => c.name());

    expect(commands).toContain('init');
  });
});
