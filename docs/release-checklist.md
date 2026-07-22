# v0.4 Release Checklist / v0.4 发布检查清单

## Scope / 范围

- [ ] Concrete pnpm and `package.json` workspace packages are discovered.
- [ ] Glob exclusions, Windows normalization, stable ordering, and safe directory boundaries are covered.
- [ ] Package-local facts use repository-relative paths and distinguish source from package output.
- [ ] Direct internal dependency types, dependencies, consumers, unnamed packages, and duplicate diagnostics are covered.
- [ ] Package commands are evidence-backed and `--package` focus behaves explicitly.
- [ ] Single-package analysis remains compatible.

- [ ] 能发现真实 pnpm 与 `package.json` workspace packages。
- [ ] 已覆盖 glob 排除、Windows 路径、稳定排序和安全目录边界。
- [ ] 包级事实使用仓库相对路径，并区分源码入口与发布产物入口。
- [ ] 已覆盖内部依赖类型、直接消费者、无名包和重复名称诊断。
- [ ] 包级命令有证据，`--package` 聚焦行为明确。
- [ ] 单包仓库保持兼容。

## Required Local Gates / 必须通过的本地门禁

```bash
npm run format
npm run release:check
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out/v0.3
npm run evaluate -- ./evaluations/v0.4-local.json --out ./evaluation-out/v0.4
npm run dev -- . --summary-only
npm run dev -- . --audit-only
npm run dev -- ./tests/fixtures/workspaces/package-facts --package @fixture/core --summary-only
npm pack --dry-run --json
npm audit
python <text-encoding-guard-skill>/scripts/check_mojibake.py --root .
git diff --check
```

The final coverage percentages must not fall below the recorded v0.3 baseline, and thresholds must not be reduced or bypassed with new exclusions.

最终覆盖率不得低于记录的 v0.3 基线；不得降低阈值，也不得通过新增排除项绕过覆盖率。

## Public Monorepo Smoke / 公开 Monorepo 补充检查

```bash
npm run benchmark -- ./benchmarks/public-monorepo-smoke.json --cache-dir <outside-repo-cache> --out ./benchmark-smoke-out
```

- [ ] Record workspace package, internal edge, and package command counts.
- [ ] Classify failures as code regression, network, checkout, or upstream drift.
- [ ] Do not overwrite a committed baseline unless every delta is reviewed.

Public results are supplementary; local v0.3 and v0.4 semantic suites remain the correctness gates.

## Package Contents / npm 包内容

The dry-run package must contain only the expected release files:

- `dist/index.js`
- `README.md`
- `LICENSE`
- `package.json`

It must exclude source, tests, fixtures, caches, evaluation/benchmark output, machine paths, and an empty `dist/index.d.ts`.

## Git and CI / Git 与 CI

- [ ] Every milestone is a Conventional Commit and has been pushed.
- [ ] `REPO_ROAST_REPORT.md` remains unmodified, untracked, and uncommitted.
- [ ] No force push, tag, npm publish, or GitHub Release was performed.
- [ ] Local and `origin/main` full SHAs match.
- [ ] The final GitHub CI run succeeds.
- [ ] Final `git status` contains only the user's pre-existing untracked file.
