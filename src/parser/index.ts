/**
 * Markdown Parser module
 * Parses Markdown CV files into structured data
 */

import type { List, Root, RootContent, Table } from 'mdast';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { parse as parseYaml } from 'yaml';

import {
  createParseError,
  failure,
  success,
  type ParseError,
  type Result,
} from '../types/index.js';
import {
  METADATA_FIELDS,
  loadFromEnv,
  loadFromFrontmatter,
  type CVMetadata,
} from '../types/metadata.js';
import {
  findSectionByTag,
  type CertificationEntry,
  type CompetencyEntry,
  type EducationEntry,
  type ExperienceEntry,
  type LanguageEntry,
  type ParsedSection,
  type ProjectEntry,
  type RoleEntry,
  type SectionContent,
  type SkillEntry,
  type TableRow,
} from '../types/sections.js';

/**
 * Parsed CV structure
 */
export interface ParsedCV {
  readonly metadata: CVMetadata;
  readonly sections: readonly ParsedSection[];
  readonly rawContent: string;
}

/**
 * Create markdown processor
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkStringify);
}

/**
 * Extract text from mdast node
 */
function extractText(node: RootContent): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }
  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as RootContent[]).map(extractText).join('');
  }
  return '';
}

/**
 * Remove HTML comments from the beginning of content
 * This allows templates to have comments before frontmatter
 * Note: This handles nested comment markers within comments
 */
function stripLeadingHtmlComments(content: string): string {
  let result = content.trimStart();

  // Keep removing HTML comments from the beginning
  while (result.startsWith('<!--')) {
    // Find the matching closing --> by counting nesting
    let depth = 0;
    let endIndex = -1;

    for (let i = 0; i < result.length - 2; i++) {
      if (result.substring(i, i + 4) === '<!--') {
        depth++;
        i += 3; // Skip past <!--
      } else if (result.substring(i, i + 3) === '-->') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
        i += 2; // Skip past -->
      }
    }

    if (endIndex === -1) break;
    result = result.substring(endIndex + 3).trimStart();
  }

  return result;
}

/**
 * Parse frontmatter delimiter type
 */
function parseFrontmatterDelimiter(content: string): '---' | '+++' | null {
  const trimmed = stripLeadingHtmlComments(content);
  if (trimmed.startsWith('---')) return '---';
  if (trimmed.startsWith('+++')) return '+++';
  return null;
}

/**
 * Validate frontmatter delimiters match (if frontmatter exists)
 * Returns true if no frontmatter or valid frontmatter, false if malformed
 */
function validateFrontmatterDelimiters(
  content: string,
  errors: ParseError[],
): boolean {
  const delimiter = parseFrontmatterDelimiter(content);

  // No frontmatter is valid - it's optional
  if (!delimiter) {
    return true;
  }

  // Strip leading HTML comments before checking delimiters
  const strippedContent = stripLeadingHtmlComments(content);
  const lines = strippedContent.split('\n');
  let foundStart = false;
  let foundEnd = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!foundStart && line === delimiter) {
      foundStart = true;
    } else if (foundStart && !foundEnd && line === delimiter) {
      foundEnd = true;
      break;
    }
  }

  if (!foundEnd) {
    errors.push(
      createParseError(
        `Frontmatter must end with "${delimiter}" to match opening delimiter`,
        1,
        1,
        'frontmatter',
      ),
    );
    return false;
  }

  return true;
}

/**
 * Extract and merge metadata from env vars and frontmatter
 */
