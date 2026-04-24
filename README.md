# repo2skill

Turn a repository into agent-ready onboarding context.

## What it generates today

Given a local repository path or public GitHub URL, `repo2skill` currently writes:

- `repo2skill.json`
- `project-map.md`
- `AGENTS.md`
- `SKILL.md`
- `quickstart.windows.md`
- `quickstart.macos.md`
- `quickstart.linux.md`
- `report.html` when using `--format all`

All generated files derive from the same structured analysis object.

## What it detects today

The current MVP can extract:

- package manager from lockfiles
- project type from strong framework or CLI signals
- canonical scripts from `package.json`
- entrypoints from `package.json` fields and common conventions
- environment variables from `.env.example`, `.env.local.example`, and `process.env.*` usage

Current outputs are evidence-backed and intentionally narrow.
The project also now includes a benchmark manifest plus a runnable benchmark command for regression work.

## Current scope

Supported now:

- public GitHub repositories
- local repositories
- Node.js / TypeScript-oriented repositories
- `json`, `md`, and `all` export modes
- simple local cache for repeated public GitHub clones

Not implemented yet:

- remote freshness checks for cached GitHub clones
- private repository authentication
- broad multi-language support

## Usage

Install dependencies:

```bash
npm install
```

Run the CLI against a local repository:

```bash
npm run dev -- ./tests/fixtures/analysis-target --out ./out
```

Analyze a repository without writing any output files:

```bash
npm run dev -- ./tests/fixtures/analysis-target --summary-only
```

Run the CLI against a public GitHub repository:

```bash
npm run dev -- https://github.com/octocat/Hello-World --out ./out-github
```

Use a custom cache directory instead of the system temp directory:

```bash
npm run dev -- https://github.com/octocat/Hello-World --cache-dir E:/repo2skill-cache --out ./out-github
```

Clone and analyze a specific GitHub branch:

```bash
npm run dev -- https://github.com/octocat/Hello-World --branch master --out ./out-github
```

Run the benchmark manifest:

```bash
npm run benchmark -- ./benchmarks/public-node-ts.json --out ./benchmark-out
```

For repeated benchmark runs on Windows, prefer a short cache path to reduce long-path checkout failures:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out
```

Write a baseline summary JSON while running the benchmark:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --baseline-out ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

Compare the current benchmark run with an existing baseline:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

Write the compare result to JSON for CI or later inspection:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json --compare-out ./benchmark-smoke-out/compare.json
```

## Example output

From the current fixture, `repo2skill` produces:

- `repo2skill.json` with detected `pnpm`, `dev/build/test`, and env var evidence
- `project-map.md` with concise repository facts
- `AGENTS.md` with priority commands and finishing checks
- `SKILL.md` with repository-specific guidance derived from the same evidence
- OS-specific quickstart files that only include evidenced commands and env var hints
- an HTML report when using `--format all`
- benchmark summaries across a manifest of public repositories

## Why this shape

The project is being built schema-first and evidence-first:

- detectors collect facts
- exporters render only from structured analysis
- missing evidence means omitted sections instead of guessed prose

This keeps generated onboarding context useful for both agents and humans.

## Development

Run the test suite:

```bash
npm test
```

Run the full local verification loop:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run the current benchmark manifest:

```bash
npm run benchmark -- ./benchmarks/public-node-ts.json --out ./benchmark-out
```

## Status

Early MVP, but no longer just a scaffold.
The local and public-GitHub analysis paths, benchmark runner, and HTML report are implemented and verified.
