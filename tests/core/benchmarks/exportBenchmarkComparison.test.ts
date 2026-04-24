import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { exportBenchmarkComparison } from "../../../src/core/benchmarks/exportBenchmarkComparison.js";
import type { BenchmarkComparison } from "../../../src/schemas/benchmark.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-benchmark-compare-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

function createComparison(): BenchmarkComparison {
  return {
    manifestName: "public-node-ts-smoke",
    baselineGeneratedAt: "2026-04-24T00:00:00.000Z",
    baselineRepoCount: 2,
    currentRepoCount: 2,
    unchangedCount: 1,
    regressionCount: 1,
    improvementCount: 0,
    comparisons: [
      {
        name: "vite",
        status: "unchanged",
        deltas: []
      },
      {
        name: "axios",
        status: "regression",
        deltas: [
          {
            field: "success",
            kind: "regression",
            baselineValue: true,
            currentValue: false
          }
        ]
      }
    ]
  };
}

describe("exportBenchmarkComparison", () => {
  it("writes the compare result JSON file", async () => {
    const tempDir = await createTempDir();
    const outputPath = path.join(tempDir, "compare", "public-node-ts-smoke.compare.json");

    const comparison = await exportBenchmarkComparison(outputPath, createComparison());

    expect(comparison.regressionCount).toBe(1);
    await expect(fs.pathExists(outputPath)).resolves.toBe(true);
    await expect(fs.readJson(outputPath)).resolves.toMatchObject({
      manifestName: "public-node-ts-smoke",
      unchangedCount: 1,
      regressionCount: 1,
      improvementCount: 0
    });
  });
});
