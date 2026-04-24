# repo2skill 测试说明

这份文档说明如何手动测试当前版本的 `repo2skill`。

当前版本已经支持：

- 本地仓库分析
- 公开 GitHub 仓库分析
- 指定 GitHub branch
- `--summary-only`
- GitHub 简单本地缓存

## 1. 进入项目目录

```powershell
cd path\to\repo2skill
```

## 2. 基础工程检查

先确认工程链路本身是通的：

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

预期：

- `lint` 通过
- `typecheck` 通过
- `test` 通过
- `build` 通过

## 3. 测试本地仓库分析

运行：

```powershell
npm run dev -- .\tests\fixtures\analysis-target --out .\out-local
```

预期终端摘要至少包含：

- `Package manager: pnpm`
- `Project type: vite`
- `Scripts: dev, build, test`
- `Entrypoints: src/main.ts`
- `Environment variables: API_URL (high), SECRET_TOKEN (medium)`

预期输出目录存在：

```powershell
Get-ChildItem .\out-local
```

应该能看到这些文件：

- `repo2skill.json`
- `project-map.md`
- `AGENTS.md`
- `SKILL.md`
- `quickstart.windows.md`
- `quickstart.macos.md`
- `quickstart.linux.md`

## 4. 检查本地分析输出内容

查看 JSON：

```powershell
Get-Content -Raw .\out-local\repo2skill.json
```

至少确认这些内容存在：

- `"packageManager": "pnpm"`
- `"projectType": "vite"`
- `src/main.ts`
- `API_URL`
- `SECRET_TOKEN`

查看仓库地图：

```powershell
Get-Content -Raw .\out-local\project-map.md
```

至少确认这些内容存在：

- `## Project Type`
- `vite`
- `## Entrypoints`
- `src/main.ts`

查看 AGENTS：

```powershell
Get-Content -Raw .\out-local\AGENTS.md
```

至少确认这些内容存在：

- `## Priority Commands`
- `## Validation Before Finishing`

查看 Windows quickstart：

```powershell
Get-Content -Raw .\out-local\quickstart.windows.md
```

至少确认这些内容存在：

- `## Start Command`
- `vite`

并确认它没有硬写未被探测到的安装步骤。

## 5. 测试 --summary-only

先清理目录，再执行：

```powershell
if (Test-Path .\out-summary) { Remove-Item -Recurse -Force .\out-summary }
npm run dev -- .\tests\fixtures\analysis-target --summary-only --out .\out-summary
```

预期：

- 会打印摘要
- 不会生成输出目录

检查：

```powershell
Test-Path .\out-summary
```

预期输出：

```powershell
False
```

## 6. 测试公开 GitHub 仓库分析

运行：

```powershell
npm run dev -- https://github.com/octocat/Hello-World --out .\out-github
```

预期终端摘要至少包含：

- `Repository input: https://github.com/octocat/Hello-World`
- `Materialized root: ...`

查看输出目录：

```powershell
Get-ChildItem .\out-github
```

应该能看到 7 个输出文件。

## 7. 测试 GitHub branch

运行：

```powershell
npm run dev -- https://github.com/octocat/Hello-World --branch master --out .\out-github-branch
```

预期：

- 命令成功
- 能生成输出文件

## 8. 测试 GitHub 缓存

连续运行两次：

```powershell
npm run dev -- https://github.com/octocat/Hello-World --summary-only
npm run dev -- https://github.com/octocat/Hello-World --summary-only
```

观察两次输出里的：

- `Materialized root: ...`

预期：

- 两次路径相同

如果路径相同，说明缓存命中，第二次没有重新 clone 到新目录。

## 9. 测试异常输入

测试一个不存在的本地路径：

```powershell
npm run dev -- .\does-not-exist
```

预期：

- 明确报错
- 不生成新的输出目录

## 10. 建议的测试顺序

如果只想快速确认核心功能，按这个顺序测：

1. `npm run lint`
2. `npm test`
3. 本地仓库分析
4. `--summary-only`
5. GitHub 仓库分析
6. GitHub 缓存

如果要做完整发布前检查，再补：

1. `npm run typecheck`
2. `npm run build`
3. GitHub branch
