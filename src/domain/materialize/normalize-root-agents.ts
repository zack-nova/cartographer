import { MaterializeTemplateError } from "../../errors/materialize-template.js";

const markerPattern = /^<!-- orbit:(begin|end) orbit_id="([^"]+)" -->$/;

export function normalizeRootAgentsContent(content: string): string {
  const lines = content.split(/\r?\n/);
  const normalizedLines: string[] = [];
  let currentOrbitId: string | null = null;

  for (const line of lines) {
    if (!line.includes("<!-- orbit:")) {
      normalizedLines.push(line);
      continue;
    }

    const match = line.match(markerPattern);

    if (match === null) {
      throw new MaterializeTemplateError(
        "Invalid runtime AGENTS.md marker structure",
      );
    }

    const [, markerKind, orbitId] = match;

    if (markerKind === "begin") {
      if (currentOrbitId !== null) {
        throw new MaterializeTemplateError(
          "Invalid runtime AGENTS.md marker structure",
        );
      }

      currentOrbitId = orbitId;
      continue;
    }

    if (currentOrbitId === null || currentOrbitId !== orbitId) {
      throw new MaterializeTemplateError(
        "Invalid runtime AGENTS.md marker structure",
      );
    }

    currentOrbitId = null;
  }

  if (currentOrbitId !== null) {
    throw new MaterializeTemplateError(
      "Invalid runtime AGENTS.md marker structure",
    );
  }

  return normalizedLines.join("\n");
}
