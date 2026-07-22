import type { CommandRole } from "../../schemas/analysis.js";

export const VALIDATION_SCRIPT_ORDER = ["test", "lint", "typecheck", "build"] as const;

export function getCommandRole(name: string): CommandRole {
  if (
    name === "dev" ||
    name === "format" ||
    VALIDATION_SCRIPT_ORDER.includes(name as (typeof VALIDATION_SCRIPT_ORDER)[number])
  ) {
    return name as CommandRole;
  }

  return "other";
}
