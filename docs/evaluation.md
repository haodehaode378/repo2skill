# Context Evaluation / 上下文评估

`repo2skill` has two quality layers:

`repo2skill` 有两层质量验证：

- Benchmark checks detector-level metrics across many repositories.
- Context evaluation checks whether generated artifacts contain the exact facts an agent needs.
- Semantic fact assertions check exact entrypoints, navigation directories, commands, and config files before artifact rendering is considered.

- Benchmark 用来检查多个仓库上的 detector 指标。
- Context evaluation 用来检查生成物是否包含 agent 真正需要的关键事实。

## Why / 为什么需要

Benchmark counts are useful, but they do not prove that an agent can use the generated `SKILL.md` or `AGENTS.md`.

Benchmark 的计数很有用，但它不能直接证明 agent 能否使用生成的 `SKILL.md` 或 `AGENTS.md`。

Context evaluation closes that gap by asserting artifact content:

Context evaluation 通过断言生成物内容来补上这个缺口：

- expected command facts are present
- expected config references are present
- source entrypoints are visible
- package output entrypoints are not promoted into primary navigation
- unsupported claims are absent
- expected repository facts are present and forbidden navigation facts are absent

- 预期命令事实存在
- 预期配置引用存在
- 源码入口可见
- 发布产物入口不会被提升为主要导航目录
- 不支持的声明不会出现

## Run / 运行

Run the deterministic local v0.3 semantic suite first:

```bash
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out
```

It covers self-hosted CLI navigation, generated and source `bin` entrypoints, workspace navigation, and package-output/source separation without network access.

Run the deterministic v0.4 monorepo suite as the package-graph correctness gate:

```bash
npm run evaluate -- ./evaluations/v0.4-local.json --out ./evaluation-out/v0.4
```

It covers repo2skill's single-package compatibility, pnpm and both npm workspace forms, exclusions, source/package-output separation, four dependency sections, unnamed and duplicate packages, scoped commands, focused output, and Windows path normalization.

Then use the public tinybench case as a supplementary network evaluation:

```bash
npm run evaluate -- ./evaluations/tinybench.json --cache-dir ./repo2skill-cache --out ./evaluation-tinybench-out
```

Expected result:

预期结果：

```text
Evaluation manifest: tinybench-context
Cases: 1
Succeeded: 1
Failed: 0
Results:
- OK | tinybench | failures=0
```

## Manifest Format / Manifest 格式

```json
{
  "name": "tinybench-context",
  "cases": [
    {
      "name": "tinybench",
      "input": "https://github.com/tinylibs/tinybench",
      "facts": {
        "expectedEntrypoints": ["./dist/index.js", "src/index.ts"],
        "expectedImportantDirectories": ["src"],
        "forbiddenImportantDirectories": ["dist"],
        "expectedCommands": ["pnpm test"],
        "expectedConfigFiles": ["vitest.config.ts"]
      },
      "assertions": [
        {
          "artifact": "SKILL.md",
          "includes": [
            "Run `pnpm test` for `test` (script: `vitest run`).",
            "Entrypoint: `src/index.ts` (source, medium)"
          ]
        },
        {
          "artifact": "AGENTS.md",
          "excludes": ["- `dist`"]
        }
      ]
    }
  ]
}
```

Semantic fact fields are optional, so existing artifact-only manifests remain valid. Supported fact assertions are:

- `expectedEntrypoints` and `forbiddenEntrypoints`
- `expectedImportantDirectories` and `forbiddenImportantDirectories`
- `expectedCommands`
- `expectedConfigFiles`
- `expectedWorkspacePackages` and `forbiddenWorkspacePackages`
- `expectedWorkspacePackagePaths` and `forbiddenWorkspacePackagePaths`
- `expectedInternalDependencies` and `forbiddenInternalDependencies`
- `expectedPackageCommands` and `forbiddenPackageCommands`
- `expectedPackageEntrypoints` and `forbiddenPackageEntrypoints`
- `expectedPackageImportantDirectories` and `forbiddenPackageImportantDirectories`
- `expectedFocusedPackage`

Dependency, command, entrypoint, and directory assertions use structured objects. Evaluation cases may set `package` to apply the same name/path focus behavior as the main CLI before artifacts and facts are checked.

Failures print the case, fact or artifact target, expected value, and actual observed value. Exact fact assertions catch regressions that preserve the same count while changing the detected path.

## Relationship to Agent Testing / 和 Agent 测试的关系

This is not a replacement for asking an actual coding agent to use `SKILL.md`.

这不能完全替代真实 agent 使用 `SKILL.md` 的测试。

It is a deterministic pre-check that makes sure the generated context contains the facts an agent should rely on.

Benchmark success means the analysis process completed. Benchmark counts reveal structural changes, but equal counts do not prove equal facts. Semantic evaluation is the stricter correctness layer; real agent task testing remains a higher layer outside this deterministic suite.

它是一个确定性的前置检查，用来保证生成的上下文包含 agent 应该依赖的事实。
