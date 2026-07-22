# v0.4.0 Release Notes

Date: 2026-07-22

## Summary

repo2skill v0.4.0 upgrades workspace awareness into a deterministic package-level operational graph. Coding agents can now see concrete packages, package-local facts and validation commands, direct internal dependencies and consumers, and focused package context without running target-repository scripts.

## Highlights

- Concrete workspace discovery for pnpm YAML, npm workspaces arrays/objects, and conventional directories.
- Stable glob exclusions, Windows path normalization, generated/cache boundaries, and no symlink traversal.
- Package-local metadata, scripts, commands, entrypoints, config, source directories, project type, env-var hints, and evidence.
- Typed direct internal dependency edges plus duplicate-name diagnostics and unnamed-package support.
- pnpm, npm, and Yarn scoped commands with explicit package-`cwd` fallback facts.
- `--package <name-or-path>` focus for the selected package, direct dependencies, and direct consumers.
- Workspace-aware JSON, project map, AGENTS, SKILL, maintenance profile, platform quickstarts, and self-contained HTML.
- Backward-compatible workspace semantic assertions and benchmark package metrics.

## Compatibility

- Existing CLI options and single-package analysis remain supported.
- New analysis fields are optional/defaulted so existing JSON consumers and v0.3 manifests remain valid.
- v0.3 deterministic evaluation continues to pass.
- The package remains a pure CLI with `repo2skill -> dist/index.js`.

## Boundaries

v0.4 stops at direct package relationships. It does not implement function-call, class, symbol, import, or LLM-generated architecture graphs. It does not run target package scripts, install target dependencies, authenticate private repositories, or provide a dashboard.

## Verification Commands

```bash
npm run release:check
npm run evaluate -- ./evaluations/v0.3-local.json --out ./evaluation-out/v0.3
npm run evaluate -- ./evaluations/v0.4-local.json --out ./evaluation-out/v0.4
npm run benchmark -- ./benchmarks/public-monorepo-smoke.json --cache-dir <outside-repo-cache> --out ./benchmark-smoke-out
npm pack --dry-run --json
npm audit
```

Concrete final results are recorded in [`release-verification.md`](./release-verification.md).
