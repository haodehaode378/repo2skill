import type { EnvVar } from "../../schemas/analysis.js";

export const MAX_RENDERED_ENV_VARS = 20;

export function getDisplayEnvVars(envVars: EnvVar[]): EnvVar[] {
  return envVars.slice(0, MAX_RENDERED_ENV_VARS);
}

export function getOmittedEnvVarCount(envVars: EnvVar[]): number {
  return Math.max(0, envVars.length - MAX_RENDERED_ENV_VARS);
}
