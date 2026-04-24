import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { RepoAnalysis } from "../../../src/schemas/analysis.js";
import type { BenchmarkManifest } from "../../../src/schemas/benchmark.js";
import {
  renderBenchmarkSummary,
  runBenchmarkManifest
} from "../../../src/core/benchmarks/runBenchmarkManifest.js";

function createManifest(): BenchmarkManifest {
  return {
    name: "fixture-benchmark",
    repos: [
      {
        name: "repo-one",
        url: "https://github.com/example/repo-one"
      },
      {
        name: "repo-two",
        url: "https://github.com/example/repo-two",
        branch: "main"
      }
    ]
  };
}

function createAnalysis(): RepoAnalysis {
  return {
    repo: {
      input: "https://github.com/example/repo",
      rootDir: "/tmp/repo",
      name: "repo"
    },
    detected: {
      packageManager: "pnpm",
      projectType: "vite",
      workspace: {
        isWorkspace: true,
        packageGlobs: ["packages/*"],
        signals: ["pnpm-workspace.yaml"],
        confidence: "high"
      },
      scripts: [
        {
          name: "dev",
          command: "vite",
          confidence: "high"
        }
      ],
      commands: [],
      directories: [],
      configFiles: [
        {
          path: "vite.config.ts",
          type: "framework",
          confidence: "high"
        }
      ],
      entrypoints: ["src/main.ts"],
      envVars: [
        {
          name: "API_URL",
          sourceFile: ".env.example",
          confidence: "high"
        }
      ]
    },
    evidence: []
  };
}

describe("runBenchmarkManifest", () => {
  it("runs each repository and returns a summary", async () => {
    const materializeRepositoryFn = vi
      .fn()
      .mockResolvedValue({
        rootDir: "/tmp/repo",
        cleanup: vi.fn().mockResolvedValue(undefined)
      });
    const analyzeLocalRepoFn = vi.fn().mockResolvedValue(createAnalysis());
    const exportAnalysisArtifactsFn = vi.fn().mockResolvedValue([]);

    const summary = await runBenchmarkManifest(createManifest(), {
      outDir: "benchmark-out",
      format: "md",
      cacheDir: "E:/r2s-cache",
      materializeRepositoryFn,
      analyzeLocalRepoFn,
      exportAnalysisArtifactsFn
    });

    expect(summary.manifestName).toBe("fixture-benchmark");
    expect(summary.repoCount).toBe(2);
    expect(summary.successCount).toBe(2);
    expect(summary.failureCount).toBe(0);
    expect(summary.results).toEqual([
      {
        name: "repo-one",
        url: "https://github.com/example/repo-one",
        branch: undefined,
        success: true,
        outputDir: path.join("benchmark-out", "repo-one"),
        packageManager: "pnpm",
        projectType: "vite",
        workspace: true,
        scriptCount: 1,
        commandCount: 0,
        configFileCount: 1,
        entrypointCount: 1,
        envVarCount: 1
      },
      {
        name: "repo-two",
        url: "https://github.com/example/repo-two",
        branch: "main",
        success: true,
        outputDir: path.join("benchmark-out", "repo-two"),
        packageManager: "pnpm",
        projectType: "vite",
        workspace: true,
        scriptCount: 1,
        commandCount: 0,
        configFileCount: 1,
        entrypointCount: 1,
        envVarCount: 1
      }
    ]);
    expect(materializeRepositoryFn).toHaveBeenCalledTimes(2);
    expect(exportAnalysisArtifactsFn).toHaveBeenCalledTimes(2);
    expect(materializeRepositoryFn).toHaveBeenNthCalledWith(
      1,
      {
        type: "github",
        source: "https://github.com/example/repo-one"
      },
      {
        branch: undefined,
        cacheDir: "E:/r2s-cache"
      }
    );
  });

  it("captures repository failures without aborting the whole run", async () => {
    const materializeRepositoryFn = vi.fn().mockImplementation(async (input: { source: string }) => {
      if (input.source.endsWith("repo-two")) {
        return {
          rootDir: "/tmp/repo-two",
          cleanup: vi.fn().mockResolvedValue(undefined)
        };
      }

      return {
        rootDir: "/tmp/repo-one",
        cleanup: vi.fn().mockResolvedValue(undefined)
      };
    });
    const analyzeLocalRepoFn = vi
      .fn()
      .mockResolvedValueOnce(createAnalysis())
      .mockRejectedValueOnce(new Error("analysis failed"));
    const exportAnalysisArtifactsFn = vi.fn().mockResolvedValue([]);

    const summary = await runBenchmarkManifest(createManifest(), {
      outDir: "benchmark-out",
      materializeRepositoryFn,
      analyzeLocalRepoFn,
      exportAnalysisArtifactsFn
    });

    expect(summary.successCount).toBe(1);
    expect(summary.failureCount).toBe(1);
    expect(summary.results[1]).toMatchObject({
      name: "repo-two",
      success: false,
      error: "analysis failed"
    });
  });

  it("captures materialization failures without aborting the whole run", async () => {
    const materializeRepositoryFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("clone failed"))
      .mockResolvedValueOnce({
        rootDir: "/tmp/repo-two",
        cleanup: vi.fn().mockResolvedValue(undefined)
      });
    const analyzeLocalRepoFn = vi.fn().mockResolvedValue(createAnalysis());
    const exportAnalysisArtifactsFn = vi.fn().mockResolvedValue([]);

    const summary = await runBenchmarkManifest(createManifest(), {
      outDir: "benchmark-out",
      materializeRepositoryFn,
      analyzeLocalRepoFn,
      exportAnalysisArtifactsFn
    });

    expect(summary.successCount).toBe(1);
    expect(summary.failureCount).toBe(1);
    expect(summary.results[0]).toMatchObject({
      name: "repo-one",
      success: false,
      error: "clone failed"
    });
    expect(summary.results[1]).toMatchObject({
      name: "repo-two",
      success: true
    });
  });
});

describe("renderBenchmarkSummary", () => {
  it("renders a concise terminal summary", () => {
    const summary = {
      manifestName: "fixture-benchmark",
      repoCount: 2,
      successCount: 1,
      failureCount: 1,
      format: "all" as const,
      results: [
        {
          name: "repo-one",
          url: "https://github.com/example/repo-one",
          success: true,
          outputDir: "benchmark-out/repo-one",
          packageManager: "pnpm",
          projectType: "vite",
          workspace: true,
          scriptCount: 3,
          commandCount: 3,
          configFileCount: 2,
          entrypointCount: 1,
          envVarCount: 2
        },
        {
          name: "repo-two",
          url: "https://github.com/example/repo-two",
          success: false,
          outputDir: "benchmark-out/repo-two",
          error: "analysis failed"
        }
      ]
    };

    const text = renderBenchmarkSummary(summary);

    expect(text).toContain("Benchmark manifest: fixture-benchmark");
    expect(text).toContain("Succeeded: 1");
    expect(text).toContain("Failed: 1");
    expect(text).toContain("OK | repo-one | pm=pnpm | type=vite | workspace=true | scripts=3 | commands=3 | configs=2 | entrypoints=1 | env=2");
    expect(text).toContain("FAIL | repo-two | error=analysis failed");
  });
});
