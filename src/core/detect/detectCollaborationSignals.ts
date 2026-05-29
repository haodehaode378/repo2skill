import path from "node:path";
import fs from "fs-extra";
import type {
  DemoSignal,
  DocumentationFile,
  DocumentationFileType,
  PackageMetadata,
  RepoAnalysis
} from "../../schemas/analysis.js";

const ROOT_DOCUMENTATION_FILES: Array<{
  fileName: string;
  type: DocumentationFileType;
}> = [
  { fileName: "README.md", type: "readme" },
  { fileName: "README.mdx", type: "readme" },
  { fileName: "LICENSE", type: "license" },
  { fileName: "LICENSE.md", type: "license" },
  { fileName: "CHANGELOG.md", type: "changelog" },
  { fileName: "RELEASES.md", type: "changelog" },
  { fileName: "CONTRIBUTING.md", type: "contributing" },
  { fileName: "CODE_OF_CONDUCT.md", type: "code-of-conduct" }
];

const DOCUMENTATION_DIRECTORIES: Array<{
  directory: string;
  type: DocumentationFileType;
}> = [
  { directory: "docs", type: "docs" },
  { directory: "examples", type: "examples" }
];

const ROUTE_DIRECTORIES = ["app", "pages", "routes", "src/app", "src/pages", "src/routes"];
const ASSET_DIRECTORIES = ["public", "static", "assets", "src/assets"];
const EXAMPLE_DIRECTORIES = ["examples", "demo", "demos"];

type PackageJsonForMetadata = {
  name?: unknown;
  version?: unknown;
  private?: unknown;
  repository?: unknown;
  bugs?: unknown;
  homepage?: unknown;
  bin?: unknown;
  publishConfig?: unknown;
};

export async function detectCollaborationSignals(
  rootDir: string,
  analysis: RepoAnalysis,
  preloadedPackageJson?: Record<string, unknown>
): Promise<void> {
  analysis.detected.docs = await detectDocumentation(rootDir);
  analysis.detected.demoSignals = await detectDemoSignals(rootDir);

  const packageMetadata = await detectPackageMetadata(rootDir, preloadedPackageJson);

  if (packageMetadata) {
    analysis.detected.packageMetadata = packageMetadata;
  }

  for (const doc of analysis.detected.docs) {
    analysis.evidence.push({
      claim: `doc:${doc.type}`,
      sourceFile: doc.path,
      reason: `Detected ${doc.type} documentation signal`,
      confidence: doc.confidence
    });
  }

  for (const signal of analysis.detected.demoSignals) {
    analysis.evidence.push({
      claim: `demo:${signal.type}`,
      sourceFile: signal.path,
      reason: `Detected ${signal.type} signal from ${signal.source}`,
      confidence: signal.confidence
    });
  }

  if (packageMetadata) {
    analysis.evidence.push({
      claim: "packageMetadata",
      sourceFile: packageMetadata.path,
      reason: "Detected package metadata for release and report profiles",
      confidence: packageMetadata.confidence
    });
  }
}

async function detectDocumentation(rootDir: string): Promise<DocumentationFile[]> {
  const found = new Map<string, DocumentationFile>();

  const fileChecks = await Promise.all(
    ROOT_DOCUMENTATION_FILES.map(async (candidate) => ({
      ...candidate,
      exists: await fs.pathExists(path.join(rootDir, candidate.fileName))
    }))
  );

  for (const candidate of fileChecks) {
    if (!candidate.exists || hasDocumentationType(found, candidate.type)) {
      continue;
    }

    found.set(candidate.fileName, {
      path: candidate.fileName,
      type: candidate.type,
      confidence: "high"
    });
  }

  const directoryChecks = await Promise.all(
    DOCUMENTATION_DIRECTORIES.map(async (candidate) => ({
      ...candidate,
      exists: await fs.pathExists(path.join(rootDir, candidate.directory))
    }))
  );

  for (const candidate of directoryChecks) {
    if (!candidate.exists) {
      continue;
    }

    found.set(candidate.directory, {
      path: candidate.directory,
      type: candidate.type,
      confidence: "medium"
    });
  }

  return [...found.values()].sort((left, right) => left.path.localeCompare(right.path));
}

async function detectPackageMetadata(
  rootDir: string,
  preloadedPackageJson?: Record<string, unknown>
): Promise<PackageMetadata | undefined> {
  const packageJsonPath = path.join(rootDir, "package.json");
  const exists = await fs.pathExists(packageJsonPath);

  if (!exists && !preloadedPackageJson) {
    return undefined;
  }

  const packageJson = (preloadedPackageJson ??
    ((await fs.readJson(packageJsonPath)) as Record<string, unknown>)) as PackageJsonForMetadata;

  return {
    path: "package.json",
    name: typeof packageJson.name === "string" ? packageJson.name : undefined,
    version: typeof packageJson.version === "string" ? packageJson.version : undefined,
    private: typeof packageJson.private === "boolean" ? packageJson.private : undefined,
    hasRepository: packageJson.repository != null,
    hasBugs: packageJson.bugs != null,
    hasHomepage: typeof packageJson.homepage === "string",
    hasBin:
      typeof packageJson.bin === "string" ||
      (packageJson.bin != null &&
        typeof packageJson.bin === "object" &&
        Object.values(packageJson.bin).some((value) => typeof value === "string")),
    hasPublishConfig: packageJson.publishConfig != null,
    confidence: "high"
  };
}

async function detectDemoSignals(rootDir: string): Promise<DemoSignal[]> {
  const signals: DemoSignal[] = [];

  await addDirectorySignals(rootDir, signals, ROUTE_DIRECTORIES, "route", "route convention");
  await addDirectorySignals(rootDir, signals, ASSET_DIRECTORIES, "asset", "asset convention");
  await addDirectorySignals(rootDir, signals, EXAMPLE_DIRECTORIES, "example", "example convention");

  return signals.sort((left, right) => left.path.localeCompare(right.path));
}

async function addDirectorySignals(
  rootDir: string,
  signals: DemoSignal[],
  directories: string[],
  type: DemoSignal["type"],
  source: string
): Promise<void> {
  const checks = await Promise.all(
    directories.map(async (directory) => ({
      directory,
      exists: await fs.pathExists(path.join(rootDir, directory))
    }))
  );

  for (const check of checks) {
    if (!check.exists) {
      continue;
    }

    signals.push({
      path: check.directory,
      type,
      source,
      confidence: "medium"
    });
  }
}

function hasDocumentationType(
  docs: Map<string, DocumentationFile>,
  type: DocumentationFileType
): boolean {
  return [...docs.values()].some((doc) => doc.type === type);
}
