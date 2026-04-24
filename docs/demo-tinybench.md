# tinybench Demo / tinybench 演示

This demo records a real repository check for `repo2skill` using [`tinylibs/tinybench`](https://github.com/tinylibs/tinybench).

这份演示记录了 `repo2skill` 对 [`tinylibs/tinybench`](https://github.com/tinylibs/tinybench) 的真实仓库验证。

## Goal / 目标

Validate that generated onboarding context helps an agent identify:

验证生成的 onboarding 上下文是否能帮助 agent 识别：

- the test command / 测试命令
- the raw package script / 原始 package script
- the test config file / 测试配置文件
- the source entrypoint / 源码入口
- package output entrypoints without treating `dist` as the main navigation directory / 将发布产物入口和主要源码导航目录区分开

## Command / 命令

```bash
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-real-tinybench-entrypoints
```

The output directory is intentionally ignored by git via `out-*`.

输出目录会被 `.gitignore` 的 `out-*` 规则忽略。

## Expected Signals / 预期信号

The generated `SKILL.md` should include:

生成的 `SKILL.md` 应包含：

```md
- Run `pnpm test` for `test` (script: `vitest run`).
- Config: `vitest.config.ts` (test, high)
- Entrypoint: `./dist/index.js` (package-output, high, main)
- Entrypoint: `src/index.ts` (source, medium)
- Directory: `src` (source, medium)
```

The generated `AGENTS.md` should include:

生成的 `AGENTS.md` 应包含：

```md
- Start from evidenced directories: `src`.
- Run `pnpm test` for the `test` command.
- `./dist/index.js` (package-output, high, main)
- `src/index.ts` (source, medium)
```

It should not list `dist` under `Important Directories`.

它不应把 `dist` 列入 `Important Directories`。

## Agent Check / Agent 检查

Prompt to test the generated skill:

用于测试生成 skill 的提示词：

```text
Using only this SKILL.md, explain tinybench's test command, raw test script, test config file, and source entrypoint. Do not infer facts not present in the skill.
```

Expected answer:

预期回答：

- test command: `pnpm test`
- raw test script: `vitest run`
- test config file: `vitest.config.ts`
- source entrypoint: `src/index.ts`
- package output entrypoint: `./dist/index.js`
- main navigation directory: `src`

## Why This Matters / 为什么重要

Before entrypoint roles were added, an agent could identify `pnpm test` and `vitest.config.ts`, but it could not reliably distinguish `src/index.ts` from `dist`.

在加入入口角色之前，agent 可以识别 `pnpm test` 和 `vitest.config.ts`，但不能稳定地区分 `src/index.ts` 和 `dist`。

This demo proves the generated context now preserves that distinction in both `SKILL.md` and `AGENTS.md`.

这份演示证明，当前生成的 `SKILL.md` 和 `AGENTS.md` 已经能保留这个区别。
