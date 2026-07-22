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
- Workspace discovery expands only safe repository-relative globs, skips generated/cache directories, and does not follow symlinks.
- Package analysis reuses a single collected file index and emits repository-relative paths.
- Package scripts are evidence for generated commands; scoped and `cwd` fallback commands are never executed.

## Current Audit Checks

The lightweight audit flags:

- install lifecycle scripts (`preinstall`, `install`, and `postinstall`) as high risk because consumers may execute them during installation;
- preparation and publish hooks such as `prepare`, `prepack`, and `prepublishOnly` as medium risk by default;
- any lifecycle hook with suspicious network, shell, or eval-like behavior as high risk;
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
- No function-level dependency or call-graph security analysis.

## Safe Usage Guidance

- Prefer `--audit-only` before generating artifacts for an unfamiliar repository.
- Review generated `AGENTS.md` and `SKILL.md` before giving them to an agent as instructions.
- Treat detected commands as candidates, not endorsements.
- Treat severity as triage guidance: a medium publish hook still requires review, while high findings deserve priority.
- Do not run package lifecycle scripts from an untrusted repository without inspection.
- Keep output directories separate from source repositories when reviewing unknown projects.
- Treat package dependency edges as package metadata facts, not proof that the referenced code is safe.
