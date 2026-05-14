# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Performance

- Extract shared directory walker (`sharedWalker.ts`) eliminating duplicated traversal logic across detect and audit modules
- Cache `package.json` parse result — previously read 4 times per analysis run
- Parallelize all 7 detect functions with `Promise.all` instead of sequential execution
- Use `Set` lookup for conventional entrypoint checks instead of repeated `fs.pathExists` calls

### Refactor

- Extract `commandHelpers.ts` with shared `getCommands`, `getValidationCommands`, `getCommandRole`, `formatCode` — removes 3-way copy-paste across exporters
- Decompose `renderHtmlReport` (~170 lines) into 9 focused section renderers
- Add WHY comments to 4 security regex patterns in `auditRepository.ts`

### Fix

- Anchor GitHub URL regex with `$` to prevent partial-match false positives
- Validate branch name against allowlist pattern to prevent git flag injection
- Skip symlinks during audit file traversal to prevent directory traversal attacks

### Security

- Add `SAFE_BRANCH_PATTERN` whitelist for branch names passed to `git clone`
- Add `skipSymlinks: true` to audit directory walker
- Anchor `GITHUB_URL_PATTERN` to reject URLs with trailing path segments

### Engineering

- Add `@vitest/coverage-v8` with v8 provider and lcov/text reporters
- Configure coverage thresholds: 80% lines, 80% statements, 75% branches, 80% functions
- Add `test:coverage` npm script
- Add coverage step to GitHub Actions CI pipeline

## [0.2.0] - 2025-05-01

### Added

- HTML report export with styled sections
- Project map export for IDE integration
- Benchmark and evaluation CLI commands
- Quickstart guides for Windows, macOS, Linux
- SKILL.md export with frontmatter metadata

### Changed

- Improve agent onboarding outputs with richer evidence

## [0.1.0] - 2025-04-15

### Added

- Initial MVP: detect package manager, scripts, config files, entrypoints
- Repository analysis pipeline: detect → deriveFacts → export
- AGENTS.md and JSON export formats
- Zod schema validation for analysis results
- Commander-based CLI with GitHub URL and local path input support
