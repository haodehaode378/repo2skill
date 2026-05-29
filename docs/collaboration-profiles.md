# Collaboration Profiles

`repo2skill` can generate scenario-specific collaboration artifacts from the same repository analysis.

## Profiles

- `onboarding`: default output, including `repo2skill.json`, `project-map.md`, `AGENTS.md`, `SKILL.md`, quickstarts, and optional HTML report.
- `release-check`: writes `release-check.md` with README, LICENSE, CI, version, changelog, examples, environment, and metadata checks.
- `course-report`: writes `course-project-report.md` with a course project report scaffold, module candidates, setup steps, validation, and screenshot checklist.
- `demo`: writes `demo-screenshot-plan.md` with demo flow, screenshot filenames, recording script, and acceptance steps.
- `issue-to-pr`: writes `issue-to-pr-plan.md` from repository evidence and optional issue text.
- `all`: writes the default onboarding artifacts plus every collaboration profile.

## Usage

```bash
npm run dev -- ./tests/fixtures/analysis-target --profile release-check --out ./out-release-check
npm run dev -- ./tests/fixtures/analysis-target --profile course-report --out ./out-course-report
npm run dev -- ./tests/fixtures/analysis-target --profile demo --out ./out-demo
npm run dev -- ./tests/fixtures/analysis-target --profile issue-to-pr --issue-file ./issue.md --out ./out-issue
npm run dev -- ./tests/fixtures/analysis-target --profile all --out ./out-all
```

The analyzer remains read-only for target repositories. It does not run target repository lifecycle scripts, publish commands, deploy commands, migrations, or destructive cleanup commands.

## Shared Safety Prompt

Generated collaboration artifacts should be treated as evidence-backed guidance, not as permission to make broad edits.

```md
You are working inside a repository that was analyzed by repo2skill.

Use only evidence from the generated project map, commands, config files, entrypoints, and source directories. Do not invent architecture, commands, or environment variables. Prefer read-only inspection first. Before modifying files, identify the relevant source files and the validation command that proves the change.

Do not run publish, deploy, release, migration, destructive cleanup, or secret-related commands unless the user explicitly asks for them. If evidence is missing, state that it is missing and propose the smallest safe next step.
```

## Using Generated Skills In A Repository

For team-shared agent workflows, keep generated repository skills close to the project they describe:

```txt
target-repo/
  .agents/
    skills/
      repo-onboarding/
        SKILL.md
        project-map.md
        quickstart.windows.md
        quickstart.macos.md
        quickstart.linux.md
```

Recommended workflow:

1. Generate onboarding artifacts with `--profile onboarding` or `--profile all`.
2. Review the generated files manually before committing them to the target repository.
3. Copy only the reviewed, useful artifacts into `.agents/skills/<skill-name>/`.
4. Keep profile reports such as `release-check.md`, `course-project-report.md`, and `demo-screenshot-plan.md` as review artifacts unless the team wants them versioned.

Do not commit generated skills blindly. The analyzer reads repository files and preserves evidence, but humans should still review generated instructions before they become repo-level guidance.

## Future Plugin Packaging

The current implementation adds profile outputs to the CLI. A later plugin package can wrap the same behavior without changing the evidence model:

- Keep `repo2skill` as the analysis and artifact generation engine.
- Package reusable workflows as plugin skills that call the CLI with a specific `--profile`.
- Keep repository-specific generated `SKILL.md` files separate from the product's own reusable plugin skills.
- Preserve the default read-only target repository boundary unless a future workflow explicitly asks for write operations.
