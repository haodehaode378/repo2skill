import path from "node:path";
import fs from "fs-extra";
import {
  BenchmarkBaselineSchema,
  type BenchmarkBaseline
} from "../../schemas/benchmark.js";
import type { BenchmarkSummary } from "./runBenchmarkManifest.js";

export async function exportBenchmarkBaseline(
  filePath: string,
  summary: BenchmarkSummary,
  generatedAt = new Date().toISOString()
): Promise<BenchmarkBaseline> {
  const baseline = createBenchmarkBaseline(summary, generatedAt);
  const validated = BenchmarkBaselineSchema.parse(baseline);

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, validated, { spaces: 2 });

  return validated;
}

export function createBenchmarkBaseline(
  summary: BenchmarkSummary,
  generatedAt = new Date().toISOString()
): BenchmarkBaseline {
  return {
    manifestName: summary.manifestName,
    generatedAt,
    format: summary.format,
    repoCount: summary.repoCount,
    successCount: summary.successCount,
    failureCount: summary.failureCount,
    repos: summary.results.map((result) => ({
      name: result.name,
      url: result.url,
      branch: result.branch,
      success: result.success,
      packageManager: result.packageManager,
      projectType: result.projectType,
      scriptCount: result.scriptCount,
      entrypointCount: result.entrypointCount,
      envVarCount: result.envVarCount,
      error: result.error
    }))
  };
}
