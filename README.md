# md2cv

[English](README.md) | [日本語](README.ja.md)

md2cv is a command-line tool that transforms Markdown documents into formatted PDF and HTML resumes. Simply write your CV in Markdown, and let md2cv handle the formatting and layout. The tool supports both western-style CVs and Japanese-style documents including rirekisho (履歴書) and shokumu-keirekisho (職務経歴書).

## Key Features

- Write your CV in Markdown
- Generate PDF and HTML outputs
- Multiple format support: western-style CV and Japanese rirekisho (履歴書)

## Installation

Install md2cv globally to use it from anywhere:

```bash
npm install -g md2cv
```

Or run it directly without installation using npx:

```bash
npx md2cv -i your-cv.md
```

## Usage

### Quick Start with Templates

The easiest way to get started is to generate a template:

```bash
# Generate an English CV template
md2cv init -l en -f cv -o my-cv.md

# Generate a Japanese rirekisho template
md2cv init -l ja -f rirekisho -o my-rirekisho.md

# Generate a template for both formats
md2cv init -l en -f both -o my-resume.md

# Generate template without explanatory comments
md2cv init -l en -f cv --no-comments -o my-cv.md

# Output template to stdout
md2cv init -l ja -f cv

# List available templates
md2cv init --list-templates

# List available sections for a specific format
md2cv init -l en -f cv --list-sections
```

### Generating CV/Resume

Here are some common examples to get you started:

```bash
# Basic usage - generate PDF CV
md2cv -i examples/example-cv-en.md

# Specify output path
md2cv -i examples/example-cv-en.md -o ./output/my-cv

# Generate HTML instead of PDF
md2cv -i examples/example-cv-en.md -t html

# Generate both PDF and HTML
md2cv -i examples/example-cv-en.md -t both

# Generate Japanese rirekisho format (A3 paper)
md2cv -i examples/example-cv-ja.md -f rirekisho -p a3

# Generate both CV and rirekisho formats
md2cv -i examples/example-cv-ja.md -f both -p a3

# Generate rirekisho with photo
md2cv -i examples/example-cv-ja.md -f rirekisho --photo photo.png

# Generate rirekisho without motivation section
md2cv -i examples/example-cv-ja.md -f rirekisho --hide-motivation

# Generate CV with specific section order
md2cv -i examples/example-cv-en.md --section-order "summary,experience,skills,education"

# Generate CV with oldest experience first
md2cv -i examples/example-cv-en.md --order asc

# Apply custom stylesheet
md2cv -i examples/example-cv-en.md --stylesheet custom.css

# Enable verbose logging
md2cv -i examples/example-cv-en.md --verbose
```

## CLI Commands

md2cv provides two commands:

### generate (default)

Generate CV/resume from a markdown file. This is the default command.

```bash
md2cv generate -i input.md [options]
md2cv -i input.md [options]  # 'generate' can be omitted
```

### init

Generate a markdown template to help you get started.

```bash
md2cv init [options]
```

| Option             | Description                                      | Default |
| ------------------ | ------------------------------------------------ | ------- |
| `-o, --output`     | Output file path (default: stdout)               | stdout  |
| `-l, --lang`       | Template language (`en`, `ja`)                   | `en`    |
| `-f, --format`     | Output format (`cv`, `rirekisho`, `both`)        | `cv`    |
| `--no-comments`    | Exclude explanatory comments from template       | -       |
| `--list-templates` | List available templates and their details       | -       |
| `--list-sections`  | List available sections for the specified format | -       |

## Generate Options

The following options are available for the `generate` command:

