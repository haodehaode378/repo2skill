import { describe, expect, it } from "vitest";
import { parseOutputFormat, parseOutputProfile } from "../../src/cli/options.js";

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
