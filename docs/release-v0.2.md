# v0.2 Release Notes Draft

## Title

repo2skill v0.2: stronger evidence-backed exports and release hardening

## Short Description

`repo2skill` v0.2 expands the CLI from the initial repository analysis MVP into a more complete onboarding artifact generator with HTML reports, project maps, quickstarts, benchmark/evaluation commands, and stronger release checks.

## Highlights

- Adds HTML report, `project-map.md`, `SKILL.md`, and OS-specific quickstart exports.
- Adds benchmark and evaluation CLIs with baseline comparison support.
- Improves security posture with safer GitHub URL matching, branch allowlisting, symlink skipping during audits, and audit-only risk hints.
- Improves performance by sharing the directory walker, caching package metadata, and parallelizing detector execution.
- Adds coverage tooling and CI coverage gates.

## Try It

```bash
npx @haodehaode378/repo2skill https://github.com/tinylibs/tinybench --out ./out-tinybench
```

From source:

```bash
git clone https://github.com/haodehaode378/repo2skill.git
cd repo2skill
npm install
npm run dev -- ./tests/fixtures/analysis-target --out ./out
```

## Verification

Release verification is recorded in [`release-verification.md`](./release-verification.md).
