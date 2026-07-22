# v0.3 Release Verification

Date: 2026-07-22

This file records the concrete checks run for repo2skill v0.3.0. Deterministic local gates passed. The public smoke benchmark also exposed one Windows checkout limitation and live upstream drift, recorded below without replacing the committed baseline.

## Unified Local Quality Gate

```bash
npm run release:check
```

Result:

- Formatting, lint, and type checking: passed.
- Test files: 34 passed.
- Tests: 135 passed.
- Coverage: 92.90% statements, 92.90% lines, 84.49% branches, 98.45% functions.
- Coverage thresholds: passed.
- Pure CLI build: passed; `dist/index.js` was generated without an empty declaration file.

## Self-Hosted Analysis

```bash
npm run dev -- . --summary-only
npm run dev -- . --audit-only
```

Result:

- Entrypoints: `dist/index.js`, `src/cli/index.ts`.
- Generated `dist` output is retained as package evidence and is not an important source directory.
- The ordinary `prepack` build hook is medium severity, not high.
- The GitHub Actions workflow remains a low-severity review hint.

## Deterministic Semantic Evaluation

```bash
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out
```

Result:

- Cases: 5.
- Succeeded: 5.
- Failed: 0.
- Covered self-hosted CLI navigation, generated and source `bin` entrypoints, workspace navigation, and package-output/source separation.

The supplementary public tinybench evaluation also passed: 1 case succeeded, 0 failed.

## Public Smoke Benchmark

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir ./repo2skill-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

Observed result after one timeout and one cache-assisted retry:

- Repositories: 10.
- Succeeded: 9.
- Failed: 1.
- Next.js failed during Windows checkout because an upstream fixture path exceeded the platform filename limit.
- The comparison reported 2 unchanged repositories, 3 repositories with regression-classified count changes, and 5 with improvements.
- The non-Next.js changes were live upstream count drift, including config and environment-variable counts.
- The committed April 2026 baseline was not overwritten because the result was not a clean, reviewable detector-only change.

This public result is supplementary. The deterministic semantic suite is the correctness gate for exact v0.3 facts.

## Package Check

```bash
npm pack --dry-run --json
```

Result:

- Package: `@haodehaode378/repo2skill@0.3.0`.
- Total files: 4.
- Included: `dist/index.js`, `README.md`, `LICENSE`, and `package.json`.
- Excluded: source, tests, examples, caches, evaluation output, benchmark output, and `dist/index.d.ts`.

## Dependency and Encoding Checks

```bash
npm audit
```

Result:

- The lockfile refresh removed all critical and high-severity audit findings.
- One low-severity esbuild development-tool advisory remains because tsup, tsx, and Vite currently resolve the shared 0.27.x line; forcing an override outside their declared ranges was intentionally avoided.
- A UTF-8 mojibake scan passed with no suspicious files.
