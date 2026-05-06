import { describe, expect, it } from "vitest";
import { parseOutputFormat } from "../../src/cli/options.js";

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
