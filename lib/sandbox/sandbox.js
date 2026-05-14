/**
 * RudraX Sandbox Connector
 * 
 * Connects to a Kali Linux Docker container via SSH for sandboxed tool execution.
 * Provides secure, isolated command execution for security tools.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';

const execAsync = promisify(exec);

// ─── Config ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  host: process.env.RUDRAX_SANDBOX_HOST || 'localhost',
  port: parseInt(process.env.RUDRAX_SANDBOX_PORT || '2222', 10),
  user: process.env.RUDRAX_SANDBOX_USER || 'rudrax',
  password: process.env.RUDRAX_SANDBOX_PASS || 'rudrax',
  timeout: 30000, // 30s default command timeout
  workspace: '/home/rudrax/workspace',
};

// ─── Sandbox Class ──────────────────────────────────────────────────────────

class Sandbox {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connected = false;
    this.tools = null;
  }

  // ─── Connection ────────────────────────────────────────────────────────────

  async checkAvailable() {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(this.config.port, this.config.host);
    });
  }

  async connect() {
    const available = await this.checkAvailable();
    if (!available) {
      throw new Error(`Sandbox not available at ${this.config.host}:${this.config.port}`);
    }
    this.connected = true;
    this.tools = await this.discoverTools();
    return this;
  }

  async disconnect() {
    this.connected = false;
    this.tools = null;
  }

  // ─── Command Execution ─────────────────────────────────────────────────────

  async exec(command, options = {}) {
    if (!this.connected && !(await this.checkAvailable())) {
      throw new Error('Sandbox not available. Start it with: npm run sandbox:start');
    }

    const timeout = options.timeout || this.config.timeout;
    const cwd = options.cwd || this.config.workspace;

    // Use SSH to execute in container
    const sshCmd = [
      'ssh',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', `ConnectTimeout=5`,
      '-o', `ServerAliveInterval=10`,
      '-o', `ServerAliveCountMax=3`,
      '-p', String(this.config.port),
      `${this.config.user}@${this.config.host}`,
      `cd ${cwd} 2>/dev/null; ${command}`,
    ].join(' ');

    try {
      const { stdout, stderr } = await execAsync(sshCmd, {
        timeout: timeout + 5000, // Grace period
        maxBuffer: 10 * 1024 * 1024, // 10MB output
      });
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } catch (err) {
      return {
        success: false,
        stdout: err.stdout?.trim() || '',
        stderr: err.stderr?.trim() || err.message,
        exitCode: err.code || 1,
      };
    }
  }

  // ─── File Operations ───────────────────────────────────────────────────────

  async writeFile(remotePath, content) {
    // Create temp file locally, then scp it
    const tmpFile = `/tmp/rudrax-sandbox-${Date.now()}`;
    const fs = await import('fs/promises');
    await fs.writeFile(tmpFile, content);
    
    try {
      const scpCmd = [
        'scp',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-P', String(this.config.port),
        tmpFile,
        `${this.config.user}@${this.config.host}:${remotePath}`,
      ].join(' ');

      const { stdout, stderr } = await execAsync(scpCmd, { timeout: 30000 });
      return { success: true, path: remotePath };
    } finally {
      await fs.unlink(tmpFile).catch(() => {});
    }
  }

  async readFile(remotePath) {
    const result = await this.exec(`cat "${remotePath}"`);
    if (!result.success) {
      throw new Error(`Failed to read ${remotePath}: ${result.stderr}`);
    }
    return result.stdout;
  }

  // ─── Tool Discovery ───────────────────────────────────────────────────────

  async discoverTools() {
    const result = await this.exec('which nmap nikto dirb gobuster hashcat john msfconsole radare2 binwalk python3 ruby curl wget nc dig 2>/dev/null; echo "---SEPARATOR---"; dpkg -l 2>/dev/null | grep -E "^ii" | awk "{print \\$2}" | head -100');
    if (!result.success) return [];

    const [paths, packages] = result.stdout.split('---SEPARATOR---').map(s => s.trim());
    
    const toolList = [];
    const pathLines = (paths || '').split('\n').filter(Boolean);
    
    for (const line of pathLines) {
      const match = line.match(/^(\/[\w/.-]+)$/);
      if (match) {
        const name = match[1].split('/').pop();
        toolList.push({ name, path: match[1] });
      }
    }

    return toolList;
  }

  // ─── Quick Tool Shortcuts ──────────────────────────────────────────────────

  async nmap(target, args = '') {
    return this.exec(`nmap ${args} ${target}`);
  }

  async nikto(target, args = '') {
    return this.exec(`nikto -h ${target} ${args}`);
  }

  async dirb(url, wordlist = '/usr/share/dirb/wordlists/common.txt') {
    return this.exec(`dirb ${url} ${wordlist}`);
  }

  async gobuster(mode, target, args = '') {
    return this.exec(`gobuster ${mode} -u ${target} ${args}`);
  }

  async whatweb(target) {
    return this.exec(`whatweb ${target}`);
  }

  async hashcat(hash, mode, args = '') {
    return this.exec(`hashcat -m ${mode} ${args} ${hash}`);
  }

  async john(hashFile, args = '') {
    return this.exec(`john ${args} ${hashFile}`);
  }

  async msfconsole(command) {
    return this.exec(`msfconsole -q -x "${command}"`, { timeout: 60000 });
  }

  async radare2(file, command) {
    return this.exec(`r2 -q -c "${command}" ${file}`);
  }

  async binwalk(file, args = '') {
    return this.exec(`binwalk ${args} ${file}`);
  }

  async curl(args) {
    return this.exec(`curl -s ${args}`);
  }

  async dig(domain, recordType = 'A') {
    return this.exec(`dig ${domain} ${recordType} +short`);
  }

  async whois(domain) {
    return this.exec(`whois ${domain} 2>/dev/null | head -50`);
  }

  async python3(script, args = '') {
    return this.exec(`python3 ${script} ${args}`);
  }

  async pip3Install(packageName) {
    return this.exec(`pip3 install ${packageName}`, { timeout: 120000 });
  }

  // ─── Status ────────────────────────────────────────────────────────────────

  getStatus() {
    return {
      connected: this.connected,
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      toolsCount: this.tools?.length || 0,
      tools: this.tools || [],
    };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let sandboxInstance = null;

export async function getSandbox(config = {}) {
  if (!sandboxInstance) {
    sandboxInstance = new Sandbox(config);
    try {
      await sandboxInstance.connect();
    } catch (err) {
      console.warn(`[Sandbox] Not available: ${err.message}`);
      sandboxInstance.connected = false;
    }
  }
  return sandboxInstance;
}

export async function startSandbox() {
  const { execAsync: exec } = await import('child_process');
  try {
    await execAsync('podman compose -f docker/docker-compose.yml up -d kali-sandbox', {
      cwd: process.cwd(),
      timeout: 120000,
    });
    console.log('[Sandbox] Starting Kali container...');
    // Wait for it to be ready
    await new Promise(resolve => setTimeout(resolve, 15000));
    return true;
  } catch (err) {
    console.error('[Sandbox] Failed to start:', err.message);
    return false;
  }
}

export async function stopSandbox() {
  try {
    await execAsync('podman compose -f docker/docker-compose.yml down kali-sandbox', {
      cwd: process.cwd(),
      timeout: 60000,
    });
    console.log('[Sandbox] Stopped.');
    return true;
  } catch (err) {
    console.error('[Sandbox] Failed to stop:', err.message);
    return false;
  }
}

export { Sandbox };
export default Sandbox;