import type { ScriptCommand } from "../../schemas/analysis.js";

export function renderPackageScriptCommand(
  script: ScriptCommand,
  packageManager?: string
): string {
  switch (packageManager) {
    case "pnpm":
      return `pnpm ${script.name}`;
    case "yarn":
      return `yarn ${script.name}`;
    case "bun":
      return `bun run ${script.name}`;
    case "npm":
      return `npm run ${script.name}`;
    default:
      return script.command;
  }
}
