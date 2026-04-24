import path from "node:path";
import type { BenchmarkManifest, BenchmarkRepo } from "../../schemas/benchmark.js";
import type { RepoAnalysis } from "../../schemas/analysis.js";
import {
  analyzeLocalRepo,
  exportAnalysisArtifacts,
  type OutputFormat
} from "../run/runLocalAnalysis.js";
import { materializeRepository } from "../collect/materializeRepository.js";

export type BenchmarkRepoResult = {
  name: string;
  url: string;
  branch?: string;
  success: boolean;
  outputDir: string;
  packageManager?: string;
  projectType?: string;
  workspace?: boolean;
  scriptCount?: number;
  commandCount?: number;
  configFileCount?: number;
  entrypointCount?: number;
  envVarCount?: number;
  error?: string;
};

export type BenchmarkSummary = {
  manifestName: string;
  repoCount: number;
  successCount: number;
  failureCount: number;
  format: OutputFormat;
  results: BenchmarkRepoResult[];
};

type RunBenchmarkManifestOptions = {
  outDir: string;
  format?: OutputFormat;
  cacheDir?: string;
  materializeRepositoryFn?: typeof materializeRepository;
  analyzeLocalRepoFn?: typeof analyzeLocalRepo;
  exportAnalysisArtifactsFn?: typeof exportAnalysisArtifacts;
};

export async function runBenchmarkManifest(
  manifest: BenchmarkManifest,
  options: RunBenchmarkManifestOptions
): Promise<BenchmarkSummary> {
  const format = options.format ?? "all";
  const results: BenchmarkRepoResult[] = [];
  const materialize = options.materializeRepositoryFn ?? materializeRepository;
  const analyze = options.analyzeLocalRepoFn ?? analyzeLocalRepo;
  const exportArtifacts = options.exportAnalysisArtifactsFn ?? exportAnalysisArtifacts;

  for (const repo of manifest.repos) {
    results.push(
      await runSingleBenchmarkRepo(repo, {
        outDir: path.join(options.outDir, repo.name),
        format,
        cacheDir: options.cacheDir,
        materializeRepositoryFn: materialize,
        analyzeLocalRepoFn: analyze,
        exportAnalysisArtifactsFn: exportArtifacts
      })
    );
  }

  const successCount = results.filter((result) => result.success).length;

  return {
    manifestName: manifest.name,
    repoCount: manifest.repos.length,
    successCount,
    failureCount: manifest.repos.length - successCount,
    format,
    results
  };
}

export function renderBenchmarkSummary(summary: BenchmarkSummary): string {
  const lines = [
    `Benchmark manifest: ${summary.manifestName}`,
    `Format: ${summary.format}`,
    `Repositories: ${summary.repoCount}`,
    `Succeeded: ${summary.successCount}`,
    `Failed: ${summary.failureCount}`
  ];

  if (summary.results.length > 0) {
    lines.push("Results:");

    for (const result of summary.results) {
      const parts = [result.success ? "OK" : "FAIL", result.name];

      if (result.packageManager) {
        parts.push(`pm=${result.packageManager}`);
      }

      if (result.projectType) {
        parts.push(`type=${result.projectType}`);
      }

      if (typeof result.workspace === "boolean") {
        parts.push(`workspace=${result.workspace}`);
      }

      if (typeof result.scriptCount === "number") {
        parts.push(`scripts=${result.scriptCount}`);
      }

      if (typeof result.commandCount === "number") {
        parts.push(`commands=${result.commandCount}`);
      }

      if (typeof result.configFileCount === "number") {
        parts.push(`configs=${result.configFileCount}`);
      }

      if (typeof result.entrypointCount === "number") {
        parts.push(`entrypoints=${result.entrypointCount}`);
      }

      if (typeof result.envVarCount === "number") {
        parts.push(`env=${result.envVarCount}`);
      }

      if (result.error) {
        parts.push(`error=${result.error}`);
      }

      lines.push(`- ${parts.join(" | ")}`);
    }
  }

  return lines.join("\n");
}

type RunSingleBenchmarkRepoOptions = {
  outDir: string;
  format: OutputFormat;
  cacheDir?: string;
  materializeRepositoryFn: typeof materializeRepository;
  analyzeLocalRepoFn: typeof analyzeLocalRepo;
  exportAnalysisArtifactsFn: typeof exportAnalysisArtifacts;
};

async function runSingleBenchmarkRepo(
  repo: BenchmarkRepo,
  options: RunSingleBenchmarkRepoOptions
): Promise<BenchmarkRepoResult> {
  const outputDir = options.outDir;
  const input = {
    type: "github" as const,
    source: repo.url
  };
  let materialized: Awaited<ReturnType<typeof materializeRepository>> | undefined;

  try {
    materialized = await options.materializeRepositoryFn(input, {
      branch: repo.branch,
      cacheDir: options.cacheDir
    });
    const analysis = await options.analyzeLocalRepoFn(materialized.rootDir);
    await options.exportAnalysisArtifactsFn(outputDir, analysis, options.format);

    return buildSuccessResult(repo, outputDir, analysis);
  } catch (error) {
    return {
      name: repo.name,
      url: repo.url,
      branch: repo.branch,
      success: false,
      outputDir,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (materialized) {
      await materialized.cleanup();
    }
  }
}

function buildSuccessResult(
  repo: BenchmarkRepo,
  outputDir: string,
  analysis: RepoAnalysis
): BenchmarkRepoResult {
  return {
    name: repo.name,
    url: repo.url,
    branch: repo.branch,
    success: true,
    outputDir,
    packageManager: analysis.detected.packageManager,
    projectType: analysis.detected.projectType,
    workspace: analysis.detected.workspace?.isWorkspace,
    scriptCount: analysis.detected.scripts.length,
    commandCount: analysis.detected.commands.length,
    configFileCount: analysis.detected.configFiles.length,
    entrypointCount: analysis.detected.entrypoints.length,
    envVarCount: analysis.detected.envVars.length
  };
}
