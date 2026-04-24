import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCacheRootDir,
  getGitHubCacheKey,
  getGitHubRepoName,
  materializeRepository
} from "../../../src/core/collect/materializeRepository.js";

const tempDirs: string[] = [];

async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-collect-"));
  tempDirs.push(tempDir);
  return tempDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("getGitHubRepoName", () => {
  it("extracts the repository name from a standard GitHub URL", () => {
    expect(getGitHubRepoName("https://github.com/example/repo")).toBe("repo");
  });

  it("strips a trailing .git suffix", () => {
    expect(getGitHubRepoName("https://github.com/example/repo.git")).toBe("repo");
  });
});

describe("getGitHubCacheKey", () => {
  it("produces the same key for equivalent GitHub URL forms", () => {
    expect(getGitHubCacheKey("https://github.com/example/repo")).toBe(
      getGitHubCacheKey("https://github.com/example/repo.git")
    );
  });

  it("uses the branch as part of the cache key", () => {
    expect(getGitHubCacheKey("https://github.com/example/repo", "main")).not.toBe(
      getGitHubCacheKey("https://github.com/example/repo", "develop")
    );
  });
});

describe("getCacheRootDir", () => {
  it("uses an explicit cache directory when provided", () => {
    expect(getCacheRootDir({ cacheDir: "E:/repo2skill-cache" })).toBe(
      path.resolve("E:/repo2skill-cache")
    );
  });

  it("uses the environment variable when present", () => {
    const previous = process.env.REPO2SKILL_CACHE_DIR;
    process.env.REPO2SKILL_CACHE_DIR = "E:/env-cache";

    try {
      expect(getCacheRootDir()).toBe(path.resolve("E:/env-cache"));
    } finally {
      if (previous === undefined) {
        delete process.env.REPO2SKILL_CACHE_DIR;
      } else {
        process.env.REPO2SKILL_CACHE_DIR = previous;
      }
    }
  });
});

describe("materializeRepository", () => {
  it("returns local repositories without allocating temp state", async () => {
    const rootDir = path.resolve("tests/fixtures/analysis-target");

    const materialized = await materializeRepository({
      type: "local",
      source: rootDir
    });

    expect(materialized.rootDir).toBe(rootDir);
    await expect(materialized.cleanup()).resolves.toBeUndefined();
  });

  it("clones GitHub URLs into the cache directory via git", async () => {
    const cacheDir = path.join(await createTempDir(), "custom-cache");
    const runCommand = vi.fn(async (_command: string, args: string[]) => {
      const cloneDir = args[args.length - 1];
      await fs.ensureDir(path.join(cloneDir, ".git"));
      await fs.ensureDir(cloneDir);
    });

    const materialized = await materializeRepository(
      {
        type: "github",
        source: "https://github.com/example/repo"
      },
      {
        cacheDir,
        runCommand
      }
    );

    expect(runCommand).toHaveBeenCalledWith("git", [
      "clone",
      "--depth",
      "1",
      "https://github.com/example/repo",
      materialized.rootDir
    ]);
    expect(materialized.rootDir.startsWith(path.resolve(cacheDir))).toBe(true);
    expect(path.basename(materialized.rootDir)).toBe("repo");
    await expect(fs.pathExists(materialized.rootDir)).resolves.toBe(true);

    await materialized.cleanup();

    await expect(fs.pathExists(materialized.rootDir)).resolves.toBe(true);
  });

  it("passes the branch option through to git clone", async () => {
    const cacheDir = path.join(await createTempDir(), "custom-cache");
    const runCommand = vi.fn(async (_command: string, args: string[]) => {
      const cloneDir = args[args.length - 1];
      await fs.ensureDir(path.join(cloneDir, ".git"));
      await fs.ensureDir(cloneDir);
    });

    const materialized = await materializeRepository(
      {
        type: "github",
        source: "https://github.com/example/repo"
      },
      {
        cacheDir,
        branch: "main",
        runCommand
      }
    );

    expect(runCommand).toHaveBeenCalledWith("git", [
      "clone",
      "--depth",
      "1",
      "--branch",
      "main",
      "https://github.com/example/repo",
      materialized.rootDir
    ]);

    await materialized.cleanup();
  });

  it("reuses a cached clone without running git again", async () => {
    const cacheDir = path.join(await createTempDir(), "custom-cache");
    const cacheKey = getGitHubCacheKey("https://github.com/example/repo");
    const cachedCloneDir = path.join(cacheDir, cacheKey, "repo");
    const runCommand = vi.fn(async () => {
      throw new Error("git should not run on cache hit");
    });

    await fs.ensureDir(path.join(cachedCloneDir, ".git"));

    const materialized = await materializeRepository(
      {
        type: "github",
        source: "https://github.com/example/repo"
      },
      {
        cacheDir,
        runCommand
      }
    );

    expect(materialized.rootDir).toBe(cachedCloneDir);
    expect(runCommand).not.toHaveBeenCalled();
  });

  it("cleans up the temp directory when clone fails", async () => {
    const cacheDir = path.join(await createTempDir(), "custom-cache");
    const runCommand = vi.fn(async () => {
      throw new Error("clone failed");
    });

    await expect(
      materializeRepository(
        {
          type: "github",
          source: "https://github.com/example/repo"
        },
        {
          cacheDir,
          runCommand
        }
      )
    ).rejects.toThrow("clone failed");

    const remaining = (await fs.pathExists(cacheDir)) ? await fs.readdir(cacheDir) : [];
    expect(remaining).toEqual([]);
  });
});
