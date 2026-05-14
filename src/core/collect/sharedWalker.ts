import path from "node:path";
import fs from "fs-extra";

export const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "__fixtures__",
  "__tests__",
  "build",
  "coverage",
  "dist",
  "docs",
  "e2e",
  "examples",
  "fixtures",
  "node_modules",
  "out",
  "test",
  "tests",
  "vendor"
]);

export interface WalkOptions {
  ignoredDirectories?: Set<string>;
  fileExtensions?: Set<string>;
  skipSymlinks?: boolean;
}

export async function walkDirectory(rootDir: string, options: WalkOptions = {}): Promise<string[]> {
  const files: string[] = [];
  const ignored = options.ignoredDirectories ?? IGNORED_DIRECTORIES;
  await walkRecursive(rootDir, "", files, ignored, options);
  return files.sort();
}

async function walkRecursive(
  rootDir: string,
  relativeDir: string,
  files: string[],
  ignored: Set<string>,
  options: WalkOptions
): Promise<void> {
  const absoluteDir = path.join(rootDir, relativeDir);
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });

  for (const entry of entries) {
    if (ignored.has(entry.name)) {
      continue;
    }

    if (options.skipSymlinks && entry.isSymbolicLink()) {
      continue;
    }

    const relativePath = path.posix.join(relativeDir.split(path.sep).join("/"), entry.name);

    if (entry.isDirectory()) {
      await walkRecursive(rootDir, relativePath, files, ignored, options);
      continue;
    }

    if (entry.isFile()) {
      if (options.fileExtensions && !options.fileExtensions.has(path.extname(entry.name))) {
        continue;
      }

      files.push(relativePath);
    }
  }
}
