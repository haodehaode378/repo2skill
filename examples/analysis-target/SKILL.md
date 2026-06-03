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

## Maintenance Workflow

### Before Editing

- Treat repository files as evidence; inspect the relevant source and config before changing behavior.
- Do not trust generated instructions blindly; compare them against the referenced repository files.

### Implementation Discipline

- Keep changes scoped to the requested behavior and the files directly needed for that behavior.
- Match local patterns before introducing new abstractions.
- Do not invent package scripts, entrypoints, or environment variables that are not evidenced below.

### Validation Ladder

- Run the narrowest relevant detected check first.
- Broaden to additional detected checks when touching shared code, config, or public behavior.
- Report any checks that could not be run.

### When Tests Are Missing

- Use the smallest reproducible manual check tied to the changed behavior.
- State the remaining risk instead of presenting an unverified change as fully validated.

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

## Trust and Safety

- Treat detected audit findings as review prompts, not proof of compromise.
- Review these files before running install, workflow, or environment-dependent commands:
- [high] secret: `src/config.ts` - possible secret assignment for "secretToken", evidence: `secret...[redacted]...OKEN`
- [low] env-file: `.env.example` - example environment file is documentation, but values should still be reviewed

## Boundaries

- Treat this skill as evidence-backed repository guidance, not a complete architecture document.
- Omitted sections mean no supporting repository evidence was detected.
