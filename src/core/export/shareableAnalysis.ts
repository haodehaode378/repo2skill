import path from "node:path";
import type { RepoAnalysis } from "../../schemas/analysis.js";

export function createShareableAnalysis(analysis: RepoAnalysis): RepoAnalysis {
  const displayRootDir = getDisplayRootDir(analysis.repo.rootDir, analysis.repo.name);

  return {
    ...analysis,
    repo: {
      ...analysis.repo,
      input: getDisplayInput(analysis.repo.input, displayRootDir),
      rootDir: displayRootDir
    }
  };
}

function getDisplayInput(input: string, displayRootDir: string): string {
  if (/^https?:\/\//.test(input)) {
    return input;
  }

  return displayRootDir;
}

function getDisplayRootDir(rootDir: string, repoName: string): string {
  const relativeRoot = path.relative(process.cwd(), rootDir);

  if (relativeRoot && !relativeRoot.startsWith("..") && !path.isAbsolute(relativeRoot)) {
    return `./${relativeRoot.split(path.sep).join("/")}`;
  }

  return repoName;
}
