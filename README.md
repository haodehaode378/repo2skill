# repo2skill

把任意仓库转换成 agent-ready onboarding context。  
Turn any repository into agent-ready onboarding context.

`repo2skill` 会分析本地仓库或公开 GitHub 仓库，并生成有证据支撑的 agent onboarding 产物：`repo2skill.json`、`project-map.md`、`AGENTS.md`、`SKILL.md`、跨平台 quickstart，以及可选 HTML 报告。

`repo2skill` analyzes a local repository or public GitHub repo and generates evidence-backed onboarding artifacts for coding agents and humans: `repo2skill.json`, `project-map.md`, `AGENTS.md`, `SKILL.md`, OS quickstarts, and an optional HTML report.

## Quick Start / 快速开始

分析公开 GitHub 仓库：

Analyze a public GitHub repo:

```bash
npm run dev -- https://github.com/octocat/Hello-World --out ./out
```

分析内置本地 fixture：

Analyze the included local fixture:

```bash
npm run dev -- ./tests/fixtures/analysis-target --out ./out
```

## Output Preview / 输出预览

示例输出见 [examples/analysis-target](./examples/analysis-target)。`repo2skill` 会把仓库证据转换成可直接给 agent 使用的操作指南。

See [examples/analysis-target](./examples/analysis-target) for committed sample output. `repo2skill` turns repository evidence into directly usable agent guidance.

```md
## Before Changing Code

- Review relevant config first: `package.json`, `vite.config.ts`, `.env.example`.
- Start from evidenced directories: `src`.

## Validation Before Finishing

- Run only the evidenced validation commands that are relevant to your change.
- Run `pnpm test` for the `test` command.
- Run `pnpm build` for the `build` command.
```

同一份分析也会生成仓库专属 `SKILL.md`：

The same analysis also generates a repository-specific `SKILL.md`:

```md
## Steps

- Review relevant config files first: `.env.example`, `package.json`, `vite.config.ts`.
- Start code navigation from evidenced directories: `src`.
- Use only the detected commands below; do not invent package scripts.
```

## What It Produces / 生成内容

给定本地仓库路径或公开 GitHub URL，`repo2skill` 当前会生成：

Given a local repository path or public GitHub URL, `repo2skill` currently writes:

- `repo2skill.json`
- `project-map.md`
- `AGENTS.md`
- `SKILL.md`
- `quickstart.windows.md`
- `quickstart.macos.md`
- `quickstart.linux.md`
- `report.html` when using `--format all`

所有产物都来自同一个结构化分析对象，避免不同文档互相矛盾。

All generated files derive from the same structured analysis object, so different artifacts do not drift apart.

## Why It Exists / 为什么需要它

Coding agent 在进入陌生仓库时，最缺的不是更多 prose，而是可信、可执行、可追溯的上下文：

When a coding agent enters an unfamiliar repository, it needs trustworthy, executable, traceable context rather than more prose:

- 清晰的命令面 / a clear command surface
- 简洁的项目地图 / a concise project map
- 有证据支撑的环境变量、入口点、配置文件提示 / evidence-backed environment, entrypoint, and config hints
- 稳定的 onboarding 文档，而不是猜测出来的说明 / stable onboarding docs instead of guessed instructions

`repo2skill` 的目标是自动生成这一层上下文。

`repo2skill` is built to generate that layer automatically.

## Current Status / 当前状态

- 已支持本地仓库和公开 GitHub 仓库分析 / local and public GitHub analysis paths implemented
- 已支持 smoke/full benchmark baseline / benchmark runner with smoke and full baselines
- 已支持 regression compare / compare mode for regression checks
- schema-first、evidence-first 输出管线 / schema-first and evidence-first output pipeline

当前 benchmark baseline：

Current benchmark baselines:

- smoke set: 10 public repositories
- full set: 21 public repositories

## What It Detects Today / 当前检测能力

当前 MVP 可以提取：

The current MVP can extract:

- 包管理器，来自 lockfile / package manager from lockfiles
- 项目类型，来自强框架或 CLI 信号 / project type from strong framework or CLI signals
- `package.json` 中的 canonical scripts / canonical scripts from `package.json`
- 可执行命令事实，例如 `pnpm test` / executable command facts such as `pnpm test`
- 重要目录，来自 entrypoints 和 workspace globs / important directories from entrypoints and workspace globs
- 关键配置文件，例如 `tsconfig`、框架配置、lint/format 配置、GitHub Actions / key config files such as `tsconfig`, framework configs, lint/format configs, and GitHub Actions workflows
- 入口点，来自 `package.json` 字段和常见约定 / entrypoints from `package.json` fields and common conventions
- 环境变量，来自 `.env.example`、`.env.local.example` 和 `process.env.*` / environment variables from `.env.example`, `.env.local.example`, and `process.env.*` usage

