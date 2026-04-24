import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectEntrypoints } from "../../../src/core/detect/detectEntrypoints.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./tests/fixtures/entrypoints",
      rootDir: "",
      name: "fixture"
    },
    detected: {
      scripts: [],
      commands: [],
      directories: [],
      configFiles: [],
      entrypoints: [],
      entrypointFacts: [],
      envVars: []
    },
    evidence: []
  };
}

describe("detectEntrypoints", () => {
  it("extracts entrypoints from package.json fields", async () => {
    const analysis = createAnalysis();

    await detectEntrypoints(path.resolve("tests/fixtures/entrypoints/package-fields"), analysis);

    expect(analysis.detected.entrypoints).toEqual([
      "./dist/index.js",
      "./dist/index.mjs",
      "./dist/browser.js",
      "./bin/cli.js"
    ]);
    expect(analysis.detected.entrypointFacts).toEqual([
      {
        path: "./dist/index.js",
        role: "package-output",
        source: "package.json",
        confidence: "high",
        reason: "main"
      },
      {
        path: "./dist/index.mjs",
        role: "package-output",
        source: "package.json",
        confidence: "high",
        reason: "module"
      },
      {
        path: "./dist/browser.js",
        role: "package-output",
        source: "package.json",
        confidence: "high",
        reason: "browser"
      },
      {
        path: "./bin/cli.js",
        role: "cli",
        source: "package.json",
        confidence: "high",
        reason: "bin"
      }
    ]);
    expect(analysis.evidence).toEqual([
      {
        claim: "entrypoint=./dist/index.js",
        sourceFile: "package.json",
        reason: "main",
        confidence: "high"
      },
      {
        claim: "entrypoint=./dist/index.mjs",
        sourceFile: "package.json",
        reason: "module",
        confidence: "high"
      },
      {
        claim: "entrypoint=./dist/browser.js",
        sourceFile: "package.json",
        reason: "browser",
        confidence: "high"
      },
      {
        claim: "entrypoint=./bin/cli.js",
        sourceFile: "package.json",
        reason: "bin",
        confidence: "high"
      }
    ]);
  });

  it("extracts conventional entrypoints when explicit fields are absent", async () => {
    const analysis = createAnalysis();

    await detectEntrypoints(path.resolve("tests/fixtures/entrypoints/conventions"), analysis);

    expect(analysis.detected.entrypoints).toEqual(["src/main.ts", "src/server.ts", "index.ts"]);
    expect(analysis.detected.entrypointFacts).toEqual([
      {
        path: "src/main.ts",
        role: "source",
        source: "src/main.ts",
        confidence: "medium",
        reason: undefined
      },
      {
        path: "src/server.ts",
        role: "source",
        source: "src/server.ts",
        confidence: "medium",
        reason: undefined
      },
      {
        path: "index.ts",
        role: "other",
        source: "index.ts",
        confidence: "medium",
        reason: undefined
      }
    ]);
    expect(analysis.evidence).toEqual([
      {
        claim: "entrypoint=src/main.ts",
        sourceFile: "src/main.ts",
        confidence: "medium"
      },
      {
        claim: "entrypoint=src/server.ts",
        sourceFile: "src/server.ts",
        confidence: "medium"
      },
      {
        claim: "entrypoint=index.ts",
        sourceFile: "index.ts",
        confidence: "medium"
      }
    ]);
  });

  it("does nothing when no known entrypoint exists", async () => {
    const analysis = createAnalysis();

    await detectEntrypoints(path.resolve("tests/fixtures/entrypoints/empty"), analysis);

    expect(analysis.detected.entrypoints).toEqual([]);
    expect(analysis.evidence).toEqual([]);
  });
});
