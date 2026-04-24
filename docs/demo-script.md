# Demo Script / 演示脚本

Use this script for a short terminal recording or GIF.

这份脚本用于录制短终端演示或 GIF。

## Scene 1: Start from a real repository / 场景 1：从真实仓库开始

Narration:

旁白：

```text
repo2skill turns an unfamiliar repository into agent-ready onboarding context.
```

Command:

命令：

```bash
npm run dev -- https://github.com/tinylibs/tinybench --no-cache --out ./out-tinybench
```

Expected terminal highlights:

预期终端重点：

```text
Package manager: pnpm
Scripts: dev, build, test, lint, typecheck
Entrypoints: ./dist/index.js, src/index.ts
Generated files:
- out-tinybench\AGENTS.md
- out-tinybench\SKILL.md
- out-tinybench\project-map.md
```

## Scene 2: Show generated guidance / 场景 2：展示生成的指导

Command:

命令：

```bash
Get-Content .\out-tinybench\SKILL.md
```

Highlight:

重点展示：

```md
- Run `pnpm test` for `test` (script: `vitest run`).
- Config: `vitest.config.ts` (test, high)
- Entrypoint: `./dist/index.js` (package-output, high, main)
- Entrypoint: `src/index.ts` (source, medium)
- Directory: `src` (source, medium)
```

## Scene 3: Explain the before and after / 场景 3：解释 before 和 after

Before:

之前：

```text
Agent enters a repo and has to infer commands, entrypoints, config files, and validation paths.
```

After:

之后：

```text
Agent receives evidenced commands, source navigation, validation checks, and boundaries.
```

## Scene 4: Close with the artifact list / 场景 4：用产物列表收尾

Show:

展示：

```text
repo2skill.json
project-map.md
AGENTS.md
SKILL.md
quickstart.windows.md
quickstart.macos.md
quickstart.linux.md
report.html
```

Closing line:

收尾句：

```text
One command, multiple evidence-backed onboarding artifacts.
```
