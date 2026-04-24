import fs from "fs-extra";
import {
  EvaluationManifestSchema,
  type EvaluationManifest
} from "../../schemas/evaluation.js";

export async function loadEvaluationManifest(filePath: string): Promise<EvaluationManifest> {
  const raw = await fs.readJson(filePath);
  return EvaluationManifestSchema.parse(raw);
}
