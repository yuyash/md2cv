# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
