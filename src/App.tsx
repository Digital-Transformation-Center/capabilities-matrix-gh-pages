import { useState, useMemo } from 'react';
import matrixDataRaw from './data/matrixData.json';
import type { MatrixData, Tool, Project, Capability } from './types/matrix';
import { Header } from './components/Header';
import { CapabilityView } from './components/CapabilityView';
import { ProjectsView } from './components/ProjectsView';
import { MatrixView } from './components/MatrixView';
import { DetailModal } from './components/DetailModal';
import { MarkdownModal } from './components/MarkdownModal';
import './styles/index.css';

const data = matrixDataRaw as MatrixData;

export function App() {
  const [activeTab, setActiveTab] = useState<'capabilities' | 'projects' | 'matrix'>('capabilities');
  const [searchQuery, setSearchQuery] = useState('');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Selected item modal
  const [selectedItem, setSelectedItem] = useState<
    { type: 'tool'; data: Tool } | { type: 'project'; data: Project } | null
  >(null);

  // Selected markdown file preview modal
  const [markdownSource, setMarkdownSource] = useState<{ path: string; content: string } | null>(null);

  // Fast Lookup Maps
  const capabilitiesMap = useMemo(() => {
    const map: Record<string, Capability> = {};
    data.capabilities.forEach((c) => { map[c.id] = c; });
    return map;
  }, []);

  const toolsMap = useMemo(() => {
    const map: Record<string, Tool> = {};
    data.tools.forEach((t) => { map[t.id] = t; });
    return map;
  }, []);

  const projectsMap = useMemo(() => {
    const map: Record<string, Project> = {};
    data.projects.forEach((p) => { map[p.id] = p; });
    return map;
  }, []);

  const handleSelectProject = (projectId: string) => {
    const proj = projectsMap[projectId];
    if (proj) {
      setSelectedItem({ type: 'project', data: proj });
    }
  };

  const handleSelectTool = (tool: Tool) => {
    setSelectedItem({ type: 'tool', data: tool });
  };

  const handleViewSource = (path: string, body: string) => {
    setMarkdownSource({ path, content: body });
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unitSystem={unitSystem}
        setUnitSystem={setUnitSystem}
        stats={{
          capabilities: data.capabilities.length,
          tools: data.tools.length,
          projects: data.projects.length,
        }}
      />

      <main>
        {activeTab === 'capabilities' && (
          <CapabilityView
            capabilities={data.capabilities}
            toolsMap={toolsMap}
            projectsMap={projectsMap}
            searchQuery={searchQuery}
            unitSystem={unitSystem}
            onSelectProject={handleSelectProject}
            onSelectTool={handleSelectTool}
            onViewSource={handleViewSource}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={data.projects}
            toolsMap={toolsMap}
            capabilitiesMap={capabilitiesMap}
            searchQuery={searchQuery}
            onSelectProject={handleSelectProject}
            onSelectTool={handleSelectTool}
            onViewSource={handleViewSource}
          />
        )}

        {activeTab === 'matrix' && (
          <MatrixView
            projects={data.projects}
            tools={data.tools}
            capabilitiesMap={capabilitiesMap}
            onSelectProject={handleSelectProject}
            onSelectTool={handleSelectTool}
          />
        )}
      </main>

      <DetailModal
        item={selectedItem}
        toolsMap={toolsMap}
        projectsMap={projectsMap}
        capabilitiesMap={capabilitiesMap}
        unitSystem={unitSystem}
        onClose={() => setSelectedItem(null)}
        onSelectProject={handleSelectProject}
        onSelectTool={handleSelectTool}
        onViewSource={handleViewSource}
      />

      <MarkdownModal
        source={markdownSource}
        onClose={() => setMarkdownSource(null)}
      />
    </div>
  );
}

export default App;
