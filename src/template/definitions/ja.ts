/**
 * Japanese template definitions
 */

import type {
  FrontmatterFieldTemplate,
  SectionTemplate,
  TemplateDefinition,
} from '../../types/template.js';

/**
 * Japanese frontmatter field templates
 */
export const JA_FRONTMATTER_FIELDS: readonly FrontmatterFieldTemplate[] = [
  {
    key: 'name',
    example: '山田 太郎',
    description: '氏名（漢字）- 履歴書に表示される正式な氏名',
    required: true,
  },
  {
    key: 'name_furigana',
    example: 'ヤマダ タロウ',
    description: '氏名（フリガナ）- カタカナで記載。履歴書形式で使用',
    required: false,
  },
  {
    key: 'email_address',
    example: 'taro.yamada@example.com',
    description: 'メールアドレス - 連絡可能なメールアドレス',
    required: true,
  },
  {
    key: 'phone_number',
    example: '090-1234-5678',
    description: '電話番号 - 連絡可能な電話番号（携帯推奨）',
    required: true,
  },
  {
    key: 'post_code',
    example: '100-0001',
    description: '郵便番号 - ハイフン付きで記載',
    required: false,
  },
  {
    key: 'home_address',
    example: '東京都千代田区千代田1-1-1',
    description: '現住所 - 都道府県から番地まで記載',
    required: false,
  },
  {
    key: 'home_address_furigana',
    example: 'とうきょうとちよだくちよだ',
    description: '現住所（ふりがな）- ひらがなで記載。履歴書形式で使用',
    required: false,
  },
  {
    key: 'dob',
    example: '1990-04-15',
    description: '生年月日（YYYY-MM-DD形式）- 履歴書形式で年齢計算に使用',
    required: false,
  },
  {
    key: 'gender',
    example: 'male',
    description: '性別（male/female/other）- 任意記載。履歴書形式で使用',
    required: false,
  },
  {
    key: 'linkedin',
    example: 'https://linkedin.com/in/taroyamada',
    description: 'LinkedIn プロフィール URL - 職務経歴書で使用',
    required: false,
  },
  {
    key: 'github',
    example: 'https://github.com/taroyamada',
    description: 'GitHub プロフィール URL - エンジニア向け',
    required: false,
  },
  {
    key: 'website',
    example: 'https://taroyamada.dev',
    description: '個人サイト・ポートフォリオ URL',
    required: false,
  },
] as const;

/**
 * Japanese section templates
 */
