# Before / After Demo / Before After 演示

This demo shows the practical difference between handing an unfamiliar repository to an agent with no generated context and handing it the `repo2skill` artifacts.

这份演示说明：不给 agent 生成上下文，和给它 `repo2skill` 产物，差别具体在哪里。

## Repository / 仓库

[`tinylibs/tinybench`](https://github.com/tinylibs/tinybench)

## Task / 任务

Ask an agent to identify the repository's test command, raw test script, test config file, source entrypoint, and package output entrypoint.

让 agent 识别仓库的测试命令、原始 test script、测试配置文件、源码入口和发布产物入口。

## Before repo2skill / 使用前

Without generated onboarding context, an agent must inspect the repository from scratch. It may still find the correct facts, but it has to decide which files matter and can blur the difference between source files and package output files.

没有生成的 onboarding 上下文时，agent 必须从零检查仓库。它仍然可能找到正确事实，但需要自行判断哪些文件重要，并且容易混淆源码文件和发布产物文件。

Risky outcomes:

可能的问题：

- Treating `dist` as a main navigation directory.
- Missing that `pnpm test` is the runnable command while `vitest run` is the raw package script.
- Reporting `./dist/index.js` without also surfacing `src/index.ts` as the source entrypoint.

- 把 `dist` 当成主要导航目录。
- 没有区分可执行命令 `pnpm test` 和原始 package script `vitest run`。
- 只报告 `./dist/index.js`，但没有把 `src/index.ts` 作为源码入口展示出来。

## After repo2skill / 使用后

Run:

运行：

```bash
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-tinybench
```

The generated context gives the agent evidence-backed facts:

生成的上下文会给 agent 明确的证据驱动事实：

```md
- Run `pnpm test` for `test` (script: `vitest run`).
- Config: `vitest.config.ts` (test, high)
- Entrypoint: `./dist/index.js` (package-output, high, main)
- Entrypoint: `src/index.ts` (source, medium)
- Directory: `src` (source, medium)
```

Expected agent answer:

预期 agent 回答：

- test command: `pnpm test`
- raw test script: `vitest run`
- test config file: `vitest.config.ts`
- source entrypoint: `src/index.ts`
- package output entrypoint: `./dist/index.js`
- main navigation directory: `src`

## What Improved / 改进点

`repo2skill` does not make the agent smarter by adding guesses. It narrows the starting context to facts that were detected from repository files, then keeps source navigation separate from package output metadata.

`repo2skill` 不是靠猜测让 agent 看起来更聪明，而是把起始上下文压缩到仓库文件中检测到的事实，并明确区分源码导航和发布产物元数据。

