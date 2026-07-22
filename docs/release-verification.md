# v0.4 Release Verification

Date: 2026-07-22

This record contains the concrete local repo2skill v0.4.0 release checks. GitHub CI is verified against the pushed release commit and reported with its run URL in the release handoff.

## Deterministic Semantic Evaluation

```bash
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out/v0.3
npm run evaluate -- ./evaluations/v0.4-local.json --out ./evaluation-out/v0.4
```

Observed final result:

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

```bash
npm run format
npm run release:check
```

Result:

- Format, lint, typecheck, and build passed.
- Test files: 39 passed.
- Tests: 166 passed.
- Coverage: 94.19% statements, 94.19% lines, 85.05% branches, 99.18% functions.
- All four coverage percentages exceed the recorded v0.3 baseline; configured thresholds were not reduced.

## Self-Hosted and Focused CLI Checks

```bash
npm run dev -- . --summary-only
npm run dev -- . --audit-only
npm run dev -- ./tests/fixtures/workspaces/package-facts --package @fixture/core --summary-only
```

Result:

- Self-analysis detected npm, CLI project type, `dist/index.js`, and `src/cli/index.ts`.
- Self-audit reported two review hints: the medium `prepack` lifecycle hook and the low GitHub Actions workflow.
- Focused analysis selected `@fixture/core` at `packages/core` and retained only `CORE_TOKEN` from its package context.

## Package and Dependency Checks

```bash
npm pack --dry-run --json
npm audit
```

Result:

- Package: `@haodehaode378/repo2skill@0.4.0`.
- Files: 4 (`LICENSE`, `README.md`, `dist/index.js`, `package.json`).
- Tarball size: 41,032 bytes; unpacked size: 181,514 bytes.
- No source, tests, fixtures, caches, evaluation output, benchmark output, local paths, or empty declaration file were packed.
- npm audit: one low-severity esbuild development-tool advisory; no moderate, high, or critical finding.

## Encoding and Diff Checks

The UTF-8/mojibake scanner reported no suspicious patterns. `git diff --check` passed. `REPO_ROAST_REPORT.md` remained unmodified and uncommitted.
