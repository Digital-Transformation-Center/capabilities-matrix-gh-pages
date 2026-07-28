import React, { useState } from 'react';
import type { Project, Tool, Capability } from '../types/matrix';
import { Check, Minus, Filter } from 'lucide-react';

interface MatrixViewProps {
  projects: Project[];
  tools: Tool[];
  capabilitiesMap: Record<string, Capability>;
  onSelectProject: (projectId: string) => void;
  onSelectTool: (tool: Tool) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  projects,
  tools,
  capabilitiesMap,
  onSelectProject,
  onSelectTool,
}) => {
  const [selectedCapFilter, setSelectedCapFilter] = useState<string>('all');

  // Extract capability categories for filter bar
  const capabilityList = Object.values(capabilitiesMap);

  const filteredTools = tools.filter((t) => {
    if (selectedCapFilter === 'all') return true;
    return t.capabilityId === selectedCapFilter;
  });

  return (
    <div className="matrix-wrapper">
      <div className="matrix-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Filter Domain:</span>
          <div className="matrix-filter-tabs">
            <button
              className={`matrix-filter-btn ${selectedCapFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCapFilter('all')}
            >
              All Domains ({tools.length})
            </button>
            {capabilityList.map((cap) => (
              <button
                key={cap.id}
                className={`matrix-filter-btn ${selectedCapFilter === cap.id ? 'active' : ''}`}
                onClick={() => setSelectedCapFilter(cap.id)}
              >
                {cap.title} ({cap.tools.length})
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {projects.length} Demonstrators × {filteredTools.length} Tools
        </span>
      </div>

      <div className="matrix-container">
        <table className="matrix-table-compact">
          <thead>
            <tr>
              <th className="sticky-corner-header" style={{ minWidth: '230px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Demonstrator Project
                </div>
              </th>
              {filteredTools.map((tool) => {
                const cap = capabilitiesMap[tool.capabilityId];
                return (
                  <th
                    key={tool.id}
                    className="tool-header-col"
                    onClick={() => onSelectTool(tool)}
                    title={`Click to inspect ${tool.title} (${cap ? cap.title : ''})`}
                  >
                    <div className="vertical-text-wrap">{tool.title}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.id}>
                <td className="matrix-project-cell" onClick={() => onSelectProject(proj.id)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{proj.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '2px' }}>
                    {proj.status}
                  </div>
                </td>
                {filteredTools.map((tool) => {
                  const isUsed = proj.tools.includes(tool.id);
                  return (
                    <td
                      key={tool.id}
                      className={`matrix-cell ${isUsed ? 'active-used' : ''}`}
                      onClick={() => onSelectTool(tool)}
                      title={`${proj.title} ${isUsed ? 'USES' : 'does not use'} ${tool.title}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {isUsed ? (
                        <Check size={16} style={{ color: 'var(--accent-emerald)', margin: '0 auto' }} />
                      ) : (
                        <Minus size={14} style={{ opacity: 0.15, color: 'var(--text-muted)', margin: '0 auto' }} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
