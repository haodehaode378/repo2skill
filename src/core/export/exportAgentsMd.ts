import path from "node:path";
import fs from "fs-extra";
import {
  RepoAnalysisSchema,
  type CommandCandidate,
  type RepoAnalysis
} from "../../schemas/analysis.js";
import { getEntrypointFacts, isGeneratedEntrypointRole } from "../entrypoints/facts.js";
import { getDisplayEnvVars, getOmittedEnvVarCount } from "../envVars/display.js";
import { formatCode, getCommands, getValidationCommands } from "./commandHelpers.js";
import {
  formatReferenceList,
  getWorkspacePackageLabel,
  getWorkspacePackages,
  getWorkspaceSourceEntrypoints,
  getWorkspaceValidationCommands
} from "./workspaceHelpers.js";

export async function exportAgentsMd(outDir: string, analysis: RepoAnalysis): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderAgentsMd(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "AGENTS.md"), markdown);
}

export function renderAgentsMd(analysis: RepoAnalysis): string {
  const sections: string[] = [];

  sections.push(renderAgentsOverview(analysis));

  const commands = getCommands(analysis);
  const importantDirectories = getImportantDirectories(analysis);

  sections.push(...renderAgentsCommands(commands));
  sections.push(...renderAgentsWorkspacePackages(analysis));
  sections.push(...renderAgentsBeforeChanging(analysis, importantDirectories));
  sections.push(...renderAgentsValidation(commands));
  sections.push(...renderAgentsDirectories(importantDirectories));
  sections.push(...renderAgentsEntrypoints(analysis));
  sections.push(...renderAgentsConfigFiles(analysis));
  sections.push(...renderAgentsTrustAndSafety(analysis));
  sections.push(...renderAgentsNotes(analysis));

  sections.push("");

  return sections.join("\n");
}

function renderAgentsWorkspacePackages(analysis: RepoAnalysis): string[] {
  const packages = getWorkspacePackages(analysis);

  if (packages.length === 0) {
    return [];
  }

  const lines = ["", "## Package-Specific Guidance", ""];

  if (analysis.detected.workspace?.focusedPackage) {
    const focused = analysis.detected.workspace.focusedPackage;
    lines.push(
      `Focused context: ${formatCode(focused.name ?? focused.path)} (${formatCode(focused.path)}).`
    );
    lines.push("");
  }

  for (const workspacePackage of packages) {
    const entrypoints = getWorkspaceSourceEntrypoints(workspacePackage);
    const configs = (workspacePackage.configFiles ?? []).map((config) => config.path);
    const validations = getWorkspaceValidationCommands(workspacePackage);
    lines.push(`### ${getWorkspacePackageLabel(workspacePackage)}`);
    lines.push("");
    lines.push(`- Package path: ${formatCode(workspacePackage.path)}.`);
    if (entrypoints.length > 0) {
      lines.push(
        `- Before editing, inspect source entrypoints: ${entrypoints.map(formatCode).join(", ")}.`
      );
    }
    if (configs.length > 0) {
      lines.push(`- Before editing configuration, inspect: ${configs.map(formatCode).join(", ")}.`);
    }
    if (validations.length > 0) {
      lines.push(
        `- Package validation: ${validations.map((command) => formatCode(command.command)).join(", ")}.`
      );
    }
    lines.push(
      `- Direct internal dependencies: ${formatReferenceList(workspacePackage.directDependencies)}.`
    );
    lines.push(
      `- Direct consumers to re-check: ${formatReferenceList(workspacePackage.directConsumers)}.`
    );
    lines.push("");
  }

  lines.push(
    "Use root validation for shared/root configuration changes; use package validation for isolated package changes."
  );
  return lines;
}

function renderAgentsOverview(analysis: RepoAnalysis): string {
  const lines: string[] = [];

  lines.push("## Repository Overview");
  lines.push("");
  lines.push(`- Name: \`${analysis.repo.name}\``);
  lines.push(`- Root Directory: \`${analysis.repo.rootDir}\``);

  if (analysis.detected.packageManager) {
    lines.push(`- Detected Package Manager: \`${analysis.detected.packageManager}\``);
  }

  return lines.join("\n");
}

function renderAgentsCommands(commands: CommandCandidate[]): string[] {
  if (commands.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Priority Commands");
  lines.push("");

  for (const command of commands) {
    const rawScript = command.rawScript ? ` (script: \`${command.rawScript}\`)` : "";
    lines.push(`- \`${command.name}\`: \`${command.command}\`${rawScript}`);
  }

  return lines;
}

function renderAgentsBeforeChanging(
  analysis: RepoAnalysis,
  importantDirectories: string[]
): string[] {
  const instructions = getBeforeChangingInstructions(analysis, importantDirectories);

  if (instructions.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Before Changing Code");
  lines.push("");

  for (const instruction of instructions) {
    lines.push(`- ${instruction}`);
  }

  return lines;
}

function renderAgentsValidation(commands: CommandCandidate[]): string[] {
  const validationCommands = getValidationCommands(commands);
  const lines: string[] = [];

  lines.push("");
  lines.push("## Validation Before Finishing");
  lines.push("");

  if (validationCommands.length > 0) {
    lines.push("- Run only the evidenced validation commands that are relevant to your change.");

    for (const command of validationCommands) {
      lines.push(`- Run \`${command.command}\` for the \`${command.name}\` command.`);
    }
  } else {
    lines.push(
      "- No validation command was detected. Do not invent one; inspect project scripts first if validation is needed."
    );
  }

  return lines;
}

function renderAgentsDirectories(importantDirectories: string[]): string[] {
  if (importantDirectories.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Important Directories");
  lines.push("");

  for (const directory of importantDirectories) {
    lines.push(`- \`${directory}\``);
  }

  return lines;
}

function renderAgentsEntrypoints(analysis: RepoAnalysis): string[] {
  const entrypoints = getEntrypointFacts(analysis);

  if (entrypoints.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Entrypoints");
  lines.push("");

  for (const entrypoint of entrypoints) {
    const reason = entrypoint.reason ? `, ${entrypoint.reason}` : "";
    lines.push(`- \`${entrypoint.path}\` (${entrypoint.role}, ${entrypoint.confidence}${reason})`);
  }

  return lines;
}

function renderAgentsConfigFiles(analysis: RepoAnalysis): string[] {
  if (analysis.detected.configFiles.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Key Config Files");
  lines.push("");

  for (const configFile of analysis.detected.configFiles) {
    lines.push(`- \`${configFile.path}\` (${configFile.type})`);
  }

  return lines;
}

function renderAgentsTrustAndSafety(analysis: RepoAnalysis): string[] {
  const findings = analysis.detected.auditFindings ?? [];

  if (findings.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Trust and Safety Notes");
  lines.push("");
  lines.push(
    "- Review detected audit findings before running install, workflow, or environment-dependent commands."
  );

  for (const finding of findings.slice(0, 8)) {
    const evidence = finding.evidence ? `, evidence: \`${finding.evidence}\`` : "";
    lines.push(
      `- [${finding.severity}] ${finding.category}: \`${finding.path}\` - ${finding.message}${evidence}`
    );
  }

  if (findings.length > 8) {
    lines.push(`- ${findings.length - 8} additional audit findings omitted from this summary.`);
  }

  return lines;
}

function renderAgentsNotes(analysis: RepoAnalysis): string[] {
  const notes = getNotesAndBoundaries(analysis);

  if (notes.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Notes and Boundaries");
  lines.push("");

  for (const note of notes) {
    lines.push(`- ${note}`);
  }

  return lines;
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
