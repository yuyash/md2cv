/**
 * LSP-aware parser module
 * Extends the base parser with position information for VS Code integration
 */

import type { Code, Root, RootContent, Yaml } from 'mdast';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { YAMLParseError, parseDocument } from 'yaml';

import {
  createParseError,
  createPosition,
  createRange,
  failure,
  success,
  type ParseError,
  type Position,
  type Range,
  type Result,
} from '../types/index.js';
import { findSectionByTag } from '../types/sections.js';

/**
 * Code block with position information
 */
export interface LocatedCodeBlock {
  readonly type: string; // e.g., 'experience', 'education', 'skills'
  readonly lang: string; // e.g., 'resume:experience'
  readonly content: string;
  readonly range: Range;
  readonly contentRange: Range; // Range of the YAML content inside the block
}

/**
 * Frontmatter field with position information
 */
export interface LocatedFrontmatterField {
  readonly key: string;
  readonly value: string | undefined;
  readonly range: Range;
  readonly keyRange: Range;
  readonly valueRange: Range | undefined;
}

/**
 * Frontmatter with position information
 */
export interface LocatedFrontmatter {
  readonly range: Range;
  readonly fields: readonly LocatedFrontmatterField[];
  readonly raw: string;
}

/**
 * Section with position information
 */
export interface LocatedSection {
  readonly id: string;
  readonly title: string;
  readonly range: Range;
  readonly titleRange: Range;
  readonly codeBlocks: readonly LocatedCodeBlock[];
}

/**
 * Parsed document with full position information for LSP
 */
export interface ParsedDocumentWithPositions {
  readonly frontmatter: LocatedFrontmatter | null;
  readonly sections: readonly LocatedSection[];
  readonly codeBlocks: readonly LocatedCodeBlock[];
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
    .use(remarkFrontmatter, ['yaml']);
}

/**
 * Convert mdast position to our Position type (0-based)
 */
function toPosition(
  point: { line: number; column: number } | undefined,
): Position {
  if (!point) {
    return createPosition(0, 0);
  }
  // mdast uses 1-based lines and columns, convert to 0-based
  return createPosition(point.line - 1, point.column - 1);
}

/**
 * Convert mdast position to our Range type
 */
