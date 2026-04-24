import path from "node:path";
import fs from "fs-extra";
import type { ConfigFileType, RepoAnalysis } from "../../schemas/analysis.js";

const ROOT_CONFIG_FILES: Array<{
  fileName: string;
  type: ConfigFileType;
}> = [
  { fileName: "package.json", type: "package" },
  { fileName: "tsconfig.json", type: "typescript" },
  { fileName: "tsconfig.base.json", type: "typescript" },
  { fileName: "vite.config.js", type: "framework" },
  { fileName: "vite.config.mjs", type: "framework" },
  { fileName: "vite.config.cjs", type: "framework" },
  { fileName: "vite.config.ts", type: "framework" },
  { fileName: "next.config.js", type: "framework" },
  { fileName: "next.config.mjs", type: "framework" },
  { fileName: "next.config.cjs", type: "framework" },
  { fileName: "next.config.ts", type: "framework" },
  { fileName: "eslint.config.js", type: "lint" },
  { fileName: "eslint.config.mjs", type: "lint" },
  { fileName: "eslint.config.cjs", type: "lint" },
  { fileName: ".eslintrc", type: "lint" },
  { fileName: ".eslintrc.json", type: "lint" },
  { fileName: ".prettierrc", type: "format" },
  { fileName: ".prettierrc.json", type: "format" },
  { fileName: "prettier.config.js", type: "format" },
  { fileName: "vitest.config.ts", type: "test" },
  { fileName: "vitest.config.js", type: "test" },
  { fileName: "jest.config.js", type: "test" },
  { fileName: "jest.config.ts", type: "test" },
  { fileName: "turbo.json", type: "workspace" },
  { fileName: "nx.json", type: "workspace" },
  { fileName: "pnpm-workspace.yaml", type: "workspace" },
  { fileName: "Dockerfile", type: "container" },
  { fileName: ".env.example", type: "environment" },
  { fileName: ".env.local.example", type: "environment" }
];

export async function detectConfigFiles(
  rootDir: string,
  analysis: RepoAnalysis
): Promise<void> {
  const found = new Map<string, ConfigFileType>();

  for (const configFile of ROOT_CONFIG_FILES) {
    if (await fs.pathExists(path.join(rootDir, configFile.fileName))) {
      found.set(configFile.fileName, configFile.type);
    }
  }

  const workflowDir = path.join(rootDir, ".github", "workflows");

  if (await fs.pathExists(workflowDir)) {
    const workflows = await fs.readdir(workflowDir, { withFileTypes: true });

    for (const workflow of workflows) {
      if (!workflow.isFile() || !/\.(ya?ml)$/i.test(workflow.name)) {
        continue;
      }

      found.set(path.posix.join(".github/workflows", workflow.name), "ci");
    }
  }

  analysis.detected.configFiles = [...found.entries()]
    .map(([filePath, type]) => ({
      path: filePath,
      type,
      confidence: "high" as const
    }))
    .sort((left, right) => left.path.localeCompare(right.path));

  for (const configFile of analysis.detected.configFiles) {
    analysis.evidence.push({
      claim: `configFile:${configFile.path}`,
      sourceFile: configFile.path,
      reason: `Detected ${configFile.type} configuration file`,
      confidence: configFile.confidence
    });
  }
}
