import React, { useState } from 'react';
import type { Capability, Tool, Project } from '../types/matrix';
import * as LucideIcons from 'lucide-react';
import { ChevronDown, ChevronRight, Wrench, FolderGit2, FileText, Cpu, Box } from 'lucide-react';
import { formatDimensions } from '../utils/formatDimensions';

interface CapabilityViewProps {
  capabilities: Capability[];
  toolsMap: Record<string, Tool>;
  projectsMap: Record<string, Project>;
  searchQuery: string;
  unitSystem: 'metric' | 'imperial';
  onSelectProject: (projectId: string) => void;
  onSelectTool: (tool: Tool) => void;
  onViewSource: (path: string, body: string) => void;
}

// Dynamic icon loader for any Lucide icon name
const DynamicCapabilityIcon: React.FC<{ name: string; size?: number }> = ({ name, size = 18 }) => {
  const formattedName = name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Cpu';
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[formattedName] || Cpu;
  return <IconComponent size={size} />;
};

export const CapabilityView: React.FC<CapabilityViewProps> = ({
  capabilities,
  toolsMap,
  projectsMap,
  searchQuery,
  unitSystem,
  onSelectProject,
  onSelectTool,
  onViewSource,
}) => {
  const [expandedCaps, setExpandedCaps] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    capabilities.forEach((c, idx) => { initial[c.id] = idx === 0; });
    return initial;
  });

  const toggleExpand = (capId: string) => {
    setExpandedCaps((prev) => ({ ...prev, [capId]: !prev[capId] }));
  };

  const filteredCapabilities = capabilities.filter((cap) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();

    if (cap.title.toLowerCase().includes(q) || cap.summary.toLowerCase().includes(q)) return true;

    const hasMatchingTool = cap.tools.some((tId) => {
      const tool = toolsMap[tId];
      if (!tool) return false;
      return (
        tool.title.toLowerCase().includes(q) ||
        tool.summary.toLowerCase().includes(q) ||
        tool.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    if (hasMatchingTool) return true;

    return cap.projects.some((pId) => {
      const proj = projectsMap[pId];
      return proj && proj.title.toLowerCase().includes(q);
    });
  });

  return (
    <div className="capability-section">
      {filteredCapabilities.map((cap) => {
        const isExpanded = !!expandedCaps[cap.id];
        const capTools = cap.tools.map((tId) => toolsMap[tId]).filter(Boolean);

        return (
          <div key={cap.id} className={`capability-card ${isExpanded ? 'expanded' : ''}`}>
            <div className="capability-header" onClick={() => toggleExpand(cap.id)}>
              <div className="capability-info">
                <div className="capability-icon-wrap">
                  <DynamicCapabilityIcon name={cap.icon} size={18} />
                </div>
                <div>
                  <div className="capability-title">
                    <span>{cap.title}</span>
                    <button
                      className="source-file-badge"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewSource(cap.relativePath, cap.body);
                      }}
                      title="View Markdown source"
                    >
                      <FileText size={12} />
                      {cap.relativePath}
                    </button>
                  </div>
                  <div className="capability-meta">{cap.summary}</div>
                </div>
              </div>

              <div className="capability-counts">
                <span className="count-pill">
                  <Wrench size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {capTools.length} Tools
                </span>
                <span className="count-pill">
                  <FolderGit2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {cap.projects.length} Projects
                </span>
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </div>

            {isExpanded && (
              <div className="capability-body">
                <div className="tool-grid">
                  {capTools.map((tool) => {
                    const toolProjects = tool.projects.map((pId) => projectsMap[pId]).filter(Boolean);
                    const formattedDim = formatDimensions(tool.dimensions, unitSystem);

                    return (
                      <div
                        key={tool.id}
                        className="tool-card"
                        onClick={() => onSelectTool(tool)}
                      >
                        <div className="tool-card-top">
                          <span className="tool-title">{tool.title}</span>
                          <span className="tool-type-badge">{tool.type}</span>
                        </div>

                        <p className="tool-summary">{tool.summary}</p>

                        {formattedDim && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '3px 7px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                            <Box size={12} style={{ color: 'var(--accent-primary)' }} />
                            <span><strong>Footprint:</strong> {formattedDim}</span>
                          </div>
                        )}

                        <div className="tool-tags">
                          {tool.tags.map((tag) => (
                            <span key={tag} className="tag-pill">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {toolProjects.length > 0 && (
                          <div className="associated-projects">
                            <div className="associated-label">
                              <FolderGit2 size={12} />
                              Linked Demonstrators ({toolProjects.length})
                            </div>
                            <div className="project-pill-list">
                              {toolProjects.map((proj) => (
                                <button
                                  key={proj.id}
                                  className="project-pill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectProject(proj.id);
                                  }}
                                >
                                  {proj.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
