import path from "node:path";
import fs from "fs-extra";

export type ResolvedInput =
  | {
      type: "github";
      source: string;
    }
  | {
      type: "local";
      source: string;
    };

export async function resolveInput(input: string): Promise<ResolvedInput> {
  const isGitHub = /^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(input);

  if (isGitHub) {
    return {
      type: "github",
      source: input
    };
  }

  const absolutePath = path.resolve(input);
  const exists = await fs.pathExists(absolutePath);

  if (!exists) {
    throw new Error(`Input path does not exist: ${absolutePath}`);
  }

  return {
    type: "local",
    source: absolutePath
  };
}
