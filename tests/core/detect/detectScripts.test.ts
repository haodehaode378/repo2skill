import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectScripts } from "../../../src/core/detect/detectScripts.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./tests/fixtures/scripts",
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

describe("detectScripts", () => {
  it("extracts canonical scripts from package.json", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/scripts/full");

    await detectScripts(rootDir, analysis);

    expect(analysis.detected.scripts).toEqual([
      {
        name: "dev",
        command: "vite",
        confidence: "high"
      },
      {
        name: "build",
        command: "tsc -b && vite build",
        confidence: "high"
      },
      {
        name: "test",
        command: "vitest run",
        confidence: "high"
      },
      {
        name: "lint",
        command: "eslint .",
        confidence: "high"
      },
      {
        name: "typecheck",
        command: "tsc --noEmit",
        confidence: "high"
      },
      {
        name: "format",
        command: "prettier --write .",
        confidence: "high"
      }
    ]);

    expect(analysis.evidence).toEqual([
      {
        claim: "script:dev=vite",
        sourceFile: "package.json",
        confidence: "high"
      },
      {
        claim: "script:build=tsc -b && vite build",
        sourceFile: "package.json",
        confidence: "high"
      },
      {
        claim: "script:test=vitest run",
        sourceFile: "package.json",
        confidence: "high"
      },
      {
        claim: "script:lint=eslint .",
        sourceFile: "package.json",
        confidence: "high"
      },
      {
        claim: "script:typecheck=tsc --noEmit",
        sourceFile: "package.json",
        confidence: "high"
      },
      {
        claim: "script:format=prettier --write .",
        sourceFile: "package.json",
        confidence: "high"
      }
    ]);
  });

  it("keeps only canonical scripts that actually exist", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/scripts/partial");

    await detectScripts(rootDir, analysis);

    expect(analysis.detected.scripts).toEqual([
      {
        name: "dev",
        command: "node server.js",
        confidence: "high"
      },
      {
        name: "test",
        command: "vitest",
        confidence: "high"
      }
    ]);

    expect(analysis.evidence).toEqual([
      {
        claim: "script:dev=node server.js",
        sourceFile: "package.json",
        confidence: "high"
      },
      {
        claim: "script:test=vitest",
        sourceFile: "package.json",
        confidence: "high"
      }
    ]);
  });

  it("does nothing when package.json is missing", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/scripts/no-package-json");

    await detectScripts(rootDir, analysis);

    expect(analysis.detected.scripts).toEqual([]);
    expect(analysis.evidence).toEqual([]);
  });
});
