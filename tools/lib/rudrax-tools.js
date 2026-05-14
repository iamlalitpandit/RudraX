/**
 * RudraX Tools - Systematic API
 * 
 * Categories:
 *   🤖 ai-assistants  - AI coding & reasoning tools
 *   💻 ide             - Development environments
 *   🔍 search          - Code search & utilities
 *   🔌 adapters        - Integration bridges
 */

import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TOOLS_ROOT = join(__dirname, '..');

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG_PATH = join(TOOLS_ROOT, 'rudrax-tools.json');
let toolConfig = null;
try {
  toolConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
} catch (e) {
  console.warn('⚠️  Could not load rudrax-tools.json');
}

// ─── Path Resolution ─────────────────────────────────────────────────────────

const TOOL_PATHS = {
  codex: join(TOOLS_ROOT, 'integrated/codex/linux-x64/bin/codex'),
  claude: join(TOOLS_ROOT, 'integrated/claude-code/linux-x64/bin/claude'),
  codeServer: join(TOOLS_ROOT, 'integrated/code-server/linux-x64/bin/code-server'),
  ripgrep: join(TOOLS_ROOT, 'integrated/codex/linux-x64/bin/rg'),
};

// ─── Category Registry ──────────────────────────────────────────────────────

const CATEGORIES = {
  'ai-assistants': {
    label: '🤖 AI Assistants',
    description: 'AI-powered coding and reasoning assistants',
    tools: ['codex', 'claude', 'ollama'],
  },
  'ide': {
    label: '💻 IDE & Server',
    description: 'Development environments and web servers',
    tools: ['code-server'],
  },
  'search': {
    label: '🔍 Search & Utility',
    description: 'Code search, analysis, and utility tools',
    tools: ['ripgrep'],
  },
  'adapters': {
    label: '🔌 Adapters & Integration',
    description: 'Integration bridges between AI tools and RudraX',
    tools: ['codex-adapter', 'claude-adapter'],
  },
};

// ─── Tool Metadata ──────────────────────────────────────────────────────────

const TOOL_META = {
  codex: {
    name: 'OpenAI Codex CLI',
    type: 'cli',
    category: 'ai-assistants',
    tags: ['ai', 'coding', 'openai'],
  },
  claude: {
    name: 'Claude Code CLI',
    type: 'cli',
    category: 'ai-assistants',
    tags: ['ai', 'coding', 'anthropic'],
  },
  ollama: {
    name: 'Ollama Bridge',
    type: 'api',
    category: 'ai-assistants',
    tags: ['ai', 'ollama', 'local-llm'],
  },
  codeServer: {
    name: 'VS Code Server',
    type: 'web-ide',
    category: 'ide',
    tags: ['ide', 'vscode', 'web'],
  },
  ripgrep: {
    name: 'Ripgrep',
    type: 'utility',
    category: 'search',
    tags: ['search', 'grep', 'utility'],
  },
  codexAdapter: {
    name: 'Codex Integration Adapter',
    type: 'adapter',
    category: 'adapters',
    tags: ['adapter', 'codex', 'integration'],
  },
  claudeAdapter: {
    name: 'Claude Code Adapter',
    type: 'adapter',
    category: 'adapters',
    tags: ['adapter', 'claude', 'integration'],
  },
};

// ─── RudraXTools Class ─────────────────────────────────────────────────────

export class RudraXTools {
  constructor() {
    this.toolsRoot = TOOLS_ROOT;
    this.config = toolConfig;
    this.ollamaEndpoint = toolConfig?.config?.ollama?.endpoint || 'http://172.31.32.172:11434';
    this.ollamaDefaultModel = toolConfig?.config?.ollama?.defaultModel || 'kimi-k2.6:cloud';
  }

  // ─── Tool Availability ──────────────────────────────────────────────────────

