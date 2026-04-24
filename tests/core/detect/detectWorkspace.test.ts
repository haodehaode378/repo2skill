import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectWorkspace } from "../../../src/core/detect/detectWorkspace.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(rootDir: string): RepoAnalysis {
  return {
    repo: {
      input: rootDir,
      rootDir,
      name: path.basename(rootDir)
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

describe("detectWorkspace", () => {
  it("detects pnpm workspace package globs with high confidence", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/pnpm");
    const analysis = createAnalysis(rootDir);

    await detectWorkspace(rootDir, analysis);

    expect(analysis.detected.workspace).toEqual({
      isWorkspace: true,
      packageGlobs: ["apps/*", "packages/*"],
      signals: ["pnpm-workspace.yaml"],
      confidence: "high"
    });
    expect(analysis.evidence).toContainEqual({
      claim: "workspace=true",
      sourceFile: "pnpm-workspace.yaml",
      reason: "Detected workspace signals: pnpm-workspace.yaml",
      confidence: "high"
    });
  });

  it("detects package.json workspaces with high confidence", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/package-json");
    const analysis = createAnalysis(rootDir);

    await detectWorkspace(rootDir, analysis);

    expect(analysis.detected.workspace).toEqual({
      isWorkspace: true,
      packageGlobs: ["apps/*", "packages/*"],
      signals: ["package.json workspaces"],
      confidence: "high"
    });
  });

  it("detects tooling-only workspace signals with medium confidence", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/tooling");
    const analysis = createAnalysis(rootDir);

    await detectWorkspace(rootDir, analysis);

    expect(analysis.detected.workspace).toEqual({
      isWorkspace: true,
      packageGlobs: [],
      signals: ["turbo.json"],
      confidence: "medium"
    });
  });

  it("detects conventional workspace directories with medium confidence", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/conventions");
    const analysis = createAnalysis(rootDir);

    await detectWorkspace(rootDir, analysis);

    expect(analysis.detected.workspace).toEqual({
      isWorkspace: true,
      packageGlobs: ["apps/*"],
      signals: ["apps/"],
      confidence: "medium"
    });
  });

  it("leaves analysis unchanged when no workspace evidence exists", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/empty");
    const analysis = createAnalysis(rootDir);

    await detectWorkspace(rootDir, analysis);

    expect(analysis.detected.workspace).toBeUndefined();
    expect(analysis.evidence).toEqual([]);
  });
});
