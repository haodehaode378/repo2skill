import { describe, expect, it } from "vitest";
import {
  createWorkspacePackageCommand,
  renderPackageScriptCommand
} from "../../../src/core/commands/packageScripts.js";
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

  it.each([
    ["pnpm", "pnpm --filter @fixture/web dev"],
    ["npm", "npm run dev --workspace @fixture/web"],
    ["yarn", "yarn workspace @fixture/web dev"]
  ])("renders %s workspace-scoped package commands", (packageManager, expected) => {
    expect(
      createWorkspacePackageCommand(script, packageManager, {
        path: "apps/web",
        packageJsonPath: "apps/web/package.json",
        name: "@fixture/web"
      })
    ).toMatchObject({
      command: expected,
      cwd: ".",
      packageName: "@fixture/web",
      packagePath: "apps/web",
      scoped: true
    });
  });

  it("uses an evidenced local command and package cwd when scoped syntax is unavailable", () => {
    expect(
      createWorkspacePackageCommand(script, "bun", {
        path: "apps/web",
        packageJsonPath: "apps/web/package.json",
        name: "@fixture/web"
      })
    ).toMatchObject({
      command: "bun run dev",
      cwd: "apps/web",
      source: "apps/web/package.json",
      scoped: false
    });
  });

  it("uses package cwd rather than guessing a filter for unnamed packages", () => {
    expect(
      createWorkspacePackageCommand(script, "pnpm", {
        path: "packages/unnamed",
        packageJsonPath: "packages/unnamed/package.json"
      })
    ).toMatchObject({
      command: "pnpm dev",
      cwd: "packages/unnamed",
      scoped: false
    });
  });
});
