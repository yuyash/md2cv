# md2cv

[English](README.md) | [日本語](README.ja.md)

md2cv は Markdown で書かれた履歴書・職務経歴書を PDF や HTML に変換するコマンドラインツールです。Markdown で内容を書くだけで、フォーマットやレイアウトは md2cv が自動で処理します。欧米式の CV と日本式の履歴書の両方に対応しています。

## 主な機能

- Markdown で履歴書を作成
- PDF と HTML の出力に対応
- 複数フォーマット対応：欧米式 CV、日本式履歴書

## インストール

インストール:

```bash
npm install -g md2cv
```

または npx で直接実行:

```bash
npx md2cv -i your-cv.md
```

## 使い方

### テンプレートでクイックスタート

テンプレートを生成して簡単に始められます：

```bash
# 英語の CV テンプレートを生成
md2cv init -l en -f cv -o my-cv.md

# 日本語の履歴書テンプレートを生成
md2cv init -l ja -f rirekisho -o my-rirekisho.md

# 両方のフォーマット用テンプレートを生成
md2cv init -l ja -f both -o my-resume.md

# 説明コメントなしでテンプレートを生成
md2cv init -l ja -f cv --no-comments -o my-cv.md

# 標準出力にテンプレートを出力
md2cv init -l ja -f cv

# 利用可能なテンプレート一覧を表示
md2cv init --list-templates

# 特定フォーマットの利用可能なセクション一覧を表示
md2cv init -l ja -f cv --list-sections
```

### CV/履歴書の生成

基本的な使用例:

```bash
# 基本的な使い方 - PDF の CV を生成
md2cv -i examples/example-cv-ja.md

# 出力先を指定
md2cv -i examples/example-cv-ja.md -o ./output/my-cv

# PDF の代わりに HTML を生成
md2cv -i examples/example-cv-ja.md -t html

# PDF と HTML の両方を生成
md2cv -i examples/example-cv-ja.md -t both

# 日本式履歴書フォーマットで生成（A3用紙）
md2cv -i examples/example-cv-ja.md -f rirekisho -p a3

# CV と履歴書の両方を生成
md2cv -i examples/example-cv-ja.md -f both -p a3

# 写真付きの履歴書を生成
md2cv -i examples/example-cv-ja.md -f rirekisho --photo photo.png

# 志望動機欄なしの履歴書を生成
md2cv -i examples/example-cv-ja.md -f rirekisho --hide-motivation

# セクションの順序を指定して CV を生成
md2cv -i examples/example-cv-ja.md --section-order "summary,experience,skills,education"

# 古い経歴から順に表示
md2cv -i examples/example-cv-ja.md --order asc

# カスタムスタイルシートを適用
md2cv -i examples/example-cv-ja.md --stylesheet custom.css

# 詳細ログを有効化
md2cv -i examples/example-cv-ja.md --verbose
```

## CLI コマンド

md2cv は2つのコマンドを提供します：

### generate（デフォルト）

Markdown ファイルから CV/履歴書を生成します。デフォルトコマンドです。

```bash
md2cv generate -i input.md [options]
md2cv -i input.md [options]  # 'generate' は省略可能
```

### init

テンプレートを生成して簡単に始められます。

```bash
md2cv init [options]
```

| オプション          | 説明                                             | デフォルト |
| ------------------- | ------------------------------------------------ | ---------- |
| `-o, --output`      | 出力ファイルパス（デフォルト: 標準出力）         | 標準出力   |
| `-l, --lang`        | テンプレート言語（`en`, `ja`）                   | `en`       |
| `-f, --format`      | 出力フォーマット（`cv`, `rirekisho`, `both`）    | `cv`       |
| `--no-comments`     | テンプレートから説明コメントを除外               | -          |
| `--list-templates`  | 利用可能なテンプレートと詳細を表示               | -          |
| `--list-sections`   | 指定フォーマットの利用可能なセクションを表示     | -          |

## generate オプション

`generate` コマンドで使用できるオプション：

