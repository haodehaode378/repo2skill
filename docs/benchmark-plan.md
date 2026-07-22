# Benchmark Plan

`repo2skill` now includes:

- a main benchmark manifest at [`benchmarks/public-node-ts.json`](../benchmarks/public-node-ts.json)
- a smaller smoke manifest at [`benchmarks/public-node-ts-smoke.json`](../benchmarks/public-node-ts-smoke.json)
- a one-repository monorepo smoke manifest at [`benchmarks/public-monorepo-smoke.json`](../benchmarks/public-monorepo-smoke.json)
- a runnable benchmark CLI via `npm run benchmark -- <manifest> --out <dir>`
- committed baseline summaries under [`benchmarks/baselines`](../benchmarks/baselines)
- regression comparison via `--compare`

Current purpose:

- keep a concrete home for public-repository regression work
- make it obvious which repositories should be reused for future validation
- provide a stable format that later automation can consume

`success` means a repository was materialized, analyzed, and exported without an exception. Count fields make detector shape changes visible, but they do not prove that the detected paths are correct. Two analyses can both report two entrypoints while naming different files.

Current scope:

- public GitHub repositories only
- Node.js / TypeScript-oriented repositories first
- smoke manifest for faster verification before running the full set
- 10 repositories in the smoke manifest
- 21 repositories in the full manifest

Release check:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir ./repo2skill-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
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
- `workspacePackageCount`
- `internalDependencyEdgeCount`
- `packageCommandCount`
- `focusedPackageSuccess` when a benchmark repo requests `package`

Next steps:

1. decide which benchmark failures are acceptable signal changes vs regressions
2. add snapshot-style checks for selected generated artifacts
3. add an agent-facing evaluation doc for real repository tasks

## Semantic Quality Layer

Use the local semantic manifest before the public benchmark:

```bash
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out
npm run evaluate -- ./evaluations/v0.4-local.json --out ./evaluation-out/v0.4
```

This asserts exact entrypoints, commands, config files, and allowed navigation directories. Artifact `includes` and `excludes` then verify that the structured facts survive rendering. The semantic suite lives in evaluation rather than duplicating the same assertion engine in benchmark code.

The v0.4 public monorepo smoke is supplementary:

```bash
npm run benchmark -- ./benchmarks/public-monorepo-smoke.json --cache-dir <outside-repo-cache> --out ./benchmark-smoke-out
```

Do not overwrite a committed baseline after network, checkout, or upstream failures. Record the failure class and keep deterministic local evaluation as the correctness gate.
