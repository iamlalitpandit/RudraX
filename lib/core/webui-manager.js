/**
 * RudraX WebUI Manager — Auto-starts WebUI as a background daemon
 *
 * Spawns the WebUI server as a detached child process when RudraX starts.
 * Manages lifecycle: start, stop, status, port detection.
 *
 * Usage (automatic):
 *   When RudraX TUI starts, WebUI auto-starts in the background.
 *
 * Manual commands:
 *   /webui start    — Start WebUI daemon
 *   /webui stop     — Stop WebUI daemon
 *   /webui status   — Check if WebUI is running
 *   /webui restart  — Restart WebUI daemon
 */

import { spawn } from 'child_process';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');

const DEFAULT_PORT = 5555;
const PID_FILE = join(homedir(), '.rudrax', 'webui.pid');
const PORT_FILE = join(homedir(), '.rudrax', 'webui.port');
const LOG_FILE = join(homedir(), '.rudrax', 'webui.log');

/**
 * Check if a port is already in use
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port);
  });
}

/**
 * Read the PID of the running WebUI process
 */
function getPid() {
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
    if (isNaN(pid)) return null;
    // Check if process is actually running
    try {
      process.kill(pid, 0); // Signal 0 = check existence
      return pid;
    } catch {
      // Process not running, clean up stale PID file
      fs.unlinkSync(PID_FILE);
      try { fs.unlinkSync(PORT_FILE); } catch {}
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Read the port of the running WebUI process
 */
function getPort() {
  try {
    const port = parseInt(fs.readFileSync(PORT_FILE, 'utf-8').trim(), 10);
    return isNaN(port) ? null : port;
  } catch {
    return null;
  }
}

/**
 * Check if WebUI is currently running
 */
export async function isRunning() {
  const pid = getPid();
  if (!pid) return false;
  const port = getPort();
  if (!port) return false;
  return await isPortInUse(port);
}

/**
 * Get WebUI status info
 */
export async function getStatus() {
  const pid = getPid();
  const port = getPort();
  if (!pid) {
    return { running: false, pid: null, port: null, url: null };
  }
  const portActive = await isPortInUse(port || DEFAULT_PORT);
  if (!portActive) {
    // Stale process
    return { running: false, pid: null, port: null, url: null };
  }
  return {
    running: true,
    pid,
    port,
    url: `http://localhost:${port}`,
  };
}

/**
 * Start WebUI server as a background daemon
 */
export async function startWebUI(options = {}) {
  const port = options.port || DEFAULT_PORT;

  // Check if already running
  const status = await getStatus();
  if (status.running) {
    return { ok: true, message: `WebUI already running on ${status.url} (PID: ${status.pid})`, port: status.port, pid: status.pid, url: status.url };
  }

  // Check if port is taken by something else
  const portInUse = await isPortInUse(port);
  if (portInUse) {
    // Port is taken but not by our process — try next port
    for (let p = port + 1; p < port + 10; p++) {
      if (!(await isPortInUse(p))) {
        return startWebUI({ ...options, port: p });
      }
    }
    return { ok: false, message: `Port ${port} is already in use and no available ports found`, port: null, pid: null, url: null };
  }

  // Ensure log directory exists
  const logDir = dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Spawn WebUI as detached background process
  const env = {
    ...process.env,
    RUDRAX_WEBUI_PORT: String(port),
    RUDRAX_WEBUI_CHILD: '1',
  };

  const serverPath = join(ROOT_DIR, 'webui', 'server.js');

  const child = spawn(process.execPath, [serverPath], {
    env,
    detached: true,
    stdio: ['ignore', fs.openSync(LOG_FILE, 'a'), fs.openSync(LOG_FILE, 'a')],
    cwd: ROOT_DIR,
  });

  child.unref(); // Let the child run independently

  // Write PID and port files
  fs.writeFileSync(PID_FILE, String(child.pid));
  fs.writeFileSync(PORT_FILE, String(port));

  // Wait for server to be ready (up to 5 seconds)
  let ready = false;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    if (await isPortInUse(port)) {
      ready = true;
      break;
    }
  }

  if (ready) {
    return {
      ok: true,
      message: `🔥 WebUI started on http://localhost:${port} (PID: ${child.pid})`,
      port,
      pid: child.pid,
      url: `http://localhost:${port}`,
    };
  } else {
    return {
      ok: false,
      message: `WebUI process started (PID: ${child.pid}) but port ${port} not responding yet. Check ${LOG_FILE}`,
      port,
      pid: child.pid,
      url: null,
    };
  }
}

/**
 * Stop WebUI server
 */
export async function stopWebUI() {
  const pid = getPid();
  if (!pid) {
    return { ok: true, message: 'WebUI is not running' };
  }

  try {
    process.kill(pid, 'SIGTERM');

    // Wait for process to exit (up to 3 seconds)
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        process.kill(pid, 0);
      } catch {
        // Process exited
        break;
      }
    }

    // Force kill if still running
    try {
      process.kill(pid, 'SIGKILL');
    } catch {}

    // Clean up files
    try { fs.unlinkSync(PID_FILE); } catch {}
    try { fs.unlinkSync(PORT_FILE); } catch {}

    return { ok: true, message: `WebUI stopped (killed PID ${pid})` };
  } catch (e) {
    // Process already dead
    try { fs.unlinkSync(PID_FILE); } catch {}
    try { fs.unlinkSync(PORT_FILE); } catch {}
    return { ok: true, message: 'WebUI process was already stopped' };
  }
}

