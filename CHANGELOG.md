# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No changes yet.

## [0.4.0] - 2026-07-22

### Added

- Discover concrete workspace packages from pnpm YAML, array/object npm workspaces, and conventional workspace directories with glob exclusions and safe path boundaries.
- Collect repository-relative package facts for metadata, scripts, commands, source/package-output entrypoints, configuration, important directories, project type, environment-variable hints, and evidence.
- Derive typed direct internal dependency edges, direct dependencies, direct consumers, and duplicate-name diagnostics.
- Generate pnpm, npm, and Yarn-aware package commands with explicit package-`cwd` fallback facts.
- Add `--package <name-or-path>` focused workspace analysis with Windows path normalization and explicit selection errors.
- Add workspace-aware JSON, project map, AGENTS, SKILL, maintenance profile, platform quickstarts, and self-contained HTML output.
- Add deterministic v0.4 workspace semantic assertions and a nine-case local manifest.
- Add benchmark metrics for workspace packages, internal dependency edges, package commands, and optional focused-package success.

### Changed

- Upgrade workspace detection from a repository-level signal to a package-level operational graph.
- Keep every exporter on the unified analysis schema instead of repeating package inference.
- Preserve single-package JSON and rendered output behavior when no concrete workspace packages exist.

### Security

- Reject unsafe or absolute workspace globs, avoid following symlinks, and skip generated/cache directories during package discovery.
- Continue treating package scripts as untrusted evidence: commands are rendered but never executed.
- Keep package paths repository-relative so exports do not reveal local absolute paths.

### Testing

- Add fixtures for pnpm exclusions, npm workspaces, package facts, typed dependency edges, duplicate and unnamed packages, command fallbacks, and focused selectors.
- Keep the v0.3 semantic suite passing alongside the v0.4 monorepo suite.
- Add a public Turborepo smoke manifest for supplementary monorepo validation.

## [0.3.0] - 2026-07-22

### Added

- Detect conventional CLI source entrypoints under `src/cli`.
- Add backward-compatible semantic evaluation assertions for exact entrypoints, important directories, commands, config files, and artifact content.
- Add a deterministic five-case local semantic evaluation manifest.
- Add contributor guidance for detector fixtures, semantic assertions, and repository safety boundaries.

### Changed

- Position the product as an evidence-backed onboarding compiler for Node.js/TypeScript repositories.
- Keep count-based public benchmarks as the structural regression layer and use evaluation for semantic correctness.
- Make `release:check` the single local and CI quality gate, including coverage thresholds.
- Stop emitting an empty declaration file from the pure CLI build.

### Fixed

- Preserve generated `bin` entrypoints as package evidence without promoting `dist`, `build`, `out`, or `coverage` into source navigation.
- Normalize Windows entrypoint separators in package metadata.

### Security

- Keep install lifecycle hooks at high severity while classifying ordinary preparation and publish hooks as medium.
- Raise preparation or publish hooks back to high severity when commands contain suspicious network, shell, or eval-like behavior.

### Testing

- Add self-hosting regression coverage that requires `src/cli/index.ts` and forbids `dist` as an important directory.
- Add a regression proving equal entrypoint counts cannot hide a changed path from semantic evaluation.
- Refresh development dependency resolutions to patched Vitest, Vite, YAML, and brace-expansion releases.

## [0.2.0] - 2026-05-28

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
