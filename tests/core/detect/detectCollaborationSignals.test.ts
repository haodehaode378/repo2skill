import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectCollaborationSignals } from "../../../src/core/detect/detectCollaborationSignals.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./tests/fixtures/collaboration-target",
      rootDir: "",
      name: "fixture"
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

describe("detectCollaborationSignals", () => {
  it("detects docs, package metadata, and demo signals", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/collaboration-target");

    await detectCollaborationSignals(rootDir, analysis);

    expect(analysis.detected.docs).toEqual(
      expect.arrayContaining([
        {
          path: "CHANGELOG.md",
          type: "changelog",
          confidence: "high"
        },
        {
          path: "CONTRIBUTING.md",
          type: "contributing",
          confidence: "high"
        },
        {
          path: "LICENSE",
          type: "license",
          confidence: "high"
        },
        {
          path: "README.md",
          type: "readme",
          confidence: "high"
        },
        {
          path: "docs",
          type: "docs",
          confidence: "medium"
        },
        {
          path: "examples",
          type: "examples",
          confidence: "medium"
        }
      ])
    );
    expect(analysis.detected.docs).toHaveLength(6);
    expect(analysis.detected.packageMetadata).toMatchObject({
      path: "package.json",
      name: "collaboration-target",
      version: "1.2.3",
      hasRepository: true,
      hasBugs: true,
      hasHomepage: true,
      hasBin: true,
      hasPublishConfig: false,
      confidence: "high"
    });
    expect(analysis.detected.demoSignals).toEqual([
      {
        path: "examples",
        type: "example",
        source: "example convention",
        confidence: "medium"
      },
      {
        path: "public",
        type: "asset",
        source: "asset convention",
        confidence: "medium"
      },
      {
        path: "src/pages",
        type: "route",
        source: "route convention",
        confidence: "medium"
      }
    ]);
    expect(analysis.evidence).toContainEqual({
      claim: "doc:readme",
      sourceFile: "README.md",
      reason: "Detected readme documentation signal",
      confidence: "high"
    });
  });
});
