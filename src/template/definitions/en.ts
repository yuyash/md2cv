/**
 * English template definitions
 */

import type {
  FrontmatterFieldTemplate,
  SectionTemplate,
  TemplateDefinition,
} from '../../types/template.js';

/**
 * English frontmatter field templates
 */
export const EN_FRONTMATTER_FIELDS: readonly FrontmatterFieldTemplate[] = [
  {
    key: 'name',
    example: 'John Doe',
    description: 'Your full name as it should appear on the CV',
    required: true,
  },
  {
    key: 'email_address',
    example: 'john.doe@example.com',
    description: 'Your primary email address for professional contact',
    required: true,
  },
  {
    key: 'phone_number',
    example: '+1-555-123-4567',
    description: 'Your phone number with country code',
    required: true,
  },
  {
    key: 'home_address',
    example: 'San Francisco, CA',
    description:
      'Your location (city, state/country) - full address not recommended for privacy',
    required: false,
  },
  {
    key: 'linkedin',
    example: 'https://linkedin.com/in/johndoe',
    description: 'Your LinkedIn profile URL for professional networking',
    required: false,
  },
  {
    key: 'github',
    example: 'https://github.com/johndoe',
    description: 'Your GitHub profile URL to showcase your code',
    required: false,
  },
  {
    key: 'website',
    example: 'https://johndoe.dev',
    description: 'Your personal website or portfolio URL',
    required: false,
  },
] as const;

/**
 * English section templates
 */
export const EN_SECTIONS: readonly SectionTemplate[] = [
  {
    id: 'summary',
    title: 'Summary',
    description:
      'A brief professional summary (2-4 sentences) highlighting your key qualifications, years of experience, and career objectives. This is the first thing recruiters read, so make it compelling and tailored to your target role.',
    usage: 'cv',
    content: `Write a compelling summary of your professional background, key skills, and what you bring to potential employers.
Focus on your unique value proposition and career highlights.

Example:
Experienced software engineer with 8+ years of expertise in building scalable web applications.
Passionate about clean code, mentoring junior developers, and delivering high-quality solutions.`,
  },
  {
    id: 'experience',
    title: 'Experience',
    description:
      'Your work history with companies, roles, dates, and achievements. List in reverse chronological order (most recent first). Use action verbs and quantify achievements where possible (e.g., "Increased sales by 25%", "Reduced load time by 40%").',
    usage: 'both',
    content: `\`\`\`resume:experience
- company: Company Name
  location: City, Country
  roles:
    - title: Job Title
      team: Team Name (optional)
      start: 2022-01
      end: present
      summary:
        - Brief description of your role and responsibilities
      highlights:
        - Key achievement with measurable impact (e.g., "Reduced deployment time by 50%")
        - Another significant accomplishment
        - Quantifiable result (e.g., "Managed team of 5 engineers")
      projects:
        - name: Project Name (optional)
          start: 2022-06
          end: 2023-01
          bullets:
            - Project contribution or outcome
\`\`\``,
  },
  {
    id: 'education',
    title: 'Education',
    description:
      'Your educational background including degrees, institutions, graduation dates, and relevant details. Include GPA if above 3.5, relevant coursework, honors, or thesis topics if applicable.',
    usage: 'both',
    content: `\`\`\`resume:education
- school: University Name
  degree: Bachelor of Science in Computer Science
  location: City, Country
  start: 2014-09
  end: 2018-06
  details:
    - GPA: 3.8/4.0 (include if above 3.5)
    - Relevant coursework: Data Structures, Algorithms, Machine Learning
    - Honors: Dean's List, Summa Cum Laude
\`\`\``,
  },
  {
    id: 'skills',
    title: 'Skills',
    description:
      'Your technical and professional skills organized by category. Be specific and honest about your proficiency levels. Include programming languages, frameworks, tools, and soft skills relevant to your target role.',
    usage: 'both',
    content: `\`\`\`resume:skills
categories:
  - category: Programming Languages
    items: [JavaScript, TypeScript, Python, Go]
  - category: Frameworks & Libraries
    items: [React, Node.js, Django, Express]
  - category: Tools & Platforms
    items: [AWS, Docker, Kubernetes, Git, CI/CD]
  - category: Databases
    items: [PostgreSQL, MongoDB, Redis]
\`\`\``,
  },
  {
    id: 'certifications',
    title: 'Certifications',
    description:
      'Professional certifications and licenses you have obtained. Include the certification name, issuing organization, date obtained, and expiration date if applicable. Prioritize certifications relevant to your target role.',
    usage: 'both',
    content: `\`\`\`resume:certifications
- name: AWS Solutions Architect Professional
  issuer: Amazon Web Services
  date: 2023-06
  url: https://aws.amazon.com/certification/ (optional)
- name: Certified Kubernetes Administrator
  issuer: CNCF
  date: 2022-11
\`\`\``,
  },
  {
    id: 'languages',
    title: 'Languages',
    description:
      'Languages you speak and your proficiency level. Use standard proficiency levels: Native, Fluent, Professional working proficiency, Limited working proficiency, Elementary. Include certifications like TOEFL, IELTS, JLPT if applicable.',
    usage: 'cv',
    content: `\`\`\`resume:languages
- language: English
  level: Native
- language: Spanish
  level: Professional working proficiency
- language: Japanese
  level: Conversational (JLPT N2)
\`\`\``,
  },
  {
    id: 'competencies',
    title: 'Core Competencies',
    description:
      'Key strengths and competencies that set you apart. Focus on transferable skills and leadership qualities. Provide brief descriptions with concrete examples of how you have demonstrated each competency.',
    usage: 'both',
    content: `\`\`\`resume:competencies
- header: Technical Leadership
  description: Led cross-functional teams of 10+ engineers, delivering projects on time and within budget.
- header: Problem Solving
  description: Strong analytical skills with a track record of solving complex technical challenges.
- header: Communication
  description: Excellent written and verbal communication skills, experienced in stakeholder management.
\`\`\``,
  },
  {
    id: 'motivation',
    title: 'Motivation',
    description:
      'Your motivation for applying to this position (rirekisho format only). Explain why you are interested in the company/role, what attracts you to the opportunity, and how your background makes you a good fit.',
    usage: 'rirekisho',
    content: `Write your motivation for applying to this specific position or company.
Explain why you are interested and what you hope to contribute.

Tips:
- Research the company and mention specific aspects that attract you
- Connect your experience and skills to the role requirements
- Show enthusiasm while remaining professional`,
  },
  {
    id: 'notes',
    title: 'Notes',
    description:
      'Additional notes such as availability, salary expectations, work preferences, or special requests (rirekisho format only). Be clear and professional about any constraints or preferences.',
    usage: 'rirekisho',
    content: `Add any additional information such as:
- Earliest start date: Available immediately / After 2 weeks notice
- Preferred work location: Remote / Hybrid / On-site
- Work authorization status if relevant
- Other relevant notes for the employer`,
  },
] as const;

/**
 * Complete English template definition
 */
export const EN_TEMPLATE: TemplateDefinition = {
  language: 'en',
  frontmatterFields: EN_FRONTMATTER_FIELDS,
  sections: EN_SECTIONS,
} as const;
