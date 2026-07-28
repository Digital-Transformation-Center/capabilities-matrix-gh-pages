import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Tool, Project, Capability } from '../types/matrix';
import { X, FolderGit2, Cpu, Wrench, FileText, UserCheck, CheckCircle2, Box } from 'lucide-react';
import { formatDimensions } from '../utils/formatDimensions';

interface DetailModalProps {
  item: { type: 'tool'; data: Tool } | { type: 'project'; data: Project } | null;
  toolsMap: Record<string, Tool>;
  projectsMap: Record<string, Project>;
  capabilitiesMap: Record<string, Capability>;
  unitSystem: 'metric' | 'imperial';
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onSelectTool: (tool: Tool) => void;
  onViewSource: (path: string, body: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  toolsMap,
  projectsMap,
  capabilitiesMap,
  unitSystem,
  onClose,
  onSelectProject,
  onSelectTool,
  onViewSource,
}) => {
  if (!item) return null;

  if (item.type === 'tool') {
    const tool = item.data;
    const parentCap = capabilitiesMap[tool.capabilityId];
    const linkedProjects = tool.projects.map((pId) => projectsMap[pId]).filter(Boolean);
    const formattedDim = formatDimensions(tool.dimensions, unitSystem);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="modal-title">{tool.title}</span>
                <span className="tool-type-badge">{tool.type}</span>
              </div>
              <button
                className="source-file-badge"
                style={{ marginTop: '6px' }}
                onClick={() => onViewSource(tool.relativePath, tool.body)}
              >
                <FileText size={12} />
                {tool.relativePath}
              </button>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            {parentCap && (
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} style={{ color: 'var(--accent-primary)' }} />
                <div style={{ fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Capability Category: </span>
                  <strong style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>{parentCap.title}</strong>
                </div>
              </div>
            )}

            {formattedDim && (
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                <Box size={16} style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Physical Footprint Dimensions: </span>
                  <strong style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>{formattedDim}</strong>
                </div>
              </div>
            )}

            <div>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.04em' }}>Tool Summary</h4>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{tool.summary}</p>
            </div>

            {tool.body && (
              <div className="markdown-body">
                <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.04em' }}>Detailed Specifications</h4>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{tool.body}</ReactMarkdown>
              </div>
            )}

            {linkedProjects.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em' }}>Associated Demonstrator Projects ({linkedProjects.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {linkedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        onClose();
                        onSelectProject(proj.id);
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                          <FolderGit2 size={14} />
                          {proj.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{proj.summary}</div>
                      </div>
                      <span className="status-badge">{proj.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'project') {
    const proj = item.data;
    const projTools = proj.tools.map((tId) => toolsMap[tId]).filter(Boolean);

    // Group tools by capability
    const toolsByCap: Record<string, Tool[]> = {};
    projTools.forEach((tool) => {
      const capId = tool.capabilityId || 'other';
      if (!toolsByCap[capId]) toolsByCap[capId] = [];
      toolsByCap[capId].push(tool);
    });

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <div className="modal-title">{proj.title}</div>
              <button
                className="source-file-badge"
                style={{ marginTop: '6px' }}
                onClick={() => onViewSource(proj.relativePath, proj.body)}
              >
                <FileText size={12} />
                {proj.relativePath}
              </button>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-emerald)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className="status-badge">{proj.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <UserCheck size={15} />
                <span style={{ color: 'var(--text-muted)' }}>Lead:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{proj.lead}</strong>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.04em' }}>Demonstrator Overview</h4>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{proj.summary}</p>
            </div>

            {proj.body && (
              <div className="markdown-body">
                <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.04em' }}>Full Documentation</h4>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{proj.body}</ReactMarkdown>
              </div>
            )}

            <div className="usage-tree-box">
              <div className="usage-tree-header">
                <Cpu size={14} />
                Tree of Capabilities & Tools Utilized in this Project
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {Object.entries(toolsByCap).map(([capId, capTools]) => {
                  const cap = capabilitiesMap[capId];
                  return (
                    <div key={capId} style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem', marginBottom: '4px' }}>
                        • Capability Domain: {cap ? cap.title : 'General'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginLeft: '10px' }}>
                        {capTools.map((tool) => (
                          <div
                            key={tool.id}
                            className="tool-chip"
                            onClick={() => {
                              onSelectTool(tool);
                            }}
                          >
                            <Wrench size={11} />
                            {tool.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
