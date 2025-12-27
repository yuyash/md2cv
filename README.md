# md2cv

[English](README.md) | [日本語](README.ja.md)

md2cv is a command-line tool that transforms Markdown documents into formatted PDF and HTML resumes. Simply write your CV in Markdown, and let md2cv handle the formatting and layout. The tool supports both western-style CVs and Japanese-style documents including rirekisho (履歴書) and shokumu-keirekisho (職務経歴書), making it ideal for international job seekers.

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

# Enable verbose logging
md2cv -i examples/example-cv-en.md --verbose
```

## CLI Options

The following options are available to customize the output:

| Option                     | Description                                                                                                      | Default         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------- |
| `-i, --input <file>`       | Input markdown file (required)                                                                                   | -               |
| `-o, --output <path>`      | Output file path (without extension)                                                                             | Input directory |
| `-f, --format <format>`    | Output format: `cv`, `rirekisho`, `both`                                                                         | `cv`            |
| `-t, --output-type <type>` | Output type: `pdf`, `html`, `both`                                                                               | `pdf`           |
| `-p, --paper-size <size>`  | Paper size: `a3`, `a4`, `b4`, `b5`, `letter`                                                                     | `a4`            |
| `-c, --config <file>`      | Configuration file (JSON or YAML)                                                                                | -               |
| `--order <order>`          | Chronological order for CV format: `asc` (oldest first), `desc` (newest first). Rirekisho always uses asc.       | `desc`          |
| `--hide-motivation`        | Hide motivation section in rirekisho format (increases history/license rows)                                     | `false`         |
| `--photo <filepath>`       | Photo image file for rirekisho format (png, jpg, tiff)                                                           | -               |
| `--section-order <list>`   | Comma-separated list of section IDs to include in CV output (e.g., `summary,experience,education,skills`)        | All sections    |
| `--log-format <format>`    | Log format: `json`, `text`                                                                                       | `text`          |
| `--verbose`                | Enable verbose logging                                                                                           | `false`         |
| `--version`                | Show version                                                                                                     | -               |
| `--help`                   | Show help                                                                                                        | -               |

## Markdown Format

### Frontmatter and Environment Variables

```yaml
---
name: John Doe
email_address: john@example.com
phone_number: +1-234-567-8900
home_address: San Francisco, CA
---
```

Frontmatter fields can also be set via environment variables. This is useful for keeping personal information out of version control.

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

| Section ID     | Supported Tags                                                                    | Format    |
| -------------- | --------------------------------------------------------------------------------- | --------- |
| `summary`      | 概要, 職務要約, Summary, Professional Summary, Profile, Executive Summary         | CV        |
| `experience`   | 職歴, 職務経歴, Experience, Work Experience, Professional Experience              | Both      |
| `education`    | 学歴, Education                                                                   | Both      |
| `skills`       | スキル, Skills, Technical Skills                                                  | Both      |
| `certifications` | 免許・資格, 資格, 免許, Certifications                                          | Both      |
| `languages`    | 語学, Languages, Language Skills                                                  | CV        |
| `competencies` | 自己PR, Core Competencies, Key Competencies, Superpowers                          | Both      |
| `motivation`   | 志望動機, 志望の動機, Motivation                                                  | Rirekisho |
| `notes`        | 本人希望記入欄, Notes                                                             | Rirekisho |

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

## License

GPL-3.0
