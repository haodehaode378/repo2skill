import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis } from "../../schemas/analysis.js";

export async function exportJson(outDir: string, analysis: RepoAnalysis): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const outputPath = path.join(outDir, "repo2skill.json");
  const json = collapseSingleStringArrays(JSON.stringify(validatedAnalysis, null, 2));

  await fs.ensureDir(outDir);
  await fs.writeFile(outputPath, `${json}\n`);
}

function collapseSingleStringArrays(json: string): string {
  return json.replace(/\[\n(\s+)"((?:[^"\\]|\\.)*)"\n\s+\]/g, '["$2"]');
}
