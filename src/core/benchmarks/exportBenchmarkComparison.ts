import path from "node:path";
import fs from "fs-extra";
import {
  BenchmarkComparisonSchema,
  type BenchmarkComparison
} from "../../schemas/benchmark.js";

export async function exportBenchmarkComparison(
  filePath: string,
  comparison: BenchmarkComparison
): Promise<BenchmarkComparison> {
  const validated = BenchmarkComparisonSchema.parse(comparison);

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, validated, { spaces: 2 });

  return validated;
}
