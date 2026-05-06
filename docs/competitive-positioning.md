# Competitive Positioning

`repo2skill` is a repository onboarding generator for coding agents. It is intentionally narrower than a general code intelligence platform and more evidence-focused than a prose summarizer.

## Compared With Generic Repo Summaries

Generic summaries usually answer, "What is this project about?" They are useful for orientation, but they often mix facts, interpretation, and missing context.

`repo2skill` answers, "What should an agent inspect and run before changing this repo?" It generates `AGENTS.md`, `SKILL.md`, quickstarts, and structured JSON from explicit repository evidence such as `package.json`, lockfiles, config files, entrypoints, environment examples, and CI files.

## Compared With Repo Map Tools

Repo-map tools help navigate files and symbols. They are good at showing shape, but they usually stop before turning that shape into operational agent instructions.

`repo2skill` includes a `project-map.md`, but treats it as one artifact in a larger onboarding bundle. The same detected facts also feed validation guidance, command rendering, quickstarts, and reusable skill references.

## Compared With a Security-First repo2skill Variant

A security-first variant would prioritize sandboxing, policy enforcement, malicious instruction detection, dependency risk scoring, and blocking unsafe operations.

This project is not that tool yet. Its current security posture is a lightweight audit pass plus conservative documentation: it can flag lifecycle scripts, workflows, env files, AI instruction files, and suspected secrets, but it does not execute a hardened sandbox or prove that a repository is safe.

## What This Project Optimizes For

- Evidence-backed agent onboarding artifacts.
- Small, inspectable Node.js / TypeScript CLI behavior.
- Reproducible outputs that can be committed, reviewed, and benchmarked.
- Clear trust boundaries instead of pretending generated instructions are inherently safe.

## What It Does Not Try To Be

- A full static analyzer.
- A dependency vulnerability scanner.
- A semantic code search engine.
- A replacement for human security review.
- A universal multi-language architecture explainer.
