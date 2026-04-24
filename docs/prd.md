# repo2skill PRD

## Positioning

`repo2skill` is an onboarding compiler for coding agents.
It should turn an unfamiliar repository into trustworthy, agent-ready context instead of acting as a generic documentation generator.

## P0 Scope

- Public GitHub repositories
- Local repositories
- Node.js / TypeScript first

Non-goals:

- Private repository auth
- Automatic dependency installation
- Broad multi-language support
- GUI platform work
- Automatic code fixing

## Required Outputs

All exported artifacts should derive from a single structured analysis object:

- `repo2skill.json`
- `project-map.md`
- `AGENTS.md`
- `SKILL.md`
- `quickstart.windows.md`
- `quickstart.macos.md`
- `quickstart.linux.md`

## Architecture

Use four layers:

1. `collect`
2. `detect`
3. `infer`
4. `export`

The shared analysis schema is the contract between those layers.

## Week 0 Goal

Deliver a minimal skeleton with:

- CLI entrypoint
- shared analysis schema
- input resolution
- fixture repository
- tests for the basic path

## Working Rules

- Prefer deterministic evidence over model guesses.
- Keep the scope narrow.
- Add tests with each vertical slice.
- Avoid making exporters infer facts independently.
