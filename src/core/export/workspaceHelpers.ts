import type {
  RepoAnalysis,
  WorkspacePackage,
  WorkspacePackageCommand,
  WorkspacePackageReference
} from "../../schemas/analysis.js";
import { VALIDATION_SCRIPT_ORDER } from "../commands/commandRoles.js";
import { isGeneratedEntrypointRole } from "../entrypoints/facts.js";

export function getWorkspacePackages(analysis: RepoAnalysis): WorkspacePackage[] {
  return analysis.detected.workspace?.packages ?? [];
}

export function getWorkspacePackageLabel(workspacePackage: WorkspacePackage): string {
  return workspacePackage.name ?? workspacePackage.path;
}

export function formatWorkspacePackageReference(reference: WorkspacePackageReference): string {
  return reference.name ? `${reference.name} (${reference.path})` : reference.path;
}

export function getWorkspaceSourceEntrypoints(workspacePackage: WorkspacePackage): string[] {
  return (workspacePackage.entrypointFacts ?? [])
    .filter((entrypoint) => !isGeneratedEntrypointRole(entrypoint.role))
    .map((entrypoint) => entrypoint.path);
}

export function getWorkspaceValidationCommands(
  workspacePackage: WorkspacePackage
): WorkspacePackageCommand[] {
  const order = new Map(VALIDATION_SCRIPT_ORDER.map((role, index) => [role, index]));

  return (workspacePackage.commands ?? [])
    .filter((command) => order.has(command.role as (typeof VALIDATION_SCRIPT_ORDER)[number]))
    .sort((left, right) => {
      const leftOrder = order.get(left.role as (typeof VALIDATION_SCRIPT_ORDER)[number]) ?? 99;
      const rightOrder = order.get(right.role as (typeof VALIDATION_SCRIPT_ORDER)[number]) ?? 99;
      return leftOrder - rightOrder || left.name.localeCompare(right.name);
    });
}

export function formatReferenceList(references: WorkspacePackageReference[] | undefined): string {
  if (!references || references.length === 0) {
    return "none";
  }

  return references.map(formatWorkspacePackageReference).join(", ");
}
