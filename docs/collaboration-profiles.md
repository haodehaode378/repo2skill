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