function extractMetadata(tree: Root, errors: ParseError[]): CVMetadata | null {
  const yamlNode = tree.children.find((node) => node.type === 'yaml');
  const frontmatter: Record<string, unknown> = {};

  if (yamlNode && 'value' in yamlNode) {
    try {
      const parsed: unknown = parseYaml(String(yamlNode.value));
      if (typeof parsed === 'object' && parsed !== null) {
        Object.assign(frontmatter, parsed as Record<string, unknown>);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(
        createParseError(
          `Invalid YAML frontmatter: ${msg}`,
          1,
          1,
          'frontmatter',
        ),
      );
      return null;
    }
  }

  // Build metadata: env vars first, then frontmatter overrides
  const metadata: Record<string, string | Date | undefined> = {};

  for (const fieldName of Object.keys(METADATA_FIELDS)) {
    // Load from env first
    let value = loadFromEnv(fieldName);
    // Frontmatter overrides
    const fmValue = loadFromFrontmatter(fieldName, frontmatter);
    if (fmValue) {
      value = fmValue;
    }
    if (value) {
      // Parse dob field to Date type
      if (fieldName === 'dob') {
        metadata[fieldName] = parseDateOfBirth(value);
      } else if (fieldName === 'gender') {
        metadata[fieldName] = parseGender(value);
      } else {
        metadata[fieldName] = value;
      }
    }
  }

  return metadata as unknown as CVMetadata;
}

/**
 * Parse list items
 */
function parseListItems(listNode: List): string[] {
  const items: string[] = [];
  for (const item of listNode.children) {
    if (item.type === 'listItem' && item.children) {
      const text = item.children
        .map((child) => extractText(child as RootContent))
        .join('');
      items.push(text.trim());
    }
  }
  return items;
}

/**
 * Parse markdown table to rows
 */
function parseTable(tableNode: Table): TableRow[] {
  const rows: TableRow[] = [];

  // Skip header row
  for (let i = 1; i < tableNode.children.length; i++) {
    const row = tableNode.children[i];
    if (row?.type === 'tableRow' && row.children.length >= 3) {
      const cells = row.children;
      rows.push({
        year: cells[0] ? extractText(cells[0] as RootContent).trim() : '',
        month: cells[1] ? extractText(cells[1] as RootContent).trim() : '',
        content: cells[2] ? extractText(cells[2] as RootContent).trim() : '',
      });
    }
  }

  return rows;
}

/**
 * Safely convert unknown value to string
 */
function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return '';
}

/**
 * Safely convert unknown value to optional string
 */
function safeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return safeString(value);
}

/**
 * Parse date of birth string to Date object
 * Supports formats: YYYY-MM-DD, YYYY/MM/DD, YYYY年MM月DD日, MM/DD/YYYY
 */
function parseDateOfBirth(str: string | undefined): Date | undefined {
  if (!str) return undefined;
  const s = str.trim();

  // YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    return new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
    );
  }

  // YYYY年MM月DD日
  m = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (m) {
    return new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
    );
  }

  // MM/DD/YYYY or MM-DD-YYYY
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    return new Date(
      parseInt(m[3], 10),
      parseInt(m[1], 10) - 1,
      parseInt(m[2], 10),
    );
  }

  return undefined;
}

/**
 * Parse year-month string to Date object (day defaults to 1)
 * Supports formats: YYYY-MM, YYYY/MM, YYYY年MM月, YYYY (year only)
 */
function parseYearMonth(str: string | undefined): Date | undefined {
  if (!str) return undefined;
  const s = str.trim();

  // YYYY-MM or YYYY/MM
  let m = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m) {
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, 1);
  }

  // YYYY年MM月
  m = s.match(/^(\d{4})年(\d{1,2})月/);
  if (m) {
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, 1);
  }

  // YYYY only
  m = s.match(/^(\d{4})$/);
  if (m) {
    return new Date(parseInt(m[1], 10), 0, 1);
  }

  return undefined;
}

/**
 * Check if string represents "present" or "現在"
 */
function isPresent(str: string | undefined): boolean {
  if (!str) return false;
  const s = str.trim().toLowerCase();
  return s === 'present' || s === '現在';
}

/**
 * Parse end date which can be a date or "present"/"現在"
 */
function parseEndDate(str: string | undefined): Date | 'present' | undefined {
  if (!str) return undefined;
  if (isPresent(str)) return 'present';
  return parseYearMonth(str);
}

/**
 * Parse gender string to Gender type
 * Supports: male/m/男, female/f/女, other
 */
function parseGender(
  str: string | undefined,
): 'male' | 'female' | 'other' | undefined {
  if (!str) return undefined;
  const s = str.trim().toLowerCase();
  if (s === 'male' || s === 'm' || s === '男') return 'male';
  if (s === 'female' || s === 'f' || s === '女') return 'female';
  if (s === 'other') return 'other';
  return undefined;
}

/**
 * Parse summary which can be a string or an array of strings
 */
function parseSummary(value: unknown): readonly string[] | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.map((s) => safeString(s));
  return undefined;
}

/**
 * Parse resume:education code block
 */