| Option                     | Description                                                                                                                 | Default         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `-i, --input <file>`       | Input markdown file (required)                                                                                              | -               |
| `-o, --output <path>`      | Output file path (without extension)                                                                                        | Input directory |
| `-f, --format <format>`    | Output format: `cv`, `rirekisho`, `both`                                                                                    | `cv`            |
| `-t, --output-type <type>` | Output type: `pdf`, `html`, `both`                                                                                          | `pdf`           |
| `-p, --paper-size <size>`  | Paper size: `a3`, `a4`, `b4`, `b5`, `letter`                                                                                | `a4`            |
| `-c, --config <file>`      | Configuration file (JSON or YAML)                                                                                           | -               |
| `--order <order>`          | Chronological order for CV format: `asc` (oldest first), `desc` (newest first). Rirekisho always uses asc.                  | `desc`          |
| `--hide-motivation`        | Hide motivation section in rirekisho format (increases history/license rows)                                                | `false`         |
| `--photo <filepath>`       | Photo image file for rirekisho format (png, jpg, tiff)                                                                      | -               |
| `--section-order <list>`   | Comma-separated list of section IDs to include in CV output (e.g., `summary,experience,education,skills`)                   | All sections    |
| `--stylesheet <filepath>`  | Custom CSS stylesheet file to override default styles (fonts, colors, spacing, etc.). See [STYLE.md](STYLE.md) for details. | -               |
| `--log-format <format>`    | Log format: `json`, `text`                                                                                                  | `text`          |
| `--verbose`                | Enable verbose logging                                                                                                      | `false`         |
| `--version`                | Show version                                                                                                                | -               |
| `--help`                   | Show help                                                                                                                   | -               |

## Markdown Format

### Frontmatter and Environment Variables

There are two ways to provide metadata: use frontmatter in the Markdown file, or use environment variables (including values loaded from a `.env` file). Frontmatter is the simplest, but it embeds personal information in the file. Environment variables keep personal details out of the Markdown and version control.

```yaml
---
name: John Doe
email_address: john@example.com
phone_number: +1-234-567-8900
home_address: San Francisco, CA
---
```

Frontmatter fields can also be set via environment variables. You can provide all metadata via environment variables without frontmatter. This is useful for keeping personal information out of version control. You can also use a `.env` file to define these values.

| Field                    | Environment Variable(s)                            | Required |
| ------------------------ | -------------------------------------------------- | -------- |
| `name`                   | `NAME`                                             | Yes      |
| `name_ja`                | `NAME_JA`                                          | No       |
| `name_furigana`          | `NAME_FURIGANA`, `NAME_HURIGANA`                   | No       |
| `email_address`          | `EMAIL_ADDRESS`, `EMAIL_ADDRESS1`                  | Yes      |
| `email_address2`         | `EMAIL_ADDRESS2`                                   | No       |
| `phone_number`           | `PHONE_NUMBER`, `PHONE_NUMBER1`                    | Yes      |
| `phone_number2`          | `PHONE_NUMBER2`                                    | No       |
| `post_code`              | `POST_CODE`, `POST_CODE1`                          | No       |
| `home_address`           | `HOME_ADDRESS`, `HOME_ADDRESS1`                    | No       |
| `home_address_furigana`  | `HOME_ADDRESS_FURIGANA`, `HOME_ADDRESS_HURIGANA`   | No       |
| `post_code2`             | `POST_CODE2`                                       | No       |
| `home_address2`          | `HOME_ADDRESS2`                                    | No       |
| `home_address2_furigana` | `HOME_ADDRESS2_FURIGANA`, `HOME_ADDRESS2_HURIGANA` | No       |
| `gender`                 | `GENDER`                                           | No       |
| `dob`                    | `DOB`, `DATE_OF_BIRTH`                             | No       |
| `linkedin`               | `LINKEDIN`, `LINKEDIN_URL`                         | No       |

Priority: Frontmatter values override environment variables.

```bash
# Example: Set personal info via environment
export NAME="John Doe"
export EMAIL_ADDRESS="john@example.com"
export PHONE_NUMBER="+1-234-567-8900"

md2cv -i cv.md
```

### Sections

Use structured code blocks to define your CV content:

````markdown
# Summary

Experienced software engineer with 10+ years of expertise in building scalable web applications.
Passionate about clean code and mentoring junior developers.

# Experience

```resume:experience
- company: TechCorp
  location: San Francisco, CA
  roles:
    - title: Senior Software Engineer
      team: Platform Team
      start: 2020-01
      end: present
      summary:
        - Leading backend development for core platform services
      highlights:
        - Led development of microservices architecture
        - Mentored junior developers
        - Reduced API latency by 40%
      projects:
        - name: API Gateway
          start: 2021-06
          end: 2022-03
          bullets:
            - Designed and implemented rate limiting
            - Integrated OAuth 2.0 authentication
- company: StartupXYZ
  location: New York, NY
  roles:
    - title: Software Engineer
      start: 2017-03
      end: 2019-12
      highlights:
        - Built real-time notification system
        - Implemented CI/CD pipeline
```

# Education

