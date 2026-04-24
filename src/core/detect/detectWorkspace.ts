import path from "node:path";
import fs from "fs-extra";
import type { RepoAnalysis } from "../../schemas/analysis.js";

type PackageJsonWithWorkspaces = {
  workspaces?: unknown;
};

const TOOLING_SIGNAL_FILES = ["turbo.json", "nx.json"] as const;
const CONVENTIONAL_WORKSPACE_DIRS = ["apps", "packages"] as const;

export async function detectWorkspace(
  rootDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const packageGlobs = new Set<string>();
  const signals = new Set<string>();

  await detectPnpmWorkspace(rootDir, packageGlobs, signals);
  await detectPackageJsonWorkspaces(rootDir, packageGlobs, signals);
  await detectToolingSignals(rootDir, signals);
  await detectConventionalWorkspaceDirs(rootDir, packageGlobs, signals);

  if (signals.size === 0 && packageGlobs.size === 0) {
    return;
  }

  const hasExplicitWorkspaceConfig =
    signals.has("pnpm-workspace.yaml") || signals.has("package.json workspaces");

  analysis.detected.workspace = {
    isWorkspace: true,
    packageGlobs: [...packageGlobs].sort(),
    signals: [...signals].sort(),
    confidence: hasExplicitWorkspaceConfig ? "high" : "medium"
  };

  analysis.evidence.push({
    claim: "workspace=true",
    sourceFile: analysis.detected.workspace.signals[0],
    reason: `Detected workspace signals: ${analysis.detected.workspace.signals.join(", ")}`,
    confidence: analysis.detected.workspace.confidence
  });
}

async function detectPnpmWorkspace(
  rootDir: string,
  packageGlobs: Set<string>,
  signals: Set<string>
): Promise<void> {
  const workspacePath = path.join(rootDir, "pnpm-workspace.yaml");

  if (!(await fs.pathExists(workspacePath))) {
    return;
  }

  signals.add("pnpm-workspace.yaml");

  const content = await fs.readFile(workspacePath, "utf8");

  for (const workspaceGlob of parsePnpmWorkspaceGlobs(content)) {
    packageGlobs.add(workspaceGlob);
  }
}

function parsePnpmWorkspaceGlobs(content: string): string[] {
  const globs: string[] = [];
  let inPackagesBlock = false;

  for (const line of content.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inPackagesBlock = true;
      continue;
    }

    if (inPackagesBlock && /^\S/.test(line)) {
      inPackagesBlock = false;
    }

    if (!inPackagesBlock) {
      continue;
    }

    const match = line.match(/^\s*-\s*['"]?([^'"\s#]+)['"]?/);

    if (match) {
      globs.push(match[1]);
    }
  }

  return globs;
}

async function detectPackageJsonWorkspaces(
  rootDir: string,
  packageGlobs: Set<string>,
  signals: Set<string>
): Promise<void> {
  const packageJsonPath = path.join(rootDir, "package.json");

  if (!(await fs.pathExists(packageJsonPath))) {
    return;
  }

  const packageJson = (await fs.readJson(packageJsonPath)) as PackageJsonWithWorkspaces;
  const workspaces = packageJson.workspaces;
  const detectedGlobs = parsePackageJsonWorkspaces(workspaces);

  if (detectedGlobs.length === 0) {
    return;
  }

  signals.add("package.json workspaces");

  for (const workspaceGlob of detectedGlobs) {
    packageGlobs.add(workspaceGlob);
  }
}

function parsePackageJsonWorkspaces(workspaces: unknown): string[] {
  if (Array.isArray(workspaces)) {
    return workspaces.filter((workspace): workspace is string => typeof workspace === "string");
  }

  if (
    workspaces != null &&
    typeof workspaces === "object" &&
    "packages" in workspaces &&
    Array.isArray(workspaces.packages)
  ) {
    return workspaces.packages.filter(
      (workspace): workspace is string => typeof workspace === "string"
    );
  }

  return [];
}

async function detectToolingSignals(rootDir: string, signals: Set<string>): Promise<void> {
  for (const signalFile of TOOLING_SIGNAL_FILES) {
    if (await fs.pathExists(path.join(rootDir, signalFile))) {
      signals.add(signalFile);
    }
  }
}

async function detectConventionalWorkspaceDirs(
  rootDir: string,
  packageGlobs: Set<string>,
  signals: Set<string>
): Promise<void> {
  for (const directoryName of CONVENTIONAL_WORKSPACE_DIRS) {
    const directoryPath = path.join(rootDir, directoryName);

    if (!(await fs.pathExists(directoryPath))) {
      continue;
    }

    const stats = await fs.stat(directoryPath);

    if (!stats.isDirectory()) {
      continue;
    }

    signals.add(`${directoryName}/`);
    packageGlobs.add(`${directoryName}/*`);
  }
}
