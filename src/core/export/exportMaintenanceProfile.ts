import path from "node:path";
import fs from "fs-extra";
import {
  RepoAnalysisSchema,
  type CommandCandidate,
  type RepoAnalysis
} from "../../schemas/analysis.js";
import { getEntrypointFacts, isGeneratedEntrypointRole } from "../entrypoints/facts.js";
import { formatCode, getCommands, getValidationCommands } from "./commandHelpers.js";
import {
  formatReferenceList,
  getWorkspacePackageLabel,
  getWorkspacePackages
} from "./workspaceHelpers.js";

export async function exportMaintenanceProfile(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);
  const markdown = renderMaintenanceProfile(validatedAnalysis);

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, "maintenance-profile.md"), markdown);
}

export function renderMaintenanceProfile(analysis: RepoAnalysis): string {
  const commands = getCommands(analysis);
  const validationCommands = getValidationCommands(commands);
  const lines: string[] = [];

  lines.push(`# ${analysis.repo.name} Maintenance Profile`);
  lines.push("");
  lines.push("## Project Type");
  lines.push("");
  lines.push(`- Repository: \`${analysis.repo.name}\``);
  lines.push(`- Root Directory: \`${analysis.repo.rootDir}\``);

  if (analysis.detected.projectType) {
    lines.push(`- Detected Project Type: \`${analysis.detected.projectType}\``);
  }

  if (analysis.detected.packageManager) {
    lines.push(`- Package Manager: \`${analysis.detected.packageManager}\``);
  }

  lines.push(...renderMainEntrypoints(analysis));
  lines.push(...renderWorkspaceInventory(analysis));
  lines.push(...renderMinimumValidation(validationCommands));
  lines.push(...renderHighRiskFiles(analysis));
  lines.push(...renderChangeBoundaries(analysis));
  lines.push(...renderAgentHandoffAdvice(analysis, validationCommands));

  return `${lines.join("\n")}\n`;
}

function renderWorkspaceInventory(analysis: RepoAnalysis): string[] {
  const packages = getWorkspacePackages(analysis);

  if (packages.length === 0) {
    return [];
  }

  const lines = ["", "## Workspace Package Inventory", ""];
  for (const workspacePackage of packages) {
    const locationClass = workspacePackage.path.startsWith("apps/")
      ? "application path"
      : workspacePackage.path.startsWith("packages/")
        ? "shared package path"
        : "workspace path";
    lines.push(
      `- ${formatCode(getWorkspacePackageLabel(workspacePackage))} at ${formatCode(workspacePackage.path)} (${locationClass}); dependencies: ${formatReferenceList(workspacePackage.directDependencies)}; consumers: ${formatReferenceList(workspacePackage.directConsumers)}.`
    );
  }

  const ranked = packages
    .map((workspacePackage) => ({
      workspacePackage,
      consumerCount: workspacePackage.directConsumers?.length ?? 0
    }))
    .filter((item) => item.consumerCount > 0)
    .sort(
      (left, right) =>
        right.consumerCount - left.consumerCount ||
        left.workspacePackage.path.localeCompare(right.workspacePackage.path)
    );

  if (ranked.length > 0) {
    lines.push("");
    lines.push("### Packages by Direct Consumer Count");
    lines.push("");
    for (const item of ranked) {
      lines.push(
        `- ${formatCode(getWorkspacePackageLabel(item.workspacePackage))}: ${item.consumerCount} direct consumer${item.consumerCount === 1 ? "" : "s"}.`
      );
    }
  }

  return lines;
}

function renderMainEntrypoints(analysis: RepoAnalysis): string[] {
  const entrypoints = getEntrypointFacts(analysis);

  if (entrypoints.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## Main Entrypoints");
  lines.push("");

  for (const entrypoint of entrypoints) {
    const reason = entrypoint.reason ? `, ${entrypoint.reason}` : "";
    lines.push(`- \`${entrypoint.path}\` (${entrypoint.role}, ${entrypoint.confidence}${reason})`);
  }

  return lines;
}

function renderMinimumValidation(validationCommands: CommandCandidate[]): string[] {
  const lines: string[] = [];
  lines.push("");
  lines.push("## Minimum Validation");
  lines.push("");

  if (validationCommands.length === 0) {
    lines.push("- No validation command was detected. Inspect project scripts before finishing.");
    return lines;
  }

  for (const command of validationCommands.slice(0, 3)) {
    lines.push(`- \`${command.command}\` for \`${command.name}\``);
  }

  return lines;
}

function renderHighRiskFiles(analysis: RepoAnalysis): string[] {
  const highRiskFiles = getHighRiskFiles(analysis);

  if (highRiskFiles.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("## High-Risk Files");
  lines.push("");

  for (const file of highRiskFiles) {
    lines.push(`- ${file}`);
  }

  return lines;
}

function renderChangeBoundaries(analysis: RepoAnalysis): string[] {
  const lines: string[] = [];
  lines.push("");
  lines.push("## Change Boundaries");
  lines.push("");

  if (analysis.detected.directories.length > 0) {
    lines.push(
      `- Start changes in evidenced directories: ${analysis.detected.directories
        .map((directory) => formatCode(directory.path))
        .join(", ")}.`
    );
  } else {
    const sourceDirectories = getEntrypointFacts(analysis)
      .filter((entrypoint) => !isGeneratedEntrypointRole(entrypoint.role))
      .map((entrypoint) => path.posix.dirname(entrypoint.path))
      .filter((directory) => directory !== ".");

    if (sourceDirectories.length > 0) {
      lines.push(
        `- Start changes near source entrypoints: ${[...new Set(sourceDirectories)]
          .map(formatCode)
          .join(", ")}.`
      );
    }
  }

  if (analysis.detected.workspace) {
    lines.push(
      "- For workspace changes, identify the affected package before editing shared files."
    );
  }

  lines.push(
    "- Avoid changing generated or package-output entrypoints unless the task is packaging-related."
  );

  return lines;
}

function renderAgentHandoffAdvice(
  analysis: RepoAnalysis,
  validationCommands: CommandCandidate[]
): string[] {
  const lines: string[] = [];
  lines.push("");
  lines.push("## Agent Handoff Advice");
  lines.push("");
  lines.push("- Read `AGENTS.md` and `SKILL.md` before editing.");
  lines.push("- Verify claims against referenced repository files before acting on them.");

  if (validationCommands.length > 0) {
    lines.push("- Run the relevant minimum validation command before reporting completion.");
  } else {
    lines.push("- If no automated check exists, report the manual verification used.");
  }

  if (analysis.detected.envVars.length > 0) {
    lines.push(
      "- Review environment-variable references before running code paths that need local config."
    );
  }

  return lines;
}

function getHighRiskFiles(analysis: RepoAnalysis): string[] {
  const files: string[] = [];
  const seen = new Set<string>();

  for (const configFile of analysis.detected.configFiles) {
    if (["package", "workspace", "ci", "environment", "container"].includes(configFile.type)) {
      const label = `${formatCode(configFile.path)} (${configFile.type}, ${configFile.confidence})`;

      if (!seen.has(label)) {
        seen.add(label);
        files.push(label);
      }
    }
  }

  for (const entrypoint of getEntrypointFacts(analysis)) {
    if (!isGeneratedEntrypointRole(entrypoint.role)) {
      continue;
    }

    const label = `${formatCode(entrypoint.path)} (${entrypoint.role}, ${entrypoint.confidence})`;

    if (!seen.has(label)) {
      seen.add(label);
      files.push(label);
    }
  }

  return files;
}
