const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content');
const outputDir = path.join(rootDir, 'src', 'data');
const outputFile = path.join(outputDir, 'matrixData.json');

console.log('🔄 Compiling Markdown Matrix Data...');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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
console.log('⚙️ Populated public/site-config.js from site-config.json');

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

// Generate content/site-config.js for MkDocs site output
const contentSiteConfigJsPath = path.join(contentDir, 'site-config.js');
fs.writeFileSync(contentSiteConfigJsPath, siteConfigJsContent, 'utf8');

// Ensure admin files are copied to content/admin and public/admin for MkDocs/Vite build output
const adminSrc = path.join(rootDir, 'admin');
const adminContent = path.join(contentDir, 'admin');
const adminPublic = path.join(rootDir, 'public', 'admin');
if (fs.existsSync(adminSrc)) {
  fs.mkdirSync(adminContent, { recursive: true });
  fs.cpSync(adminSrc, adminContent, { recursive: true });
  fs.mkdirSync(adminPublic, { recursive: true });
  fs.cpSync(adminSrc, adminPublic, { recursive: true });
  console.log('📁 Synced /admin directory to /content/admin for MkDocs build output.');
}

// Helper to format icon markup (Lucide or Material)
function formatIconMarkup(iconStr) {
  if (!iconStr) return '<i data-lucide="cpu"></i>';
  let str = String(iconStr).trim();
  if (str.startsWith(':') && str.endsWith(':')) return str;
  if (str.includes('/')) {
    str = str.replace(/\//g, '-');
    return `:${str}:`;
  }
  return `<i data-lucide="${str}"></i>`;
}

// Helper to safely list markdown files in a subfolder
function getMdFiles(subDir) {
  const targetDir = path.join(contentDir, subDir);
  if (!fs.existsSync(targetDir)) return [];
  return fs.readdirSync(targetDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      fileName: f,
      fullPath: path.join(targetDir, f),
      relativePath: `content/${subDir}/${f}`
    }));
}

// Helper to parse dimensions (width, length, height in mm)
function parseDimensions(dim) {
  if (!dim) return null;
  if (typeof dim === 'object' && !Array.isArray(dim)) {
    const w = parseFloat(dim.width || dim.w || 0);
    const l = parseFloat(dim.length || dim.l || 0);
    const h = parseFloat(dim.height || dim.h || 0);
    if (w || l || h) return { width: w, length: l, height: h };
  }
  if (typeof dim === 'string') {
    // Parse "650 x 1100 x 1450" or "650, 1100, 1450"
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

// 1. Read Capabilities
const capabilityFiles = getMdFiles('capabilities');
const capabilitiesMap = {};

capabilityFiles.forEach(({ fileName, fullPath, relativePath }) => {
  const rawContent = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(rawContent);
  const id = data.id || fileName.replace(/\.md$/, '');

  capabilitiesMap[id] = {
    id: id,
    title: data.title || id,
    icon: data.icon || 'Cpu',
    color: data.color || '#3B82F6',
    category: data.category || 'General Capability',
    summary: data.summary || '',
    body: content.trim(),
    relativePath: relativePath,
    tools: [],
    projects: []
  };
});

// 2. Read Tools
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
    type: data.type || 'Equipment / Tool',
    dimensions: parseDimensions(data.dimensions || data.footprint),
    tags: Array.isArray(data.tags) ? data.tags : [],
    summary: data.summary || '',
    body: content.trim(),
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

// 3. Read Projects
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
    status: data.status || 'Active',
    lead: data.lead || 'DTC Team',
    tools: toolIds,
    capabilities: Array.from(derivedCapabilityIds),
    summary: data.summary || '',
    body: content.trim(),
    relativePath: relativePath
  };
});

// Inject Bi-Directional Links into Markdown files for MkDocs cross-referencing
const LINK_HEADER_MARKER = '## Related Items';
const EMOJI_LINK_HEADER_MARKER = '## 🔗 Related Items';

