import path from "node:path";
import fs from "fs-extra";
import type {
  DirectoryCandidate,
  EntrypointCandidate,
  EvidenceRecord,
  RepoAnalysis,
  WorkspacePackage
} from "../../schemas/analysis.js";
import { detectConfigFiles } from "../detect/detectConfigFiles.js";
import { detectEntrypoints } from "../detect/detectEntrypoints.js";
import { detectEnvVars } from "../detect/detectEnvVars.js";
import { detectProjectType } from "../detect/detectProjectType.js";
import { detectScripts } from "../detect/detectScripts.js";
import { deriveDirectories } from "../facts/deriveFacts.js";

export async function analyzeWorkspacePackages(
  rootDir: string,
  analysis: RepoAnalysis,
  rootSourceFiles: string[]
): Promise<void> {
  const workspace = analysis.detected.workspace;

  if (!workspace?.packages || workspace.packages.length === 0) {
    return;
  }

  const analyzedPackages = await Promise.all(
    workspace.packages.map((workspacePackage) =>
      analyzeWorkspacePackage(
        rootDir,
        workspacePackage,
        analysis.detected.packageManager,
        rootSourceFiles
      )
    )
  );

  workspace.packages = analyzedPackages;

  for (const workspacePackage of analyzedPackages) {
    for (const evidence of workspacePackage.evidence ?? []) {
      analysis.evidence.push({
        ...evidence,
        claim: `workspacePackage[${workspacePackage.path}].${evidence.claim}`
      });
    }
  }
}

async function analyzeWorkspacePackage(
  rootDir: string,
  workspacePackage: WorkspacePackage,
  packageManager: string | undefined,
  rootSourceFiles: string[]
): Promise<WorkspacePackage> {
  const packageRoot = path.join(rootDir, ...workspacePackage.path.split("/"));
  const packageJson = await readPackageJson(
    path.join(rootDir, ...workspacePackage.packageJsonPath.split("/"))
  );
  const packageSourceFiles = getPackageSourceFiles(rootSourceFiles, workspacePackage.path);
  const packageAnalysis = createPackageAnalysis(packageRoot, workspacePackage, packageManager);

  await Promise.all([
    detectConfigFiles(packageRoot, packageAnalysis),
    detectProjectType(packageRoot, packageAnalysis, packageJson),
    detectScripts(packageRoot, packageAnalysis, packageJson),
    detectEntrypoints(packageRoot, packageAnalysis, packageJson, packageSourceFiles),
    detectEnvVars(packageRoot, packageAnalysis, packageSourceFiles)
  ]);

  const directories = deriveDirectories(packageAnalysis);

  return {
    ...workspacePackage,
    projectType: packageAnalysis.detected.projectType,
    scripts: packageAnalysis.detected.scripts,
    directories: directories.map((directory) => rebaseDirectory(directory, workspacePackage.path)),
    configFiles: packageAnalysis.detected.configFiles.map((configFile) => ({
      ...configFile,
      path: rebasePath(workspacePackage.path, configFile.path)
    })),
    entrypoints: packageAnalysis.detected.entrypoints.map((entrypoint) =>
      rebasePath(workspacePackage.path, entrypoint)
    ),
    entrypointFacts: (packageAnalysis.detected.entrypointFacts ?? []).map((entrypoint) =>
      rebaseEntrypoint(entrypoint, workspacePackage.path)
    ),
    envVars: packageAnalysis.detected.envVars.map((envVar) => ({
      ...envVar,
      sourceFile: rebasePath(workspacePackage.path, envVar.sourceFile)
    })),
    evidence: packageAnalysis.evidence.map((evidence) =>
      rebaseEvidence(evidence, workspacePackage.path)
    )
  };
}

function createPackageAnalysis(
  packageRoot: string,
  workspacePackage: WorkspacePackage,
  packageManager: string | undefined
): RepoAnalysis {
  return {
    repo: {
      input: workspacePackage.path,
      rootDir: packageRoot,
      name: workspacePackage.name ?? path.posix.basename(workspacePackage.path)
    },
    detected: {
      packageManager,
      scripts: [],
      commands: [],
      directories: [],
      configFiles: [],
      entrypoints: [],
      entrypointFacts: [],
      envVars: [],
      docs: [],
      demoSignals: [],
      auditFindings: []
    },
    evidence: []
  };
}

function getPackageSourceFiles(rootSourceFiles: string[], packagePath: string): string[] {
  const prefix = `${packagePath}/`;
  return rootSourceFiles
    .filter((sourceFile) => sourceFile.startsWith(prefix))
    .map((sourceFile) => sourceFile.slice(prefix.length));
}

function rebaseDirectory(directory: DirectoryCandidate, packagePath: string): DirectoryCandidate {
  return {
    ...directory,
    path: rebasePath(packagePath, directory.path),
    source: rebasePath(packagePath, directory.source)
  };
}

function rebaseEntrypoint(
  entrypoint: EntrypointCandidate,
  packagePath: string
): EntrypointCandidate {
  return {
    ...entrypoint,
    path: rebasePath(packagePath, entrypoint.path),
    source: rebasePath(packagePath, entrypoint.source)
  };
}

function rebaseEvidence(evidence: EvidenceRecord, packagePath: string): EvidenceRecord {
  return {
    ...evidence,
    sourceFile: rebasePath(packagePath, evidence.sourceFile)
  };
}

function rebasePath(packagePath: string, filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
  return path.posix.join(packagePath, normalized);
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
