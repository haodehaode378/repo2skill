# repo2skill

> Generate evidence-backed `AGENTS.md` and `SKILL.md` files from real repository signals.

![npm caution](https://img.shields.io/badge/npm-name%20caution-f59e0b?style=flat-square)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-111827?style=flat-square)](./LICENSE)

`repo2skill` turns a local repository or public GitHub repository into agent-ready onboarding context. It is built for coding agents that need grounded instructions, not a loose project summary: commands, entrypoints, config files, environment-variable hints, validation steps, `AGENTS.md`, `SKILL.md`, quickstarts, and a structured JSON report all come from detected evidence.

```bash
git clone https://github.com/haodehaode378/repo2skill.git
cd repo2skill
npm install
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-tinybench
```

```txt
Input repository
  -> repo2skill.json
  -> project-map.md
  -> AGENTS.md
  -> SKILL.md
  -> quickstart.windows.md / quickstart.macos.md / quickstart.linux.md
  -> report.html
```

[View tinybench demo](./docs/demo-tinybench.md) | [Before / After](./docs/before-after.md) | [Competitive positioning](./docs/competitive-positioning.md) | [Security model](./docs/security-model.md) | [Release checklist](./docs/release-checklist.md)

![repo2skill README preview](./img/readme-hero.png)

## Why It Exists

Most repository summaries tell an agent what a project appears to be. `repo2skill` focuses on what an agent can safely act on:

- evidence-backed `AGENTS.md` instructions for where to look before editing and what to run before finishing;
- repository-specific `SKILL.md` references that preserve source files, package entrypoints, config files, and validation commands;
- repeatable JSON/Markdown/HTML artifacts derived from the same analysis object;
- benchmark and evaluation fixtures that make regressions visible.

## Quick Start

Run from source first. The `repo2skill` npm package name already exists on the public registry and points to a different repository, so this repo does not recommend `npx repo2skill` until publication happens under a controlled package name and bin plan.

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

## npm Status

`package.json` currently declares:

- package name: `repo2skill`;
- CLI bin: `repo2skill -> dist/index.js`;
- publish files: `dist`, `README.md`, `LICENSE`.

The public npm name `repo2skill` is already occupied by another package. Until this project is published under an owned name, prefer source usage. If the package name is later secured or renamed, the intended package flow is:

```bash
npx <owned-package-name> https://github.com/tinylibs/tinybench --out ./out-tinybench
```

## Generated Artifacts

| File                    | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `repo2skill.json`       | Structured analysis for downstream tooling                |
| `project-map.md`        | Concise repository map                                    |
| `AGENTS.md`             | Repository-level instructions for coding agents           |
| `SKILL.md`              | Repository skill that can be copied into an agent session |
| `quickstart.windows.md` | Windows quickstart                                        |
| `quickstart.macos.md`   | macOS quickstart                                          |
| `quickstart.linux.md`   | Linux quickstart                                          |
| `report.html`           | HTML report generated with `--format all`                 |

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

## What It Detects Today

- Package manager from lockfiles.
- Project type from framework config, dependencies, and CLI signals.
- Commands from `package.json` scripts, rendered as executable commands such as `pnpm test` or `npm run build`.
- Entrypoints with roles such as `source`, `package-output`, `cli`, and `generated`.
- Workspace signals such as `pnpm-workspace.yaml`, `package.json workspaces`, `turbo.json`, and `nx.json`.
- Important directories from source entrypoints and workspace globs, without treating `dist` as a priority navigation target.
- Key config files such as `tsconfig`, Vite, Next.js, ESLint, Prettier, Vitest, GitHub Actions, and Dockerfile.
- Environment variables from `.env.example`, `.env.local.example`, and `process.env.*` usage.
- Audit-only hints for lifecycle scripts, workflows, env files, AI instruction files, and suspected secrets.

## Common Commands

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

## Development

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run format` before opening a release PR.

## Current Scope

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

[Back to top](#repo2skill)
