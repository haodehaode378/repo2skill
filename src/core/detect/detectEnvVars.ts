import path from "node:path";
import fs from "fs-extra";
import type { ConfidenceLevel, EnvVar, RepoAnalysis } from "../../schemas/analysis.js";

const ENV_EXAMPLE_FILES = [".env.example", ".env.local.example"] as const;
const IGNORED_DIRECTORIES = new Set([".git", "coverage", "dist", "node_modules"]);

const ENV_FILE_PATTERN = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;
const PROCESS_ENV_DOT_PATTERN = /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g;
const PROCESS_ENV_BRACKET_PATTERN =
  /process\.env\[(["'])([A-Za-z_][A-Za-z0-9_]*)\1\]/g;

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  low: 0,
  medium: 1,
  high: 2
};

export async function detectEnvVars(
  rootDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const found = new Map<string, EnvVar>();

  for (const envFileName of ENV_EXAMPLE_FILES) {
    const envFilePath = path.join(rootDir, envFileName);
    const exists = await fs.pathExists(envFilePath);

    if (!exists) {
      continue;
    }

    const fileContent = await fs.readFile(envFilePath, "utf8");
    const filePath = toRelativePath(rootDir, envFilePath);

    for (const line of fileContent.split(/\r?\n/)) {
      const match = line.match(ENV_FILE_PATTERN);

      if (!match) {
        continue;
      }

      registerEnvVar(found, {
        name: match[1],
        sourceFile: filePath,
        confidence: "high"
      });
    }
  }

  const sourceFiles = await listSourceFiles(rootDir);

  for (const sourceFile of sourceFiles) {
    const content = await fs.readFile(sourceFile, "utf8");
    const relativePath = toRelativePath(rootDir, sourceFile);

    for (const match of content.matchAll(PROCESS_ENV_DOT_PATTERN)) {
      registerEnvVar(found, {
        name: match[1],
        sourceFile: relativePath,
        confidence: "medium"
      });
    }

    for (const match of content.matchAll(PROCESS_ENV_BRACKET_PATTERN)) {
      registerEnvVar(found, {
        name: match[2],
        sourceFile: relativePath,
        confidence: "medium"
      });
    }
  }

  analysis.detected.envVars = Array.from(found.values());

  for (const envVar of analysis.detected.envVars) {
    analysis.evidence.push({
      claim: `envVar:${envVar.name}`,
      sourceFile: envVar.sourceFile,
      confidence: envVar.confidence
    });
  }
}

function registerEnvVar(found: Map<string, EnvVar>, candidate: EnvVar): void {
  const existing = found.get(candidate.name);

  if (!existing) {
    found.set(candidate.name, candidate);
    return;
  }

  if (CONFIDENCE_RANK[candidate.confidence] > CONFIDENCE_RANK[existing.confidence]) {
    found.set(candidate.name, candidate);
  }
}

async function listSourceFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];
  await walkDirectory(rootDir, files);
  return files.sort();
}

async function walkDirectory(currentDir: string, files: string[]): Promise<void> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, files);
      continue;
    }

    files.push(fullPath);
  }
}

function toRelativePath(rootDir: string, filePath: string): string {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}
