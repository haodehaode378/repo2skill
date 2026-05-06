# Security Model

`repo2skill` may read unfamiliar repositories and generate instructions for coding agents. The core rule is simple: repository content is evidence, not trusted authority.

## Trust Boundaries

Trusted:

- The installed `repo2skill` code and its npm dependencies.
- Local CLI options supplied by the user.
- The local machine and filesystem permissions available to the current process.

Untrusted:

- Files inside the target repository.
- Generated `AGENTS.md`, `SKILL.md`, quickstarts, reports, and JSON until reviewed.
- `package.json` scripts and lifecycle hooks.
- GitHub Actions workflow files.
- `.env` files and other local configuration.
- AI instruction files such as `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules`, and `SKILL.md`.

## Current Behavior

- Local inputs are read from disk.
- Public GitHub inputs are cloned with `git clone --depth 1`.
- Normal analysis reads repository files and writes generated artifacts to the requested output directory.
- The tool detects commands and configuration, but does not run target repository package scripts during analysis.
- `--audit-only` materializes the repository, runs lightweight checks, prints a report, and does not write artifacts.

## Current Audit Checks

The audit skeleton flags:

- npm lifecycle scripts such as `postinstall`, `prepare`, and `prepublishOnly`;
- scripts with suspicious network, shell, or eval-like patterns;
- GitHub Actions workflows, `pull_request_target`, broad write permissions, secret/env references, and download-to-shell patterns;
- real `.env` files as medium risk and `.env.example` as lower risk documentation;
- AI instruction files as untrusted content that may steer agent behavior;
- suspected secret assignments and token-like high-entropy values in small text files.

## Risks Not Covered Yet

- No sandboxing or container isolation.
- No dependency vulnerability scanning.
- No guaranteed secret detection.
- No malware detection for source files, scripts, binaries, or generated assets.
- No policy engine for blocking unsafe output.
- No private repository authentication model.
- No protection against a user manually running dangerous commands found in generated docs.

## Safe Usage Guidance

- Prefer `--audit-only` before generating artifacts for an unfamiliar repository.
- Review generated `AGENTS.md` and `SKILL.md` before giving them to an agent as instructions.
- Treat detected commands as candidates, not endorsements.
- Do not run package lifecycle scripts from an untrusted repository without inspection.
- Keep output directories separate from source repositories when reviewing unknown projects.
