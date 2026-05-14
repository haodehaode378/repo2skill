import path from "node:path";
import fs from "fs-extra";
import {
  RepoAnalysisSchema,
  type RepoAnalysis
} from "../../schemas/analysis.js";
import { getEntrypointFacts, isGeneratedEntrypointRole } from "../entrypoints/facts.js";
import { getDisplayEnvVars, getOmittedEnvVarCount } from "../envVars/display.js";
import { formatCode, getCommands, getValidationCommands } from "./commandHelpers.js";

export async function exportAgentsMd(outDir: string, analysis: RepoAnalysis): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderAgentsMd(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "AGENTS.md"), markdown);
}

export function renderAgentsMd(analysis: RepoAnalysis): string {
  const sections: string[] = [];

  sections.push("## Repository Overview");
  sections.push("");
  sections.push(`- Name: \`${analysis.repo.name}\``);
  sections.push(`- Root Directory: \`${analysis.repo.rootDir}\``);

  if (analysis.detected.packageManager) {
    sections.push(`- Detected Package Manager: \`${analysis.detected.packageManager}\``);
  }

  const commands = getCommands(analysis);
  const importantDirectories = getImportantDirectories(analysis);

  if (commands.length > 0) {
    sections.push("");
    sections.push("## Priority Commands");
    sections.push("");

    for (const command of commands) {
      const rawScript = command.rawScript ? ` (script: \`${command.rawScript}\`)` : "";
      sections.push(`- \`${command.name}\`: \`${command.command}\`${rawScript}`);
    }
  }

  const beforeChanging = getBeforeChangingInstructions(analysis, importantDirectories);

  if (beforeChanging.length > 0) {
    sections.push("");
    sections.push("## Before Changing Code");
    sections.push("");

    for (const instruction of beforeChanging) {
      sections.push(`- ${instruction}`);
    }
  }

  const validationCommands = getValidationCommands(commands);

  if (validationCommands.length > 0) {
    sections.push("");
    sections.push("## Validation Before Finishing");
    sections.push("");
    sections.push("- Run only the evidenced validation commands that are relevant to your change.");

    for (const command of validationCommands) {
      sections.push(`- Run \`${command.command}\` for the \`${command.name}\` command.`);
    }
  } else {
    sections.push("");
    sections.push("## Validation Before Finishing");
    sections.push("");
    sections.push(
      "- No validation command was detected. Do not invent one; inspect project scripts first if validation is needed."
    );
  }

  if (importantDirectories.length > 0) {
    sections.push("");
    sections.push("## Important Directories");
    sections.push("");

    for (const directory of importantDirectories) {
      sections.push(`- \`${directory}\``);
    }
  }

  const entrypoints = getEntrypointFacts(analysis);

  if (entrypoints.length > 0) {
    sections.push("");
    sections.push("## Entrypoints");
    sections.push("");

    for (const entrypoint of entrypoints) {
      const reason = entrypoint.reason ? `, ${entrypoint.reason}` : "";
      sections.push(
        `- \`${entrypoint.path}\` (${entrypoint.role}, ${entrypoint.confidence}${reason})`
      );
    }
  }

  if (analysis.detected.configFiles.length > 0) {
    sections.push("");
    sections.push("## Key Config Files");
    sections.push("");

    for (const configFile of analysis.detected.configFiles) {
      sections.push(`- \`${configFile.path}\` (${configFile.type})`);
    }
  }

  const notes = getNotesAndBoundaries(analysis);

  if (notes.length > 0) {
    sections.push("");
    sections.push("## Notes and Boundaries");
    sections.push("");

    for (const note of notes) {
      sections.push(`- ${note}`);
    }
  }

  sections.push("");

  return sections.join("\n");
}

function getImportantDirectories(analysis: RepoAnalysis): string[] {
  if (analysis.detected.directories.length > 0) {
    return analysis.detected.directories.map((directory) => directory.path);
  }

  const directories: string[] = [];
  const seen = new Set<string>();

  for (const entrypoint of getEntrypointFacts(analysis)) {
    if (isGeneratedEntrypointRole(entrypoint.role)) {
      continue;
    }

    const directory = path.posix.dirname(entrypoint.path);

    if (directory === "." || seen.has(directory)) {
      continue;
    }

    seen.add(directory);
    directories.push(directory);
  }

  return directories;
}

function getBeforeChangingInstructions(
  analysis: RepoAnalysis,
  importantDirectories: string[]
): string[] {
  const instructions: string[] = [];
  const configFiles = getConfigFilesByPriority(analysis);

  if (configFiles.length > 0) {
    instructions.push(`Review relevant config first: ${configFiles.map(formatCode).join(", ")}.`);
  }

  if (importantDirectories.length > 0) {
    instructions.push(
      `Start from evidenced directories: ${importantDirectories.map(formatCode).join(", ")}.`
    );
  }

  if (analysis.detected.workspace) {
    instructions.push(
      "For workspace changes, identify the affected package before editing shared files."
    );
  }

  return instructions;
}

function getConfigFilesByPriority(analysis: RepoAnalysis): string[] {
  const priority = new Map([
    ["package", 0],
    ["workspace", 1],
    ["typescript", 2],
    ["framework", 3],
    ["lint", 4],
    ["format", 5],
    ["test", 6],
    ["ci", 7],
    ["environment", 8],
    ["container", 9],
    ["other", 10]
  ]);

  return [...analysis.detected.configFiles]
    .sort((left, right) => {
      const leftPriority = priority.get(left.type) ?? 99;
      const rightPriority = priority.get(right.type) ?? 99;
      return leftPriority - rightPriority || left.path.localeCompare(right.path);
    })
    .slice(0, 6)
    .map((configFile) => configFile.path);
}

function getNotesAndBoundaries(analysis: RepoAnalysis): string[] {
  const notes: string[] = [];

  if (analysis.detected.workspace) {
    const signals = analysis.detected.workspace.signals.map((signal) => `\`${signal}\``).join(", ");
    notes.push(
      `Workspace/monorepo signals detected (${analysis.detected.workspace.confidence} confidence): ${signals}.`
    );
  }

  if (analysis.detected.envVars.length > 0) {
    const envVarList = getDisplayEnvVars(analysis.detected.envVars)
      .map((envVar) => `\`${envVar.name}\``)
      .join(", ");
    const omittedCount = getOmittedEnvVarCount(analysis.detected.envVars);
    const suffix =
      omittedCount > 0 ? ` (${omittedCount} additional variables omitted from this summary)` : "";
    notes.push(`Detected environment variables: ${envVarList}${suffix}.`);
  }

  if (analysis.evidence.length > 0) {
    notes.push(
      `This file reflects ${analysis.evidence.length} evidenced findings from the repository analysis.`
    );
  }

  return notes;
}
