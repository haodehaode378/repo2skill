import path from "node:path";
import fs from "fs-extra";
import type { RepoAnalysis } from "../../schemas/analysis.js";

const PACKAGE_MANAGER_LOCKFILES = [
  ["pnpm-lock.yaml", "pnpm"],
  ["package-lock.json", "npm"],
  ["yarn.lock", "yarn"],
  ["bun.lockb", "bun"]
] as const;

export async function detectPackageManager(
  rootDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  for (const [lockfile, packageManager] of PACKAGE_MANAGER_LOCKFILES) {
    const lockfilePath = path.join(rootDir, lockfile);
    const exists = await fs.pathExists(lockfilePath);

    if (!exists) {
      continue;
    }

    analysis.detected.packageManager = packageManager;
    analysis.evidence.push({
      claim: `packageManager=${packageManager}`,
      sourceFile: lockfile,
      confidence: "high"
    });

    return;
  }
}
