import React from 'react';
import type { Project, Tool, Capability } from '../types/matrix';
import { FileText, Cpu, UserCheck } from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  toolsMap: Record<string, Tool>;
  capabilitiesMap: Record<string, Capability>;
  searchQuery: string;
  onSelectProject: (projectId: string) => void;
  onSelectTool: (tool: Tool) => void;
  onViewSource: (path: string, body: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  toolsMap,
  capabilitiesMap,
  searchQuery,
  onSelectProject,
  onSelectTool,
  onViewSource,
}) => {
  const filteredProjects = projects.filter((proj) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      proj.title.toLowerCase().includes(q) ||
      proj.summary.toLowerCase().includes(q) ||
      proj.lead.toLowerCase().includes(q) ||
      proj.tools.some((tId) => tId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="projects-grid">
      {filteredProjects.map((proj) => {
        // Group tools by capability for the tree view
        const toolsByCap: Record<string, Tool[]> = {};
        proj.tools.forEach((tId) => {
          const tool = toolsMap[tId];
          if (tool) {
            const capId = tool.capabilityId || 'other';
            if (!toolsByCap[capId]) toolsByCap[capId] = [];
            toolsByCap[capId].push(tool);
          }
        });

        return (
          <div key={proj.id} className="project-card" onClick={() => onSelectProject(proj.id)}>
            <div>
              <div className="project-card-header">
                <div>
                  <h3 className="project-card-title">{proj.title}</h3>
                  <button
                    className="source-file-badge"
                    style={{ marginTop: '6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewSource(proj.relativePath, proj.body);
                    }}
                  >
                    <FileText size={12} />
                    {proj.relativePath}
                  </button>
                </div>
                <span className="status-badge">{proj.status}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 10px' }}>
                <UserCheck size={14} />
                <span>Lead: {proj.lead}</span>
              </div>

              <p className="project-card-summary">{proj.summary}</p>
            </div>

            <div className="usage-tree-box">
              <div className="usage-tree-header">
                <Cpu size={14} />
                Capabilities & Tools Utilized Tree
              </div>

              <div className="tree-node-group">
                {Object.entries(toolsByCap).map(([capId, capTools]) => {
                  const cap = capabilitiesMap[capId];
                  return (
                    <div key={capId}>
                      <div className="tree-node-cap">
                        <span>• {cap ? cap.title : 'General Capability'}</span>
                      </div>
                      <div className="tree-node-tools">
                        {capTools.map((tool) => (
                          <span
                            key={tool.id}
                            className="tool-chip"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTool(tool);
                            }}
                          >
                            {tool.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
