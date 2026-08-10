const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content');
const buildContentDir = path.join(rootDir, '.build_content');
const outputDir = path.join(rootDir, 'src', 'data');
const outputFile = path.join(outputDir, 'matrixData.json');

console.log('🔄 Compiling Markdown Matrix Data & Preparing .build_content...');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Prepare .build_content directory cleanly from content
if (fs.existsSync(buildContentDir)) {
  fs.rmSync(buildContentDir, { recursive: true, force: true });
}
fs.mkdirSync(buildContentDir, { recursive: true });
fs.cpSync(contentDir, buildContentDir, { recursive: true });

// Process site domain configuration from site-config.json
const siteConfigPath = path.join(rootDir, 'site-config.json');
let siteConfig = {
  githubPagesUrl: 'https://digital-transformation-center.github.io/capabilities-matrix-gh-pages/',
  netlifyUrl: 'https://dtc-modelshop-capabilities.netlify.app/'
};

if (fs.existsSync(siteConfigPath)) {
  try {
    const rawConfig = fs.readFileSync(siteConfigPath, 'utf8');
    siteConfig = { ...siteConfig, ...JSON.parse(rawConfig) };
  } catch (err) {
    console.warn('⚠️ Could not parse site-config.json:', err.message);
  }
}

// Generate public/site-config.js for browser runtime
const publicDir = path.join(rootDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const siteConfigJsPath = path.join(publicDir, 'site-config.js');
const siteConfigJsContent = `// Auto-generated from site-config.json during build\nwindow.SITE_CONFIG = ${JSON.stringify(siteConfig, null, 2)};\n`;
fs.writeFileSync(siteConfigJsPath, siteConfigJsContent, 'utf8');

// Auto-update site_url in admin/config.yml
const adminConfigYamlPath = path.join(rootDir, 'admin', 'config.yml');
if (fs.existsSync(adminConfigYamlPath)) {
  let yamlContent = fs.readFileSync(adminConfigYamlPath, 'utf8');
  const siteUrlRegex = /^site_url:.*$/m;
  const newSiteUrlLine = `site_url: "${siteConfig.githubPagesUrl}"`;
  if (siteUrlRegex.test(yamlContent)) {
    yamlContent = yamlContent.replace(siteUrlRegex, newSiteUrlLine);
  }
  fs.writeFileSync(adminConfigYamlPath, yamlContent, 'utf8');
}

// Generate .build_content/site-config.js for MkDocs site output
const buildSiteConfigJsPath = path.join(buildContentDir, 'site-config.js');
fs.writeFileSync(buildSiteConfigJsPath, siteConfigJsContent, 'utf8');

// Ensure admin files are copied to .build_content/admin and public/admin for MkDocs/Vite build output
const adminSrc = path.join(rootDir, 'admin');
const adminBuild = path.join(buildContentDir, 'admin');
const adminPublic = path.join(rootDir, 'public', 'admin');
if (fs.existsSync(adminSrc)) {
  fs.mkdirSync(adminBuild, { recursive: true });
  fs.cpSync(adminSrc, adminBuild, { recursive: true });
  fs.mkdirSync(adminPublic, { recursive: true });
  fs.cpSync(adminSrc, adminPublic, { recursive: true });
}

// Helper to format icon markup (Lucide or Material)
function formatIconMarkup(iconStr) {
  if (!iconStr) return '<i data-lucide="cpu"></i>';
  let str = String(iconStr).trim();
  if (str.startsWith(':lucide-') && str.endsWith(':')) {
    const iconName = str.replace(/^:lucide-/, '').replace(/:$/, '');
    return `<i data-lucide="${iconName}"></i>`;
  }
  if (str.startsWith(':') && str.endsWith(':')) return str;
  if (str.includes('/')) {
    str = str.replace(/\//g, '-');
    return `:${str}:`;
  }
  return `<i data-lucide="${str}"></i>`;
}

// Helper to process :lucide-icon-name: shortcodes into <i data-lucide="icon-name"></i>
function processLucideShortcodes(contentStr) {
  if (!contentStr) return '';
  return contentStr.replace(/:lucide-([a-z0-9-]+):/g, '<i data-lucide="$1"></i>');
}

// Helper to safely list markdown files in content directory
function getMdFiles(subDir) {
  const targetDir = path.join(contentDir, subDir);
  if (!fs.existsSync(targetDir)) return [];
  return fs.readdirSync(targetDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .map(f => ({
      fileName: f,
      fullPath: path.join(targetDir, f),
      relativePath: `content/${subDir}/${f}`
    }));
}

// Helper to parse dimensions
function parseDimensions(dim) {
  if (!dim) return null;
  if (typeof dim === 'object' && !Array.isArray(dim)) {
    const w = parseFloat(dim.width || dim.w || 0);
    const l = parseFloat(dim.length || dim.l || 0);
    const h = parseFloat(dim.height || dim.h || 0);
    if (w || l || h) return { width: w, length: l, height: h };
  }
  if (typeof dim === 'string') {
    const parts = dim.toLowerCase().replace(/mm|in|"/g, '').split(/[x,×]/).map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
    if (parts.length >= 2) {
      return {
        width: parts[0] || 0,
        length: parts[1] || 0,
        height: parts[2] || 0
      };
    }
  }
  return null;
}

// 1. Read Capabilities from RAW content/ directory
const capabilityFiles = getMdFiles('capabilities');
const capabilitiesMap = {};

capabilityFiles.forEach(({ fileName, fullPath, relativePath }) => {
  const rawContent = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(rawContent);
  const id = data.id || fileName.replace(/\.md$/, '');

  capabilitiesMap[id] = {
    id: id,
    title: data.title || id,
    icon: data.icon || 'cpu',
    color: data.color || '#3B82F6',
    category: data.category || 'General Capability',
    summary: data.summary || '',
    body: processLucideShortcodes(content.trim()),
    relativePath: relativePath,
    tools: [],
    projects: []
  };
});

// 2. Read Tools from RAW content/ directory
const toolFiles = getMdFiles('tools');
const toolsMap = {};

toolFiles.forEach(({ fileName, fullPath, relativePath }) => {
  const rawContent = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(rawContent);
  const id = data.id || fileName.replace(/\.md$/, '');

  const toolObj = {
    id: id,
    title: data.title || id,
    capabilityId: data.capability || '',
    icon: data.icon || 'wrench',
    type: data.type || 'Equipment / Tool',
    dimensions: parseDimensions(data.dimensions || data.footprint),
    tags: Array.isArray(data.tags) ? data.tags : [],
    summary: data.summary || '',
    body: processLucideShortcodes(content.trim()),
    relativePath: relativePath,
    projects: []
  };

  toolsMap[id] = toolObj;

  // Add tool reference to capability
  if (data.capability && capabilitiesMap[data.capability]) {
    capabilitiesMap[data.capability].tools.push(id);
  } else if (data.capability) {
    console.warn(`⚠️ Tool '${id}' references unknown capability '${data.capability}'`);
  }
});

// 3. Read Projects from RAW content/ directory
const projectFiles = getMdFiles('projects');
const projectsMap = {};

projectFiles.forEach(({ fileName, fullPath, relativePath }) => {
  const rawContent = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(rawContent);
  const id = data.id || fileName.replace(/\.md$/, '');

  const toolIds = Array.isArray(data.tools) ? data.tools : [];
  const derivedCapabilityIds = new Set();

  toolIds.forEach(tId => {
    if (toolsMap[tId]) {
      // Link project to tool
      toolsMap[tId].projects.push(id);

      // Extract capability from tool
      const capId = toolsMap[tId].capabilityId;
      if (capId && capabilitiesMap[capId]) {
        derivedCapabilityIds.add(capId);
        // Link project to capability
        if (!capabilitiesMap[capId].projects.includes(id)) {
          capabilitiesMap[capId].projects.push(id);
        }
      }
    } else {
      console.warn(`⚠️ Project '${id}' references unknown tool '${tId}'`);
    }
  });

  projectsMap[id] = {
    id: id,
    title: data.title || id,
    icon: data.icon || 'folder-kanban',
    status: data.status || 'Active',
    lead: data.lead || 'DTC Team',
    tools: toolIds,
    capabilities: Array.from(derivedCapabilityIds),
    summary: data.summary || '',
    body: processLucideShortcodes(content.trim()),
    relativePath: relativePath
  };
});

// Write Compiled JSON for site consumption
fs.writeFileSync(outputFile, JSON.stringify({
  capabilities: Object.values(capabilitiesMap),
  tools: Object.values(toolsMap),
  projects: Object.values(projectsMap)
}, null, 2), 'utf8');

// Inject Bi-Directional Links ONLY into .build_content/ directory (leaving content/ 100% clean raw source!)
const LINK_HEADER_MARKER = '## Related Items';

function appendRelatedSectionToBuild(subFolder, fileId, newSectionContent) {
  const targetPath = path.join(buildContentDir, subFolder, `${fileId}.md`);
  if (!fs.existsSync(targetPath)) return;

  let rawContent = fs.readFileSync(targetPath, 'utf8');
  const updatedContent = rawContent.trimEnd() + '\n\n' + newSectionContent.trim() + '\n';
  fs.writeFileSync(targetPath, updatedContent, 'utf8');
}

// 1. Inject into Capability markdown files in .build_content/
Object.values(capabilitiesMap).forEach((cap) => {
  const relatedTools = cap.tools.map(tId => toolsMap[tId]).filter(Boolean);
  const relatedProjects = cap.projects.map(pId => projectsMap[pId]).filter(Boolean);

  let section = `${LINK_HEADER_MARKER}\n\n### <i data-lucide="wrench"></i> Associated Tools & Equipment\n`;
  if (relatedTools.length === 0) {
    section += '_No tools registered yet._\n\n';
  } else {
    relatedTools.forEach(t => {
      section += `- **[${t.title}](../tools/${t.id}.md)**: ${t.summary || t.type}\n`;
    });
    section += '\n';
  }

  section += `### <i data-lucide="folder-kanban"></i> Active Demonstrator Projects\n`;
  if (relatedProjects.length === 0) {
    section += '_No active projects linked yet._\n\n';
  } else {
    relatedProjects.forEach(p => {
      section += `- **[${p.title}](../projects/${p.id}.md)** (${p.status}) - _${p.lead}_\n`;
    });
    section += '\n';
  }

  appendRelatedSectionToBuild('capabilities', cap.id, section);
});

// 2. Inject into Tool markdown files in .build_content/
Object.values(toolsMap).forEach((tool) => {
  const parentCap = capabilitiesMap[tool.capabilityId];
  const relatedProjects = tool.projects.map(pId => projectsMap[pId]).filter(Boolean);

  let section = `${LINK_HEADER_MARKER}\n\n### <i data-lucide="layers"></i> Parent Capability\n`;
  if (parentCap) {
    section += `- **[${parentCap.title}](../capabilities/${parentCap.id}.md)**: ${parentCap.summary}\n\n`;
  } else {
    section += '_No capability assigned._\n\n';
  }

  section += `### <i data-lucide="folder-kanban"></i> Demonstrator Projects Using This Tool\n`;
  if (relatedProjects.length === 0) {
    section += '_Currently not assigned to any demonstrator projects._\n\n';
  } else {
    relatedProjects.forEach(p => {
      section += `- **[${p.title}](../projects/${p.id}.md)** (${p.status}) - _${p.lead}_\n`;
    });
    section += '\n';
  }

  appendRelatedSectionToBuild('tools', tool.id, section);
});

// 3. Inject into Project markdown files in .build_content/
Object.values(projectsMap).forEach((proj) => {
  const relatedTools = proj.tools.map(tId => toolsMap[tId]).filter(Boolean);

  let section = `${LINK_HEADER_MARKER}\n\n### <i data-lucide="layers"></i> Capabilities & Tools Used\n`;
  
  // Group tools by parent capability
  const toolsByCap = {};
  relatedTools.forEach(t => {
    const capId = t.capabilityId || 'other';
    if (!toolsByCap[capId]) toolsByCap[capId] = [];
    toolsByCap[capId].push(t);
  });

  if (Object.keys(toolsByCap).length === 0) {
    section += '_No tools or capabilities assigned yet._\n\n';
  } else {
    Object.keys(toolsByCap).forEach(capId => {
      const cap = capabilitiesMap[capId];
      const capLink = cap ? `**[${cap.title}](../capabilities/${cap.id}.md)**` : '**General Equipment**';
      
      section += `- ${capLink}\n`;
      toolsByCap[capId].forEach(t => {
        section += `  - **[${t.title}](../tools/${t.id}.md)** (${t.type}) - ${t.summary}\n`;
      });
    });
    section += '\n';
  }

  appendRelatedSectionToBuild('projects', proj.id, section);
});

// Auto-generate .build_content/capabilities/index.md Overview Directory
function generateCapabilitiesIndexMarkdown() {
  const capsList = Object.values(capabilitiesMap);
  let content = `# Capabilities Overview Directory\n\nThe Digital Transformation Center Model Shop offers 5 core physical and digital capabilities to support rapid prototyping, sensorization, inspection, and automated operations.\n\n| Icon | Capability Area | Category | Summary |\n| :---: | :--- | :--- | :--- |\n`;

  capsList.forEach(c => {
    const iconMarkup = formatIconMarkup(c.icon);
    content += `| ${iconMarkup} | **[${c.title}](${c.id}.md)** | ${c.category} | ${c.summary} |\n`;
  });

  fs.writeFileSync(path.join(buildContentDir, 'capabilities', 'index.md'), content, 'utf8');
}

// Auto-generate .build_content/tools/index.md Overview Directory
function generateToolsIndexMarkdown() {
  const toolsList = Object.values(toolsMap);
  let content = `# Tools & Equipment Directory\n\nComprehensive inventory of specialized fabrication, inspection, metrology, and prototyping tools available in the DTC Model Shop.\n\n| Tool / Equipment | Parent Capability | Classification / Type | Summary |\n| :--- | :--- | :--- | :--- |\n`;

  toolsList.forEach(t => {
    const parentCap = capabilitiesMap[t.capabilityId];
    const capCell = parentCap ? `[${parentCap.title}](../capabilities/${parentCap.id}.md)` : '-';
    content += `| **[${t.title}](${t.id}.md)** | ${capCell} | ${t.type} | ${t.summary} |\n`;
  });

  fs.writeFileSync(path.join(buildContentDir, 'tools', 'index.md'), content, 'utf8');
}

// Auto-generate .build_content/projects/index.md Overview Directory
function generateProjectsIndexMarkdown() {
  const projectsList = Object.values(projectsMap);
  let content = `# Demonstrator Projects Directory\n\nActive demonstrator projects showcasing integrated DTC capabilities, specialized equipment, and custom automation tooling.\n\n| Project Title | Status | Team Lead | Tools Used |\n| :--- | :---: | :--- | :---: |\n`;

  projectsList.forEach(p => {
    content += `| **[${p.title}](${p.id}.md)** | ${p.status} | ${p.lead} | ${p.tools.length} Tools |\n`;
  });

  fs.writeFileSync(path.join(buildContentDir, 'projects', 'index.md'), content, 'utf8');
}

// Auto-generate .build_content/index.md with Full Matrix Grid Table
function generateHomePageMarkdown() {
  const toolsList = Object.values(toolsMap);
  const projectsList = Object.values(projectsMap);
  const capsList = Object.values(capabilitiesMap);

  let tableHeader = '| Tool / Equipment | Capability |';
  let tableAlign = '| :--- | :--- |';

  projectsList.forEach(p => {
    const shortTitle = p.title.length > 18 ? p.title.substring(0, 16) + '…' : p.title;
    tableHeader += ` [${shortTitle}](projects/${p.id}.md) |`;
    tableAlign += ' :---: |';
  });

  let tableRows = '';
  toolsList.forEach(t => {
    const parentCap = capabilitiesMap[t.capabilityId];
    const capCell = parentCap ? `[${parentCap.title}](capabilities/${parentCap.id}.md)` : '-';
    
    let row = `| **[${t.title}](tools/${t.id}.md)** | ${capCell} |`;
    
    projectsList.forEach(p => {
      const isUsed = t.projects.includes(p.id) || p.tools.includes(t.id);
      row += isUsed ? ' **<span style="color: #10b981; font-size: 1.1em;">✓</span>** |' : ' <span style="color: #64748b;">-</span> |';
    });

    tableRows += row + '\n';
  });

  const indexMdContent = `# DTC Model Shop Capabilities & Projects Matrix

Welcome to the **Digital Transformation Center (DTC) Model Shop Capabilities Matrix**. This site provides an interactive, cross-referenced breakdown of physical capabilities, specialized equipment, and active demonstrator projects.

<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin: 1.5rem 0;">
  <a href="capabilities/" class="md-button">
    Explore Capabilities
  </a>
  <a href="tools/" class="md-button">
    View Tools Inventory
  </a>
  <a href="projects/" class="md-button">
    Browse Projects
  </a>
</div>

---

## Inventory & Project Metrics

| Metric | Total Count |
| :--- | :--- |
| **Core Capabilities** | **${capsList.length}** Areas |
| **Registered Tools & Equipment** | **${toolsList.length}** Items |
| **Active Demonstrator Projects** | **${projectsList.length}** Projects |

---

## Full Tools vs. Projects Matrix Table

The table below maps every **Tool & Equipment** item to the **Demonstrator Projects** that utilize it:

${tableHeader}
${tableAlign}
${tableRows}

---

## Capability Areas Directory

| Capability Area | Category | Summary |
| :--- | :--- | :--- |
${capsList.map(c => `| **[${c.title}](capabilities/${c.id}.md)** | ${c.category} | ${c.summary} |`).join('\n')}
`;

  fs.writeFileSync(path.join(buildContentDir, 'index.md'), indexMdContent, 'utf8');
}

// Generate all overview index pages dynamically inside .build_content/
generateCapabilitiesIndexMarkdown();
generateToolsIndexMarkdown();
generateProjectsIndexMarkdown();
generateHomePageMarkdown();

console.log(`✅ Built .build_content/ successfully! (${Object.keys(capabilitiesMap).length} capabilities, ${Object.keys(toolsMap).length} tools, ${Object.keys(projectsMap).length} projects)`);