function toRange(
  position:
    | {
        start: { line: number; column: number };
        end: { line: number; column: number };
      }
    | undefined,
): Range {
  if (!position) {
    return createRange(createPosition(0, 0), createPosition(0, 0));
  }
  return createRange(toPosition(position.start), toPosition(position.end));
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
 * Parse frontmatter YAML with position information
 */
function parseFrontmatterWithPositions(
  yamlNode: Yaml,
  errors: ParseError[],
): LocatedFrontmatter | null {
  const yamlContent = yamlNode.value;
  const nodeRange = toRange(yamlNode.position);

  // The YAML content starts after the opening ---
  // We need to calculate the offset for field positions
  const yamlStartLine = nodeRange.start.line + 1; // Skip the --- line

  const fields: LocatedFrontmatterField[] = [];

  try {
    const doc = parseDocument(yamlContent, { keepSourceTokens: true });

    if (doc.contents && 'items' in doc.contents) {
      for (const item of doc.contents.items) {
        // Check if item is a Pair (has key and value properties)
        if (
          'key' in item &&
          'value' in item &&
          item.key &&
          item.value !== undefined
        ) {
          const keyNode = item.key;
          const valueNode = item.value;

          const keyStr = String(keyNode);
          const valueStr = valueNode ? String(valueNode) : undefined;

          // Calculate positions relative to the document
          // yaml library uses 0-based offsets, we need to convert to line/column
          const keyRange = calculateYamlNodeRange(
            yamlContent,
            keyNode,
            yamlStartLine,
          );
          const valueRange = valueNode
            ? calculateYamlNodeRange(yamlContent, valueNode, yamlStartLine)
            : undefined;

          const fieldRange = createRange(
            keyRange.start,
            valueRange ? valueRange.end : keyRange.end,
          );

          fields.push({
            key: keyStr,
            value: valueStr,
            range: fieldRange,
            keyRange,
            valueRange,
          });
        }
      }
    }
  } catch (e) {
    if (e instanceof YAMLParseError) {
      const line = e.linePos?.[0]?.line ?? 1;
      const col = e.linePos?.[0]?.col ?? 1;
      errors.push(
        createParseError(
          `Invalid YAML frontmatter: ${e.message}`,
          yamlStartLine + line - 1,
          col,
          'frontmatter',
        ),
      );
    } else {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(
        createParseError(
          `Invalid YAML frontmatter: ${msg}`,
          nodeRange.start.line,
          nodeRange.start.character,
          'frontmatter',
        ),
      );
    }
    return null;
  }

  return {
    range: nodeRange,
    fields,
    raw: yamlContent,
  };
}

/**
 * Calculate range for a YAML node within the document
 */
function calculateYamlNodeRange(
  yamlContent: string,
  node: unknown,
  baseLineOffset: number,
): Range {
  // Try to get range from node if available
  const nodeWithRange = node as { range?: [number, number, number?] };
  if (nodeWithRange.range) {
    const [startOffset, endOffset] = nodeWithRange.range;
    const startPos = offsetToPosition(yamlContent, startOffset, baseLineOffset);
    const endPos = offsetToPosition(yamlContent, endOffset, baseLineOffset);
    return createRange(startPos, endPos);
  }

  // Fallback: return a zero-width range at the base offset
  return createRange(
    createPosition(baseLineOffset, 0),
    createPosition(baseLineOffset, 0),
  );
}

/**
 * Convert byte offset to Position
 */
function offsetToPosition(
  content: string,
  offset: number,
  baseLineOffset: number,
): Position {
  let line = 0;
  let lastNewline = -1;

  for (let i = 0; i < offset && i < content.length; i++) {
    if (content[i] === '\n') {
      line++;
      lastNewline = i;
    }
  }

  const character = offset - lastNewline - 1;
  return createPosition(baseLineOffset + line, character);
}

/**
 * Parse code block with position information
 */
function parseCodeBlock(codeNode: Code): LocatedCodeBlock | null {
  const lang = codeNode.lang || '';

  // Only process resume: code blocks
  if (!lang.startsWith('resume:')) {
    return null;
  }

  const type = lang.replace('resume:', '');
  const range = toRange(codeNode.position);

  // Content range is inside the code fence
  // Start after the opening ``` line, end before the closing ```
  const contentRange = createRange(
    createPosition(range.start.line + 1, 0),
    createPosition(range.end.line - 1, 0),
  );

  return {
    type,
    lang,
    content: codeNode.value,
    range,
    contentRange,
  };
}

/**
 * Parse sections with position information
 */
function parseSectionsWithPositions(tree: Root): LocatedSection[] {
  const sections: LocatedSection[] = [];
  const contentNodes = tree.children.filter((node) => node.type !== 'yaml');

  let currentTitle: string | null = null;
  let currentTitleRange: Range | null = null;
  let currentCodeBlocks: LocatedCodeBlock[] = [];

  for (const node of contentNodes) {
    if (node.type === 'heading' && node.depth === 1) {
      // Save previous section
      if (currentTitle !== null && currentTitleRange !== null) {
        const sectionDef = findSectionByTag(currentTitle);
        if (sectionDef) {
          const endLine = node.position?.start.line
            ? node.position.start.line - 2
            : currentTitleRange.end.line;

          sections.push({
            id: sectionDef.id,
            title: currentTitle,
            range: createRange(
              currentTitleRange.start,
              createPosition(endLine, 0),
            ),
            titleRange: currentTitleRange,
            codeBlocks: currentCodeBlocks,
          });
        }
      }

      // Start new section
      currentTitle = node.children
        .map((c) => extractText(c as RootContent))
        .join('');
      currentTitleRange = toRange(node.position);
      currentCodeBlocks = [];
    } else if (currentTitle !== null && node.type === 'code') {
      const codeBlock = parseCodeBlock(node);
      if (codeBlock) {
        currentCodeBlocks.push(codeBlock);
      }
    }
  }

  // Don't forget last section
  if (currentTitle !== null && currentTitleRange !== null) {
    const sectionDef = findSectionByTag(currentTitle);
    if (sectionDef) {
      // Find the last line of content
      const lastNode = contentNodes[contentNodes.length - 1];
      const endLine =
        lastNode?.position?.end.line ?? currentTitleRange.end.line;

      sections.push({
        id: sectionDef.id,
        title: currentTitle,
        range: createRange(
          currentTitleRange.start,
          createPosition(endLine - 1, 0),
        ),
        titleRange: currentTitleRange,
        codeBlocks: currentCodeBlocks,
      });
    }
  }

  return sections;
}

/**
 * Parse markdown with full position information for LSP
 */
export function parseMarkdownWithPositions(
  markdown: string,
): Result<ParsedDocumentWithPositions, ParseError[]> {
  const errors: ParseError[] = [];

  try {
    const processor = createProcessor();
    const tree = processor.parse(markdown);

    // Find and parse frontmatter
    const yamlNode = tree.children.find(
      (node): node is Yaml => node.type === 'yaml',
    );
    const frontmatter = yamlNode
      ? parseFrontmatterWithPositions(yamlNode, errors)
      : null;

    if (errors.length > 0) {
      return failure(errors);
    }

    // Collect all code blocks
    const allCodeBlocks: LocatedCodeBlock[] = [];
    for (const node of tree.children) {
      if (node.type === 'code') {
        const codeBlock = parseCodeBlock(node);
        if (codeBlock) {
          allCodeBlocks.push(codeBlock);
        }
      }
    }

    // Parse sections
    const sections = parseSectionsWithPositions(tree);

    return success({
      frontmatter,
      sections,
      codeBlocks: allCodeBlocks,
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

export default parseMarkdownWithPositions;
