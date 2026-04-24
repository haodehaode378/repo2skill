import { describe, expect, it } from "vitest";
import type { BenchmarkBaseline } from "../../../src/schemas/benchmark.js";
import type { BenchmarkSummary } from "../../../src/core/benchmarks/runBenchmarkManifest.js";
import {
  compareBenchmarkToBaseline,
  renderBenchmarkComparison
} from "../../../src/core/benchmarks/compareBenchmarkBaseline.js";

function createBaseline(): BenchmarkBaseline {
  return {
    manifestName: "public-node-ts-smoke",
    generatedAt: "2026-04-24T00:00:00.000Z",
    format: "all",
    repoCount: 2,
    successCount: 2,
    failureCount: 0,
    repos: [
      {
        name: "vite",
        url: "https://github.com/vitejs/vite",
        success: true,
        packageManager: "pnpm",
        workspace: true,
        scriptCount: 6,
        commandCount: 6,
        configFileCount: 4,
        entrypointCount: 0,
        envVarCount: 34
      },
      {
        name: "axios",
        url: "https://github.com/axios/axios",
        success: true,
        packageManager: "npm",
        scriptCount: 3,
        commandCount: 3,
        configFileCount: 2,
        entrypointCount: 3,
        envVarCount: 8
      }
    ]
  };
}

describe("compareBenchmarkToBaseline", () => {
  it("reports unchanged repositories when values match", () => {
    const current: BenchmarkSummary = {
      manifestName: "public-node-ts-smoke",
      repoCount: 2,
      successCount: 2,
      failureCount: 0,
      format: "all",
      results: [
        {
          name: "vite",
          url: "https://github.com/vitejs/vite",
          success: true,
          outputDir: "benchmark-out/vite",
          packageManager: "pnpm",
          workspace: true,
          scriptCount: 6,
          commandCount: 6,
          configFileCount: 4,
          entrypointCount: 0,
          envVarCount: 34
        },
        {
          name: "axios",
          url: "https://github.com/axios/axios",
          success: true,
          outputDir: "benchmark-out/axios",
          packageManager: "npm",
          scriptCount: 3,
          commandCount: 3,
          configFileCount: 2,
          entrypointCount: 3,
          envVarCount: 8
        }
      ]
    };

    const comparison = compareBenchmarkToBaseline(current, createBaseline());

    expect(comparison.unchangedCount).toBe(2);
    expect(comparison.regressionCount).toBe(0);
    expect(comparison.improvementCount).toBe(0);
  });

  it("reports regressions and improvements", () => {
    const current: BenchmarkSummary = {
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
          workspace: true,
          scriptCount: 7,
          commandCount: 6,
          configFileCount: 5,
          entrypointCount: 0,
          envVarCount: 34
        },
        {
          name: "axios",
          url: "https://github.com/axios/axios",
          success: false,
          outputDir: "benchmark-out/axios",
          error: "clone failed"
        }
      ]
    };

    const comparison = compareBenchmarkToBaseline(current, createBaseline());

    expect(comparison.unchangedCount).toBe(0);
    expect(comparison.regressionCount).toBe(1);
    expect(comparison.improvementCount).toBe(1);
    expect(comparison.comparisons).toEqual([
      {
        name: "vite",
        status: "improvement",
        deltas: [
          {
            field: "scriptCount",
            kind: "improvement",
            baselineValue: 6,
            currentValue: 7
          },
          {
            field: "configFileCount",
            kind: "improvement",
            baselineValue: 4,
            currentValue: 5
          }
        ]
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
          },
          {
            field: "packageManager",
            kind: "regression",
            baselineValue: "npm",
            currentValue: undefined
          },
          {
            field: "scriptCount",
            kind: "regression",
            baselineValue: 3,
            currentValue: undefined
          },
          {
            field: "commandCount",
            kind: "regression",
            baselineValue: 3,
            currentValue: undefined
          },
          {
            field: "configFileCount",
            kind: "regression",
            baselineValue: 2,
            currentValue: undefined
          },
          {
            field: "entrypointCount",
            kind: "regression",
            baselineValue: 3,
            currentValue: undefined
          },
          {
            field: "envVarCount",
            kind: "regression",
            baselineValue: 8,
            currentValue: undefined
          }
        ]
      }
    ]);
  });
});

describe("renderBenchmarkComparison", () => {
  it("renders a concise comparison summary", () => {
    const text = renderBenchmarkComparison({
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
    });

    expect(text).toContain("Baseline manifest: public-node-ts-smoke");
    expect(text).toContain("Regressions: 1");
    expect(text).toContain("axios: regression:success true -> false");
  });
});
