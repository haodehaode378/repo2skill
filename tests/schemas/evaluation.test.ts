import { describe, expect, it } from "vitest";
import { EvaluationManifestSchema } from "../../src/schemas/evaluation.js";

describe("EvaluationManifestSchema", () => {
  it("keeps artifact-only manifests compatible", () => {
    const manifest = EvaluationManifestSchema.parse({
      name: "legacy",
      cases: [
        {
          name: "artifact-only",
          input: ".",
          assertions: [{ artifact: "AGENTS.md", includes: ["src"], excludes: [] }]
        }
      ]
    });

    expect(manifest.cases[0]?.facts).toBeUndefined();
  });

  it("accepts semantic fact-only cases", () => {
    const manifest = EvaluationManifestSchema.parse({
      name: "facts",
      cases: [
        {
          name: "entrypoints",
          input: ".",
          facts: { expectedEntrypoints: ["src/cli/index.ts"] }
        }
      ]
    });

    expect(manifest.cases[0]?.assertions).toEqual([]);
    expect(manifest.cases[0]?.facts?.expectedEntrypoints).toEqual(["src/cli/index.ts"]);
  });

  it("rejects cases without any quality assertion", () => {
    expect(() =>
      EvaluationManifestSchema.parse({
        name: "empty",
        cases: [{ name: "empty", input: "." }]
      })
    ).toThrow("Each evaluation case must contain artifact or semantic fact assertions");
  });
});
