import { CurationPlanError } from "../../errors/curation-plan.js";
import type { VariableDeclaration } from "../curation/types.js";

const variableNamePattern = /^[a-z][a-z0-9_]*$/;

export function validateVariableDeclarations(
  variables: VariableDeclaration[] | undefined,
  discoveredPaths: string[],
): VariableDeclaration[] {
  if (variables === undefined) {
    return [];
  }

  const discoveredPathSet = new Set(discoveredPaths);
  const seenVariableNames = new Set<string>();
  const literalToVariable = new Map<string, string>();

  return variables.map((variable) => {
    if (!variableNamePattern.test(variable.name)) {
      throw new CurationPlanError(`Invalid variable name: ${variable.name}`);
    }

    if (seenVariableNames.has(variable.name)) {
      throw new CurationPlanError(`Duplicate variable name: ${variable.name}`);
    }

    seenVariableNames.add(variable.name);

    const replacements = variable.replacements.map((replacement) => {
      if (!discoveredPathSet.has(replacement.path)) {
        throw new CurationPlanError(
          `Variable replacement path is not part of the discovery set: ${replacement.path}`,
        );
      }

      if (replacement.literal.length === 0) {
        throw new CurationPlanError(
          "Variable replacement literal cannot be empty",
        );
      }

      const existingVariable = literalToVariable.get(replacement.literal);

      if (
        existingVariable !== undefined &&
        existingVariable !== variable.name
      ) {
        throw new CurationPlanError(
          `Variable literal conflict: ${replacement.literal} is mapped to both ${existingVariable} and ${variable.name}`,
        );
      }

      literalToVariable.set(replacement.literal, variable.name);

      return {
        path: replacement.path,
        literal: replacement.literal,
      };
    });

    return {
      name: variable.name,
      description: variable.description,
      replacements,
    };
  });
}