输出结果会保持 narrow and evidence-backed。没有证据的内容会被省略，而不是脑补。

Outputs are intentionally narrow and evidence-backed. Missing evidence means omitted sections instead of guessed prose.

## Current Scope / 当前范围

已支持：

Supported now:

- 公开 GitHub 仓库 / public GitHub repositories
- 本地仓库 / local repositories
- Node.js / TypeScript-oriented repositories
- `json`、`md`、`all` export modes
- 公开 GitHub clone 的本地缓存 / simple local cache for repeated public GitHub clones
- 显式缓存刷新和 no-cache 模式 / explicit cache refresh and no-cache modes

暂不支持：

Not implemented yet:

- 私有仓库鉴权 / private repository authentication
- 广泛多语言支持 / broad multi-language support

## Usage / 使用方式

安装依赖：

Install dependencies:

```bash
npm install
```

分析本地仓库：

Run the CLI against a local repository:

```bash
npm run dev -- ./tests/fixtures/analysis-target --out ./out
```

只打印摘要，不写输出文件：

Analyze a repository without writing output files:

```bash
npm run dev -- ./tests/fixtures/analysis-target --summary-only
```

分析公开 GitHub 仓库：

Run the CLI against a public GitHub repository:

```bash
npm run dev -- https://github.com/octocat/Hello-World --out ./out-github
```

使用自定义缓存目录：

Use a custom cache directory:

```bash
npm run dev -- https://github.com/octocat/Hello-World --cache-dir E:/repo2skill-cache --out ./out-github
```

刷新已有缓存：

Refresh a cached public GitHub clone before analyzing:

```bash
npm run dev -- https://github.com/octocat/Hello-World --refresh --out ./out-github
```

使用临时 clone，分析结束后删除：

Analyze with a temporary clone that is removed after the run:

```bash
npm run dev -- https://github.com/octocat/Hello-World --no-cache --out ./out-github
```

分析指定 branch：

Clone and analyze a specific GitHub branch:

```bash
npm run dev -- https://github.com/octocat/Hello-World --branch master --out ./out-github
```

运行 benchmark：

Run the benchmark manifest:

```bash
npm run benchmark -- ./benchmarks/public-node-ts.json --out ./benchmark-out
```

Windows 上重复跑 benchmark 时，建议使用较短 cache 路径，降低 long-path checkout 风险：

For repeated benchmark runs on Windows, prefer a short cache path to reduce long-path checkout failures:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out
```

写入 baseline summary：

Write a baseline summary JSON while running the benchmark:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --baseline-out ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

对比当前 benchmark 和已有 baseline：

Compare the current benchmark run with an existing baseline:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
```

将 compare 结果写成 JSON：

Write the compare result to JSON:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json --compare-out ./benchmark-smoke-out/compare.json
```

## Example Output / 示例输出

当前 fixture 会生成：

From the current fixture, `repo2skill` produces:

- `repo2skill.json`：包含 `pnpm`、命令、配置文件、目录、环境变量和证据 / detected `pnpm`, commands, config files, directories, env vars, and evidence
- `project-map.md`：简洁仓库地图 / concise repository facts
- `AGENTS.md`：优先命令、修改前导航、配置引用和完成前检查 / priority commands, pre-change navigation, config references, and finishing checks
- `SKILL.md`：`Use When`、`Steps`、`Commands`、`Validation`、`References`
- OS quickstarts：只包含有证据的命令和环境变量提示 / OS-specific quickstarts with only evidenced commands and env hints
- `report.html`：HTML report when using `--format all`
- benchmark summaries：跨公开仓库的 regression signals / regression signals across public repository manifests

See [examples/analysis-target](./examples/analysis-target) for committed sample output.

## Design Principles / 设计原则

- detectors collect facts / detector 只收集事实
- exporters render from structured analysis / exporter 只从结构化分析渲染
- missing evidence means omitted sections / 没有证据就省略
- no hallucinated commands / 不生成脑补命令
- benchmark protects core facts from regression / benchmark 保护核心事实不退化

## Development / 开发

运行测试：

Run the test suite:

```bash
npm test
```

运行完整本地验证：

Run the full local verification loop:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

运行当前 benchmark manifest：

Run the current benchmark manifest:

```bash
npm run benchmark -- ./benchmarks/public-node-ts.json --out ./benchmark-out
```

## Release Notes / 发布说明

当前是 early MVP，但已经不只是 scaffold：本地和公开 GitHub 分析路径、结构化事实源、AGENTS/SKILL/quickstart/exporters、benchmark runner 和 HTML report 都已实现并验证。

This is still an early MVP, but no longer just a scaffold: local and public-GitHub analysis paths, structured facts, AGENTS/SKILL/quickstart exporters, benchmark runner, and HTML report are implemented and verified.
