import path from "node:path";
import fs from "fs-extra";
import type { RepoAnalysis, ScriptCommand } from "../../schemas/analysis.js";

const CANONICAL_SCRIPT_NAMES = [
  "dev",
  "build",
  "test",
  "lint",
  "typecheck",
  "format"
] as const;

type PackageJsonWithScripts = {
  scripts?: Record<string, unknown>;
};

export async function detectScripts(
  rootDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const packageJsonPath = path.join(rootDir, "package.json");
  const exists = await fs.pathExists(packageJsonPath);

  if (!exists) {
    return;
  }

  const packageJson = (await fs.readJson(packageJsonPath)) as PackageJsonWithScripts;
  const nextScripts: ScriptCommand[] = [];

  for (const scriptName of CANONICAL_SCRIPT_NAMES) {
    const command = packageJson.scripts?.[scriptName];

    if (typeof command !== "string") {
      continue;
    }

    nextScripts.push({
      name: scriptName,
      command,
      confidence: "high"
    });

    analysis.evidence.push({
      claim: `script:${scriptName}=${command}`,
      sourceFile: "package.json",
      confidence: "high"
    });
  }

  analysis.detected.scripts = nextScripts;
}
