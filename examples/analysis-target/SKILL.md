---
name: analysis-target-repo-skill
description: Repository-specific guidance for working in analysis-target. Use when modifying this repository and you need the detected commands, validation checks, and environment-variable hints.
---

# analysis-target Repository Skill

## Use When

- You are working inside `analysis-target`.
- You need repository-specific commands, validation checks, or configuration references.
- You want evidence-backed onboarding context instead of inferred workflow assumptions.

- Root Directory: `./tests/fixtures/analysis-target`
- Detected Package Manager: `pnpm`

## Steps

- Review relevant config files first: `.env.example`, `package.json`, `vite.config.ts`.
- Start code navigation from evidenced directories: `src`.
- Use only the detected commands below; do not invent package scripts.
- Before finishing, run the relevant validation commands listed below.

## Commands

- Run `pnpm dev` for `dev` (script: `vite`).
- Run `pnpm build` for `build` (script: `vite build`).
- Run `pnpm test` for `test` (script: `vitest run`).

## Validation

- Prefer `pnpm test` before finishing changes when that check is relevant.
- Prefer `pnpm build` before finishing changes when that check is relevant.

## References

- Config: `.env.example` (environment, high)
- Config: `package.json` (package, high)
- Config: `vite.config.ts` (framework, high)
- Entrypoint: `src/main.ts` (source, medium)
- Directory: `src` (source, medium)
- Env: `API_URL` from `.env.example` (high)
- Env: `SECRET_TOKEN` from `src/config.ts` (medium)

## Boundaries

- Treat this skill as evidence-backed repository guidance, not a complete architecture document.
- Omitted sections mean no supporting repository evidence was detected.