export const JA_SECTIONS: readonly SectionTemplate[] = [
  {
    id: 'summary',
    title: '職務要約',
    description:
      'これまでのキャリアの概要と強みを簡潔にまとめます（2〜4文程度）。採用担当者が最初に読む部分なので、自分の価値を端的に伝えることが重要です。経験年数、専門分野、主な実績を含めましょう。',
    usage: 'cv',
    content: `これまでの職務経験の概要、主な実績、得意分野などを記載してください。
採用担当者に自分の価値を伝える重要なセクションです。

例：
Webアプリケーション開発に8年以上従事し、大規模システムの設計・開発をリードしてきました。
チームマネジメントと技術的な課題解決を得意とし、品質の高いソリューションの提供に注力しています。`,
  },
  {
    id: 'experience',
    title: '職歴',
    description:
      '勤務先、役職、業務内容、実績を記載します。新しい職歴から順に記載（逆時系列）。具体的な数値や成果を含めると効果的です（例：「売上を25%向上」「処理時間を40%短縮」）。',
    usage: 'both',
    content: `\`\`\`resume:experience
- company: 株式会社サンプル
  location: 東京都
  roles:
    - title: シニアエンジニア
      team: プラットフォーム開発部
      start: 2020-04
      end: present
      summary:
        - バックエンドシステムの設計・開発を担当
      highlights:
        - マイクロサービスアーキテクチャへの移行をリード（チーム10名）
        - API レスポンス時間を 40% 改善
        - 新人エンジニア 5 名の育成・メンタリングを担当
      projects:
        - name: 決済システム刷新プロジェクト
          start: 2021-04
          end: 2022-03
          bullets:
            - 決済処理の高速化を実現（処理時間50%短縮）
            - 障害発生率を 80% 削減
\`\`\``,
  },
  {
    id: 'education',
    title: '学歴',
    description:
      '学校名、学部・学科、卒業年月を記載します。新しい学歴から順に記載。GPA（3.5以上の場合）、卒業論文のテーマ、関連する受賞歴なども記載可能です。',
    usage: 'both',
    content: `\`\`\`resume:education
- school: 東京大学
  degree: 工学部 情報工学科
  location: 東京都
  start: 2010-04
  end: 2014-03
  details:
    - GPA: 3.8/4.0（3.5以上の場合は記載推奨）
    - 卒業論文: 分散システムにおける効率的なデータ同期手法の研究
    - 学部長賞受賞
\`\`\``,
  },
  {
    id: 'skills',
    title: 'スキル',
    description:
      '技術スキルや業務スキルをカテゴリ別に記載します。応募する職種に関連するスキルを優先的に記載。習熟度を正直に記載し、実務経験のあるものを中心にリストアップしましょう。',
    usage: 'both',
    content: `\`\`\`resume:skills
categories:
  - category: プログラミング言語
    items: [TypeScript, Python, Go, Java]
  - category: フレームワーク
    items: [React, Node.js, Spring Boot, Django]
  - category: インフラ・ツール
    items: [AWS, Docker, Kubernetes, Terraform, CI/CD]
  - category: データベース
    items: [PostgreSQL, MySQL, MongoDB, Redis]
\`\`\``,
  },
  {
    id: 'certifications',
    title: '免許・資格',
    description:
      '取得した資格や免許を記載します。取得日の新しいものから順に記載。応募職種に関連する資格を優先的に記載しましょう。有効期限がある資格は更新状況も確認してください。',
    usage: 'both',
    content: `\`\`\`resume:certifications
- name: AWS ソリューションアーキテクト プロフェッショナル
  issuer: Amazon Web Services
  date: 2023-06
- name: 基本情報技術者
  issuer: IPA（情報処理推進機構）
  date: 2015-04
- name: TOEIC 900点
  issuer: ETS
  date: 2022-01
- name: 普通自動車第一種運転免許
  issuer: 公安委員会
  date: 2010-08
\`\`\``,
  },
  {
    id: 'languages',
    title: '語学',
    description:
      '語学力とレベルを記載します。ネイティブ、ビジネスレベル、日常会話レベルなどの表現を使用。TOEIC、TOEFL、IELTS、日本語能力試験（JLPT）などのスコアがあれば併記しましょう。',
    usage: 'cv',
    content: `\`\`\`resume:languages
- language: 日本語
  level: ネイティブ
- language: 英語
  level: ビジネスレベル（TOEIC 900点）
- language: 中国語
  level: 日常会話レベル（HSK 4級）
\`\`\``,
  },
  {
    id: 'competencies',
    title: '自己PR',
    description:
      '自分の強みや特徴をアピールします。具体的なエピソードや実績を交えて記載すると説得力が増します。応募職種で求められる能力と自分の強みを結びつけて記載しましょう。',
    usage: 'both',
    content: `\`\`\`resume:competencies
- header: 技術リーダーシップ
  description: 10名以上のエンジニアチームをリードし、複数のプロジェクトを成功に導いた経験があります。メンバーの成長支援と技術的な意思決定の両面でチームに貢献してきました。
- header: 問題解決力
  description: 複雑な技術課題に対して、論理的なアプローチで解決策を見出すことが得意です。本番環境での障害対応経験も豊富で、迅速な原因特定と対策実施ができます。
- header: コミュニケーション力
  description: 技術者・非技術者問わず、分かりやすく説明し、円滑なプロジェクト推進を実現します。顧客折衝やステークホルダーとの調整経験も豊富です。
\`\`\``,
  },
  {
    id: 'motivation',
    title: '志望動機',
    description:
      '応募先企業・職種への志望理由を記載します（履歴書形式のみ）。企業研究を行い、なぜその企業・職種に興味を持ったのか、自分のスキルや経験がどのように貢献できるかを具体的に記載しましょう。',
    usage: 'rirekisho',
    content: `貴社を志望した理由、入社後に実現したいこと、
自分のスキルや経験がどのように貢献できるかを記載してください。

ポイント：
- 企業研究を行い、具体的な魅力を挙げる
- 自分の経験・スキルと応募職種の関連性を示す
- 入社後のビジョンや貢献したいことを明確に
- 熱意を持ちつつも、具体的かつ論理的に記載`,
  },
  {
    id: 'notes',
    title: '本人希望記入欄',
    description:
      '勤務条件や特記事項を記載します（履歴書形式のみ）。特に希望がない場合は「貴社規定に従います」と記載するのが一般的です。希望がある場合は明確かつ簡潔に記載しましょう。',
    usage: 'rirekisho',
    content: `特に希望がない場合は「貴社規定に従います」と記載。
希望がある場合は以下のような内容を記載：

- 希望勤務地：東京本社 / リモートワーク希望
- 入社可能日：即日 / 現職の引き継ぎ後（約1ヶ月後）
- 勤務形態：フルタイム / 時短勤務希望
- その他特記事項`,
  },
] as const;

/**
 * Complete Japanese template definition
 */
export const JA_TEMPLATE: TemplateDefinition = {
  language: 'ja',
  frontmatterFields: JA_FRONTMATTER_FIELDS,
  sections: JA_SECTIONS,
} as const;