| オプション                 | 説明                                                                                           | デフォルト      |
| -------------------------- | ---------------------------------------------------------------------------------------------- | --------------- |
| `-i, --input <file>`       | 入力 Markdown ファイル（必須）                                                                 | -               |
| `-o, --output <path>`      | 出力ファイルパス（拡張子なし）                                                                 | 入力ファイルと同じディレクトリ |
| `-f, --format <format>`    | 出力フォーマット: `cv`, `rirekisho`, `both`                                                    | `cv`            |
| `-t, --output-type <type>` | 出力タイプ: `pdf`, `html`, `both`                                                              | `pdf`           |
| `-p, --paper-size <size>`  | 用紙サイズ: `a3`, `a4`, `b4`, `b5`, `letter`                                                   | `a4`            |
| `-c, --config <file>`      | 設定ファイル（JSON または YAML）                                                               | -               |
| `--order <order>`          | CV の時系列順序: `asc`（古い順）, `desc`（新しい順）。履歴書は常に古い順。                      | `desc`          |
| `--hide-motivation`        | 履歴書の志望動機欄を非表示（学歴・職歴・資格欄が拡大）                                         | `false`         |
| `--photo <filepath>`       | 履歴書用の写真ファイル（png, jpg, tiff）                                                       | -               |
| `--section-order <list>`   | CV に含めるセクション ID のカンマ区切りリスト（例: `summary,experience,education,skills`）     | 全セクション    |
| `--stylesheet <filepath>`  | カスタム CSS スタイルシートファイル（フォント、色、余白などを上書き）。詳細は [STYLE.md](STYLE.md) を参照。 | -               |
| `--log-format <format>`    | ログフォーマット: `json`, `text`                                                               | `text`          |
| `--verbose`                | 詳細ログを有効化                                                                               | `false`         |
| `--version`                | バージョンを表示                                                                               | -               |
| `--help`                   | ヘルプを表示                                                                                   | -               |

## Markdown フォーマット

### フロントマターと環境変数

```yaml
---
name: 山田 太郎
name_furigana: やまだ たろう
email_address: taro@example.com
phone_number: 090-1234-5678
post_code: 100-0001
home_address: 東京都千代田区千代田1-1
home_address_furigana: とうきょうとちよだくちよだ
gender: male
dob: 1990-01-15
---
```

フロントマターのフィールドは環境変数でも設定できます。個人情報をバージョン管理から除外したい場合に便利です。

| フィールド               | 環境変数                                           | 必須     |
| ------------------------ | -------------------------------------------------- | -------- |
| `name`                   | `NAME`                                             | はい     |
| `name_ja`                | `NAME_JA`                                          | いいえ   |
| `name_furigana`          | `NAME_FURIGANA`, `NAME_HURIGANA`                   | いいえ   |
| `email_address`          | `EMAIL_ADDRESS`, `EMAIL_ADDRESS1`                  | はい     |
| `email_address2`         | `EMAIL_ADDRESS2`                                   | いいえ   |
| `phone_number`           | `PHONE_NUMBER`, `PHONE_NUMBER1`                    | はい     |
| `phone_number2`          | `PHONE_NUMBER2`                                    | いいえ   |
| `post_code`              | `POST_CODE`, `POST_CODE1`                          | いいえ   |
| `home_address`           | `HOME_ADDRESS`, `HOME_ADDRESS1`                    | いいえ   |
| `home_address_furigana`  | `HOME_ADDRESS_FURIGANA`, `HOME_ADDRESS_HURIGANA`   | いいえ   |
| `post_code2`             | `POST_CODE2`                                       | いいえ   |
| `home_address2`          | `HOME_ADDRESS2`                                    | いいえ   |
| `home_address2_furigana` | `HOME_ADDRESS2_FURIGANA`, `HOME_ADDRESS2_HURIGANA` | いいえ   |
| `gender`                 | `GENDER`                                           | いいえ   |
| `dob`                    | `DOB`, `DATE_OF_BIRTH`                             | いいえ   |
| `linkedin`               | `LINKEDIN`, `LINKEDIN_URL`                         | いいえ   |

優先順位: フロントマターの値が環境変数より優先されます。

```bash
# 例: 環境変数で個人情報を設定
export NAME="山田 太郎"
export EMAIL_ADDRESS="taro@example.com"
export PHONE_NUMBER="090-1234-5678"

md2cv -i cv.md
```

### セクション

構造化コードブロックを使用して CV の内容を定義します:

````markdown
# 概要

10年以上の経験を持つソフトウェアエンジニア。スケーラブルなWebアプリケーションの構築を専門とし、
クリーンコードとジュニアエンジニアの育成に情熱を持っています。

