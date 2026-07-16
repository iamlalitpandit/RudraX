import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { parseEnv } from 'node:util';

function expandPath(value, homeDir) {
  if (!value) return undefined;
  if (value === '~') return homeDir;
  if (value.startsWith('~/')) return join(homeDir, value.slice(2));
  return isAbsolute(value) ? value : value;
}

/**
 * Load RudraX environment files without overwriting variables supplied by the
 * parent process. File precedence is project > agent > user config.
 *
 * Values are never logged. The returned array contains only loaded file paths.
 */
export function loadRudraXEnvironment({ cwd = process.cwd(), homeDir = homedir() } = {}) {
  const processKeys = new Set(Object.keys(process.env));
  const loaded = [];

  const applyFile = (path) => {
    if (!existsSync(path)) return;
    const values = parseEnv(readFileSync(path, 'utf8'));
    for (const [key, value] of Object.entries(values)) {
      if (!processKeys.has(key) && value.trim() !== '') process.env[key] = value;
    }
    loaded.push(path);
  };

  const userEnv = join(homeDir, '.rudrax', '.env');
  applyFile(userEnv);

  const configuredAgentDir = expandPath(process.env.RUDRAX_CODING_AGENT_DIR, homeDir);
  const agentDir = configuredAgentDir || join(homeDir, '.rudrax', 'agent');
  const agentEnv = join(agentDir, '.env');
  if (agentEnv !== userEnv) applyFile(agentEnv);

  const projectEnv = join(cwd, '.env');
  if (projectEnv !== userEnv && projectEnv !== agentEnv) applyFile(projectEnv);

  return loaded;
}
