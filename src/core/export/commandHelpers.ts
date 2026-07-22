import type { CommandCandidate, RepoAnalysis } from "../../schemas/analysis.js";
import { getCommandRole, VALIDATION_SCRIPT_ORDER } from "../commands/commandRoles.js";
import { renderPackageScriptCommand } from "../commands/packageScripts.js";

export { getCommandRole } from "../commands/commandRoles.js";

export function getCommands(analysis: RepoAnalysis): CommandCandidate[] {
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

export function getValidationCommands(commands: CommandCandidate[]): CommandCandidate[] {
  const byRole = new Map(commands.map((command) => [command.role, command]));

  return VALIDATION_SCRIPT_ORDER.flatMap((scriptName) => {
    const command = byRole.get(scriptName);
    return command ? [command] : [];
  });
}

export function formatCode(value: string): string {
  return `\`${value}\``;
}
