# v0.3 Release Checklist / v0.3 发布检查清单

This checklist keeps the release focused on evidence-backed Node.js/TypeScript onboarding correctness.

这份清单用于确保 v0.3 聚焦于 Node.js/TypeScript onboarding 的证据与正确性。

## Scope / 范围

- Public GitHub repositories / 公开 GitHub 仓库
- Local repositories / 本地仓库
- Node.js / TypeScript-oriented repositories
- Evidence-backed exports only / 只输出有证据支撑的内容
- Workspace-aware root navigation, not complete per-package analysis / 感知 workspace 根目录，不做完整子包分析
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
npm run release:check
```

Run the stable fixture export:

运行稳定 fixture 导出：

```bash
npm run dev -- ./tests/fixtures/analysis-target --out ./examples/analysis-target
```

After regenerating examples, check that local absolute paths are not committed.

重新生成 examples 后，检查不要提交本机绝对路径。

## npm Package / npm 包检查

Before publishing, verify the package contents locally:

发布前先在本地验证包内容：

```bash
npm pack --dry-run --json
```

The dry-run package listing should include:

打包产物应包含：

- `dist/index.js`
- `README.md`
- `LICENSE`
- `package.json`

The packed tarball should not include:

打包产物不应包含：

- `src`
- `tests`
- `examples`
- `benchmark-out`
- `out-*`
- `node_modules`

The package is a pure CLI and should not contain an empty `dist/index.d.ts` declaration artifact.

## Benchmark Checks / Benchmark 检查

Smoke benchmark:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir ./repo2skill-cache --out ./benchmark-smoke-out
```

Compare with baseline:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir ./repo2skill-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
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

Equal counts do not prove equal facts. Run the deterministic semantic suite as a separate required gate:

```bash
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out
```

## README / README 检查

- The README should remain bilingual / README 应保持中英双语
- The first screen should show value quickly / 首屏应快速展示价值
- Output preview should point to `examples/analysis-target` / 输出预览应指向 `examples/analysis-target`
- Claims should match implemented behavior / 文案承诺应与已实现行为一致

## Encoding / 编码检查

README 和发布文档包含中文。编辑器和自动化应保持 UTF-8，并在发布前检查中英文文本没有乱码。
