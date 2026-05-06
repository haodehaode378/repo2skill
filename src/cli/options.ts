import { InvalidArgumentError } from "commander";
import type { OutputFormat } from "../core/run/runLocalAnalysis.js";

const OUTPUT_FORMATS = new Set<OutputFormat>(["json", "md", "all"]);

export function parseOutputFormat(value: string): OutputFormat {
  if (OUTPUT_FORMATS.has(value as OutputFormat)) {
    return value as OutputFormat;
  }

  throw new InvalidArgumentError(`invalid format "${value}". Expected one of: json, md, all.`);
}