function appendOrReplaceRelatedSection(filePath, newSectionContent) {
  let rawContent = fs.readFileSync(filePath, 'utf8');
  
  const idx1 = rawContent.indexOf('## Related Items');
  const idx2 = rawContent.indexOf('## 🔗 Related Items');
  
  let markerIndex = -1;
  if (idx1 !== -1 && idx2 !== -1) {
    markerIndex = Math.min(idx1, idx2);
  } else if (idx1 !== -1) {
    markerIndex = idx1;
  } else if (idx2 !== -1) {
    markerIndex = idx2;
  }

  if (markerIndex !== -1) {
    rawContent = rawContent.substring(0, markerIndex).trimEnd();
  }
  const updatedContent = rawContent.trimEnd() + '\n\n' + newSectionContent.trim() + '\n';
  fs.writeFileSync(filePath, updatedContent, 'utf8');
}

// Strip related sections from overview index pages
function stripRelatedSection(filePath) {
  if (!fs.existsSync(filePath)) return;
  let rawContent = fs.readFileSync(filePath, 'utf8');
  const idx1 = rawContent.indexOf('## Related Items');
  const idx2 = rawContent.indexOf('## 🔗 Related Items');
  let markerIndex = -1;
  if (idx1 !== -1 && idx2 !== -1) {
    markerIndex = Math.min(idx1, idx2);
  } else if (idx1 !== -1) {
    markerIndex = idx1;
  } else if (idx2 !== -1) {
    markerIndex = idx2;
  }

  if (markerIndex !== -1) {
    rawContent = rawContent.substring(0, markerIndex).trimEnd() + '\n';
    fs.writeFileSync(filePath, rawContent, 'utf8');
  }
}

['capabilities/index.md', 'tools/index.md', 'projects/index.md', 'index.md'].forEach(file => {
  stripRelatedSection(path.join(contentDir, file));
});

// 1. Inject into Capability markdown files
Object.values(capabilitiesMap).forEach((cap) => {
  if (cap.id === 'index') return;
  const filePath = path.join(contentDir, 'capabilities', `${cap.id}.md`);
  if (!fs.existsSync(filePath)) return;

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

  appendOrReplaceRelatedSection(filePath, section);
});

// 2. Inject into Tool markdown files
Object.values(toolsMap).forEach((tool) => {
  if (tool.id === 'index') return;
  const filePath = path.join(contentDir, 'tools', `${tool.id}.md`);
  if (!fs.existsSync(filePath)) return;

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

  appendOrReplaceRelatedSection(filePath, section);
});

// 3. Inject into Project markdown files
Object.values(projectsMap).forEach((proj) => {
  if (proj.id === 'index') return;
  const filePath = path.join(contentDir, 'projects', `${proj.id}.md`);
  if (!fs.existsSync(filePath)) return;

  const relatedTools = proj.tools.map(tId => toolsMap[tId]).filter(Boolean);
  const relatedCaps = proj.capabilities.map(cId => capabilitiesMap[cId]).filter(Boolean);

  let section = `${LINK_HEADER_MARKER}\n\n### <i data-lucide="wrench"></i> Tools & Equipment Used\n`;
  if (relatedTools.length === 0) {
    section += '_No tools specified._\n\n';
  } else {
    relatedTools.forEach(t => {
      section += `- **[${t.title}](../tools/${t.id}.md)** (${t.type}) - ${t.summary}\n`;
    });
    section += '\n';
  }

  section += `### <i data-lucide="layers"></i> Capabilities Supported\n`;
  if (relatedCaps.length === 0) {
    section += '_No capabilities derived._\n\n';
  } else {
    relatedCaps.forEach(c => {
      section += `- **[${c.title}](../capabilities/${c.id}.md)**: ${c.summary}\n`;
    });
    section += '\n';
  }

  appendOrReplaceRelatedSection(filePath, section);
});

// Auto-generate content/index.md with Full Matrix Grid Table
function generateIndexPageMarkdown() {
  const toolsList = Object.values(toolsMap).filter(t => t.id !== 'index');
  const projectsList = Object.values(projectsMap).filter(p => p.id !== 'index');
  const capsList = Object.values(capabilitiesMap).filter(c => c.id !== 'index');

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

  fs.writeFileSync(path.join(contentDir, 'index.md'), indexMdContent, 'utf8');
}

generateIndexPageMarkdown();

const outputData = {
  compiledAt: new Date().toISOString(),
  capabilities: Object.values(capabilitiesMap),
  tools: Object.values(toolsMap),
  projects: Object.values(projectsMap)
};

fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf8');
console.log(`✅ Matrix Data compiled & bi-directional links + Full Matrix Table injected successfully! (${outputData.capabilities.length} capabilities, ${outputData.tools.length} tools, ${outputData.projects.length} projects)`);



