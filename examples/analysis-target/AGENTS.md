## Repository Overview

- Name: `analysis-target`
- Root Directory: `./tests/fixtures/analysis-target`
- Detected Package Manager: `pnpm`

## Priority Commands

- `dev`: `pnpm dev` (script: `vite`)
- `build`: `pnpm build` (script: `vite build`)
- `test`: `pnpm test` (script: `vitest run`)

## Before Changing Code

- Review relevant config first: `package.json`, `vite.config.ts`, `.env.example`.
- Start from evidenced directories: `src`.

## Validation Before Finishing

- Run only the evidenced validation commands that are relevant to your change.
- Run `pnpm test` for the `test` command.
- Run `pnpm build` for the `build` command.

## Important Directories

- `src`

## Entrypoints

- `src/main.ts` (source, medium)

## Key Config Files

- `.env.example` (environment)
- `package.json` (package)
- `vite.config.ts` (framework)

## Trust and Safety Notes

- Review detected audit findings before running install, workflow, or environment-dependent commands.
- [high] secret: `src/config.ts` - possible secret assignment for "secretToken", evidence: `secret...[redacted]...OKEN`
- [low] env-file: `.env.example` - example environment file is documentation, but values should still be reviewed

## Notes and Boundaries

- Detected environment variables: `API_URL`, `SECRET_TOKEN`.
- This file reflects 12 evidenced findings from the repository analysis.
