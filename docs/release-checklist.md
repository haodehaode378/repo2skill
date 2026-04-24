# v0.1 Release Checklist / v0.1 发布检查清单

This checklist keeps the release focused on a stable, evidence-first MVP.

这份清单用于确保 v0.1 仍然聚焦在稳定、证据优先的 MVP。

## Scope / 范围

- Public GitHub repositories / 公开 GitHub 仓库
- Local repositories / 本地仓库
- Node.js / TypeScript-oriented repositories
- Evidence-backed exports only / 只输出有证据支撑的内容
- No private repository authentication / 不做私有仓库鉴权
- No broad multi-language support / 不做广泛多语言支持

## Generated Artifacts / 生成物

Do not commit transient local outputs:

不要提交临时本地输出：

- `out`
- `out-*`
- `benchmark-out`
- `benchmark-smoke-out`
- `dist`

These paths are already covered by `.gitignore`.

这些路径已经被 `.gitignore` 覆盖。

Committed examples are allowed:

允许提交的示例：

- `examples/analysis-target`

The committed example should stay deterministic and should not contain machine-specific absolute paths.

已提交示例应保持稳定，并且不应包含本机绝对路径。

## Required Verification / 必跑验证

Run before release:

发布前运行：

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run the stable fixture export:

运行稳定 fixture 导出：

```bash
npm run dev -- ./tests/fixtures/analysis-target --out ./examples/analysis-target
```

After regenerating examples, check that local absolute paths are not committed.

重新生成 examples 后，检查不要提交本机绝对路径。

## Benchmark Checks / Benchmark 检查

Smoke benchmark:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out
```

Compare with baseline:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

The comparison should not report regressions in:

对比结果不应出现以下字段退化：

- `success`
- `packageManager`
- `projectType`
- `workspace`
- `scriptCount`
- `commandCount`
- `configFileCount`
- `entrypointCount`
- `envVarCount`

## README / README 检查

- The README should remain bilingual / README 应保持中英双语
- The first screen should show value quickly / 首屏应快速展示价值
- Output preview should point to `examples/analysis-target` / 输出预览应指向 `examples/analysis-target`
- Claims should match implemented behavior / 文案承诺应与已实现行为一致

## Encoding / 编码检查

Because the README and release docs contain Chinese text, run the mojibake checker before release:

因为 README 和发布文档包含中文，发布前运行乱码检查：

```bash
python C:/Users/36366/.codex/skills/text-encoding-guard/scripts/check_mojibake.py --root .
```