/**
 * Restart WebUI server
 */
export async function restartWebUI(options = {}) {
  await stopWebUI();
  await new Promise(r => setTimeout(r, 500));
  return startWebUI(options);
}

/**
 * Auto-start WebUI when RudraX starts (called from InteractiveMode.init)
 * Respects user settings: won't start if explicitly disabled
 */
export async function autoStartWebUI() {
  const settings = loadWebUISettings();

  if (settings.enabled === false) {
    return null; // User disabled auto-start
  }

  const status = await getStatus();
  if (status.running) {
    return status; // Already running
  }

  const port = settings.port || DEFAULT_PORT;
  const result = await startWebUI({ port });

  if (result.ok) {
    // Update settings with actual port (may differ if port was in use)
    saveWebUISettings({ ...settings, port: result.port });
  }

  return result;
}

/**
 * Load WebUI settings from agent settings file
 */
function loadWebUISettings() {
  try {
    const settingsPath = join(homedir(), '.rudrax', 'agent', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      return settings.webui || {};
    }
  } catch {}
  return {};
}

/**
 * Save WebUI settings to agent settings file
 */
function saveWebUISettings(webuiSettings) {
  try {
    const settingsPath = join(homedir(), '.rudrax', 'agent', 'settings.json');
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
    settings.webui = webuiSettings;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (e) {
    console.error('[RudraX WebUI] Failed to save settings:', e.message);
    return false;
  }
}

/**
 * Register /webui command with the extension API
 */
export function registerWebUICommands(pi) {
  pi.registerCommand('webui', {
    description: 'Manage WebUI server (start/stop/status/restart)',
    handler: async (args, ctx) => {
      const subcommand = (args || '').trim().toLowerCase().split(/\s+/)[0] || 'status';

      switch (subcommand) {
        case 'start': {
          const port = parseInt(args.trim().split(/\s+/)[1], 10) || DEFAULT_PORT;
          const result = await startWebUI({ port });
          return { content: [{ type: 'text', text: result.message }] };
        }
        case 'stop': {
          const result = await stopWebUI();
          return { content: [{ type: 'text', text: result.message }] };
        }
        case 'restart': {
          const result = await restartWebUI();
          return { content: [{ type: 'text', text: result.message }] };
        }
        case 'status':
        default: {
          const status = await getStatus();
          if (status.running) {
            return { content: [{ type: 'text', text: `🟢 WebUI running on ${status.url} (PID: ${status.pid})\n\nOpen in browser: ${status.url}\n\nCommands:\n  /webui start [port]  — Start WebUI\n  /webui stop          — Stop WebUI\n  /webui restart       — Restart WebUI\n  /webui status        — Check status` }] };
          } else {
            return { content: [{ type: 'text', text: `🔴 WebUI is not running\n\nStart with: /webui start\nOr set auto-start in ~/.rudrax/agent/settings.json:\n  { "webui": { "enabled": true } }\n\nCommands:\n  /webui start [port]  — Start WebUI\n  /webui stop          — Stop WebUI\n  /webui restart       — Restart WebUI\n  /webui status        — Check status` }] };
          }
        }
      }
    }
  });

  // Register tools for agent use
  pi.registerTool({
    name: 'webui_status',
    description: 'Check if the WebUI server is running and get its URL',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      const status = await getStatus();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(status, null, 2),
        }],
      };
    },
  });
}