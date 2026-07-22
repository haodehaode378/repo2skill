import path from "node:path";
import fs from "fs-extra";
import { glob } from "tinyglobby";
import { parse as parseYaml } from "yaml";
import type { RepoAnalysis, WorkspacePackage } from "../../schemas/analysis.js";

type PackageJsonWithWorkspaces = {
  workspaces?: unknown;
};

const TOOLING_SIGNAL_FILES = ["turbo.json", "nx.json"] as const;
const CONVENTIONAL_WORKSPACE_DIRS = ["apps", "packages"] as const;
const IGNORED_WORKSPACE_PATHS = [
  "**/.git/**",
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/out/**",
  "**/repo2skill-cache/**",
  "**/benchmark-out/**",
  "**/benchmark-smoke-out/**",
  "**/evaluation-out/**"
] as const;

export async function detectWorkspace(
  rootDir: string,
  analysis: RepoAnalysis,
  preloadedPackageJson?: Record<string, unknown>
): Promise<void> {
  const packageGlobs = new Set<string>();
  const signals = new Set<string>();

  await detectPnpmWorkspace(rootDir, packageGlobs, signals);
  await detectPackageJsonWorkspaces(rootDir, packageGlobs, signals, preloadedPackageJson);
  await detectToolingSignals(rootDir, signals);
  await detectConventionalWorkspaceDirs(rootDir, packageGlobs, signals);

  if (signals.size === 0 && packageGlobs.size === 0) {
    return;
  }

  const hasExplicitWorkspaceConfig =
    signals.has("pnpm-workspace.yaml") || signals.has("package.json workspaces");
  const confidence = hasExplicitWorkspaceConfig ? "high" : "medium";
  const sortedSignals = [...signals].sort();
  const sortedGlobs = [...packageGlobs].sort();
  const packageSource = signals.has("pnpm-workspace.yaml")
    ? "pnpm-workspace.yaml"
    : signals.has("package.json workspaces")
      ? "package.json workspaces"
      : sortedSignals[0];
  const packages = await discoverWorkspacePackages(rootDir, sortedGlobs, packageSource, confidence);

  analysis.detected.workspace = {
    isWorkspace: true,
    packageGlobs: sortedGlobs,
    signals: sortedSignals,
    packages,
    confidence
  };

  analysis.evidence.push({
    claim: "workspace=true",
    sourceFile: analysis.detected.workspace.signals[0],
    reason: `Detected workspace signals: ${analysis.detected.workspace.signals.join(", ")}`,
    confidence: analysis.detected.workspace.confidence
  });

  for (const workspacePackage of packages) {
    analysis.evidence.push({
      claim: `workspacePackage=${workspacePackage.name ?? workspacePackage.path}`,
      sourceFile: workspacePackage.packageJsonPath,
      reason: `Matched workspace configuration from ${workspacePackage.source}`,
      confidence: workspacePackage.confidence
    });
  }
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
    registerWorkspaceGlob(packageGlobs, workspaceGlob);
  }
}

function parsePnpmWorkspaceGlobs(content: string): string[] {
  try {
    const document = parseYaml(content) as { packages?: unknown } | null;
    return Array.isArray(document?.packages)
      ? document.packages.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

async function detectPackageJsonWorkspaces(
  rootDir: string,
  packageGlobs: Set<string>,
  signals: Set<string>,
  preloadedPackageJson?: Record<string, unknown>
): Promise<void> {
  let packageJson: PackageJsonWithWorkspaces;

  if (preloadedPackageJson) {
    packageJson = preloadedPackageJson;
  } else {
    const packageJsonPath = path.join(rootDir, "package.json");

    if (!(await fs.pathExists(packageJsonPath))) {
      return;
    }

    packageJson = (await fs.readJson(packageJsonPath)) as PackageJsonWithWorkspaces;
  }
  const workspaces = packageJson.workspaces;
  const detectedGlobs = parsePackageJsonWorkspaces(workspaces);

  if (detectedGlobs.length === 0) {
    return;
  }

  signals.add("package.json workspaces");

  for (const workspaceGlob of detectedGlobs) {
    registerWorkspaceGlob(packageGlobs, workspaceGlob);
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
    registerWorkspaceGlob(packageGlobs, `${directoryName}/*`);
  }
}

function registerWorkspaceGlob(packageGlobs: Set<string>, workspaceGlob: string): void {
  const normalized = normalizeWorkspaceGlob(workspaceGlob);

  if (normalized) {
    packageGlobs.add(normalized);
  }
}

function normalizeWorkspaceGlob(workspaceGlob: string): string | undefined {
  const trimmed = workspaceGlob.trim();

  if (!trimmed) {
    return undefined;
  }

  const negated = trimmed.startsWith("!");
  const body = (negated ? trimmed.slice(1) : trimmed)
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "");

  if (
    !body ||
    path.posix.isAbsolute(body) ||
    /^[A-Za-z]:\//.test(body) ||
    body.split("/").includes("..")
  ) {
    return undefined;
  }

  return negated ? `!${body}` : body;
}

async function discoverWorkspacePackages(
  rootDir: string,
  packageGlobs: string[],
  source: string,
  confidence: "high" | "medium"
): Promise<WorkspacePackage[]> {
  if (packageGlobs.length === 0) {
    return [];
  }

  const packageJsonPatterns = packageGlobs.map((workspaceGlob) => {
    const negated = workspaceGlob.startsWith("!");
    const body = negated ? workspaceGlob.slice(1) : workspaceGlob;
    return `${negated ? "!" : ""}${body}/package.json`;
  });
  const packageJsonPaths = await glob(packageJsonPatterns, {
    cwd: rootDir,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: IGNORED_WORKSPACE_PATHS
  });
  const packages = await Promise.all(
    packageJsonPaths
      .map(normalizeRepositoryPath)
      .filter((packageJsonPath) => packageJsonPath !== "package.json")
      .sort()
      .map(async (packageJsonPath) => {
        const packagePath = path.posix.dirname(packageJsonPath);
        const packageJson = await readPackageJson(
          path.join(rootDir, ...packageJsonPath.split("/"))
        );

        return {
          path: packagePath,
          packageJsonPath,
          name: typeof packageJson?.name === "string" ? packageJson.name : undefined,
          version: typeof packageJson?.version === "string" ? packageJson.version : undefined,
          private: typeof packageJson?.private === "boolean" ? packageJson.private : undefined,
          source,
          confidence
        } satisfies WorkspacePackage;
      })
  );

  return packages;
}

async function readPackageJson(
  packageJsonPath: string
): Promise<Record<string, unknown> | undefined> {
  try {
    return (await fs.readJson(packageJsonPath)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function normalizeRepositoryPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").split(path.sep).join("/");
}
