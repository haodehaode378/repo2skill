# v0.1 Release Notes Draft / v0.1 发布文案草稿

## Title / 标题

repo2skill v0.1: turn repositories into agent-ready onboarding context

repo2skill v0.1：把仓库转换成 agent 可执行 onboarding 上下文

## Short Description / 简短描述

`repo2skill` analyzes local repositories and public GitHub repositories, then generates evidence-backed onboarding artifacts for coding agents and humans.

`repo2skill` 会分析本地仓库和公开 GitHub 仓库，并生成给 coding agent 和人类都能使用的证据驱动 onboarding 产物。

## Highlights / 亮点

- Generates `AGENTS.md`, `SKILL.md`, `project-map.md`, OS quickstarts, `repo2skill.json`, and an optional HTML report.
- Detects package managers, scripts, project type, workspaces, config files, entrypoints, and environment-variable hints.
- Distinguishes source entrypoints such as `src/index.ts` from package output entrypoints such as `./dist/index.js`.
- Keeps output evidence-backed and omits unsupported claims instead of inventing workflow prose.
- Includes smoke/full benchmark manifests and regression comparison.

- 生成 `AGENTS.md`、`SKILL.md`、`project-map.md`、三平台 quickstart、`repo2skill.json` 和可选 HTML 报告。
- 检测包管理器、scripts、项目类型、workspace、配置文件、入口文件和环境变量线索。
- 区分 `src/index.ts` 这类源码入口和 `./dist/index.js` 这类发布产物入口。
- 输出保持证据驱动；没有证据时省略，而不是脑补工作流。
- 内置 smoke/full benchmark manifest 和 regression compare。

## Try It From Source / 从源码试用

After npm release:

发布到 npm 后：

```bash
npx repo2skill https://github.com/tinylibs/tinybench --out ./out-tinybench
```

From source:

从源码运行：

```bash
git clone https://github.com/haodehaode378/repo2skill.git
cd repo2skill
npm install
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-tinybench
```

## Current Scope / 当前范围

- Public GitHub repositories.
- Local repositories.
- Node.js / TypeScript-oriented repositories.
- Evidence-backed exports only.

- 公开 GitHub 仓库。
- 本地仓库。
- 以 Node.js / TypeScript 为主的仓库。
- 只输出有证据支撑的内容。

## Not Yet / 暂不支持

- Private repository authentication.
- Broad multi-language semantic analysis.
- GUI platform.
- Automatic code modification.

- 私有仓库鉴权。
- 广泛多语言语义分析。
- GUI 平台。
- 自动修改代码。

## Verification / 验证

Before release, run:

发布前运行：

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm pack --dry-run
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out --compare ./benchmarks/baselines/public-node-ts-smoke.summary.json
npm run evaluate -- ./evaluations/tinybench.json --cache-dir E:/r2s-cache --out ./evaluation-out
```

Recorded verification results:

已记录的验证结果：

- [v0.1 release verification](./release-verification.md)
