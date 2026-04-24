import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis } from "../../schemas/analysis.js";

export async function exportProjectMap(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderProjectMap(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "project-map.md"), markdown);
}

export function renderProjectMap(analysis: RepoAnalysis): string {
  const sections: string[] = [];

  sections.push("## Repository Overview");
  sections.push("");
  sections.push(`- Name: \`${analysis.repo.name}\``);
  sections.push(`- Input: \`${analysis.repo.input}\``);
  sections.push(`- Root Directory: \`${analysis.repo.rootDir}\``);

  if (analysis.detected.packageManager) {
    sections.push("");
    sections.push("## Detected Package Manager");
    sections.push("");
    sections.push(`- \`${analysis.detected.packageManager}\``);
  }

  if (analysis.detected.projectType) {
    sections.push("");
    sections.push("## Project Type");
    sections.push("");
    sections.push(`- \`${analysis.detected.projectType}\``);
  }

  if (analysis.detected.scripts.length > 0) {
    sections.push("");
    sections.push("## Key Scripts");
    sections.push("");

    for (const script of analysis.detected.scripts) {
      sections.push(`- \`${script.name}\`: \`${script.command}\``);
    }
  }

  if (analysis.detected.entrypoints.length > 0) {
    sections.push("");
    sections.push("## Entrypoints");
    sections.push("");

    for (const entrypoint of analysis.detected.entrypoints) {
      sections.push(`- \`${entrypoint}\``);
    }
  }

  if (analysis.detected.envVars.length > 0) {
    sections.push("");
    sections.push("## Environment Variables");
    sections.push("");

    for (const envVar of analysis.detected.envVars) {
      sections.push(`- \`${envVar.name}\` from \`${envVar.sourceFile}\` (${envVar.confidence})`);
    }
  }

  sections.push("");

  return sections.join("\n");
}
