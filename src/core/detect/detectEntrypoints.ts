import path from "node:path";
import fs from "fs-extra";
import type { RepoAnalysis } from "../../schemas/analysis.js";

const CONVENTIONAL_ENTRYPOINTS = [
  "src/main.ts",
  "src/main.tsx",
  "src/main.js",
  "src/main.jsx",
  "src/index.ts",
  "src/index.tsx",
  "src/index.js",
  "src/index.jsx",
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
  analysis: RepoAnalysis
): Promise<void> {
  const found = new Set<string>();
  const packageJsonPath = path.join(rootDir, "package.json");
  const hasPackageJson = await fs.pathExists(packageJsonPath);

  if (hasPackageJson) {
    const packageJson = (await fs.readJson(packageJsonPath)) as PackageJsonWithEntrypoints;

    registerPackageEntrypoint(found, analysis, packageJson.main, "main");
    registerPackageEntrypoint(found, analysis, packageJson.module, "module");
    registerPackageEntrypoint(found, analysis, packageJson.browser, "browser");

    if (typeof packageJson.bin === "string") {
      registerEntrypoint(found, analysis, normalizePath(packageJson.bin), "package.json", "high");
    } else if (packageJson.bin != null && typeof packageJson.bin === "object") {
      for (const value of Object.values(packageJson.bin)) {
        if (typeof value !== "string") {
          continue;
        }

        registerEntrypoint(found, analysis, normalizePath(value), "package.json", "high");
      }
    }
  }

  for (const candidate of CONVENTIONAL_ENTRYPOINTS) {
    const exists = await fs.pathExists(path.join(rootDir, candidate));

    if (!exists) {
      continue;
    }

    registerEntrypoint(found, analysis, candidate, candidate, "medium");
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
  analysis.evidence.push({
    claim: `entrypoint=${entrypoint}`,
    sourceFile,
    reason,
    confidence
  });
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
