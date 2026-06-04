import { describe, expect, it } from "vitest";
import {
  parseOutputFormat,
  parseOutputProfile,
  parseVisualAssets,
  parseVisualMode
} from "../../src/cli/options.js";

describe("parseOutputFormat", () => {
  it.each(["json", "md", "all"] as const)("accepts %s", (format) => {
    expect(parseOutputFormat(format)).toBe(format);
  });

  it("rejects unsupported formats with a clear error", () => {
    expect(() => parseOutputFormat("nope")).toThrow(
      'invalid format "nope". Expected one of: json, md, all.'
    );
  });
});

describe("parseOutputProfile", () => {
  it.each(["onboarding", "release-check", "course-report", "demo", "issue-to-pr", "all"] as const)(
    "accepts %s",
    (profile) => {
      expect(parseOutputProfile(profile)).toBe(profile);
    }
  );

  it("rejects unsupported profiles with a clear error", () => {
    expect(() => parseOutputProfile("nope")).toThrow(
      'invalid profile "nope". Expected one of: onboarding, release-check, course-report, demo, issue-to-pr, all.'
    );
  });
});

describe("parseVisualMode", () => {
  it("accepts prompts mode", () => {
    expect(parseVisualMode("prompts")).toBe("prompts");
  });

  it("rejects unsupported visual modes with MVP guidance", () => {
    expect(() => parseVisualMode("images")).toThrow(
      'invalid visual mode "images". Expected one of: prompts. Image generation is not implemented in this MVP.'
    );
  });
});

describe("parseVisualAssets", () => {
  it("accepts aliases and removes duplicates", () => {
    expect(parseVisualAssets("hero,readme-hero,skill-card,architecture")).toEqual([
      "readme-hero",
      "skill-card",
      "architecture-poster"
    ]);
  });

  it("rejects unsupported visual assets", () => {
    expect(() => parseVisualAssets("logo")).toThrow(
      'invalid visual asset "logo". Expected one of: hero, skill-card, architecture.'
    );
  });
});
