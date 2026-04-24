import { describe, expect, it } from "vitest";
import { renderPackageScriptCommand } from "../../../src/core/commands/packageScripts.js";
import type { ScriptCommand } from "../../../src/schemas/analysis.js";

const script: ScriptCommand = {
  name: "dev",
  command: "vite",
  confidence: "high"
};

describe("renderPackageScriptCommand", () => {
  it("renders executable commands for supported package managers", () => {
    expect(renderPackageScriptCommand(script, "pnpm")).toBe("pnpm dev");
    expect(renderPackageScriptCommand(script, "npm")).toBe("npm run dev");
    expect(renderPackageScriptCommand(script, "yarn")).toBe("yarn dev");
    expect(renderPackageScriptCommand(script, "bun")).toBe("bun run dev");
  });

  it("falls back to the raw script command when package manager is unknown", () => {
    expect(renderPackageScriptCommand(script)).toBe("vite");
    expect(renderPackageScriptCommand(script, "unknown")).toBe("vite");
  });
});
