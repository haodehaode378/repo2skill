import path from "node:path";
import fs from "fs-extra";
import {
  RepoAnalysisSchema,
  type CommandCandidate,
  type RepoAnalysis
} from "../../schemas/analysis.js";
import { getEntrypointFacts } from "../entrypoints/facts.js";
import { getDisplayEnvVars, getOmittedEnvVarCount } from "../envVars/display.js";
import { formatCode, getCommands, getValidationCommands } from "./commandHelpers.js";

export async function exportSkillMd(outDir: string, analysis: RepoAnalysis): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderSkillMd(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "SKILL.md"), markdown);
}

export function renderSkillMd(analysis: RepoAnalysis): string {
  const lines: string[] = [];
  const skillName = createSkillName(analysis.repo.name);
  const description = createDescription(analysis.repo.name);

  lines.push("---");
  lines.push(`name: ${skillName}`);
  lines.push(`description: ${description}`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${analysis.repo.name} Repository Skill`);
  lines.push("");

  const commands = getCommands(analysis);
  const validationCommands = getValidationCommands(commands);

  lines.push(renderSkillUseWhen(analysis));
  lines.push(...renderSkillSteps(analysis, commands, validationCommands));
  lines.push(...renderSkillCommandsSection(commands));
  lines.push(...renderSkillValidationSection(validationCommands));
  lines.push(...renderSkillReferences(analysis));
  lines.push(...renderSkillBoundaries());

  return lines.join("\n");
}

function renderSkillUseWhen(analysis: RepoAnalysis): string {
  const lines: string[] = [];

  lines.push("## Use When");
  lines.push("");
  lines.push(`- You are working inside \`${analysis.repo.name}\`.`);
  lines.push(
    "- You need repository-specific commands, validation checks, or configuration references."
  );
  lines.push(
    "- You want evidence-backed onboarding context instead of inferred workflow assumptions."
  );
  lines.push("");
  lines.push(`- Root Directory: \`${analysis.repo.rootDir}\``);

  if (analysis.detected.packageManager) {
    lines.push(`- Detected Package Manager: \`${analysis.detected.packageManager}\``);
  }

  return lines.join("\n");
}

function renderSkillSteps(
  analysis: RepoAnalysis,
  commands: CommandCandidate[],
  validationCommands: CommandCandidate[]
): string[] {
  const steps = getSteps(analysis, commands, validationCommands);

  if (steps.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Steps");
  lines.push("");

  for (const step of steps) {
    lines.push(`- ${step}`);
  }

  return lines;
}

function renderSkillCommandsSection(commands: CommandCandidate[]): string[] {
  if (commands.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Commands");
  lines.push("");

  for (const command of commands) {
    const rawScript = command.rawScript ? ` (script: \`${command.rawScript}\`)` : "";
    lines.push(`- Run \`${command.command}\` for \`${command.name}\`${rawScript}.`);
  }

  return lines;
}

function renderSkillValidationSection(validationCommands: CommandCandidate[]): string[] {
  if (validationCommands.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Validation");
  lines.push("");

  for (const command of validationCommands) {
    lines.push(
      `- Prefer \`${command.command}\` before finishing changes when that check is relevant.`
    );
  }

  return lines;
}

function renderSkillReferences(analysis: RepoAnalysis): string[] {
  const references = getReferences(analysis);

  if (references.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## References");
  lines.push("");

  for (const reference of references) {
    lines.push(`- ${reference}`);
  }

  return lines;
}

function renderSkillBoundaries(): string[] {
  return [
    "",
    "## Boundaries",
    "",
    "- Treat this skill as evidence-backed repository guidance, not a complete architecture document.",
    "- Omitted sections mean no supporting repository evidence was detected.",
    ""
  ];
}

function getSteps(
  analysis: RepoAnalysis,
  commands: CommandCandidate[],
  validationCommands: CommandCandidate[]
): string[] {
  const steps: string[] = [];

  if (analysis.detected.configFiles.length > 0) {
    steps.push(
      `Review relevant config files first: ${analysis.detected.configFiles
        .slice(0, 6)
        .map((configFile) => formatCode(configFile.path))
        .join(", ")}.`
    );
  }

  if (analysis.detected.directories.length > 0) {
    steps.push(
      `Start code navigation from evidenced directories: ${analysis.detected.directories
        .map((directory) => formatCode(directory.path))
        .join(", ")}.`
    );
  }

  if (analysis.detected.workspace) {
    steps.push("For workspace changes, identify the affected package before editing shared files.");
  }

  if (commands.length > 0) {
    steps.push("Use only the detected commands below; do not invent package scripts.");
  }

  if (validationCommands.length > 0) {
    steps.push("Before finishing, run the relevant validation commands listed below.");
  }

  return steps;
}

function getReferences(analysis: RepoAnalysis): string[] {
  const references: string[] = [];

  for (const configFile of analysis.detected.configFiles) {
    references.push(
      `Config: \`${configFile.path}\` (${configFile.type}, ${configFile.confidence})`
    );
  }

  for (const entrypoint of getEntrypointFacts(analysis)) {
    const reason = entrypoint.reason ? `, ${entrypoint.reason}` : "";
    references.push(
      `Entrypoint: \`${entrypoint.path}\` (${entrypoint.role}, ${entrypoint.confidence}${reason})`
    );
  }

  for (const directory of analysis.detected.directories) {
    references.push(
      `Directory: \`${directory.path}\` (${directory.role}, ${directory.confidence})`
    );
  }

  if (analysis.detected.workspace) {
    references.push(
      `Workspace signals: ${analysis.detected.workspace.signals.map(formatCode).join(", ")} (${analysis.detected.workspace.confidence})`
    );

    if (analysis.detected.workspace.packageGlobs.length > 0) {
      references.push(
        `Workspace package globs: ${analysis.detected.workspace.packageGlobs.map(formatCode).join(", ")}`
      );
    }
  }

  if (analysis.detected.envVars.length > 0) {
    for (const envVar of getDisplayEnvVars(analysis.detected.envVars)) {
      references.push(
        `Env: \`${envVar.name}\` from \`${envVar.sourceFile}\` (${envVar.confidence})`
      );
    }

    const omittedCount = getOmittedEnvVarCount(analysis.detected.envVars);

    if (omittedCount > 0) {
      references.push(
        `${omittedCount} additional environment variables omitted from this summary.`
      );
    }
  }

  return references;
}

function createSkillName(repoName: string): string {
  const normalized = repoName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized ? `${normalized}-repo-skill` : "repository-skill";
}

function createDescription(repoName: string): string {
  return `Repository-specific guidance for working in ${repoName}. Use when modifying this repository and you need the detected commands, validation checks, and environment-variable hints.`;
}
