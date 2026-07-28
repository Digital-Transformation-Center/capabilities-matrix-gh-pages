import React from 'react';
import { Cpu, FolderGit2, Search, Grid, Compass, Ruler } from 'lucide-react';

interface HeaderProps {
  activeTab: 'capabilities' | 'projects' | 'matrix';
  setActiveTab: (tab: 'capabilities' | 'projects' | 'matrix') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  unitSystem: 'metric' | 'imperial';
  setUnitSystem: (unit: 'metric' | 'imperial') => void;
  stats: {
    capabilities: number;
    tools: number;
    projects: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  unitSystem,
  setUnitSystem,
  stats,
}) => {
  return (
    <header className="header">
      <div className="header-top">
        <div className="brand">
          <div className="brand-icon">
            <Compass size={24} />
          </div>
          <div className="brand-text">
            <h1>DTC Model Shop Matrix</h1>
            <p>Digital Transformation Center Capabilities & Projects Inspector</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'capabilities' ? 'active' : ''}`}
            onClick={() => setActiveTab('capabilities')}
          >
            <Cpu size={18} />
            Capabilities & Tools
          </button>
          <button
            className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FolderGit2 size={18} />
            Demonstrator Projects
          </button>
          <button
            className={`nav-tab ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            <Grid size={18} />
            Full Matrix
          </button>
        </nav>
      </div>

      <div className="header-bottom">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search capabilities, tools, tags, or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Unit Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-subtle)', padding: '3px 6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Ruler size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Units:</span>
            <button
              onClick={() => setUnitSystem('metric')}
              style={{
                border: 'none',
                background: unitSystem === 'metric' ? 'var(--bg-surface)' : 'transparent',
                color: unitSystem === 'metric' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: unitSystem === 'metric' ? 600 : 400,
                fontSize: '0.75rem',
                padding: '2px 7px',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: unitSystem === 'metric' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Metric (mm)
            </button>
            <button
              onClick={() => setUnitSystem('imperial')}
              style={{
                border: 'none',
                background: unitSystem === 'imperial' ? 'var(--bg-surface)' : 'transparent',
                color: unitSystem === 'imperial' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: unitSystem === 'imperial' ? 600 : 400,
                fontSize: '0.75rem',
                padding: '2px 7px',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: unitSystem === 'imperial' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Imperial (in)
            </button>
          </div>

          <div className="stats-bar">
            <div className="stat-item">
              <span>Capabilities</span>
              <span className="stat-badge">{stats.capabilities}</span>
            </div>
            <div className="stat-item">
              <span>Tools</span>
              <span className="stat-badge">{stats.tools}</span>
            </div>
            <div className="stat-item">
              <span>Projects</span>
              <span className="stat-badge">{stats.projects}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
