import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  createBenchmarkBaseline,
  exportBenchmarkBaseline
} from "../../../src/core/benchmarks/exportBenchmarkBaseline.js";
import type { BenchmarkSummary } from "../../../src/core/benchmarks/runBenchmarkManifest.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-benchmark-baseline-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

function createSummary(): BenchmarkSummary {
  return {
    manifestName: "public-node-ts-smoke",
    repoCount: 2,
    successCount: 1,
    failureCount: 1,
    format: "all",
    results: [
      {
        name: "vite",
        url: "https://github.com/vitejs/vite",
        success: true,
        outputDir: "benchmark-out/vite",
        packageManager: "pnpm",
        projectType: "vite",
        scriptCount: 6,
        entrypointCount: 0,
        envVarCount: 34
      },
      {
        name: "nextjs",
        url: "https://github.com/vercel/next.js",
        branch: "canary",
        success: false,
        outputDir: "benchmark-out/nextjs",
        error: "clone failed"
      }
    ]
  };
}

describe("createBenchmarkBaseline", () => {
  it("creates a stable summary without output directories", () => {
    const baseline = createBenchmarkBaseline(createSummary(), "2026-04-23T05:00:00.000Z");

    expect(baseline).toEqual({
      manifestName: "public-node-ts-smoke",
      generatedAt: "2026-04-23T05:00:00.000Z",
      format: "all",
      repoCount: 2,
      successCount: 1,
      failureCount: 1,
      repos: [
        {
          name: "vite",
          url: "https://github.com/vitejs/vite",
          branch: undefined,
          success: true,
          packageManager: "pnpm",
          projectType: "vite",
          scriptCount: 6,
          entrypointCount: 0,
          envVarCount: 34,
          error: undefined
        },
        {
          name: "nextjs",
          url: "https://github.com/vercel/next.js",
          branch: "canary",
          success: false,
          packageManager: undefined,
          projectType: undefined,
          scriptCount: undefined,
          entrypointCount: undefined,
          envVarCount: undefined,
          error: "clone failed"
        }
      ]
    });
  });
});

describe("exportBenchmarkBaseline", () => {
  it("writes the baseline JSON file", async () => {
    const tempDir = await createTempDir();
    const outputPath = path.join(tempDir, "baselines", "public-node-ts-smoke.summary.json");

    const baseline = await exportBenchmarkBaseline(
      outputPath,
      createSummary(),
      "2026-04-23T05:00:00.000Z"
    );

    expect(baseline.manifestName).toBe("public-node-ts-smoke");
    await expect(fs.pathExists(outputPath)).resolves.toBe(true);
    await expect(fs.readJson(outputPath)).resolves.toMatchObject({
      manifestName: "public-node-ts-smoke",
      successCount: 1,
      failureCount: 1
    });
  });
});
