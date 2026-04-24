import path from "node:path";
import type {
  CommandCandidate,
  CommandRole,
  DirectoryCandidate,
  DirectoryRole,
  RepoAnalysis
} from "../../schemas/analysis.js";
import { renderPackageScriptCommand } from "../commands/packageScripts.js";
import { getEntrypointFacts, isGeneratedEntrypointRole } from "../entrypoints/facts.js";

const KNOWN_COMMAND_ROLES = new Set<CommandRole>([
  "dev",
  "build",
  "test",
  "lint",
  "typecheck",
  "format"
]);

export function deriveFacts(analysis: RepoAnalysis): void {
  analysis.detected.commands = deriveCommands(analysis);
  analysis.detected.directories = deriveDirectories(analysis);
}

export function deriveCommands(analysis: RepoAnalysis): CommandCandidate[] {
  return analysis.detected.scripts.map((script) => ({
    name: script.name,
    role: getCommandRole(script.name),
    command: renderPackageScriptCommand(script, analysis.detected.packageManager),
    rawScript: script.command,
    source: "package.json",
    confidence: script.confidence
  }));
}

export function deriveDirectories(analysis: RepoAnalysis): DirectoryCandidate[] {
  const directories = new Map<string, DirectoryCandidate>();
  const entrypointFacts = getEntrypointFacts(analysis);

  for (const entrypoint of entrypointFacts) {
    if (isGeneratedEntrypointRole(entrypoint.role)) {
      continue;
    }

    const directoryPath = path.posix.dirname(entrypoint.path);

    if (directoryPath === ".") {
      continue;
    }

    registerDirectory(directories, {
      path: directoryPath,
      role: getDirectoryRole(directoryPath),
      source: entrypoint.path,
      confidence: entrypoint.confidence
    });
  }

  if (analysis.detected.workspace) {
    for (const packageGlob of analysis.detected.workspace.packageGlobs) {
      const directoryPath = packageGlob.replace(/\/\*+$/, "");

      if (!directoryPath || directoryPath === packageGlob) {
        continue;
      }

      registerDirectory(directories, {
        path: directoryPath,
        role: "workspace",
        source: packageGlob,
        confidence: analysis.detected.workspace.confidence
      });
    }
  }

  return [...directories.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function getCommandRole(name: string): CommandRole {
  return KNOWN_COMMAND_ROLES.has(name as CommandRole) ? (name as CommandRole) : "other";
}

function getDirectoryRole(directoryPath: string): DirectoryRole {
  if (directoryPath === "src" || directoryPath.startsWith("src/")) {
    return "source";
  }

  if (directoryPath === "scripts" || directoryPath.startsWith("scripts/")) {
    return "scripts";
  }

  return "other";
}

function registerDirectory(
  directories: Map<string, DirectoryCandidate>,
  candidate: DirectoryCandidate
): void {
  if (directories.has(candidate.path)) {
    return;
  }

  directories.set(candidate.path, candidate);
}
