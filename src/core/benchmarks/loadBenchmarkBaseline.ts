import fs from "fs-extra";
import {
  BenchmarkBaselineSchema,
  type BenchmarkBaseline
} from "../../schemas/benchmark.js";

export async function loadBenchmarkBaseline(filePath: string): Promise<BenchmarkBaseline> {
  const raw = await fs.readJson(filePath);
  return BenchmarkBaselineSchema.parse(raw);
}
