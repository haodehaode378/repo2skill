import type { RepoAnalysis } from "../../schemas/analysis.js";
import { createWorkspacePackageCommand } from "../commands/packageScripts.js";

export function deriveWorkspacePackageCommands(analysis: RepoAnalysis): void {
  const workspace = analysis.detected.workspace;

  if (!workspace?.packages) {
    return;
  }

  workspace.packages = workspace.packages.map((workspacePackage) => {
    const commands = (workspacePackage.scripts ?? []).map((script) =>
      createWorkspacePackageCommand(script, analysis.detected.packageManager, workspacePackage)
    );

    for (const command of commands) {
      analysis.evidence.push({
        claim: `workspacePackageCommand[${workspacePackage.path}]=${command.command}`,
        sourceFile: command.source,
        reason: command.scoped
          ? `Rendered ${analysis.detected.packageManager} workspace command`
          : `Run from package directory ${command.cwd}`,
        confidence: command.confidence
      });
    }

    return { ...workspacePackage, commands };
  });
}
