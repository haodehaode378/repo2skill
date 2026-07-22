import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { loadEvaluationManifest } from "../../../src/core/evaluations/loadEvaluationManifest.js";

const tempDirs: string[] = [];

async function createManifestFile(contents: unknown): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo2skill-evaluation-manifest-"));
  tempDirs.push(tempDir);
  const filePath = path.join(tempDir, "manifest.json");
  await fs.writeJson(filePath, contents);
  return filePath;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => fs.remove(tempDir)));
});

describe("loadEvaluationManifest", () => {
  it("loads and applies defaults to a valid manifest", async () => {
    const filePath = await createManifestFile({
      name: "fixture",
      cases: [
        {
          name: "workspace-package",
          input: ".",
          facts: { expectedWorkspacePackages: ["@fixture/core"] }
        }
      ]
    });

    const manifest = await loadEvaluationManifest(filePath);

    expect(manifest.cases[0]?.assertions).toEqual([]);
    expect(manifest.cases[0]?.facts?.expectedWorkspacePackages).toEqual(["@fixture/core"]);
    expect(manifest.cases[0]?.facts?.expectedEntrypoints).toEqual([]);
  });

  it("rejects a manifest without quality assertions", async () => {
    const filePath = await createManifestFile({
      name: "invalid",
      cases: [{ name: "empty", input: "." }]
    });

    await expect(loadEvaluationManifest(filePath)).rejects.toThrow(
      "Each evaluation case must contain artifact or semantic fact assertions"
    );
  });
});
