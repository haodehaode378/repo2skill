import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis } from "../../schemas/analysis.js";

export async function exportJson(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);

  await fs.ensureDir(outDir);
  await fs.writeJson(path.join(outDir, "repo2skill.json"), validatedAnalysis, {
    spaces: 2
  });
}
