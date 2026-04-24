import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectConfigFiles } from "../../../src/core/detect/detectConfigFiles.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./tests/fixtures/config-files",
      rootDir: "",
      name: "fixture"
    },
    detected: {
      scripts: [],
      commands: [],
      directories: [],
      configFiles: [],
      entrypoints: [],
      envVars: []
    },
    evidence: []
  };
}

describe("detectConfigFiles", () => {
  it("detects root config files and GitHub Actions workflows", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/config-files/full");

    await detectConfigFiles(rootDir, analysis);

    expect(analysis.detected.configFiles).toEqual([
      {
        path: ".github/workflows/ci.yml",
        type: "ci",
        confidence: "high"
      },
      {
        path: ".prettierrc",
        type: "format",
        confidence: "high"
      },
      {
        path: "eslint.config.mjs",
        type: "lint",
        confidence: "high"
      },
      {
        path: "package.json",
        type: "package",
        confidence: "high"
      },
      {
        path: "tsconfig.json",
        type: "typescript",
        confidence: "high"
      },
      {
        path: "vite.config.ts",
        type: "framework",
        confidence: "high"
      }
    ]);
    expect(analysis.evidence).toContainEqual({
      claim: "configFile:vite.config.ts",
      sourceFile: "vite.config.ts",
      reason: "Detected framework configuration file",
      confidence: "high"
    });
  });

  it("leaves config files empty when no config evidence exists", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/config-files/empty");

    await detectConfigFiles(rootDir, analysis);

    expect(analysis.detected.configFiles).toEqual([]);
    expect(analysis.evidence).toEqual([]);
  });
});
