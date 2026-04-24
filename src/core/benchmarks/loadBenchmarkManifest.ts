import fs from "fs-extra";
import { BenchmarkManifestSchema, type BenchmarkManifest } from "../../schemas/benchmark.js";

export async function loadBenchmarkManifest(filePath: string): Promise<BenchmarkManifest> {
  const raw = await fs.readJson(filePath);
  return BenchmarkManifestSchema.parse(raw);
}
