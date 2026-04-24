# Benchmark Plan

`repo2skill` now includes:

- a main benchmark manifest at [`benchmarks/public-node-ts.json`](../benchmarks/public-node-ts.json)
- a smaller smoke manifest at [`benchmarks/public-node-ts-smoke.json`](../benchmarks/public-node-ts-smoke.json)
- a runnable benchmark CLI via `npm run benchmark -- <manifest> --out <dir>`
- committed baseline summaries under [`benchmarks/baselines`](../benchmarks/baselines)
- regression comparison via `--compare`

Current purpose:

- keep a concrete home for public-repository regression work
- make it obvious which repositories should be reused for future validation
- provide a stable format that later automation can consume

Current scope:

- public GitHub repositories only
- Node.js / TypeScript-oriented repositories first
- smoke manifest for faster verification before running the full set
- 10 repositories in the smoke manifest
- 21 repositories in the full manifest

Release check:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

Regression fields:

- `success`
- `packageManager`
- `projectType`
- `workspace`
- `scriptCount`
- `commandCount`
- `configFileCount`
- `entrypointCount`
- `envVarCount`

Next steps:

1. decide which benchmark failures are acceptable signal changes vs regressions
2. add snapshot-style checks for selected generated artifacts
3. add an agent-facing evaluation doc for real repository tasks