function parseEducationBlock(code: string): EducationEntry[] {
  try {
    const parsed: unknown = parseYaml(code);
    // Handle both single object and array
    const items = Array.isArray(parsed) ? parsed : [parsed];

    return items
      .map((item: unknown) => {
        const obj = item as Record<string, unknown>;
        const school = safeString(obj.school);
        const degree = safeOptionalString(obj.degree);
        const start = parseYearMonth(safeOptionalString(obj.start));
        const end = parseYearMonth(safeOptionalString(obj.end));

        // Skip entries missing required fields (degree is optional for rirekisho format)
        if (!school || !start || !end) {
          return null;
        }

        const location = safeOptionalString(obj.location);
        const details = Array.isArray(obj.details)
          ? obj.details.map((d) => {
              // Handle YAML parsing objects like { "GPA": "3.8/4.0" } as "GPA: 3.8/4.0"
              if (typeof d === 'object' && d !== null) {
                const entries = Object.entries(d as Record<string, unknown>);
                if (entries.length > 0) {
                  return entries
                    .map(([k, v]) => `${k}: ${safeString(v)}`)
                    .join(', ');
                }
                return '';
              }
              return safeString(d);
            })
          : undefined;

        return {
          school,
          degree,
          start,
          end,
          ...(location !== undefined && { location }),
          ...(details !== undefined && {
            details: details as readonly string[],
          }),
        } as EducationEntry;
      })
      .filter((entry): entry is EducationEntry => entry !== null);
  } catch {
    return [];
  }
}

/**
 * Parse a project entry from YAML
 */
function parseProjectEntry(proj: Record<string, unknown>): ProjectEntry | null {
  const name = safeString(proj.name);
  const start = parseYearMonth(safeOptionalString(proj.start));
  const end = parseYearMonth(safeOptionalString(proj.end));

  // Skip entries missing required fields
  if (!name || !start || !end) {
    return null;
  }

  const bullets = Array.isArray(proj.bullets)
    ? proj.bullets.map((b) => safeString(b))
    : undefined;

  return {
    name,
    start,
    end,
    ...(bullets !== undefined && { bullets }),
  };
}

/**
 * Parse a role entry from YAML
 */
function parseRoleEntry(role: Record<string, unknown>): RoleEntry | null {
  const title = safeString(role.title || role.role);
  const start = parseYearMonth(safeOptionalString(role.start));
  const end = parseEndDate(safeOptionalString(role.end));

  // Skip entries missing required fields
  if (!title || !start || !end) {
    return null;
  }

  const team = safeOptionalString(role.team);
  const summary = parseSummary(role.summary);
  const highlights = Array.isArray(role.highlights)
    ? role.highlights.map((h) => safeString(h))
    : undefined;

  const projects: ProjectEntry[] = [];
  if (Array.isArray(role.projects)) {
    for (const projItem of role.projects) {
      const proj = projItem as Record<string, unknown>;
      const projectEntry = parseProjectEntry(proj);
      if (projectEntry) {
        projects.push(projectEntry);
      }
    }
  }

  return {
    title,
    start,
    end,
    ...(team !== undefined && { team }),
    ...(summary !== undefined && { summary }),
    ...(highlights !== undefined && { highlights }),
    ...(projects.length > 0 && { projects }),
  };
}

/**
 * Parse resume:experience code block
 */
function parseExperienceBlock(code: string): ExperienceEntry[] {
  try {
    const parsed: unknown = parseYaml(code);
    // Handle both single object and array
    const items = Array.isArray(parsed) ? parsed : [parsed];

    const entries: ExperienceEntry[] = [];
    for (const item of items) {
      const obj = item as Record<string, unknown>;
      const company = safeString(obj.company);
      const roles: RoleEntry[] = [];

      // Support both nested roles array and flat role definition
      if (Array.isArray(obj.roles)) {
        for (const roleItem of obj.roles) {
          const role = roleItem as Record<string, unknown>;
          const roleEntry = parseRoleEntry(role);
          if (roleEntry) {
            roles.push(roleEntry);
          }
        }
      } else if (obj.role || obj.title) {
        // Flat role definition (role/title, team, start, end at top level)
        const roleEntry = parseRoleEntry(obj);
        if (roleEntry) {
          roles.push(roleEntry);
        }
      }

      // Skip entries missing required fields
      if (!company || roles.length === 0) {
        continue;
      }

      const location = safeOptionalString(obj.location);

      entries.push({
        company,
        roles: roles as readonly RoleEntry[],
        ...(location !== undefined && { location }),
      });
    }
    return entries;
  } catch {
    return [];
  }
}

/**
 * Parse resume:certifications code block
 */
