export type SourceSnapshot = {
  repoLocator: string;
  requestedRef: string | null;
  resolvedRef: string;
  commit: string;
  rootDir: string;
};

export type DiscoveryEdge = {
  from: string;
  to: string;
  kind: "markdown_link";
};

export type DiscoveryGraph = {
  seedPaths: string[];
  discoveredPaths: string[];
  edges: DiscoveryEdge[];
};

export type DiscoverSourceInput = {
  repoLocator: string;
  ref?: string;
};

export type DiscoverSourceResult = {
  source: SourceSnapshot;
  discovery: DiscoveryGraph;
};
