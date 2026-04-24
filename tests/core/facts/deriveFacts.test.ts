import { describe, expect, it } from "vitest";
import { deriveCommands, deriveDirectories, deriveFacts } from "../../../src/core/facts/deriveFacts.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./fixture",
      rootDir: "/tmp/fixture",
      name: "fixture"
    },
    detected: {
      packageManager: "pnpm",
      workspace: {
        isWorkspace: true,
        packageGlobs: ["apps/*", "packages/*"],
        signals: ["pnpm-workspace.yaml"],
        confidence: "high"
      },
      scripts: [
        {
          name: "dev",
          command: "vite",
          confidence: "high"
        },
        {
          name: "test",
          command: "vitest run",
          confidence: "high"
        }
      ],
      commands: [],
      directories: [],
      configFiles: [],
      entrypoints: ["./dist/index.js", "src/main.ts", "scripts/build.ts"],
      entrypointFacts: [
        {
          path: "./dist/index.js",
          role: "package-output",
          source: "package.json",
          confidence: "high",
          reason: "main"
        },
        {
          path: "src/main.ts",
          role: "source",
          source: "src/main.ts",
          confidence: "medium"
        },
        {
          path: "scripts/build.ts",
          role: "cli",
          source: "package.json",
          confidence: "high",
          reason: "bin"
        }
      ],
      envVars: []
    },
    evidence: []
  };
}

describe("deriveFacts", () => {
  it("derives executable command candidates from scripts", () => {
    expect(deriveCommands(createAnalysis())).toEqual([
      {
        name: "dev",
        role: "dev",
        command: "pnpm dev",
        rawScript: "vite",
        source: "package.json",
        confidence: "high"
      },
      {
        name: "test",
        role: "test",
        command: "pnpm test",
        rawScript: "vitest run",
        source: "package.json",
        confidence: "high"
      }
    ]);
  });

  it("derives important directories from entrypoints and workspace globs", () => {
    expect(deriveDirectories(createAnalysis())).toEqual([
      {
        path: "apps",
        role: "workspace",
        source: "apps/*",
        confidence: "high"
      },
      {
        path: "packages",
        role: "workspace",
        source: "packages/*",
        confidence: "high"
      },
      {
        path: "scripts",
        role: "scripts",
        source: "scripts/build.ts",
        confidence: "high"
      },
      {
        path: "src",
        role: "source",
        source: "src/main.ts",
        confidence: "medium"
      }
    ]);
  });

  it("writes derived facts back to the analysis object", () => {
    const analysis = createAnalysis();

    deriveFacts(analysis);

    expect(analysis.detected.commands).toHaveLength(2);
    expect(analysis.detected.directories).toHaveLength(4);
  });
});
