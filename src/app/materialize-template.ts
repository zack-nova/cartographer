import type {
  MaterializeTemplateInput,
  MaterializeTemplateResult,
} from "../domain/materialize/types.js";
import { materializeTemplate as materializeTemplateDomain } from "../domain/materialize/materialize-template.js";

export function materializeTemplate(
  input: MaterializeTemplateInput,
): Promise<MaterializeTemplateResult> {
  return materializeTemplateDomain(input);
}
