# repo2skill 测试结果结论

这份文档记录当前这轮人工测试已经确认通过的项目。

测试环境：

- 路径：`E:\ai-skill\repo2skill`
- 终端：`cmd.exe`
- 说明：以下结论仅基于已实际执行并贴出结果的命令

## 已确认通过

### 1. 工程链路

以下命令均已实际执行并通过：

```cmd
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

结论：

- 依赖安装正常
- ESLint 正常
- TypeScript 类型检查正常
- 单元测试正常
- 构建正常

### 2. 本地仓库分析

已执行：

```cmd
npm run dev -- .\tests\fixtures\analysis-target --out .\out-local
```

终端摘要已确认包含：

- `Package manager: pnpm`
- `Project type: vite`
- `Scripts: dev, build, test`
- `Entrypoints: src/main.ts`
- `Environment variables: API_URL (high), SECRET_TOKEN (medium)`

结论：

- 本地仓库分析链路正常
- CLI 能正确输出摘要

### 3. 本地输出文件

已确认 `out-local` 目录存在，并生成以下 7 个文件：

- `repo2skill.json`
- `project-map.md`
- `AGENTS.md`
- `SKILL.md`
- `quickstart.windows.md`
- `quickstart.macos.md`
- `quickstart.linux.md`

结论：

- 当前所有本地输出文件都能正常生成

### 4. 本地输出内容

已确认 `out-local\repo2skill.json` 包含：

- `"packageManager": "pnpm"`
- `"projectType": "vite"`
- `src/main.ts`
- `API_URL`
- `SECRET_TOKEN`

已确认 `out-local\project-map.md` 包含：

- `## Project Type`
- `vite`
- `## Entrypoints`
- `src/main.ts`

已确认 `out-local\AGENTS.md` 包含：

- `## Priority Commands`
- `## Validation Before Finishing`

已确认 `out-local\quickstart.windows.md` 包含：

- `## Start Command`
- `vite`

并且未发现硬写的未证实安装步骤。

结论：

- JSON、Project Map、AGENTS、Quickstart 的内容都符合当前预期

### 5. --summary-only

已执行：

```cmd
npm run dev -- .\tests\fixtures\analysis-target --summary-only --out .\out-summary
```

已确认：

- 会打印分析摘要
- 不会生成 `out-summary`

检查结果：

```cmd
if exist .\out-summary (echo EXISTS) else (echo MISSING)
```

实际输出：

```cmd
MISSING
```

结论：

- `--summary-only` 行为正确

### 6. GitHub branch 分析

已执行：

```cmd
npm run dev -- https://github.com/octocat/Hello-World --branch master --out .\out-github-branch
```

已确认：

- GitHub 仓库分析成功
- branch 参数生效
- 生成了完整输出文件

终端摘要已确认包含：

- `Repository input: https://github.com/octocat/Hello-World`
- `Materialized root: ...`
- 7 个输出文件路径

结论：

- 公开 GitHub 仓库 + branch 的分析链路正常

### 7. GitHub 缓存

已连续两次执行：

```cmd
npm run dev -- https://github.com/octocat/Hello-World --summary-only
npm run dev -- https://github.com/octocat/Hello-World --summary-only
```

两次输出中的 `Materialized root` 均为：

```text
C:\Users\36366\AppData\Local\Temp\repo2skill-cache\81c1d5e3fcfe\Hello-World
```

结论：

- GitHub 简单缓存命中正常
- 第二次没有重新 clone 到新的目录

## 当前结论

到目前为止，以下核心能力已通过人工验证：

- 本地仓库分析
- 本地输出文件生成
- `--summary-only`
- 公开 GitHub 仓库分析
- GitHub branch 参数
- GitHub 简单缓存
- 工程验证链路：`lint / typecheck / test / build`

## 尚未在这轮记录里明确覆盖的项目

以下项目尚未在这份结果文档中记录为“已贴出实测结果”：

- 不带 `--branch` 的 GitHub 输出目录内容核对
- 异常输入（如不存在的本地路径）
- 不同 branch 对应不同缓存 key
