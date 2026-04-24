import path from "node:path";
import fs from "fs-extra";
import { RepoAnalysisSchema, type CommandCandidate, type CommandRole, type RepoAnalysis } from "../../schemas/analysis.js";
import { renderPackageScriptCommand } from "../commands/packageScripts.js";
import { getDisplayEnvVars, getOmittedEnvVarCount } from "../envVars/display.js";

type QuickstartTarget = {
  fileName: string;
  title: string;
  shellLabel: string;
};

const QUICKSTART_TARGETS: QuickstartTarget[] = [
  {
    fileName: "quickstart.windows.md",
    title: "Windows Quickstart",
    shellLabel: "powershell"
  },
  {
    fileName: "quickstart.macos.md",
    title: "macOS Quickstart",
    shellLabel: "bash"
  },
  {
    fileName: "quickstart.linux.md",
    title: "Linux Quickstart",
    shellLabel: "bash"
  }
];

export async function exportQuickstarts(
  outDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const validatedAnalysis = RepoAnalysisSchema.parse(analysis);

  await fs.ensureDir(outDir);

  for (const target of QUICKSTART_TARGETS) {
    const markdown = renderQuickstart(validatedAnalysis, target);
    await fs.writeFile(path.join(outDir, target.fileName), markdown);
  }
}

export function renderQuickstart(
  analysis: RepoAnalysis,
  target: QuickstartTarget
): string {
  const lines: string[] = [];
  const commands = getCommands(analysis);
  const suggestedCommand = getSuggestedStartCommand(commands);

  lines.push(`# ${target.title}`);
  lines.push("");
  lines.push(`Repository: \`${analysis.repo.name}\``);
  lines.push(`Root Directory: \`${analysis.repo.rootDir}\``);

  if (analysis.detected.packageManager) {
    lines.push(`Package Manager: \`${analysis.detected.packageManager}\``);
  }

  if (analysis.detected.projectType) {
    lines.push(`Project Type: \`${analysis.detected.projectType}\``);
  }

  if (analysis.detected.envVars.length > 0) {
    lines.push("");
    lines.push("## Environment Variables");
    lines.push("");
    lines.push("Set these variables before running the project if they are relevant:");
    lines.push("");

    for (const envVar of getDisplayEnvVars(analysis.detected.envVars)) {
      lines.push(`- \`${envVar.name}\` from \`${envVar.sourceFile}\` (${envVar.confidence})`);
    }

    const omittedCount = getOmittedEnvVarCount(analysis.detected.envVars);

    if (omittedCount > 0) {
      lines.push(`- ${omittedCount} additional environment variables omitted from this summary.`);
    }
  }

  if (suggestedCommand) {
    lines.push("");
    lines.push("## Start Command");
    lines.push("");
    lines.push("Run the most likely start command:");
    lines.push("");
    lines.push(`\`\`\`${target.shellLabel}`);
    lines.push(suggestedCommand.command);
    lines.push("```");
  }

  if (commands.length > 0) {
    lines.push("");
    lines.push("## Available Scripts");
    lines.push("");

    for (const command of commands) {
      const rawScript = command.rawScript ? ` (script: \`${command.rawScript}\`)` : "";
      lines.push(`- \`${command.name}\`: \`${command.command}\`${rawScript}`);
    }
  }

  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- This quickstart only uses commands detected from repository evidence.");
  lines.push("- Missing install or setup steps mean no explicit evidence was detected for them.");
  lines.push("");

  return lines.join("\n");
}

function getCommands(analysis: RepoAnalysis): CommandCandidate[] {
  if (analysis.detected.commands.length > 0) {
    return analysis.detected.commands;
  }

  return analysis.detected.scripts.map((script) => ({
    name: script.name,
    role: getCommandRole(script.name),
    command: renderPackageScriptCommand(script, analysis.detected.packageManager),
    rawScript: script.command,
    source: "package.json",
    confidence: script.confidence
  }));
}

function getSuggestedStartCommand(commands: CommandCandidate[]): CommandCandidate | undefined {
  const preferredOrder = ["dev", "start", "build", "test"] as const;
  const byName = new Map(commands.map((command) => [command.name, command]));

  for (const scriptName of preferredOrder) {
    const script = byName.get(scriptName);

    if (script) {
      return script;
    }
  }

  return undefined;
}

function getCommandRole(name: string): CommandRole {
  if (name === "dev" || name === "format" || name === "build" || name === "test" || name === "lint" || name === "typecheck") {
    return name;
  }

  return "other";
}
