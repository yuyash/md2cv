# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0](https://github.com/yuyash/md2cv/compare/v2.2.0...v2.3.0) (2026-02-13)


### Features

* group experience roles by company ([#56](https://github.com/yuyash/md2cv/issues/56)) ([4f3b704](https://github.com/yuyash/md2cv/commit/4f3b7047df9df8317f9115bbc220e15066d61df3))

## [2.2.0](https://github.com/yuyash/md2cv/compare/v2.1.0...v2.2.0) (2026-02-08)


### Features

* add home_address_ja field for Japanese address in rirekisho ([#54](https://github.com/yuyash/md2cv/issues/54)) ([0d5885f](https://github.com/yuyash/md2cv/commit/0d5885f2bc3432bd02f0fa89ba3a17b39693090a))

## [2.1.0](https://github.com/yuyash/md2cv/compare/v2.0.2...v2.1.0) (2026-02-03)


### Features

* move photo specification from CLI option to frontmatter/env var… ([#51](https://github.com/yuyash/md2cv/issues/51)) ([79c5f44](https://github.com/yuyash/md2cv/commit/79c5f447422608ef9061e8b2ec000e3719c9fe86))

## [2.0.2](https://github.com/yuyash/md2cv/compare/v2.0.1...v2.0.2) (2026-02-03)


### Bug Fixes

* sync scroll line mapping v2 ([#49](https://github.com/yuyash/md2cv/issues/49)) ([1c26e2d](https://github.com/yuyash/md2cv/commit/1c26e2db4425961b45070227cbf9b6515c4755e0))

## [2.0.1](https://github.com/yuyash/md2cv/compare/v2.0.0...v2.0.1) (2026-02-02)


### Bug Fixes

* use consistent font sizes across sections ([#47](https://github.com/yuyash/md2cv/issues/47)) ([54d2050](https://github.com/yuyash/md2cv/commit/54d2050dae632b26237fa38918c83835689ea5e8))

## [2.0.0](https://github.com/yuyash/md2cv/compare/v1.6.0...v2.0.0) (2026-02-01)


### ⚠ BREAKING CHANGES

* Parser now returns CompositeContent instead of legacy content types

### Features

* add composite content model for mixing markdown with structured blocks ([64f561c](https://github.com/yuyash/md2cv/commit/64f561ca66e0076d685bafbc2a2df615c5c1129a))
* add composite content model for mixing markdown with structured… ([#43](https://github.com/yuyash/md2cv/issues/43)) ([64f561c](https://github.com/yuyash/md2cv/commit/64f561ca66e0076d685bafbc2a2df615c5c1129a))

## [1.6.0](https://github.com/yuyash/md2cv/compare/v1.5.0...v1.6.0) (2026-01-31)


### Features

* add --margin-mm CLI option for CV format ([#41](https://github.com/yuyash/md2cv/issues/41)) ([38ef4d7](https://github.com/yuyash/md2cv/commit/38ef4d70013707566e9db092afa28fd64cca04d4))

## [1.5.0](https://github.com/yuyash/md2cv/compare/v1.4.4...v1.5.0) (2026-01-31)


### Features

* add markdown-to-HTML conversion for CV content ([#39](https://github.com/yuyash/md2cv/issues/39)) ([c361e79](https://github.com/yuyash/md2cv/commit/c361e79fcbb954943dfcc1adaa1ad891d522bd18))

## [1.4.4](https://github.com/yuyash/md2cv/compare/v1.4.3...v1.4.4) (2026-01-31)


### Bug Fixes

* add mixed content type for sections with paragraphs and lists ([#37](https://github.com/yuyash/md2cv/issues/37)) ([00c96ca](https://github.com/yuyash/md2cv/commit/00c96ca06aee5a788c7074edde9e39e842d4fe91))

## [1.4.3](https://github.com/yuyash/md2cv/compare/v1.4.2...v1.4.3) (2026-01-31)


### Bug Fixes

* page break cv sections ([#35](https://github.com/yuyash/md2cv/issues/35)) ([3899a8a](https://github.com/yuyash/md2cv/commit/3899a8a74a70fe0a2d3762130ced197037d4c95c))

## [1.4.2](https://github.com/yuyash/md2cv/compare/v1.4.1...v1.4.2) (2026-01-24)


### Bug Fixes

* **rirekisho:** Fix minor issues and parser improvements: ([#31](https://github.com/yuyash/md2cv/issues/31)) ([07bb277](https://github.com/yuyash/md2cv/commit/07bb277acc681b72112b176509b500f16e644792))

## [1.4.1](https://github.com/yuyash/md2cv/compare/v1.4.0...v1.4.1) (2026-01-02)


### Bug Fixes

* add workflow permissions and harden h1 scan ([#28](https://github.com/yuyash/md2cv/issues/28)) ([fa1fb44](https://github.com/yuyash/md2cv/commit/fa1fb44e843b48fa9c11d279513fa9e12c56d972))
* update readme.md to add env variables. ([#27](https://github.com/yuyash/md2cv/issues/27)) ([e6a1b9a](https://github.com/yuyash/md2cv/commit/e6a1b9a94648c391d966725411c4609db2f492f1))

## [1.4.0](https://github.com/yuyash/md2cv/compare/v1.3.0...v1.4.0) (2025-12-31)


### Features

* add husky/lint-staged and refactor generators ([#23](https://github.com/yuyash/md2cv/issues/23)) ([32bf4d0](https://github.com/yuyash/md2cv/commit/32bf4d072b36e8a5bacde499dcb723485e66094e))

## [1.3.0](https://github.com/yuyash/md2cv/compare/v1.2.0...v1.3.0) (2025-12-31)


### Features

* add subpath exports and improve generator ([#17](https://github.com/yuyash/md2cv/issues/17)) ([8f4b0ea](https://github.com/yuyash/md2cv/commit/8f4b0ea9ab80696c3891aab32f65281bfbf4d457))

## [1.2.0](https://github.com/yuyash/md2cv/compare/v1.1.1...v1.2.0) (2025-12-28)


### Features

* add init command for template generation ([#14](https://github.com/yuyash/md2cv/issues/14)) ([bdf4749](https://github.com/yuyash/md2cv/commit/bdf4749226b7d3424fbc1c2398bbb6e1c2097e87))

## [1.1.1](https://github.com/yuyash/md2cv/compare/v1.1.0...v1.1.1) (2025-12-28)


### Bug Fixes

* make frontmatter optional and add comprehensive metadata tests ([#12](https://github.com/yuyash/md2cv/issues/12)) ([7703dce](https://github.com/yuyash/md2cv/commit/7703dce920d71b9fabb68310040f14d2390c0f70))

## [1.1.0](https://github.com/yuyash/md2cv/compare/v1.0.5...v1.1.0) (2025-12-28)


### Features

* add custom stylesheet support for CV and rirekisho ([#10](https://github.com/yuyash/md2cv/issues/10)) ([8a7a777](https://github.com/yuyash/md2cv/commit/8a7a7774f797be569f23824e50efbbfe2fde3648))

## [1.0.5](https://github.com/yuyash/md2cv/compare/v1.0.4...v1.0.5) (2025-12-27)


### Bug Fixes

* simplify publish workflow by relying on prepublishOnly ([163bf91](https://github.com/yuyash/md2cv/commit/163bf91bd2b2a837d9b4b9057ffb4d97066c09de))
* simplify publish workflow by relying on prepublishOnly ([5cdc1ba](https://github.com/yuyash/md2cv/commit/5cdc1bada909877bd17898ce481258069782c131))

## [1.0.4](https://github.com/yuyash/md2cv/compare/v1.0.3...v1.0.4) (2025-12-27)


### Bug Fixes

* upgrade npm for trusted publishing support ([92dcbd9](https://github.com/yuyash/md2cv/commit/92dcbd9e87eef3b969faca24e174b93db5cc7c95))
* upgrade npm for trusted publishing support ([1839b18](https://github.com/yuyash/md2cv/commit/1839b180fa3f79afa59c25302b0e00f98cb25ac3))

## [1.0.3](https://github.com/yuyash/md2cv/compare/v1.0.2...v1.0.3) (2025-12-27)


### Bug Fixes

* add workflow_dispatch to publish workflow ([1a5436f](https://github.com/yuyash/md2cv/commit/1a5436f45429b647c96107b04d967ebd5239e5a9))
* add workflow_dispatch to publish workflow ([f9fd856](https://github.com/yuyash/md2cv/commit/f9fd856458caebbc31f31b17f8a54bb0b3773325))

## [1.0.2](https://github.com/yuyash/md2cv/compare/v1.0.1...v1.0.2) (2025-12-27)


### Bug Fixes

* minor documentation update ([b3e00fa](https://github.com/yuyash/md2cv/commit/b3e00faedf44f706dea7de40114a9c70fe0ac4f3))
* minor documentation update ([d8173fb](https://github.com/yuyash/md2cv/commit/d8173fbb4613c872009bb0e90e850e00e18e96ce))

## [1.0.0] - 2025-12-26

### Added

- Initial release
- Markdown to CV/Resume conversion with PDF and HTML output formats
- Support for western-style CV format
- Support for Japanese rirekisho (履歴書) format
- Support for Japanese shokumu-keirekisho (職務経歴書) format
- Multiple paper sizes: A3, A4, B4, B5, Letter
- Environment variable support for personal information
- Photo embedding for rirekisho format
