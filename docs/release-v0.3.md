# repo2skill v0.3 Release Notes

## Evidence-Backed Source Navigation

repo2skill v0.3 focuses the project on Node.js/TypeScript onboarding correctness. Package entrypoints such as `main` and `bin` remain visible evidence, while generated paths under `dist`, `build`, `out`, and `coverage` no longer become source navigation targets. Conventional CLI source entrypoints such as `src/cli/index.ts` are now detected directly.

## Semantic Quality Gates

Public benchmarks continue to reveal structural changes through success and count fields. A new backward-compatible evaluation layer checks exact entrypoints, important directories, commands, config files, and rendered artifact content. The committed `evaluations/v0.3-local.json` suite covers five deterministic local cases, including repo2skill itself, generated and source CLI bins, workspace navigation, and package-output/source separation.

## Audit and Release Improvements

- Install lifecycle hooks remain high severity.
- Ordinary preparation and publish hooks are medium severity unless their commands contain suspicious network, shell, or eval-like behavior.
- `release:check` now runs formatting, lint, type checking, coverage tests, and the CLI build, and CI calls the same command.
- The pure CLI package no longer includes an empty `dist/index.d.ts` file.

## Compatibility

The repository analysis schema remains compatible. Evaluation manifests may continue using artifact-only assertions; semantic `facts` are optional. One intentional output correction changes a generated path referenced by `bin` from the `cli` navigation role to `package-output`, while retaining `bin` as its reason.

## Verify

```bash
npm run release:check
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir ./repo2skill-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
npm pack --dry-run --json
```

Concrete release results are recorded in [`release-verification.md`](./release-verification.md).
