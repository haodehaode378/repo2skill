import { InvalidArgumentError } from "commander";
import type { VisualAssetKind } from "../schemas/visual.js";
import type { OutputFormat, OutputProfile, VisualMode } from "../core/run/runLocalAnalysis.js";

const OUTPUT_FORMATS = new Set<OutputFormat>(["json", "md", "all"]);
const VISUAL_MODES = new Set<VisualMode>(["prompts"]);
const OUTPUT_PROFILES = new Set<OutputProfile>([
  "onboarding",
  "release-check",
  "course-report",
  "demo",
  "issue-to-pr",
  "all"
]);

const VISUAL_ASSET_ALIASES = new Map<string, VisualAssetKind>([
  ["hero", "readme-hero"],
  ["readme", "readme-hero"],
  ["readme-hero", "readme-hero"],
  ["skill", "skill-card"],
  ["skill-card", "skill-card"],
  ["architecture", "architecture-poster"],
  ["architecture-poster", "architecture-poster"]
]);

export function parseOutputFormat(value: string): OutputFormat {
  if (OUTPUT_FORMATS.has(value as OutputFormat)) {
    return value as OutputFormat;
  }

  throw new InvalidArgumentError(`invalid format "${value}". Expected one of: json, md, all.`);
}

export function parseVisualMode(value: string): VisualMode {
  if (VISUAL_MODES.has(value as VisualMode)) {
    return value as VisualMode;
  }

  throw new InvalidArgumentError(
    `invalid visual mode "${value}". Expected one of: prompts. Image generation is not implemented in this MVP.`
  );
}

export function parseVisualAssets(value: string): VisualAssetKind[] {
  const assets: VisualAssetKind[] = [];
  const seen = new Set<VisualAssetKind>();

  for (const rawPart of value.split(",")) {
    const key = rawPart.trim();

    if (!key) {
      continue;
    }

    const asset = VISUAL_ASSET_ALIASES.get(key);

    if (!asset) {
      throw new InvalidArgumentError(
        `invalid visual asset "${key}". Expected one of: hero, skill-card, architecture.`
      );
    }

    if (!seen.has(asset)) {
      seen.add(asset);
      assets.push(asset);
    }
  }

  if (assets.length === 0) {
    throw new InvalidArgumentError("visual assets cannot be empty.");
  }

  return assets;
}

export function parseOutputProfile(value: string): OutputProfile {
  if (OUTPUT_PROFILES.has(value as OutputProfile)) {
    return value as OutputProfile;
  }

  throw new InvalidArgumentError(
    `invalid profile "${value}". Expected one of: onboarding, release-check, course-report, demo, issue-to-pr, all.`
  );
}