# 職歴

```resume:experience
- company: テック株式会社
  location: 東京
  roles:
    - title: シニアソフトウェアエンジニア
      team: プラットフォームチーム
      start: 2020-01
      end: present
      summary:
        - コアプラットフォームサービスのバックエンド開発をリード
      highlights:
        - マイクロサービスアーキテクチャの開発をリード
        - ジュニアエンジニアのメンタリング
        - APIレイテンシを40%削減
      projects:
        - name: API Gateway
          start: 2021-06
          end: 2022-03
          bullets:
            - レート制限の設計と実装
            - OAuth 2.0認証の統合
- company: スタートアップXYZ
  location: 大阪
  roles:
    - title: ソフトウェアエンジニア
      start: 2017-03
      end: 2019-12
      highlights:
        - リアルタイム通知システムの構築
        - CI/CDパイプラインの実装
```

# 学歴

```resume:education
- school: 東京大学
  degree: 工学部 情報工学科
  location: 東京
  start: 2010-04
  end: 2014-03
  details:
    - GPA: 3.8/4.0
    - 学部長賞 2012-2014
- school: 東京大学大学院
  degree: 情報理工学系研究科 修士課程
  start: 2014-04
  end: 2016-03
```

# スキル

カテゴリ形式:

```resume:skills
categories:
  - category: プログラミング言語
    items: [TypeScript, Python, Go, Rust]
  - category: フレームワーク
    items: [React, Node.js, Django, FastAPI]
  - category: クラウド・DevOps
    items: [AWS, Docker, Kubernetes, Terraform]
```

グリッド形式:

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

# 免許・資格

```resume:certifications
- name: AWS ソリューションアーキテクト プロフェッショナル
  issuer: Amazon Web Services
  date: 2023-01
  url: https://aws.amazon.com/certification/
- name: 基本情報技術者
  issuer: IPA
  date: 2015-04
```

# 語学

```resume:languages
- language: 日本語
  level: ネイティブ
- language: 英語
  level: ビジネスレベル (TOEIC 900)
- language: 中国語
  level: 日常会話
```

# 自己PR

```resume:competencies
- header: 技術リーダーシップ
  description: 複数のタイムゾーンにまたがる10名以上のエンジニアチームをリード
- header: システム設計
  description: 毎秒100万リクエスト以上を処理するスケーラブルな分散システムを設計
- header: メンタリング
  description: 20名以上が参加するエンジニアリングメンタリングプログラムを確立
```

# 志望動機（履歴書のみ）

貴社の革新的な製品開発に携わり、人々の生活に変化をもたらす
プロダクトを作りたいと考え、応募いたしました。

# 本人希望記入欄（履歴書のみ）

即日勤務可能。転勤可。
````

#### セクション一覧

| セクション ID    | 対応タグ                                                                          | フォーマット |
| ---------------- | --------------------------------------------------------------------------------- | ------------ |
| `summary`        | 概要, 職務要約, Summary, Professional Summary, Profile, Executive Summary         | CV           |
| `experience`     | 職歴, 職務経歴, Experience, Work Experience, Professional Experience              | 両方         |
| `education`      | 学歴, Education                                                                   | 両方         |
| `skills`         | スキル, Skills, Technical Skills                                                  | 両方         |
| `certifications` | 免許・資格, 資格, 免許, Certifications                                            | 両方         |
| `languages`      | 語学, Languages, Language Skills                                                  | CV           |
| `competencies`   | 自己PR, Core Competencies, Key Competencies, Superpowers                          | 両方         |
| `motivation`     | 志望動機, 志望の動機, Motivation                                                  | 履歴書       |
| `notes`          | 本人希望記入欄, Notes                                                             | 履歴書       |

## 設定ファイル

設定ファイルは完全にオプションです。すべてのパラメータは CLI 引数で指定できます。同じ設定を繰り返し使用する場合に便利です。

`config.json` または `config.yaml` を作成:

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

## プログラムからの使用

md2cv をライブラリとして使用する場合:

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

## ライセンス

このプロジェクトは GNU General Public License v3.0 (GPL-3.0) の下でライセンスされています。このソフトウェアは自由に使用、変更、配布できますが、派生物も同じライセンスの下で配布する必要があります。詳細は [LICENSE](LICENSE) ファイルを参照してください。