  isAvailable(toolName) {
    const path = TOOL_PATHS[toolName];
    if (!path) return toolName === 'ollama'; // Ollama is API-based
    try {
      execSync(`test -f "${path}"`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  getAvailableTools() {
    const available = {};
    for (const [key] of TOOL_PATHS) {
      available[key] = this.isAvailable(key);
    }
    available.ollama = true;
    return available;
  }

  // ─── Category API ──────────────────────────────────────────────────────────

  getCategories() {
    return CATEGORIES;
  }

  getToolsByCategory(category) {
    const cat = CATEGORIES[category];
    if (!cat) return [];
    return cat.tools.filter(t => {
      if (t === 'codex-adapter' || t === 'claude-adapter' || t === 'ollama') return true;
      const key = t === 'code-server' ? 'codeServer' : 
                  t === 'codex-adapter' ? 'codexAdapter' : 
                  t === 'claude-adapter' ? 'claudeAdapter' : t;
      return this.isAvailable(key);
    });
  }

  getAllCategorized() {
    const result = {};
    for (const [catKey, cat] of Object.entries(CATEGORIES)) {
      result[catKey] = {
        ...cat,
        tools: cat.tools.map(t => ({
          id: t,
          ...(TOOL_META[t === 'code-server' ? 'codeServer' : t === 'codex-adapter' ? 'codexAdapter' : t === 'claude-adapter' ? 'claudeAdapter' : t] || {}),
          available: this.isAvailable(t === 'code-server' ? 'codeServer' : t === 'codex-adapter' ? 'codexAdapter' : t === 'claude-adapter' ? 'claudeAdapter' : t),
        }))
      };
    }
    return result;
  }

  // ─── AI Assistants ─────────────────────────────────────────────────────────

  async launchCodex(args = [], options = {}) {
    const codexPath = TOOL_PATHS.codex;
    return this._spawnTool(codexPath, args, {
      ...options,
      env: { ...process.env, OLLAMA_HOST: this.ollamaEndpoint, ...options.env }
    });
  }

  async launchClaude(args = [], options = {}) {
    const claudePath = TOOL_PATHS.claude;
    return this._spawnTool(claudePath, args, {
      ...options,
      env: { ...process.env, OLLAMA_HOST: this.ollamaEndpoint, ...options.env }
    });
  }

  async ollamaGenerate(prompt, model = null) {
    const targetModel = model || this.ollamaDefaultModel;
    const response = await fetch(`${this.ollamaEndpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: targetModel, prompt, stream: false })
    });
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async getOllamaModels() {
    try {
      const response = await fetch(`${this.ollamaEndpoint}/api/tags`);
      const data = await response.json();
      return data.models || [];
    } catch (e) {
      console.error('Failed to fetch Ollama models:', e.message);
      return [];
    }
  }

  // ─── IDE & Server ───────────────────────────────────────────────────────────

  async launchCodeServer(port = 8080, bindAddr = '127.0.0.1', options = {}) {
    const serverPath = TOOL_PATHS.codeServer;
    const configDir = join(TOOLS_ROOT, '.code-server-config');
    
    return this._spawnTool(serverPath, [
      '--bind-addr', `${bindAddr}:${port}`,
      '--config', join(configDir, 'config.yaml'),
      ...(options.additionalArgs || [])
    ], {
      ...options,
      env: { ...process.env, CODE_SERVER_CONFIG: join(configDir, 'config.yaml'), ...options.env }
    });
  }

  // ─── Search & Utility ──────────────────────────────────────────────────────

  rg(pattern, path = '.', options = {}) {
    const rgPath = TOOL_PATHS.ripgrep;
    const args = [pattern, path];
    if (options.ignoreCase) args.unshift('-i');
    if (options.filesWithMatches) args.unshift('-l');
    if (options.lineNumber) args.unshift('-n');
    
    try {
      return execSync(`"${rgPath}" ${args.join(' ')}`, {
        encoding: 'utf8',
        cwd: options.cwd || process.cwd(),
        maxBuffer: 1024 * 1024 * 10
      });
    } catch (e) {
      if (e.status === 1) return '';
      throw e;
    }
  }

  // ─── Adapters ──────────────────────────────────────────────────────────────

  async loadCodexAdapter() {
    const adapterPath = join(TOOLS_ROOT, 'integrated/@orchids/codex-adapter/dist/index.js');
    try {
      return await import(adapterPath);
    } catch (e) {
      throw new Error(`Failed to load Codex adapter: ${e.message}`);
    }
  }

  async loadClaudeAdapter() {
    const adapterPath = join(TOOLS_ROOT, 'integrated/@orchids/claude-code-adapter/dist/index.js');
    try {
      return await import(adapterPath);
    } catch (e) {
      throw new Error(`Failed to load Claude adapter: ${e.message}`);
    }
  }

  // ─── AIOS Helpers ───────────────────────────────────────────────────────────

  getAgents() {
    return toolConfig?.agents || {};
  }

  getAgentCategories() {
    const agents = this.getAgents();
    const result = {};
    for (const [catKey, cat] of Object.entries(agents)) {
      if (catKey === '_meta') continue;
      if (!cat.agents) continue;
      result[catKey] = {
        label: cat.label,
        agents: Object.entries(cat.agents).map(([id, agent]) => ({
          id,
          ...agent,
        }))
      };
    }
    return result;
  }

  getTaskCategories() {
    const tasks = toolConfig?.tasks || {};
    const result = {};
    for (const [catKey, cat] of Object.entries(tasks)) {
      if (catKey === '_meta') continue;
      result[catKey] = {
        label: cat.label,
        tasks: cat.tasks
      };
    }
    return result;
  }

  getWorkflows() {
    const workflows = toolConfig?.workflows || {};
    const result = {};
    for (const [catKey, cat] of Object.entries(workflows)) {
      if (catKey === '_meta') continue;
      result[catKey] = {
        label: cat.label,
        workflows: cat.workflows
      };
    }
    return result;
  }

  getSquads() {
    const squads = toolConfig?.squads || {};
    const result = {};
    for (const [id, squad] of Object.entries(squads)) {
      if (id === '_meta') continue;
      result[id] = squad;
    }
    return result;
  }

  getCoreTools() {
    return toolConfig?.coreTools || {};
  }

  // ─── Status & Info ──────────────────────────────────────────────────────────

  getStatus() {
    const available = this.getAvailableTools();
    const categorized = this.getAllCategorized();
    return {
      tools: available,
      categories: categorized,
      config: {
        ollamaEndpoint: this.ollamaEndpoint,
        ollamaDefaultModel: this.ollamaDefaultModel,
      },
      agents: this.getAgentCategories(),
      tasks: this.getTaskCategories(),
      workflows: this.getWorkflows(),
      squads: this.getSquads(),
      coreTools: this.getCoreTools(),
    };
  }

  // ─── Internal Helpers ───────────────────────────────────────────────────────

  _spawnTool(command, args, options) {
    return spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
      ...options
    });
  }
}

// ─── Singleton & CLI ─────────────────────────────────────────────────────────

export const rudraxTools = new RudraXTools();

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tools = new RudraXTools();
  const command = process.argv[2];
  
  const help = `
🔧 RudraX Tools v2.0

Usage: rudrax tools <command> [options]

🤖 AI Assistants:
  codex [args...]          Launch OpenAI Codex CLI
  claude [args...]         Launch Claude Code CLI
  ollama <prompt>          Send prompt to Ollama
  models                   List available Ollama models

💻 IDE & Server:
  server [port]            Launch Code-Server (default: 8080)

🔍 Search & Utility:
  rg <pattern> [path]      Run Ripgrep search

📋 Info & Status:
  status                   Show all tools & availability
  categories               Show tool categories
  agents                   Show AIOS agent registry
  tasks                    Show AIOS task categories
  workflows                Show AIOS workflows
  squads                   Show AIOS squad configurations
  adapters                 Show adapter info
  help                     Show this help message

Examples:
  rudrax tools codex --help
  rudrax tools server 9090
  rudrax tools rg "function" ./src
  rudrax tools ollama "Write a Python function"
  rudrax tools models
`;

  async function main() {
    switch (command) {
      case 'codex':
        await tools.launchCodex(process.argv.slice(3));
        break;

      case 'claude':
        await tools.launchClaude(process.argv.slice(3));
        break;

      case 'server': {
        const port = process.argv[3] || 8080;
        console.log(`💻 Starting Code-Server on port ${port}...`);
        await tools.launchCodeServer(port);
        break;
      }

      case 'rg': {
        const pattern = process.argv[3];
        const path = process.argv[4] || '.';
        if (!pattern) {
          console.error('❌ Usage: rudrax tools rg <pattern> [path]');
          process.exit(1);
        }
        const results = tools.rg(pattern, path);
        console.log(results);
        break;
      }

      case 'ollama': {
        const prompt = process.argv.slice(3).join(' ');
        if (!prompt) {
          console.error('❌ Usage: rudrax tools ollama <prompt>');
          process.exit(1);
        }
        try {
          const response = await tools.ollamaGenerate(prompt);
          console.log('\n🤖 Response:\n');
          console.log(response.response);
        } catch (e) {
          console.error('❌ Error:', e.message);
          process.exit(1);
        }
        break;
      }

      case 'models': {
        try {
          const models = await tools.getOllamaModels();
          console.log('\n📦 Available Ollama Models:\n');
          models.forEach(m => {
            console.log(`  • ${m.name} (${m.details?.parameter_size || 'unknown'})`);
          });
        } catch (e) {
          console.error('❌ Error fetching models:', e.message);
          process.exit(1);
        }
        break;
      }

      case 'status': {
        console.log('\n🔧 RudraX Tools Status\n');
        const categorized = tools.getAllCategorized();
        
        for (const [catKey, cat] of Object.entries(categorized)) {
          console.log(`\n${cat.label}`);
          console.log(`  ${cat.description}`);
          for (const tool of cat.tools) {
            console.log(`    ${tool.available ? '✅' : '❌'} ${tool.id} — ${tool.name || tool.id}`);
          }
        }
        console.log(`\n🌐 Ollama Endpoint: ${tools.ollamaEndpoint}`);
        console.log(`🤖 Default Model: ${tools.ollamaDefaultModel}`);
        break;
      }

      case 'categories': {
        const categories = tools.getCategories();
        console.log('\n📁 Tool Categories\n');
        for (const [key, cat] of Object.entries(categories)) {
          console.log(`  ${cat.label}`);
          console.log(`    ${cat.description}`);
          console.log(`    Tools: ${cat.tools.join(', ')}`);
        }
        break;
      }

      case 'agents': {
        const agentCats = tools.getAgentCategories();
        console.log('\n👥 AIOS Agent Registry\n');
        for (const [catKey, cat] of Object.entries(agentCats)) {
          console.log(`\n  ${cat.label}`);
          for (const agent of cat.agents) {
            console.log(`    ${agent.icon} ${agent.id} — ${agent.name}`);
            console.log(`       ${agent.description}`);
          }
        }
        break;
      }

      case 'tasks': {
        const taskCats = tools.getTaskCategories();
        console.log('\n📋 AIOS Task Categories\n');
        for (const [catKey, cat] of Object.entries(taskCats)) {
          console.log(`\n  ${cat.label} (${cat.tasks.length} tasks)`);
          for (const task of cat.tasks) {
            console.log(`    • ${task}`);
          }
        }
        break;
      }

      case 'workflows': {
        const workflowCats = tools.getWorkflows();
        console.log('\n🔄 AIOS Workflows\n');
        for (const [catKey, cat] of Object.entries(workflowCats)) {
          console.log(`\n  ${cat.label}`);
          for (const wf of cat.workflows) {
            console.log(`    🔄 ${wf.name} (${wf.id})`);
            console.log(`       ${wf.description}`);
          }
        }
        break;
      }

      case 'squads': {
        const squads = tools.getSquads();
        console.log('\n👥 AIOS Squad Configurations\n');
        for (const [id, squad] of Object.entries(squads)) {
          console.log(`  ${squad.icon} ${squad.name} (${id})`);
          console.log(`     ${squad.description}`);
        }
        break;
      }

      case 'adapters':
        console.log('\n🔌 Integration Adapters\n');
        console.log('  📦 Codex Adapter:');
        console.log('     Path: integrated/@orchids/codex-adapter/');
        console.log('  📦 Claude Adapter:');
        console.log('     Path: integrated/@orchids/claude-code-adapter/');
        console.log('\n  Import in code:');
        console.log('    import { rudraxTools } from "./tools/lib/rudrax-tools.js"');
        console.log('    const adapter = await rudraxTools.loadCodexAdapter();');
        break;

      case 'help':
      default:
        console.log(help);
    }
  }

  main().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  });
}