import path from "node:path";
import fs from "fs-extra";
import type { EntrypointRole, RepoAnalysis } from "../../schemas/analysis.js";

const CONVENTIONAL_ENTRYPOINTS = [
  "src/main.ts",
  "src/main.tsx",
  "src/main.js",
  "src/main.jsx",
  "src/index.ts",
  "src/index.tsx",
  "src/index.js",
  "src/index.jsx",
  "src/cli/index.ts",
  "src/cli/index.tsx",
  "src/cli/index.js",
  "src/cli/index.jsx",
  "src/cli/main.ts",
  "src/cli/main.tsx",
  "src/cli/main.js",
  "src/cli/main.jsx",
  "src/server.ts",
  "src/server.js",
  "server.ts",
  "server.js",
  "index.ts",
  "index.js"
] as const;

type PackageJsonWithEntrypoints = {
  main?: unknown;
  module?: unknown;
  browser?: unknown;
  bin?: unknown;
};

export async function detectEntrypoints(
  rootDir: string,
  analysis: RepoAnalysis,
  preloadedPackageJson?: Record<string, unknown>,
  sourceFiles?: string[]
): Promise<void> {
  const found = new Set<string>();

  let packageJson: PackageJsonWithEntrypoints | undefined;

  if (preloadedPackageJson) {
    packageJson = preloadedPackageJson;
  } else {
    const packageJsonPath = path.join(rootDir, "package.json");
    const hasPackageJson = await fs.pathExists(packageJsonPath);

    if (hasPackageJson) {
      packageJson = (await fs.readJson(packageJsonPath)) as PackageJsonWithEntrypoints;
    }
  }

  if (packageJson) {
    registerPackageEntrypoint(found, analysis, packageJson.main, "main");
    registerPackageEntrypoint(found, analysis, packageJson.module, "module");
    registerPackageEntrypoint(found, analysis, packageJson.browser, "browser");

    if (typeof packageJson.bin === "string") {
      registerEntrypoint(
        found,
        analysis,
        normalizePath(packageJson.bin),
        "package.json",
        "high",
        "bin"
      );
    } else if (packageJson.bin != null && typeof packageJson.bin === "object") {
      for (const value of Object.values(packageJson.bin)) {
        if (typeof value !== "string") {
          continue;
        }

        registerEntrypoint(found, analysis, normalizePath(value), "package.json", "high", "bin");
      }
    }
  }

  if (sourceFiles) {
    const sourceFileSet = new Set(sourceFiles);

    for (const candidate of CONVENTIONAL_ENTRYPOINTS) {
      if (!sourceFileSet.has(candidate)) {
        continue;
      }

      registerEntrypoint(found, analysis, candidate, candidate, "medium");
    }
  } else {
    for (const candidate of CONVENTIONAL_ENTRYPOINTS) {
      const exists = await fs.pathExists(path.join(rootDir, candidate));

      if (!exists) {
        continue;
      }

      registerEntrypoint(found, analysis, candidate, candidate, "medium");
    }
  }
}

function registerPackageEntrypoint(
  found: Set<string>,
  analysis: RepoAnalysis,
  value: unknown,
  fieldName: string
): void {
  if (typeof value !== "string") {
    return;
  }

  registerEntrypoint(found, analysis, normalizePath(value), "package.json", "high", fieldName);
}

function registerEntrypoint(
  found: Set<string>,
  analysis: RepoAnalysis,
  entrypoint: string,
  sourceFile: string,
  confidence: "high" | "medium",
  reason?: string
): void {
  if (found.has(entrypoint)) {
    return;
  }

  found.add(entrypoint);
  analysis.detected.entrypoints.push(entrypoint);
  analysis.detected.entrypointFacts ??= [];
  analysis.detected.entrypointFacts.push({
    path: entrypoint,
    role: getEntrypointRole(entrypoint, sourceFile, reason),
    source: sourceFile,
    confidence,
    reason
  });
  analysis.evidence.push({
    claim: `entrypoint=${entrypoint}`,
    sourceFile,
    reason,
    confidence
  });
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").split(path.sep).join("/");
}

function getEntrypointRole(
  entrypoint: string,
  sourceFile: string,
  reason?: string
): EntrypointRole {
  const normalized = trimLeadingDotSlash(entrypoint);

  if (isGeneratedPath(normalized)) {
    return sourceFile === "package.json" ? "package-output" : "generated";
  }

  if (normalized === "src" || normalized.startsWith("src/")) {
    return "source";
  }

  if (reason === "bin") {
    return "cli";
  }

  return "other";
}

function trimLeadingDotSlash(filePath: string): string {
  return filePath.replace(/^\.\//, "");
}

function isGeneratedPath(filePath: string): boolean {
  return (
    filePath === "dist" ||
    filePath.startsWith("dist/") ||
    filePath === "build" ||
    filePath.startsWith("build/") ||
    filePath === "out" ||
    filePath.startsWith("out/") ||
    filePath === "coverage" ||
    filePath.startsWith("coverage/")
  );
}
