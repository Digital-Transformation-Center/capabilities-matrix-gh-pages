export interface Dimensions {
  width: number;  // in mm
  length: number; // in mm
  height: number; // in mm
}

export interface Capability {
  id: string;
  title: string;
  icon: string;
  color: string;
  category: string;
  summary: string;
  body: string;
  relativePath: string;
  tools: string[];
  projects: string[];
}

export interface Tool {
  id: string;
  title: string;
  capabilityId: string;
  type: string; // e.g. "Physical Hardware", "Digital Framework"
  dimensions?: Dimensions | null; // Physical footprint in mm (width x length x height)
  tags: string[];
  summary: string;
  body: string;
  relativePath: string;
  projects: string[];
}

export interface Project {
  id: string;
  title: string;
  status: string;
  lead: string;
  tools: string[];
  capabilities: string[];
  summary: string;
  body: string;
  relativePath: string;
}

export interface MatrixData {
  compiledAt: string;
  capabilities: Capability[];
  tools: Tool[];
  projects: Project[];
}
