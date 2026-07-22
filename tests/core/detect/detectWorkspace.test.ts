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
      envVars: [],
      docs: [],
      demoSignals: []
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
      packages: [],
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
      packages: [],
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
      packages: [],
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
      packages: [],
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

  it("discovers concrete pnpm packages with exclusions and stable paths", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/pnpm-packages");
    const analysis = createAnalysis(rootDir);

    await detectWorkspace(rootDir, analysis);

    expect(analysis.detected.workspace?.packageGlobs).toEqual([
      "!packages/legacy",
      "apps/*",
      "packages/*"
    ]);
    expect(analysis.detected.workspace?.packages).toEqual([
      {
        path: "apps/web",
        packageJsonPath: "apps/web/package.json",
        name: "@fixture/web",
        version: "1.0.0",
        private: true,
        source: "pnpm-workspace.yaml",
        confidence: "high"
      },
      {
        path: "packages/core",
        packageJsonPath: "packages/core/package.json",
        name: "@fixture/core",
        version: "1.2.3",
        private: false,
        source: "pnpm-workspace.yaml",
        confidence: "high"
      }
    ]);
    expect(analysis.evidence).toContainEqual({
      claim: "workspacePackage=@fixture/core",
      sourceFile: "packages/core/package.json",
      reason: "Matched workspace configuration from pnpm-workspace.yaml",
      confidence: "high"
    });
  });

  it("discovers object-form npm workspaces and normalizes backslashes", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/npm-object");
    const analysis = createAnalysis(rootDir);

    await detectWorkspace(rootDir, analysis);

    expect(analysis.detected.workspace?.packageGlobs).toEqual(["packages/*"]);
    expect(
      analysis.detected.workspace?.packages?.map((workspacePackage) => workspacePackage.path)
    ).toEqual(["packages/ui"]);
  });

  it("ignores unsafe, empty, missing, generated, and package-less workspace matches", async () => {
    const rootDir = path.resolve("tests/fixtures/workspaces/safe-boundaries");
    const analysis = createAnalysis(rootDir);

    await detectWorkspace(rootDir, analysis);

    expect(analysis.detected.workspace?.packageGlobs).toEqual([
      "build/*",
      "missing/*",
      "packages/*"
    ]);
    expect(analysis.detected.workspace?.packages).toEqual([]);
  });
});
