import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type RepoAnalysis } from "../../schemas/analysis.js";
import { renderPackageScriptCommand } from "../commands/packageScripts.js";
import { getEntrypointFacts } from "../entrypoints/facts.js";
import { getDisplayEnvVars, getOmittedEnvVarCount } from "../envVars/display.js";

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

  if (analysis.detected.workspace) {
    sections.push("");
    sections.push("## Workspace");
    sections.push("");
    sections.push(`- Confidence: \`${analysis.detected.workspace.confidence}\``);

    if (analysis.detected.workspace.signals.length > 0) {
      sections.push(`- Signals: ${analysis.detected.workspace.signals.map(formatCode).join(", ")}`);
    }

    if (analysis.detected.workspace.packageGlobs.length > 0) {
      sections.push(
        `- Package Globs: ${analysis.detected.workspace.packageGlobs.map(formatCode).join(", ")}`
      );
    }
  }

  if (analysis.detected.scripts.length > 0) {
    sections.push("");
    sections.push("## Key Scripts");
    sections.push("");

    const commandsByName = new Map(
      analysis.detected.commands.map((command) => [command.name, command])
    );

    for (const script of analysis.detected.scripts) {
      const command = commandsByName.get(script.name)?.command ?? renderPackageScriptCommand(
        script,
        analysis.detected.packageManager
      );
      sections.push(`- \`${script.name}\`: \`${command}\` (script: \`${script.command}\`)`);
    }
  }

  if (analysis.detected.directories.length > 0) {
    sections.push("");
    sections.push("## Important Directories");
    sections.push("");

    for (const directory of analysis.detected.directories) {
      sections.push(
        `- \`${directory.path}\` (${directory.role}, ${directory.confidence}) from \`${directory.source}\``
      );
    }
  }

  if (analysis.detected.configFiles.length > 0) {
    sections.push("");
    sections.push("## Key Config Files");
    sections.push("");

    for (const configFile of analysis.detected.configFiles) {
      sections.push(`- \`${configFile.path}\` (${configFile.type}, ${configFile.confidence})`);
    }
  }

  const entrypoints = getEntrypointFacts(analysis);

  if (entrypoints.length > 0) {
    sections.push("");
    sections.push("## Entrypoints");
    sections.push("");

    for (const entrypoint of entrypoints) {
      const reason = entrypoint.reason ? `, ${entrypoint.reason}` : "";
      sections.push(`- \`${entrypoint.path}\` (${entrypoint.role}, ${entrypoint.confidence}${reason})`);
    }
  }

  if (analysis.detected.envVars.length > 0) {
    sections.push("");
    sections.push("## Environment Variables");
    sections.push("");

    for (const envVar of getDisplayEnvVars(analysis.detected.envVars)) {
      sections.push(`- \`${envVar.name}\` from \`${envVar.sourceFile}\` (${envVar.confidence})`);
    }

    const omittedCount = getOmittedEnvVarCount(analysis.detected.envVars);

    if (omittedCount > 0) {
      sections.push(`- ${omittedCount} additional environment variables omitted from this summary.`);
    }
  }

  sections.push("");

  return sections.join("\n");
}

function formatCode(value: string): string {
  return `\`${value}\``;
}
