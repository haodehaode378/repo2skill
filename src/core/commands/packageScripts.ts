import type { ScriptCommand, WorkspacePackageCommand } from "../../schemas/analysis.js";
import { getCommandRole } from "./commandRoles.js";

export function renderPackageScriptCommand(script: ScriptCommand, packageManager?: string): string {
  switch (packageManager) {
    case "pnpm":
      return `pnpm ${script.name}`;
    case "yarn":
      return `yarn ${script.name}`;
    case "bun":
      return `bun run ${script.name}`;
    case "npm":
      return `npm run ${script.name}`;
    default:
      return script.command;
  }
}

export function createWorkspacePackageCommand(
  script: ScriptCommand,
  packageManager: string | undefined,
  workspacePackage: {
    path: string;
    packageJsonPath: string;
    name?: string;
  }
): WorkspacePackageCommand {
  const scopedCommand = workspacePackage.name
    ? renderScopedWorkspaceCommand(script, packageManager, workspacePackage.name)
    : undefined;

  return {
    name: script.name,
    role: getCommandRole(script.name),
    command: scopedCommand ?? renderPackageScriptCommand(script, packageManager),
    rawScript: script.command,
    cwd: scopedCommand ? "." : workspacePackage.path,
    packageName: workspacePackage.name,
    packagePath: workspacePackage.path,
    source: workspacePackage.packageJsonPath,
    confidence: script.confidence,
    scoped: scopedCommand != null
  };
}

function renderScopedWorkspaceCommand(
  script: ScriptCommand,
  packageManager: string | undefined,
  packageName: string
): string | undefined {
  switch (packageManager) {
    case "pnpm":
      return `pnpm --filter ${packageName} ${script.name}`;
    case "npm":
      return `npm run ${script.name} --workspace ${packageName}`;
    case "yarn":
      return `yarn workspace ${packageName} ${script.name}`;
    default:
      return undefined;
  }
}
