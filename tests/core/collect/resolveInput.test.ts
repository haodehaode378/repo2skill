import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveInput } from "../../../src/core/collect/resolveInput.js";

describe("resolveInput", () => {
  it("classifies GitHub URLs without touching the filesystem", async () => {
    await expect(
      resolveInput("https://github.com/example/repo")
    ).resolves.toEqual({
      type: "github",
      source: "https://github.com/example/repo"
    });
  });

  it("resolves local paths to absolute paths", async () => {
    const fixturePath = path.resolve("tests/fixtures/demo-repo");

    await expect(resolveInput("tests/fixtures/demo-repo")).resolves.toEqual({
      type: "local",
      source: fixturePath
    });
  });

  it("throws for missing local paths", async () => {
    const missingPath = path.resolve("tests/fixtures/does-not-exist");

    await expect(resolveInput("tests/fixtures/does-not-exist")).rejects.toThrow(
      `Input path does not exist: ${missingPath}`
    );
  });
});