function parseCertificationsBlock(code: string): CertificationEntry[] {
  try {
    const parsed: unknown = parseYaml(code);
    // Handle both single object and array
    const items = Array.isArray(parsed) ? parsed : [parsed];

    return items
      .map((item: unknown) => {
        const obj = item as Record<string, unknown>;
        const name = safeString(obj.name);
        const date = parseYearMonth(safeOptionalString(obj.date));

        // Skip entries missing required fields
        if (!name || !date) {
          return null;
        }

        const issuer = safeOptionalString(obj.issuer);
        const url = safeOptionalString(obj.url);

        return {
          name,
          date,
          ...(issuer !== undefined && { issuer }),
          ...(url !== undefined && { url }),
        };
      })
      .filter((entry): entry is CertificationEntry => entry !== null);
  } catch {
    return [];
  }
}

/**
 * Parse resume:skills code block
 * Supports three formats:
 * 1. Simple items list with optional columns (grid format):
 *    columns: 3
 *    items:
 *      - JavaScript
 *      - TypeScript
 * 2. Categorized skills with items:
 *    categories:
 *      - category: Programming
 *        items: [JavaScript, TypeScript]
 * 3. Categorized skills with descriptions:
 *    categories:
 *      - category: Languages
 *        description: JavaScript, TypeScript, Python
 */
interface ParsedSkillsResult {
  entries: SkillEntry[];
  columns: number;
  format: 'grid' | 'categorized';
}

function parseSkillEntry(catObj: Record<string, unknown>): SkillEntry {
  const category = safeString(catObj.category);
  const items = Array.isArray(catObj.items)
    ? catObj.items.map((i) => safeString(i))
    : undefined;
  const description = safeOptionalString(catObj.description);
  const level = safeOptionalString(catObj.level);

  return {
    category,
    ...(items !== undefined && { items }),
    ...(description !== undefined && { description }),
    ...(level !== undefined && { level }),
  };
}

function parseSkillsBlock(code: string): ParsedSkillsResult {
  const defaultResult: ParsedSkillsResult = {
    entries: [],
    columns: 3,
    format: 'grid',
  };

  try {
    const parsed: unknown = parseYaml(code);

    // Check if it's the new format with columns and items at top level
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      const columns = typeof obj.columns === 'number' ? obj.columns : 3;

      // Format 1: Simple items list (grid format)
      if (
        Array.isArray(obj.items) &&
        obj.items.every((i) => typeof i === 'string')
      ) {
        const items = obj.items.map((i) => safeString(i));
        // Convert to single SkillEntry with empty category
        return {
          entries: [{ category: '', items }],
          columns,
          format: 'grid',
        };
      }

      // Format 2 & 3: Categorized skills
      if (Array.isArray(obj.categories)) {
        const entries = obj.categories.map((cat: unknown) =>
          parseSkillEntry(cat as Record<string, unknown>),
        );
        return { entries, columns, format: 'categorized' };
      }
    }

    // Legacy format: array of { category, items, level }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const entries = items.map((item: unknown) =>
      parseSkillEntry(item as Record<string, unknown>),
    );

    return { entries, columns: 3, format: 'categorized' };
  } catch {
    return defaultResult;
  }
}

/**
 * Parse resume:competencies code block
 */
