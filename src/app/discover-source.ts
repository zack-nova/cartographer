import { discoverGraph } from "../domain/discovery/discover-graph.js";
import { loadSourceSnapshot } from "../domain/source/load-source-snapshot.js";
import type {
  DiscoverSourceInput,
  DiscoverSourceResult,
} from "../domain/source/types.js";

export async function discoverSource(
  input: DiscoverSourceInput,
): Promise<DiscoverSourceResult> {
  const source = await loadSourceSnapshot(input);
  const discovery = await discoverGraph(source);

  return {
    source,
    discovery,
  };
}
