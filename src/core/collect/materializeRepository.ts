import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs-extra";
import type { ResolvedInput } from "./resolveInput.js";

const execFile = promisify(execFileCallback);

export type MaterializedRepository = {
  rootDir: string;
  cleanup: () => Promise<void>;
};

type CommandRunner = (command: string, args: string[]) => Promise<void>;

type MaterializeRepositoryOptions = {
  baseTempDir?: string;
  cacheDir?: string;
  branch?: string;
  refresh?: boolean;
  noCache?: boolean;
  runCommand?: CommandRunner;
};

export async function materializeRepository(
  input: ResolvedInput,
  options: MaterializeRepositoryOptions = {}
): Promise<MaterializedRepository> {
  if (input.type === "local") {
    return {
      rootDir: input.source,
      cleanup: async () => {}
    };
  }

  const baseTempDir = options.baseTempDir ?? os.tmpdir();
  const branch = options.branch;
  const runCommand = options.runCommand ?? defaultRunCommand;
  const repoName = getGitHubRepoName(input.source);
  const useCache = !options.noCache;
  const cacheRootDir = useCache
    ? getCacheRootDir({
        baseTempDir,
        cacheDir: options.cacheDir
      })
    : await fs.mkdtemp(path.join(baseTempDir, "repo2skill-"));
  const cacheKey = getGitHubCacheKey(input.source, branch);
  const repoCacheDir = useCache ? path.join(cacheRootDir, cacheKey) : cacheRootDir;
  const cloneDir = path.join(repoCacheDir, repoName);
  const cloneArgs = ["clone", "--depth", "1"] as string[];

  if (branch) {
    cloneArgs.push("--branch", branch);
  }

  cloneArgs.push(input.source, cloneDir);

  if (useCache && options.refresh) {
    await fs.remove(repoCacheDir);
  }

  if (useCache && (await fs.pathExists(path.join(cloneDir, ".git")))) {
    return {
      rootDir: cloneDir,
      cleanup: async () => {}
    };
  }

  try {
    await fs.remove(repoCacheDir);
    await fs.ensureDir(cacheRootDir);
    await runCommand("git", cloneArgs);

    return {
      rootDir: cloneDir,
      cleanup: useCache ? async () => {} : async () => fs.remove(repoCacheDir)
    };
  } catch (error) {
    await fs.remove(repoCacheDir);
    throw error;
  }
}

export function getGitHubRepoName(url: string): string {
  const match = url.match(/^https?:\/\/github\.com\/[^/]+\/([^/]+?)(?:\.git)?\/?$/);

  if (!match) {
    throw new Error(`Unsupported GitHub repository URL: ${url}`);
  }

  return match[1];
}

export function getGitHubCacheKey(url: string, branch?: string): string {
  const normalizedUrl = url.replace(/\.git\/?$/, "").replace(/\/+$/, "");
  const keySource = branch ? `${normalizedUrl}#${branch}` : normalizedUrl;

  return createHash("sha1").update(keySource).digest("hex").slice(0, 12);
}

export function getCacheRootDir(options: {
  baseTempDir?: string;
  cacheDir?: string;
} = {}): string {
  if (options.cacheDir) {
    return path.resolve(options.cacheDir);
  }

  const envCacheDir = process.env.REPO2SKILL_CACHE_DIR;
  if (envCacheDir) {
    return path.resolve(envCacheDir);
  }

  const baseTempDir = options.baseTempDir ?? os.tmpdir();
  return path.join(baseTempDir, "repo2skill-cache");
}

async function defaultRunCommand(command: string, args: string[]): Promise<void> {
  await execFile(command, args);
}
