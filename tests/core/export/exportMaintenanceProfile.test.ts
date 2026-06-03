import { describe, expect, it } from "vitest";
import { renderMaintenanceProfile } from "../../../src/core/export/exportMaintenanceProfile.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./repo",
      rootDir: "/tmp/repo",
      name: "repo"
    },
    detected: {
      packageManager: "pnpm",
      projectType: "vite",
      workspace: {
        isWorkspace: true,
        packageGlobs: ["packages/*"],
        signals: ["pnpm-workspace.yaml"],
        confidence: "high"
      },
      scripts: [],
      commands: [
        {
          name: "test",
          role: "test",
          command: "pnpm test",
          rawScript: "vitest run",
          source: "package.json",
          confidence: "high"
        },
        {
          name: "build",
          role: "build",
          command: "pnpm build",
          rawScript: "tsc -b",
          source: "package.json",
          confidence: "high"
        }
      ],
      directories: [
        {
          path: "src",
          role: "source",
          source: "src/main.ts",
          confidence: "medium"
        }
      ],
      configFiles: [
        {
          path: "package.json",
          type: "package",
          confidence: "high"
        },
        {
          path: ".github/workflows/ci.yml",
          type: "ci",
          confidence: "medium"
        }
      ],
      entrypoints: ["src/main.ts", "./dist/index.js"],
      entrypointFacts: [
        {
          path: "src/main.ts",
          role: "source",
          source: "src/main.ts",
          confidence: "medium"
        },
        {
          path: "./dist/index.js",
          role: "package-output",
          source: "package.json",
          confidence: "high",
          reason: "main"
        }
      ],
      envVars: [
        {
          name: "API_URL",
          sourceFile: ".env.example",
          confidence: "high"
        }
      ],
      docs: [],
      demoSignals: []
    },
    evidence: []
  };
}

describe("renderMaintenanceProfile", () => {
  it("renders maintainer handoff context from evidenced facts", () => {
    const markdown = renderMaintenanceProfile(createAnalysis());

    expect(markdown).toContain("# repo Maintenance Profile");
    expect(markdown).toContain("- Detected Project Type: `vite`");
    expect(markdown).toContain("- Package Manager: `pnpm`");
    expect(markdown).toContain("## Main Entrypoints");
    expect(markdown).toContain("- `src/main.ts` (source, medium)");
    expect(markdown).toContain("- `./dist/index.js` (package-output, high, main)");
    expect(markdown).toContain("## Minimum Validation");
    expect(markdown).toContain("- `pnpm test` for `test`");
    expect(markdown).toContain("## High-Risk Files");
    expect(markdown).toContain("- `package.json` (package, high)");
    expect(markdown).toContain("- `.github/workflows/ci.yml` (ci, medium)");
    expect(markdown).toContain("- `./dist/index.js` (package-output, high)");
    expect(markdown).toContain("## Change Boundaries");
    expect(markdown).toContain("- Start changes in evidenced directories: `src`.");
    expect(markdown).toContain(
      "- For workspace changes, identify the affected package before editing shared files."
    );
    expect(markdown).toContain("## Agent Handoff Advice");
    expect(markdown).toContain("- Read `AGENTS.md` and `SKILL.md` before editing.");
  });
});
