# v0.2 Release Verification

Date: 2026-05-28

This file records the concrete checks run before the v0.2 release candidate.

## Local Quality Gates

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit
python C:/Users/36366/.codex/skills/text-encoding-guard/scripts/check_mojibake.py --root .
```

Result:

- `npm run format:check`: passed
- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm test`: 29 test files passed, 102 tests passed
- `npm run build`: passed
- `npm audit`: passed, 0 vulnerabilities
- Encoding check: passed, no suspicious mojibake patterns found

## Stable Fixture Export

```bash
npm run dev -- ./tests/fixtures/analysis-target --out ./examples/analysis-target
```

Result:

- Generated `repo2skill.json`, `project-map.md`, `AGENTS.md`, `SKILL.md`, OS quickstarts, and `report.html`.

## Smoke Benchmark

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

Result:

- Repositories: 10
- Succeeded: 10
- Failed: 0
- Regressions: 0
- Improvements: 0

## Context Evaluation

```bash
npm run evaluate -- ./evaluations/tinybench.json --cache-dir E:/r2s-cache --out ./evaluation-out
```

Result:

- Cases: 1
- Succeeded: 1
- Failed: 0

## npm Package Check

```bash
npm pack --dry-run
npm pack
npm exec --yes --package ./haodehaode378-repo2skill-0.2.0.tgz -- repo2skill --help
```

Result:

- Package: `@haodehaode378/repo2skill@0.2.0`
- Total files: 5
- Included files:
  - `dist/index.js`
  - `dist/index.d.ts`
  - `README.md`
  - `LICENSE`
  - `package.json`

The packed package did not include `src`, `tests`, `examples`, benchmark output, local `out-*` directories, or `node_modules`.

The packed CLI started successfully and displayed the expected command options. The temporary tarball was removed after verification.
