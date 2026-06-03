# analysis-target Maintenance Profile

## Project Type

- Repository: `analysis-target`
- Root Directory: `./tests/fixtures/analysis-target`
- Detected Project Type: `vite`
- Package Manager: `pnpm`

## Main Entrypoints

- `src/main.ts` (source, medium)

## Minimum Validation

- `pnpm test` for `test`
- `pnpm build` for `build`

## High-Risk Files

- `.env.example` (environment, high)
- `package.json` (package, high)

## Change Boundaries

- Start changes in evidenced directories: `src`.
- Avoid changing generated or package-output entrypoints unless the task is packaging-related.

## Agent Handoff Advice

- Read `AGENTS.md` and `SKILL.md` before editing.
- Verify claims against referenced repository files before acting on them.
- Run the relevant minimum validation command before reporting completion.
- Review environment-variable references before running code paths that need local config.
