# v0.4 Release Verification

Date: 2026-07-22

This record tracks the concrete repo2skill v0.4.0 release checks. Final package, coverage, dependency, encoding, Git, and CI values are refreshed by the release preparation commit after all documentation and version metadata are complete.

## Deterministic Semantic Evaluation

```bash
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out/v0.3
npm run evaluate -- ./evaluations/v0.4-local.json --out ./evaluation-out/v0.4
```

Observed pre-release result:

- v0.3: 5 cases succeeded, 0 failed.
- v0.4: 9 cases succeeded, 0 failed.
- v0.4 covers repo2skill single-package compatibility, pnpm and npm workspace discovery, exclusions, safe boundaries, typed dependency edges, unnamed and duplicate packages, package facts and commands, focused output, and Windows path normalization.

## Public Monorepo Smoke

```bash
npm run benchmark -- ./benchmarks/public-monorepo-smoke.json --cache-dir <outside-repo-cache> --out ./benchmark-smoke-out --format json
```

Observed result against `vercel/turborepo`:

- Repositories: 1.
- Succeeded: 1.
- Failed: 0.
- Package manager: pnpm.
- Workspace packages: 20.
- Internal dependency edges: 40.
- Package commands: 28.

The result was supplementary and did not overwrite a committed baseline. The clone cache was kept outside the repository for final lint and format checks.

## Compatibility and Safety Checks

- Exporter tests preserve single-package sections when no concrete workspace packages exist.
- Structured package facts use repository-relative `/` paths.
- Target package scripts are detected and rendered but never executed.
- Public benchmark network and upstream behavior are not treated as the sole correctness gate.

## Final Gate

The final release audit records:

- `npm run release:check` test and coverage totals;
- focused CLI, self-analysis, and self-audit results;
- `npm pack --dry-run --json` file list and sizes;
- `npm audit` result;
- UTF-8/mojibake and `git diff --check` results;
- local/remote SHA equality and final GitHub CI URL.
