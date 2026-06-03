# repo2skill

> Analyze any repository into agent-ready onboarding context: commands, entrypoints, security audit, quickstarts, and SKILL.md.
>
> 将任意仓库分析为 agent-ready 的 onboarding 上下文：命令、入口文件、安全审计、quickstart 和 SKILL.md。

![npm caution](https://img.shields.io/badge/npm-name%20caution-f59e0b?style=flat-square)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-111827?style=flat-square)](./LICENSE)

**Language / 语言:** [简体中文](#简体中文) | [English](#english)

`repo2skill` turns a local repository or public GitHub repository into agent-ready onboarding context. It is built for coding agents that need grounded instructions, not a loose project summary.

`repo2skill` 会把本地仓库或公开 GitHub 仓库转换成 coding agent 可直接使用的 onboarding 上下文。它不是泛泛总结项目，而是基于真实证据生成可执行、可审查的 agent 工作材料。

```bash
git clone https://github.com/haodehaode378/repo2skill.git
cd repo2skill
npm install
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-tinybench
```

Package usage after npm publication:

```bash
npx @haodehaode378/repo2skill https://github.com/tinylibs/tinybench --out ./out-tinybench
```

```txt
Input repository
  -> repo2skill.json
  -> project-map.md
  -> AGENTS.md
  -> SKILL.md
  -> maintenance-profile.md
  -> quickstart.windows.md / quickstart.macos.md / quickstart.linux.md
  -> report.html
```

[View tinybench demo](./docs/demo-tinybench.md) | [Before / After](./docs/before-after.md) | [Competitive positioning](./docs/competitive-positioning.md) | [Security model](./docs/security-model.md) | [Release checklist](./docs/release-checklist.md) | [Collaboration profiles](./docs/collaboration-profiles.md)

![repo2skill README preview](./img/readme-hero.png)

---

## 简体中文

`repo2skill` 会分析本地仓库或公开 GitHub 仓库，把仓库里的真实信号转换成 agent-ready onboarding 产物：命令、入口文件、关键配置、重要目录、环境变量线索、验证步骤、`AGENTS.md`、`SKILL.md`、quickstart 和结构化 JSON 报告。

### 为什么存在

很多 repo summary 只能告诉 agent“这个项目大概是什么”。`repo2skill` 更关心“agent 修改代码前应该看什么、完成前应该跑什么”。

- 生成有证据支撑的 `AGENTS.md`，说明修改前导航和完成前验证。
- 生成仓库专属 `SKILL.md`，保留源码入口、发布入口、配置文件和验证命令。
- 所有 JSON、Markdown、HTML 产物来自同一个分析对象，减少文档漂移。
- 通过 benchmark 和 evaluation fixture 保护仓库分析质量。

### 适合什么场景

- 你要把一个陌生仓库交给 Codex、Claude Code、Cursor 或其他 coding agent。
- 你想在 agent 修改代码前，先给它明确的“先看哪里、跑什么检查、哪些内容不应猜测”。
- 你维护开源项目，希望为贡献者和 AI 工具提供可审查的 onboarding 文件。
- 你需要一份可提交到 PR 或 release notes 的仓库分析报告，而不是一次性的聊天总结。

### 它如何保持可信

`repo2skill` 不运行目标仓库的 package scripts。它读取文件、检测信号，并把每个结论尽量绑定到真实来源：

| 信号                      | 示例来源                                                        |
| ------------------------- | --------------------------------------------------------------- |
| 包管理器                  | `pnpm-lock.yaml`、`package-lock.json`、`yarn.lock`、`bun.lockb` |
| 验证命令                  | `package.json` scripts                                          |
| 入口文件                  | `package.json` `main` / `bin`、`src/main.ts`、`src/index.ts`    |
| 配置文件                  | `tsconfig.json`、`vite.config.ts`、`.github/workflows/*.yml`    |
| 环境变量                  | `.env.example`、`.env.local.example`、`process.env.*`           |
| workspace / monorepo 信号 | `pnpm-workspace.yaml`、`package.json workspaces`、`turbo.json`  |

如果没有证据，相关段落会被省略，而不是用通用建议填充。

### 快速开始

可以从源码运行，也可以使用 scoped npm 包。公开 npm registry 上的非 scoped `repo2skill` 包名可能被其他项目占用；本项目使用 `@haodehaode378/repo2skill` 作为发布包名，CLI bin 仍为 `repo2skill`。

```bash
git clone https://github.com/haodehaode378/repo2skill.git
cd repo2skill
npm install
npm run dev -- ./tests/fixtures/analysis-target --out ./out
```

分析公开 GitHub 仓库：

```bash
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-tinybench
```

只打印摘要，不写入文件：

```bash
npm run dev -- ./tests/fixtures/analysis-target --summary-only
```

生成产物前先运行 audit-only 雏形：

```bash
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --audit-only
```

### npm 状态

当前 `package.json` 声明：

- package name: `@haodehaode378/repo2skill`;
- CLI bin: `repo2skill -> dist/index.js`;
- publish files: `dist`, `README.md`, `LICENSE`。

但公开 npm 名称 `repo2skill` 可能被其他包占用。因此本项目使用 scoped package，命令行 bin 保留为 `repo2skill`：

```bash
npx @haodehaode378/repo2skill https://github.com/tinylibs/tinybench --out ./out-tinybench
```

### 生成产物

| 文件                     | 用途                                     |
| ------------------------ | ---------------------------------------- |
| `repo2skill.json`        | 供工具链继续处理的结构化分析结果         |
| `project-map.md`         | 简洁仓库地图                             |
| `AGENTS.md`              | 给 coding agent 的仓库级工作说明         |
| `SKILL.md`               | 可复制到 agent 会话中的仓库专属 skill    |
| `maintenance-profile.md` | agent 接手维护时需要的项目画像和边界     |
| `quickstart.windows.md`  | Windows 快速开始                         |
| `quickstart.macos.md`    | macOS 快速开始                           |
| `quickstart.linux.md`    | Linux 快速开始                           |
| `report.html`            | 使用 `--format all` 时生成的 HTML report |

导出格式：

| 参数            | 生成内容                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------- |
| `--format json` | 只生成 `repo2skill.json`                                                                     |
| `--format md`   | 生成 `project-map.md`、`AGENTS.md`、`SKILL.md`、`maintenance-profile.md` 和三平台 quickstart |
| `--format all`  | 生成全部 Markdown、JSON 和 `report.html`                                                     |

`AGENTS.md` 会给出清晰的修改前导航和验证指令：

```md
## Before Changing Code

- Review relevant config first: `package.json`, `vitest.config.ts`.
- Start from evidenced directories: `src`.

## Validation Before Finishing

- Run only the evidenced validation commands that are relevant to your change.
- Run `pnpm test` for the `test` command.
```

`SKILL.md` 会保留证据来源，包括源码入口和发布产物入口的区别：

```md
## References

- Config: `vitest.config.ts` (test, high)
- Entrypoint: `./dist/index.js` (package-output, high, main)
- Entrypoint: `src/index.ts` (source, medium)
- Directory: `src` (source, medium)
```

完整示例见 [examples/analysis-target](./examples/analysis-target)。

### 推荐工作流

```bash
# 1. 先查看风险提示，不生成产物
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --audit-only

# 2. 生成 agent onboarding 产物
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-tinybench

# 3. 先人工审阅，再交给 agent 使用
ls ./out-tinybench
```

把 `AGENTS.md` 放在仓库根目录可以给 coding agent 提供项目级约束；把 `SKILL.md` 复制到支持 skill 的 agent 环境中，可以把同一套证据复用到后续会话。

### 当前可检测内容

- 从 lockfile 检测包管理器。
- 从框架配置、依赖和 CLI 信号检测项目类型。
- 从 `package.json` scripts 提取命令，并渲染为 `pnpm test` 或 `npm run build` 等可执行命令。
- 识别 `source`、`package-output`、`cli`、`generated` 等入口角色。
- 检测 `pnpm-workspace.yaml`、`package.json workspaces`、`turbo.json`、`nx.json` 等 workspace 信号。
- 根据源码入口和 workspace globs 推导重要目录，不把 `dist` 当作优先导航目录。
- 检测 `tsconfig`、Vite、Next.js、ESLint、Prettier、Vitest、GitHub Actions、Dockerfile 等关键配置。
- 从 `.env.example`、`.env.local.example` 和 `process.env.*` 用法提取环境变量线索。
- `--audit-only` 可提示 lifecycle scripts、workflows、env files、AI instruction files 和疑似 secrets。

### 常用命令

分析指定 GitHub 分支：

```bash
npm run dev -- https://github.com/octocat/Hello-World --branch master --out ./out-github
```

刷新缓存后分析：

```bash
npm run dev -- https://github.com/octocat/Hello-World --refresh --out ./out-github
```

使用临时 clone，分析后删除：

```bash
npm run dev -- https://github.com/octocat/Hello-World --no-cache --out ./out-github
```

运行 benchmark manifest：

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out
```

运行产物级上下文评估：

```bash
npm run evaluate -- ./evaluations/tinybench.json --cache-dir E:/r2s-cache --out ./evaluation-out
```

### 开发验证

```bash
npm run release:check
```

发布 PR 前可运行 `npm run format`。

### 当前范围

已支持：

- 本地仓库和公开 GitHub 仓库。
- 以 Node.js / TypeScript 为主的项目。
- `json`、`md`、`all` 导出模式。
- GitHub clone 缓存、`--refresh`、`--no-cache`。
- smoke/full benchmark baseline 和 regression comparison。

暂不支持：

- 私有仓库鉴权。
- 广泛多语言仓库的深度语义分析。
- 针对不可信仓库的完整 sandbox 或 malware detection。

### 信任边界

`repo2skill` 会读取陌生仓库内容，因此生成文件仍应先审阅再交给 agent 当作指令。`--audit-only` 是轻量风险提示，不是完整安全扫描。更多细节见 [Security model](./docs/security-model.md)。

[Back to top](#repo2skill)

---

## English

`repo2skill` analyzes a local repository or public GitHub repository and turns real repository signals into agent-ready onboarding artifacts: commands, entrypoints, key config files, important directories, environment-variable hints, validation steps, `AGENTS.md`, `SKILL.md`, quickstarts, and a structured JSON report.

### Why It Exists

Most repository summaries tell an agent what a project appears to be. `repo2skill` focuses on what an agent can safely act on:

- evidence-backed `AGENTS.md` instructions for where to look before editing and what to run before finishing;
- repository-specific `SKILL.md` references that preserve source files, package entrypoints, config files, and validation commands;
- repeatable JSON/Markdown/HTML artifacts derived from the same analysis object;
- benchmark and evaluation fixtures that make regressions visible.

### Use Cases

- You are handing an unfamiliar repository to Codex, Claude Code, Cursor, or another coding agent.
- You want the agent to know what to inspect and validate before editing, without inventing workflows.
- You maintain an open-source project and want reviewable onboarding files for contributors and AI tools.
- You need a release or PR artifact that documents detected repository facts, not a one-off chat summary.

### How It Stays Grounded

`repo2skill` does not run target repository package scripts. It reads files, detects signals, and ties conclusions back to repository evidence:

| Signal                | Example sources                                                 |
| --------------------- | --------------------------------------------------------------- |
| Package manager       | `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lockb` |
| Validation commands   | `package.json` scripts                                          |
| Entrypoints           | `package.json` `main` / `bin`, `src/main.ts`, `src/index.ts`    |
| Config files          | `tsconfig.json`, `vite.config.ts`, `.github/workflows/*.yml`    |
| Environment variables | `.env.example`, `.env.local.example`, `process.env.*`           |
| Workspace / monorepo  | `pnpm-workspace.yaml`, `package.json workspaces`, `turbo.json`  |

If there is no supporting evidence, the relevant section is omitted instead of filled with generic advice.

### Quick Start

Run from source today. After npm publication, use the scoped package. The unscoped `repo2skill` npm package name may be occupied by another project, so this repo uses `@haodehaode378/repo2skill` as the package identity while keeping the CLI bin name `repo2skill`.

```bash
git clone https://github.com/haodehaode378/repo2skill.git
cd repo2skill
npm install
npm run dev -- ./tests/fixtures/analysis-target --out ./out
```

Analyze a public GitHub repository:

```bash
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-tinybench
```

Print a summary without writing files:

```bash
npm run dev -- ./tests/fixtures/analysis-target --summary-only
```

Run the audit-only skeleton before generating artifacts:

```bash
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --audit-only
```

After npm publication, run:

```bash
npx @haodehaode378/repo2skill https://github.com/tinylibs/tinybench --out ./out-tinybench
```

### npm Status

`package.json` currently declares:

- package name: `@haodehaode378/repo2skill`;
- CLI bin: `repo2skill -> dist/index.js`;
- publish files: `dist`, `README.md`, `LICENSE`.

The unscoped npm name `repo2skill` may be occupied by another package, so the package identity is scoped while the executable command remains `repo2skill` after npm publication:

```bash
npx @haodehaode378/repo2skill https://github.com/tinylibs/tinybench --out ./out-tinybench
```

### Generated Artifacts

| File                     | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `repo2skill.json`        | Structured analysis for downstream tooling                |
| `project-map.md`         | Concise repository map                                    |
| `AGENTS.md`              | Repository-level instructions for coding agents           |
| `SKILL.md`               | Repository skill that can be copied into an agent session |
| `maintenance-profile.md` | Maintainer handoff profile for agents                     |
| `quickstart.windows.md`  | Windows quickstart                                        |
| `quickstart.macos.md`    | macOS quickstart                                          |
| `quickstart.linux.md`    | Linux quickstart                                          |
| `report.html`            | HTML report generated with `--format all`                 |

Export formats:

| Flag            | Generated files                                                                         |
| --------------- | --------------------------------------------------------------------------------------- |
| `--format json` | `repo2skill.json` only                                                                  |
| `--format md`   | `project-map.md`, `AGENTS.md`, `SKILL.md`, `maintenance-profile.md`, and OS quickstarts |
| `--format all`  | all Markdown artifacts, JSON, and `report.html`                                         |

`AGENTS.md` gives clear pre-change navigation and validation guidance:

```md
## Before Changing Code

- Review relevant config first: `package.json`, `vitest.config.ts`.
- Start from evidenced directories: `src`.

## Validation Before Finishing

- Run only the evidenced validation commands that are relevant to your change.
- Run `pnpm test` for the `test` command.
```

`SKILL.md` preserves evidence, including the difference between source entrypoints and package output entrypoints:

```md
## References

- Config: `vitest.config.ts` (test, high)
- Entrypoint: `./dist/index.js` (package-output, high, main)
- Entrypoint: `src/index.ts` (source, medium)
- Directory: `src` (source, medium)
```

See [examples/analysis-target](./examples/analysis-target) for committed sample output.

### Recommended Workflow

```bash
# 1. Inspect lightweight risk hints without generating artifacts
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --audit-only

# 2. Generate agent onboarding artifacts
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-tinybench

# 3. Review before handing the artifacts to an agent
ls ./out-tinybench
```

Put `AGENTS.md` at a repository root to provide project-level constraints for coding agents. Copy `SKILL.md` into a skill-capable agent environment when you want to reuse the same evidence-backed context across sessions.

### What It Detects Today

- Package manager from lockfiles.
- Project type from framework config, dependencies, and CLI signals.
- Commands from `package.json` scripts, rendered as executable commands such as `pnpm test` or `npm run build`.
- Entrypoints with roles such as `source`, `package-output`, `cli`, and `generated`.
- Workspace signals such as `pnpm-workspace.yaml`, `package.json workspaces`, `turbo.json`, and `nx.json`.
- Important directories from source entrypoints and workspace globs, without treating `dist` as a priority navigation target.
- Key config files such as `tsconfig`, Vite, Next.js, ESLint, Prettier, Vitest, GitHub Actions, and Dockerfile.
- Environment variables from `.env.example`, `.env.local.example`, and `process.env.*` usage.
- Audit-only hints for lifecycle scripts, workflows, env files, AI instruction files, and suspected secrets.

### Common Commands

Analyze a specific GitHub branch:

```bash
npm run dev -- https://github.com/octocat/Hello-World --branch master --out ./out-github
```

Refresh the cache before analysis:

```bash
npm run dev -- https://github.com/octocat/Hello-World --refresh --out ./out-github
```

Use a temporary clone that is deleted after analysis:

```bash
npm run dev -- https://github.com/octocat/Hello-World --no-cache --out ./out-github
```

Run the benchmark manifest:

```bash
npm run benchmark -- ./benchmarks/public-node-ts-smoke.json --cache-dir E:/r2s-cache --out ./benchmark-smoke-out
```

Artifact-level context evaluation:

```bash
npm run evaluate -- ./evaluations/tinybench.json --cache-dir E:/r2s-cache --out ./evaluation-out
```

### Development

```bash
npm run release:check
```

Use `npm run format` before opening a release PR.

### Current Scope

Supported now:

- Local repositories and public GitHub repositories.
- Node.js / TypeScript-oriented projects.
- `json`, `md`, and `all` export modes.
- GitHub clone cache, `--refresh`, and `--no-cache`.
- Smoke/full benchmark baselines and regression comparison.

Not implemented yet:

- Private repository authentication.
- Deep semantic analysis for broad multi-language repositories.
- Full sandboxing or malware detection for untrusted repositories.

### Trust Boundary

`repo2skill` reads unfamiliar repository content, so generated files should still be reviewed before they are treated as agent instructions. `--audit-only` is a lightweight risk hint, not a complete security scanner. See the [Security model](./docs/security-model.md) for details.

[Back to top](#repo2skill)
