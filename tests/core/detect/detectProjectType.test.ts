import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectProjectType } from "../../../src/core/detect/detectProjectType.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./tests/fixtures/project-types",
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

describe("detectProjectType", () => {
  it("detects vite from vite.config", async () => {
    const analysis = createAnalysis();

    await detectProjectType(path.resolve("tests/fixtures/project-types/vite"), analysis);

    expect(analysis.detected.projectType).toBe("vite");
    expect(analysis.evidence).toEqual([
      {
        claim: "projectType=vite",
        sourceFile: "vite.config.ts",
        confidence: "high"
      }
    ]);
  });

  it("detects nextjs from next.config", async () => {
    const analysis = createAnalysis();

    await detectProjectType(path.resolve("tests/fixtures/project-types/next"), analysis);

    expect(analysis.detected.projectType).toBe("nextjs");
    expect(analysis.evidence).toEqual([
      {
        claim: "projectType=nextjs",
        sourceFile: "next.config.ts",
        confidence: "high"
      }
    ]);
  });

  it("detects cli from package.json bin", async () => {
    const analysis = createAnalysis();

    await detectProjectType(path.resolve("tests/fixtures/project-types/cli"), analysis);

    expect(analysis.detected.projectType).toBe("cli");
    expect(analysis.evidence).toEqual([
      {
        claim: "projectType=cli",
        sourceFile: "package.json",
        confidence: "high"
      }
    ]);
  });

  it("does nothing when no strong signal exists", async () => {
    const analysis = createAnalysis();

    await detectProjectType(path.resolve("tests/fixtures/project-types/unknown"), analysis);

    expect(analysis.detected.projectType).toBeUndefined();
    expect(analysis.evidence).toEqual([]);
  });
});
