import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadRudraXEnvironment } from '../../lib/core/env-loader.js';

const touched = new Map();
function remember(key) {
  if (!touched.has(key)) touched.set(key, process.env[key]);
}
afterEach(() => {
  for (const [key, value] of touched) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  touched.clear();
});

describe('RudraX environment loading', () => {
  it('loads global, agent, and project env files with project precedence', () => {
    const root = mkdtempSync(join(tmpdir(), 'rudrax-env-'));
    const home = join(root, 'home');
    const cwd = join(root, 'project');
    const agentDir = join(home, '.rudrax', 'agent');
    mkdirSync(agentDir, { recursive: true });
    mkdirSync(cwd, { recursive: true });
    writeFileSync(join(home, '.rudrax', '.env'), 'RUDRAX_TEST_VALUE=global\nRUDRAX_GLOBAL_ONLY=yes\n');
    writeFileSync(join(agentDir, '.env'), 'RUDRAX_TEST_VALUE=agent\nRUDRAX_AGENT_ONLY=yes\n');
    writeFileSync(join(cwd, '.env'), 'RUDRAX_TEST_VALUE=project\nRUDRAX_PROJECT_ONLY=yes\n');
    for (const key of ['RUDRAX_TEST_VALUE','RUDRAX_GLOBAL_ONLY','RUDRAX_AGENT_ONLY','RUDRAX_PROJECT_ONLY']) {
      remember(key);
      delete process.env[key];
    }

    const loaded = loadRudraXEnvironment({ cwd, homeDir: home });

    expect(process.env.RUDRAX_TEST_VALUE).toBe('project');
    expect(process.env.RUDRAX_GLOBAL_ONLY).toBe('yes');
    expect(process.env.RUDRAX_AGENT_ONLY).toBe('yes');
    expect(process.env.RUDRAX_PROJECT_ONLY).toBe('yes');
    expect(loaded).toEqual([join(home, '.rudrax', '.env'), join(agentDir, '.env'), join(cwd, '.env')]);
  });

  it('ignores blank placeholders instead of erasing configured values', () => {
    const root = mkdtempSync(join(tmpdir(), 'rudrax-env-blank-'));
    const home = join(root, 'home');
    const cwd = join(root, 'project');
    const agentDir = join(home, '.rudrax', 'agent');
    mkdirSync(agentDir, { recursive: true });
    mkdirSync(cwd, { recursive: true });
    writeFileSync(join(agentDir, '.env'), 'AZURE_FOUNDRY_API_KEY=configured\nAZURE_FOUNDRY_DEPLOYMENT=deployment-a\n');
    writeFileSync(join(cwd, '.env'), 'AZURE_FOUNDRY_API_KEY=\nAZURE_FOUNDRY_DEPLOYMENT=\n');
    for (const key of ['AZURE_FOUNDRY_API_KEY','AZURE_FOUNDRY_DEPLOYMENT']) {
      remember(key);
      delete process.env[key];
    }

    loadRudraXEnvironment({ cwd, homeDir: home });

    expect(process.env.AZURE_FOUNDRY_API_KEY).toBe('configured');
    expect(process.env.AZURE_FOUNDRY_DEPLOYMENT).toBe('deployment-a');
  });

  it('never overrides variables already supplied by the process', () => {
    const root = mkdtempSync(join(tmpdir(), 'rudrax-env-process-'));
    const home = join(root, 'home');
    const cwd = join(root, 'project');
    mkdirSync(join(home, '.rudrax'), { recursive: true });
    mkdirSync(cwd, { recursive: true });
    writeFileSync(join(home, '.rudrax', '.env'), 'RUDRAX_PROCESS_WINS=file\n');
    remember('RUDRAX_PROCESS_WINS');
    process.env.RUDRAX_PROCESS_WINS = 'process';

    loadRudraXEnvironment({ cwd, homeDir: home });

    expect(process.env.RUDRAX_PROCESS_WINS).toBe('process');
  });
});
