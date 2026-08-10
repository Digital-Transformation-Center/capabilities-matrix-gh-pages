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

// Ensure admin files are copied to public/admin for Vite build output
const adminSrc = path.join(rootDir, 'admin');
const adminPublic = path.join(rootDir, 'public', 'admin');
if (fs.existsSync(adminSrc)) {
  fs.mkdirSync(adminPublic, { recursive: true });
  fs.cpSync(adminSrc, adminPublic, { recursive: true });
  console.log('📁 Synced /admin directory to /public/admin for build output.');
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

const outputData = {
  compiledAt: new Date().toISOString(),
  capabilities: Object.values(capabilitiesMap),
  tools: Object.values(toolsMap),
  projects: Object.values(projectsMap)
};

fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf8');
console.log(`✅ Matrix Data compiled successfully! (${outputData.capabilities.length} capabilities, ${outputData.tools.length} tools, ${outputData.projects.length} projects)`);

