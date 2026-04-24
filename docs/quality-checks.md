# Quality Checks / 质量检查

Use this checklist when changing detectors, exporters, README content, examples, or release configuration.

修改 detector、exporter、README、examples 或发布配置时，使用这份检查清单。

## Artifact Safety / 产物安全

- Generated examples must not contain machine-specific absolute paths.
- Do not commit transient output directories such as `out`, `out-*`, `benchmark-out`, or `benchmark-smoke-out`.
- `npm pack --dry-run` should include only release files: `dist`, `README.md`, `LICENSE`, and `package.json`.
- The published CLI entrypoint must match `package.json` `bin.repo2skill`.

- 生成示例不能包含本机绝对路径。
- 不要提交 `out`、`out-*`、`benchmark-out`、`benchmark-smoke-out` 等临时输出目录。
- `npm pack --dry-run` 应只包含发布文件：`dist`、`README.md`、`LICENSE` 和 `package.json`。
- 发布后的 CLI 入口必须与 `package.json` 的 `bin.repo2skill` 一致。

## Evidence Rules / 证据规则

- Do not invent package scripts. Only render scripts found in `package.json`.
- Do not claim a validation command exists unless it was detected.
- Environment variables from `.env.example` are high confidence; variables from source usage are medium confidence.
- Missing evidence should omit a section instead of filling it with generic prose.

- 不要脑补 package scripts，只渲染 `package.json` 中真实存在的 scripts。
- 没有检测到验证命令时，不要声称存在验证命令。
- 来自 `.env.example` 的环境变量是高置信度；来自源码使用的环境变量是中置信度。
- 没有证据时应省略对应章节，而不是用泛泛文案填充。

## Entrypoint Rules / 入口规则

- Source entrypoints such as `src/index.ts` should be visible in `SKILL.md`, `AGENTS.md`, and `project-map.md`.
- Package output entrypoints such as `./dist/index.js` should be marked as `package-output`.
- Generated directories such as `dist`, `build`, `out`, and `coverage` must not be promoted to `Important Directories`.
- `Important Directories` should prioritize source directories and workspace roots.

- `src/index.ts` 这类源码入口应出现在 `SKILL.md`、`AGENTS.md` 和 `project-map.md`。
- `./dist/index.js` 这类发布产物入口应标记为 `package-output`。
- `dist`、`build`、`out`、`coverage` 这类生成目录不能被提升为 `Important Directories`。
- `Important Directories` 应优先展示源码目录和 workspace 根目录。

## Release Verification / 发布验证

Run before a release:

发布前运行：

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm pack --dry-run
python C:/Users/36366/.codex/skills/text-encoding-guard/scripts/check_mojibake.py --root .
```

For benchmark regression checks:

用于 benchmark 回归检查：

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

For artifact-level context checks:

用于生成物级别的上下文检查：

```bash
npm run evaluate -- ./evaluations/tinybench.json --cache-dir E:/r2s-cache --out ./evaluation-out
```
