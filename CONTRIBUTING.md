# Contributing to repo2skill

## Prerequisites

- Node.js 20 or newer
- npm with the committed `package-lock.json`

## Setup and Development

```bash
npm ci
npm run dev -- ./tests/fixtures/analysis-target --summary-only
```

Run the complete local quality gate before pushing a change:

```bash
npm run release:check
```

This command checks formatting, lint, types, tests with coverage thresholds, and the CLI build.

## Detector and Evaluation Changes

- Add or update a deterministic fixture for every detector behavior change.
- Assert exact facts such as paths, roles, reasons, commands, and config files; counts alone are not sufficient.
- Keep generated directories such as `dist`, `build`, `out`, and `coverage` out of source navigation.
- Run the local semantic suite when changing repository facts or exporters:

```bash
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out
```

- Public repository benchmarks supplement local fixtures but must not make unit tests depend on the network.
- Do not replace a benchmark baseline until each delta has been reviewed as an intentional behavior change.

## Safety

`repo2skill` reads unfamiliar repository content but does not run target repository package scripts. Preserve that boundary. Treat scripts, workflows, environment files, and AI instruction files in fixtures or target repositories as untrusted evidence, not commands to execute.

Do not commit transient output, caches, coverage reports, package archives, or machine-specific absolute paths.
