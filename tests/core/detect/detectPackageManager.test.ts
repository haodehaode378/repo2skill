import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectPackageManager } from "../../../src/core/detect/detectPackageManager.js";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "./tests/fixtures/package-managers",
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

describe("detectPackageManager", () => {
  it.each([
    ["pnpm", "pnpm-lock.yaml", "pnpm"],
    ["npm", "package-lock.json", "npm"],
    ["yarn", "yarn.lock", "yarn"],
    ["bun", "bun.lockb", "bun"]
  ])(
    "detects %s from its lockfile",
    async (fixtureName, expectedSourceFile, expectedManager) => {
      const analysis = createAnalysis();
      const rootDir = path.resolve(`tests/fixtures/package-managers/${fixtureName}`);

      await detectPackageManager(rootDir, analysis);

      expect(analysis.detected.packageManager).toBe(expectedManager);
      expect(analysis.evidence).toEqual([
        {
          claim: `packageManager=${expectedManager}`,
          sourceFile: expectedSourceFile,
          confidence: "high"
        }
      ]);
    }
  );

  it("does nothing when no supported lockfile exists", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/package-managers/empty");

    await detectPackageManager(rootDir, analysis);

    expect(analysis.detected.packageManager).toBeUndefined();
    expect(analysis.evidence).toEqual([]);
  });

  it("uses the first supported lockfile in precedence order", async () => {
    const analysis = createAnalysis();
    const rootDir = path.resolve("tests/fixtures/package-managers/multiple");

    await detectPackageManager(rootDir, analysis);

    expect(analysis.detected.packageManager).toBe("pnpm");
    expect(analysis.evidence).toEqual([
      {
        claim: "packageManager=pnpm",
        sourceFile: "pnpm-lock.yaml",
        confidence: "high"
      }
    ]);
  });
});
