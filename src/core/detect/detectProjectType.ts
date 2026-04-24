import path from "node:path";
import fs from "fs-extra";
import type { RepoAnalysis } from "../../schemas/analysis.js";

const PROJECT_TYPE_SIGNALS = [
  {
    files: ["next.config.js", "next.config.mjs", "next.config.cjs", "next.config.ts"],
    projectType: "nextjs",
    sourceFile: "next.config.*"
  },
  {
    files: ["vite.config.js", "vite.config.mjs", "vite.config.cjs", "vite.config.ts"],
    projectType: "vite",
    sourceFile: "vite.config.*"
  }
] as const;

type PackageJsonWithBin = {
  bin?: string | Record<string, unknown>;
};

export async function detectProjectType(
  rootDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  for (const signal of PROJECT_TYPE_SIGNALS) {
    for (const fileName of signal.files) {
      const exists = await fs.pathExists(path.join(rootDir, fileName));

      if (!exists) {
        continue;
      }

      analysis.detected.projectType = signal.projectType;
      analysis.evidence.push({
        claim: `projectType=${signal.projectType}`,
        sourceFile: fileName,
        confidence: "high"
      });

      return;
    }
  }

  const packageJsonPath = path.join(rootDir, "package.json");
  const exists = await fs.pathExists(packageJsonPath);

  if (!exists) {
    return;
  }

  const packageJson = (await fs.readJson(packageJsonPath)) as PackageJsonWithBin;
  const hasBin =
    typeof packageJson.bin === "string" ||
    (packageJson.bin != null &&
      typeof packageJson.bin === "object" &&
      Object.values(packageJson.bin).some((value) => typeof value === "string"));

  if (!hasBin) {
    return;
  }

  analysis.detected.projectType = "cli";
  analysis.evidence.push({
    claim: "projectType=cli",
    sourceFile: "package.json",
    confidence: "high"
  });
}
