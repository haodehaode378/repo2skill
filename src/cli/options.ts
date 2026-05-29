import { InvalidArgumentError } from "commander";
import type { OutputFormat, OutputProfile } from "../core/run/runLocalAnalysis.js";

const OUTPUT_FORMATS = new Set<OutputFormat>(["json", "md", "all"]);
const OUTPUT_PROFILES = new Set<OutputProfile>([
  "onboarding",
  "release-check",
  "course-report",
  "demo",
  "issue-to-pr",
  "all"
]);

export function parseOutputFormat(value: string): OutputFormat {
  if (OUTPUT_FORMATS.has(value as OutputFormat)) {
    return value as OutputFormat;
  }

  throw new InvalidArgumentError(`invalid format "${value}". Expected one of: json, md, all.`);
}

export function parseOutputProfile(value: string): OutputProfile {
  if (OUTPUT_PROFILES.has(value as OutputProfile)) {
    return value as OutputProfile;
  }

  throw new InvalidArgumentError(
    `invalid profile "${value}". Expected one of: onboarding, release-check, course-report, demo, issue-to-pr, all.`
  );
}
