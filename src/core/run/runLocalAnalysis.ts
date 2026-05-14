import path from "node:path";
import fs from "fs-extra";
import type { RepoAnalysis } from "../../schemas/analysis.js";
import { walkDirectory } from "../collect/sharedWalker.js";
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
import { createShareableAnalysis } from "../export/shareableAnalysis.js";

export type OutputFormat = "json" | "md" | "all";

const SOURCE_FILE_EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx"
]);

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
      entrypointFacts: [],
      envVars: []
    },
    evidence: []
  };

  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = (await fs.pathExists(packageJsonPath))
    ? ((await fs.readJson(packageJsonPath)) as Record<string, unknown>)
    : undefined;

  const sourceFiles = await walkDirectory(rootDir, { fileExtensions: SOURCE_FILE_EXTENSIONS });

  await Promise.all([
    detectPackageManager(rootDir, analysis),
    detectConfigFiles(rootDir, analysis),
    detectWorkspace(rootDir, analysis, packageJson),
    detectProjectType(rootDir, analysis, packageJson),
    detectScripts(rootDir, analysis, packageJson),
    detectEntrypoints(rootDir, analysis, packageJson, sourceFiles),
    detectEnvVars(rootDir, analysis, sourceFiles)
  ]);

  deriveFacts(analysis);

  return analysis;
}

export async function exportAnalysisArtifacts(
  outDir: string,
  analysis: RepoAnalysis,
  format: OutputFormat
): Promise<string[]> {
  const writtenFiles: string[] = [];
  const exportedAnalysis = createShareableAnalysis(analysis);

  if (format === "json" || format === "all") {
    await exportJson(outDir, exportedAnalysis);
    writtenFiles.push(path.join(outDir, "repo2skill.json"));
  }

  if (format === "md" || format === "all") {
    await exportProjectMap(outDir, exportedAnalysis);
    writtenFiles.push(path.join(outDir, "project-map.md"));

    await exportAgentsMd(outDir, exportedAnalysis);
    writtenFiles.push(path.join(outDir, "AGENTS.md"));

    await exportSkillMd(outDir, exportedAnalysis);
    writtenFiles.push(path.join(outDir, "SKILL.md"));

    await exportQuickstarts(outDir, exportedAnalysis);
    writtenFiles.push(path.join(outDir, "quickstart.windows.md"));
    writtenFiles.push(path.join(outDir, "quickstart.macos.md"));
    writtenFiles.push(path.join(outDir, "quickstart.linux.md"));
  }

  if (format === "all") {
    await exportHtmlReport(outDir, exportedAnalysis);
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
    const suffix = omittedCount > 0 ? ` (${omittedCount} additional omitted from summary)` : "";
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
