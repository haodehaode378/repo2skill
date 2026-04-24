# v0.1 Release Verification / v0.1 发布验证

Date: 2026-04-24

This file records the concrete checks run before the v0.1 release candidate.

这份文件记录 v0.1 release candidate 发布前实际跑过的验证。

## Local Quality Gates / 本地质量门禁

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Result:

结果：

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm test`: 27 test files passed, 94 tests passed
- `npm run build`: passed

## Smoke Benchmark / Smoke Benchmark

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

Result:

结果：

- Repositories: 10
- Succeeded: 10
- Failed: 0
- Regressions: 0
- Improvements: 0

## Context Evaluation / 上下文评估

```bash
npm run evaluate -- ./evaluations/tinybench.json --cache-dir E:/r2s-cache --out ./evaluation-out
```

Result:

结果：

- Cases: 1
- Succeeded: 1
- Failed: 0

## npm Package Check / npm 包检查

```bash
npm pack --dry-run
```

Result:

结果：

- Package: `repo2skill@0.1.0`
- Total files: 5
- Included files:
  - `dist/index.js`
  - `dist/index.d.ts`
  - `README.md`
  - `LICENSE`
  - `package.json`

The packed package did not include `src`, `tests`, `examples`, benchmark output, local `out-*` directories, or `node_modules`.

打包产物没有包含 `src`、`tests`、`examples`、benchmark 输出、本地 `out-*` 目录或 `node_modules`。

## Packed CLI Check / 打包 CLI 检查

```bash
npm exec --yes --package ./repo2skill-0.1.0.tgz -- repo2skill --help
```

Result:

结果：

- The packed CLI started successfully.
- `repo2skill --help` displayed the expected command options.

## Encoding Check / 编码检查

```bash
python C:/Users/36366/.codex/skills/text-encoding-guard/scripts/check_mojibake.py --root .
```

Result:

结果：

- No suspicious mojibake patterns found.