```resume:education
- school: University of California
  degree: Bachelor of Science in Computer Science
  location: Berkeley, CA
  start: 2010-09
  end: 2014-06
  details:
    - GPA: 3.8/4.0
    - Dean's List 2012-2014
- school: Stanford University
  degree: Master of Science in Computer Science
  start: 2014-09
  end: 2016-06
```

# Skills

Categorized format:

```resume:skills
categories:
  - category: Programming Languages
    items: [TypeScript, Python, Go, Rust]
  - category: Frameworks
    items: [React, Node.js, Django, FastAPI]
  - category: Cloud & DevOps
    items: [AWS, Docker, Kubernetes, Terraform]
```

Grid format:

```resume:skills
columns: 4
items:
  - TypeScript
  - Python
  - Go
  - Rust
  - React
  - Node.js
  - Django
  - FastAPI
```

# Certifications

```resume:certifications
- name: AWS Solutions Architect Professional
  issuer: Amazon Web Services
  date: 2023-01
  url: https://aws.amazon.com/certification/
- name: Certified Kubernetes Administrator
  issuer: CNCF
  date: 2022-06
```

# Languages

```resume:languages
- language: English
  level: Native
- language: Japanese
  level: Business (JLPT N1)
- language: Spanish
  level: Conversational
```

# Core Competencies

```resume:competencies
- header: Technical Leadership
  description: Led cross-functional teams of 10+ engineers across multiple time zones
- header: System Design
  description: Designed scalable distributed systems handling 1M+ requests per second
- header: Mentorship
  description: Established engineering mentorship program with 20+ participants
```

# Motivation (rirekisho only)

I am excited to apply for this position because of my passion for building
innovative products that make a difference in people's lives.

# Notes (rirekisho only)

Available to start immediately. Open to relocation.
````

#### Section Reference

| Section ID       | Supported Tags                                                            | Format    |
| ---------------- | ------------------------------------------------------------------------- | --------- |
| `summary`        | Summary, Professional Summary, Profile, Executive Summary, 概要, 職務要約 | CV        |
| `experience`     | Experience, Work Experience, Professional Experience, 職歴, 職務経歴      | Both      |
| `education`      | Education, 学歴                                                           | Both      |
| `skills`         | Skills, Technical Skills, スキル                                          | Both      |
| `certifications` | Certifications, 免許・資格, 資格, 免許.                                   | Both      |
| `languages`      | Languages, Language Skills語学                                            | CV        |
| `competencies`   | Core Competencies, Key Competencies, Superpowers, 自己PR                  | Both      |
| `motivation`     | Motivation, 志望動機, 志望の動機                                          | Rirekisho |
| `notes`          | Notes, 本人希望記入欄                                                     | Rirekisho |

## Configuration File

Configuration files are completely optional. All parameters can be specified via CLI arguments. However, you can use a JSON or YAML config file for convenience when you want to reuse the same settings across multiple runs.

Create a `config.json` or `config.yaml`:

```json
{
  "format": "both",
  "outputType": "pdf",
  "paperSize": "a4",
  "logFormat": "text",
  "chronologicalOrder": "desc",
  "hideMotivation": false,
  "photo": "photo.png",
  "sectionOrder": ["summary", "experience", "education", "skills"]
}
```

```yaml
format: both
outputType: pdf
paperSize: a4
logFormat: text
chronologicalOrder: desc
hideMotivation: false
photo: photo.png
sectionOrder:
  - summary
  - experience
  - education
  - skills
```

## Programmatic Usage

If you want to use md2cv as a library in your own project, refer to the following code snippet:

```typescript
import { parseMarkdown, generateOutput, validateCV } from 'md2cv';

const markdown = fs.readFileSync('cv.md', 'utf-8');
const result = parseMarkdown(markdown);

if (result.ok) {
  const validated = validateCV(result.value, 'cv');
  if (validated.ok) {
    await generateOutput(validated.value, config);
  }
}
```

## Development

For information about project structure, testing, and contributing, see [DEVELOPMENT.md](DEVELOPMENT.md).

[![Coverage](https://img.shields.io/endpoint?url=https://yuyash.github.io/md2cv/badge.json)](https://yuyash.github.io/md2cv/)
[![CI](https://github.com/yuyash/md2cv/actions/workflows/ci.yml/badge.svg)](https://github.com/yuyash/md2cv/actions/workflows/ci.yml)

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). This means you are free to use, modify, and distribute this software, provided that any derivative works are also distributed under the same license. For more details, see the [LICENSE](LICENSE) file.