function parseCompetenciesBlock(code: string): CompetencyEntry[] {
  try {
    const parsed: unknown = parseYaml(code);
    // Handle both single object and array
    const items = Array.isArray(parsed) ? parsed : [parsed];

    return items.map((item: unknown) => {
      const obj = item as Record<string, unknown>;
      return {
        header: safeString(obj.header),
        description: safeString(obj.description),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Parse resume:languages code block
 */
function parseLanguagesBlock(code: string): LanguageEntry[] {
  try {
    const parsed: unknown = parseYaml(code);
    // Handle both single object and array
    const items = Array.isArray(parsed) ? parsed : [parsed];

    return items
      .map((item: unknown) => {
        const obj = item as Record<string, unknown>;
        const language = safeString(obj.language);
        const level = safeOptionalString(obj.level);

        // Skip entries missing required fields
        if (!language || !level) {
          return null;
        }

        return { language, level };
      })
      .filter((entry): entry is LanguageEntry => entry !== null);
  } catch {
    return [];
  }
}

/**
 * Parse section content from nodes
 */
function parseSectionContent(nodes: RootContent[]): SectionContent {
  // Collect all code blocks and merge entries by type
  const educationEntries: EducationEntry[] = [];
  const experienceEntries: ExperienceEntry[] = [];
  const certificationEntries: CertificationEntry[] = [];
  const skillEntries: SkillEntry[] = [];
  const competencyEntries: CompetencyEntry[] = [];
  const languageEntries: LanguageEntry[] = [];
  let skillsColumns: number | undefined = undefined;
  let skillsFormat: 'grid' | 'categorized' | undefined = undefined;

  for (const node of nodes) {
    if (node.type === 'code') {
      const codeNode = node;
      if (codeNode.lang === 'resume:education') {
        educationEntries.push(...parseEducationBlock(codeNode.value));
      } else if (codeNode.lang === 'resume:experience') {
        experienceEntries.push(...parseExperienceBlock(codeNode.value));
      } else if (codeNode.lang === 'resume:certifications') {
        certificationEntries.push(...parseCertificationsBlock(codeNode.value));
      } else if (codeNode.lang === 'resume:skills') {
        const result = parseSkillsBlock(codeNode.value);
        skillEntries.push(...result.entries);
        if (result.columns !== undefined) {
          skillsColumns = result.columns;
        }
        if (result.format !== undefined) {
          skillsFormat = result.format;
        }
      } else if (codeNode.lang === 'resume:competencies') {
        competencyEntries.push(...parseCompetenciesBlock(codeNode.value));
      } else if (codeNode.lang === 'resume:languages') {
        languageEntries.push(...parseLanguagesBlock(codeNode.value));
      }
    }
  }

  // Return merged entries if any structured blocks found
  if (educationEntries.length > 0) {
    return { type: 'education', entries: educationEntries };
  }
  if (experienceEntries.length > 0) {
    return { type: 'experience', entries: experienceEntries };
  }
  if (certificationEntries.length > 0) {
    return { type: 'certifications', entries: certificationEntries };
  }
  if (skillEntries.length > 0) {
    return {
      type: 'skills',
      entries: skillEntries,
      options: {
        columns: skillsColumns ?? 3,
        format: skillsFormat ?? 'grid',
      },
    };
  }
  if (competencyEntries.length > 0) {
    return { type: 'competencies', entries: competencyEntries };
  }
  if (languageEntries.length > 0) {
    return { type: 'languages', entries: languageEntries };
  }

  // Check for tables
  for (const node of nodes) {
    if (node.type === 'table') {
      const rows = parseTable(node);
      return { type: 'table', rows };
    }
  }

  // Check for lists
  for (const node of nodes) {
    if (node.type === 'list') {
      const items = parseListItems(node);
      return { type: 'list', items };
    }
  }

  // Default to text
  const text = nodes
    .filter((n) => n.type === 'paragraph')
    .map((n) => extractText(n))
    .join('\n\n');

  return { type: 'text', text };
}

/**
 * Parse sections from AST
 */
function parseSections(tree: Root): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const contentNodes = tree.children.filter((node) => node.type !== 'yaml');

  let currentTitle: string | null = null;
  let currentNodes: RootContent[] = [];

  for (const node of contentNodes) {
    if (node.type === 'heading' && node.depth === 1) {
      // Save previous section
      if (currentTitle !== null) {
        const sectionDef = findSectionByTag(currentTitle);
        if (sectionDef) {
          sections.push({
            id: sectionDef.id,
            title: currentTitle,
            content: parseSectionContent(currentNodes),
          });
        }
      }

      // Start new section
      currentTitle = node.children
        .map((c) => extractText(c as RootContent))
        .join('');
      currentNodes = [];
    } else if (currentTitle !== null) {
      currentNodes.push(node);
    }
  }

  // Don't forget last section
  if (currentTitle !== null) {
    const sectionDef = findSectionByTag(currentTitle);
    if (sectionDef) {
      sections.push({
        id: sectionDef.id,
        title: currentTitle,
        content: parseSectionContent(currentNodes),
      });
    }
  }

  return sections;
}

/**
 * Parse markdown content
 */
export function parseMarkdown(
  markdown: string,
): Result<ParsedCV, ParseError[]> {
  const errors: ParseError[] = [];

  // Validate frontmatter delimiters
  if (!validateFrontmatterDelimiters(markdown, errors)) {
    return failure(errors);
  }

  // Strip leading HTML comments before parsing
  // This allows templates to have comments before frontmatter
  const processedMarkdown = stripLeadingHtmlComments(markdown);

  try {
    const processor = createProcessor();
    const tree = processor.parse(processedMarkdown);

    // Extract metadata
    const metadata = extractMetadata(tree, errors);
    if (!metadata) {
      return failure(errors);
    }

    // Parse sections
    const sections = parseSections(tree);

    return success({
      metadata,
      sections,
      rawContent: markdown,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    errors.push(
      createParseError(`Failed to parse markdown: ${msg}`, 1, 1, 'markdown'),
    );
    return failure(errors);
  }
}

export default parseMarkdown;
