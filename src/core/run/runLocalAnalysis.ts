import path from "node:path";
import type { RepoAnalysis } from "../../schemas/analysis.js";
import { getDisplayEnvVars, getOmittedEnvVarCount } from "../envVars/display.js";
import { detectConfigFiles } from "../detect/detectConfigFiles.js";
import { detectEnvVars } from "../detect/detectEnvVars.js";
import { detectEntrypoints } from "../detect/detectEntrypoints.js";
import { detectPackageManager } from "../detect/detectPackageManager.js";
import { detectProjectType } from "../detect/detectProjectType.js";
import { detectScripts } from "../detect/detectScripts.js";
import { detectWorkspace } from "../detect/detectWorkspace.js";
import { deriveFacts } from "../facts/deriveFacts.js";
import { exportAgentsMd } from "../export/exportAgentsMd.js";
import { exportHtmlReport } from "../export/exportHtmlReport.js";
import { exportJson } from "../export/exportJson.js";
import { exportProjectMap } from "../export/exportProjectMap.js";
import { exportQuickstarts } from "../export/exportQuickstarts.js";
import { exportSkillMd } from "../export/exportSkillMd.js";

export type OutputFormat = "json" | "md" | "all";

export async function analyzeLocalRepo(rootDir: string): Promise<RepoAnalysis> {
  const analysis: RepoAnalysis = {
    repo: {
      input: rootDir,
      rootDir,
      name: path.basename(rootDir)
    },
    detected: {
      scripts: [],
      commands: [],
      directories: [],
      configFiles: [],
      entrypoints: [],
      envVars: []
    },
    evidence: []
  };

  await detectPackageManager(rootDir, analysis);
  await detectConfigFiles(rootDir, analysis);
  await detectWorkspace(rootDir, analysis);
  await detectProjectType(rootDir, analysis);
  await detectScripts(rootDir, analysis);
  await detectEntrypoints(rootDir, analysis);
  await detectEnvVars(rootDir, analysis);
  deriveFacts(analysis);

  return analysis;
}

export async function exportAnalysisArtifacts(
  outDir: string,
  analysis: RepoAnalysis,
  format: OutputFormat
): Promise<string[]> {
  const writtenFiles: string[] = [];

  if (format === "json" || format === "all") {
    await exportJson(outDir, analysis);
    writtenFiles.push(path.join(outDir, "repo2skill.json"));
  }

  if (format === "md" || format === "all") {
    await exportProjectMap(outDir, analysis);
    writtenFiles.push(path.join(outDir, "project-map.md"));

    await exportAgentsMd(outDir, analysis);
    writtenFiles.push(path.join(outDir, "AGENTS.md"));

    await exportSkillMd(outDir, analysis);
    writtenFiles.push(path.join(outDir, "SKILL.md"));

    await exportQuickstarts(outDir, analysis);
    writtenFiles.push(path.join(outDir, "quickstart.windows.md"));
    writtenFiles.push(path.join(outDir, "quickstart.macos.md"));
    writtenFiles.push(path.join(outDir, "quickstart.linux.md"));
  }

  if (format === "all") {
    await exportHtmlReport(outDir, analysis);
    writtenFiles.push(path.join(outDir, "report.html"));
  }

  return writtenFiles;
}

export function renderAnalysisSummary(
  analysis: RepoAnalysis,
  writtenFiles: string[],
  options: {
    inputSource?: string;
    materializedRootDir?: string;
  } = {}
): string {
  const lines: string[] = [];
  const inputSource = options.inputSource ?? analysis.repo.input;
  const materializedRootDir = options.materializedRootDir ?? analysis.repo.rootDir;

  lines.push(`Repository input: ${inputSource}`);

  if (materializedRootDir !== inputSource) {
    lines.push(`Materialized root: ${materializedRootDir}`);
  }

  if (analysis.detected.packageManager) {
    lines.push(`Package manager: ${analysis.detected.packageManager}`);
  }

  if (analysis.detected.projectType) {
    lines.push(`Project type: ${analysis.detected.projectType}`);
  }

  if (analysis.detected.scripts.length > 0) {
    lines.push(`Scripts: ${analysis.detected.scripts.map((script) => script.name).join(", ")}`);
  }

  if (analysis.detected.entrypoints.length > 0) {
    lines.push(`Entrypoints: ${analysis.detected.entrypoints.join(", ")}`);
  }

  if (analysis.detected.envVars.length > 0) {
    const envVars = getDisplayEnvVars(analysis.detected.envVars)
      .map((envVar) => `${envVar.name} (${envVar.confidence})`)
      .join(", ");
    const omittedCount = getOmittedEnvVarCount(analysis.detected.envVars);
    const suffix =
      omittedCount > 0 ? ` (${omittedCount} additional omitted from summary)` : "";
    lines.push(`Environment variables: ${envVars}${suffix}`);
  }

  if (writtenFiles.length > 0) {
    lines.push("Generated files:");

    for (const writtenFile of writtenFiles) {
      lines.push(`- ${writtenFile}`);
    }
  }

  return lines.join("\n");
}
