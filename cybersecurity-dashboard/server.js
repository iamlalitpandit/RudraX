const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ─── Configuration ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4200;
const WS_INTERVAL = 2000; // push updates every 2s
const THREAT_INTERVAL = 8000; // spawn a new threat every 8s
const MAX_THREATS = 50;

// ─── App & Server ────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ─── In-Memory State ─────────────────────────────────────────────────────────
const state = {
  threats: [],
  alerts: [],
  trafficHistory: [],
  authAttempts: [],
  events: [],
  metrics: {
    totalThreats: 0,
    blockedIPs: 0,
    activeConnections: 0,
    avgResponseTime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkThroughput: 0,
    packetsInspected: 0,
    threatLevel: 'low',
    uptime: 0,
  },
};

const START_TIME = Date.now();

// ─── Helper: Random in range ─────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const chance = (pct) => Math.random() * 100 < pct;

// ─── Threat Data ─────────────────────────────────────────────────────────────
const THREAT_TYPES = [
  { type: 'DDoS', severity: 'critical', icon: '☠️', color: '#ff0040', desc: 'Distributed Denial of Service' },
  { type: 'Brute Force', severity: 'high', icon: '🔨', color: '#ff6b00', desc: 'Repeated login attempts' },
  { type: 'Malware', severity: 'critical', icon: '🦠', color: '#ff0040', desc: 'Malicious software detected' },
  { type: 'Phishing', severity: 'high', icon: '🎣', color: '#ff6b00', desc: 'Suspicious phishing attempt' },
  { type: 'Port Scan', severity: 'medium', icon: '🔍', color: '#ffaa00', desc: 'Network port enumeration' },
  { type: 'SQL Injection', severity: 'critical', icon: '💉', color: '#ff0040', desc: 'SQL injection attempt' },
  { type: 'XSS', severity: 'high', icon: '💀', color: '#ff6b00', desc: 'Cross-site scripting' },
  { type: 'MITM', severity: 'critical', icon: '🕸️', color: '#ff0040', desc: 'Man-in-the-middle attack' },
  { type: 'Ransomware', severity: 'critical', icon: '🔒', color: '#ff0040', desc: 'Ransomware detected' },
  { type: 'DNS Tunneling', severity: 'medium', icon: '🕳️', color: '#ffaa00', desc: 'DNS exfiltration attempt' },
  { type: 'Zero-Day', severity: 'critical', icon: '⚠️', color: '#ff0040', desc: 'Unknown vulnerability exploit' },
  { type: 'Credential Stuffing', severity: 'high', icon: '👤', color: '#ff6b00', desc: 'Credential reuse attack' },
];

const SOURCE_IPS = [
  '185.220.101.x', '91.121.87.x', '45.33.32.x', '104.248.50.x',
  '192.168.1.105', '10.0.0.45', '172.16.0.88', '203.0.113.42',
  '198.51.100.17', '192.0.2.99',
];

const TARGETS = [
  'api.corp.internal', 'db-primary.local', 'web-gateway.corp',
  'mail-server.corp', 'vpn-gateway.corp', 'auth-service.corp',
  'file-server.corp', 'dns-primary.corp',
];

const COUNTRIES = ['RU', 'CN', 'KP', 'IR', 'US', 'DE', 'NG', 'BR', 'VN', 'UA'];
const AUTHS = ['VPN', 'SSH', 'Web App', 'Database', 'API Gateway', 'Mail', 'FTP'];

// ─── Generate Mock Data ──────────────────────────────────────────────────────

function generateThreat() {
  const threatDef = pick(THREAT_TYPES);
  const sourceIP = pick(SOURCE_IPS).replace('x', rand(1, 254));
  return {
    id: uuidv4().slice(0, 8),
    timestamp: new Date().toISOString(),
    ...threatDef,
    sourceIP,
    target: pick(TARGETS),
    country: pick(COUNTRIES),
    port: rand(1, 65535),
    protocol: pick(['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ICMP']),
    status: 'active',
    confidence: rand(75, 99),
    mitigated: false,
  };
}

function generateTrafficTick() {
  return {
    timestamp: Date.now(),
    inbound: rand(800, 9500),
    outbound: rand(400, 6000),
    total: 0,
    packets: rand(1000, 50000),
    connections: rand(50, 800),
  };
}

function generateAuthEvent() {
  const success = chance(70);
  return {
    id: uuidv4().slice(0, 8),
    timestamp: new Date().toISOString(),
    user: `user${rand(1, 200)}@corp.com`,
    service: pick(AUTHS),
    sourceIP: pick(SOURCE_IPS).replace('x', rand(1, 254)),
    success,
    method: pick(['password', 'certificate', 'OAuth', 'MFA', 'SSO']),
    country: pick(COUNTRIES),
  };
}

function generateEvent() {
  const eventTypes = [
    { action: 'Firewall Rule Updated', category: 'config', severity: 'info' },
    { action: 'IDS Signature Updated', category: 'defense', severity: 'info' },
    { action: 'Certificate Expiring', category: 'crypto', severity: 'warning' },
    { action: 'Vulnerability Scan Completed', category: 'scan', severity: 'info' },
    { action: 'Backup Completed', category: 'ops', severity: 'info' },
    { action: 'New Device Enrolled', category: 'device', severity: 'info' },
    { action: 'Admin Login Detected', category: 'auth', severity: 'warning' },
    { action: 'Rate Limit Triggered', category: 'defense', severity: 'warning' },
    { action: 'SSL/TLS Weak Cipher Detected', category: 'crypto', severity: 'high' },
    { action: 'IDS Alert: Suspicious Pattern', category: 'detection', severity: 'high' },
    { action: 'Patch Deployed', category: 'ops', severity: 'info' },
    { action: 'User Permission Escalation', category: 'auth', severity: 'warning' },
  ];
  const evt = pick(eventTypes);
  return {
    id: uuidv4().slice(0, 8),
    timestamp: new Date().toISOString(),
    source: pick(['SIEM', 'EDR', 'Firewall', 'IDS', 'WAF', 'DLP', 'AV', 'HIDS']),
    ...evt,
  };
}

// ─── State Updates ────────────────────────────────────────────────────────────

function tickMetrics() {
  const m = state.metrics;
  m.totalThreats = state.threats.length;
  m.activeConnections = rand(1200, 8500);
  m.avgResponseTime = Math.round((rand(5, 95) + Math.random()) * 10) / 10;
  m.cpuUsage = Math.round((rand(12, 88) + Math.random()) * 10) / 10;
  m.memoryUsage = Math.round((rand(30, 82) + Math.random()) * 10) / 10;
  m.diskUsage = Math.round((rand(40, 92) + Math.random()) * 10) / 10;
  m.networkThroughput = rand(200, 4000);
  m.packetsInspected += rand(1000, 25000);
  m.uptime = Math.floor((Date.now() - START_TIME) / 1000);

  // Derive threat level
  const criticalCount = state.threats.filter(t => t.severity === 'critical').length;
  const highCount = state.threats.filter(t => t.severity === 'high').length;
  if (criticalCount > 3) m.threatLevel = 'critical';
  else if (criticalCount > 0 || highCount > 5) m.threatLevel = 'high';
  else if (highCount > 0 || state.threats.length > 10) m.threatLevel = 'medium';
  else m.threatLevel = 'low';

  // Block some threats automatically
  state.threats.forEach(t => {
    if (!t.mitigated && t.severity === 'critical' && chance(35)) {
      t.mitigated = true;
      t.status = 'mitigated';
      m.blockedIPs++;
    }
  });
}

function tickTraffic() {
  const tick = generateTrafficTick();
  tick.total = tick.inbound + tick.outbound;
  state.trafficHistory.push(tick);
  if (state.trafficHistory.length > 60) state.trafficHistory.shift();
}

function maybeNewThreat() {
  state.threats.push(generateThreat());
  if (state.threats.length > MAX_THREATS) state.threats.shift();
}

function maybeNewAlert() {
  const active = state.threats.filter(t => t.status === 'active');
  if (active.length > 0 && chance(40)) {
    const threat = pick(active);
    state.alerts.push({
      id: uuidv4().slice(0, 8),
      timestamp: new Date().toISOString(),
      threatId: threat.id,
      type: threat.type,
      severity: threat.severity,
      message: `${threat.icon} ${threat.type} — ${threat.sourceIP} → ${threat.target}`,
      acknowledged: false,
    });
    if (state.alerts.length > 30) state.alerts.shift();
  }
}

function tickAuth() {
  state.authAttempts.push(generateAuthEvent());
  if (state.authAttempts.length > 100) state.authAttempts.shift();
}

function maybeEvent() {
  if (chance(60)) {
    state.events.push(generateEvent());
    if (state.events.length > 100) state.events.shift();
  }
}

// ─── Build Snapshot ──────────────────────────────────────────────────────────

function buildSnapshot() {
  return {
    metrics: { ...state.metrics },
    threats: [...state.threats].slice(-20),
    alerts: [...state.alerts].slice(-15),
    trafficHistory: [...state.trafficHistory],
    authAttempts: [...state.authAttempts].slice(-30),
    events: [...state.events].slice(-25),
    timestamp: Date.now(),
  };
}

// ─── WebSocket Broadcast ─────────────────────────────────────────────────────

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ─── Periodic Loop ───────────────────────────────────────────────────────────

function runCycle() {
  tickTraffic();
  tickAuth();
  maybeNewThreat();
  maybeNewAlert();
  maybeEvent();
  tickMetrics();
  broadcast(buildSnapshot());
}

// Initial data seeding
for (let i = 0; i < 30; i++) {
  state.trafficHistory.push(generateTrafficTick());
  state.authAttempts.push(generateAuthEvent());
  if (i < 8) state.threats.push(generateThreat());
  if (i < 5) state.events.push(generateEvent());
}
state.metrics.packetsInspected = rand(50000, 200000);
tickMetrics();

setInterval(runCycle, WS_INTERVAL);
setInterval(() => { maybeNewThreat(); maybeNewThreat(); }, THREAT_INTERVAL);

// ─── REST API Endpoints ──────────────────────────────────────────────────────

app.get('/api/status', (_req, res) => {
  res.json({ status: 'online', uptime: state.metrics.uptime, threats: state.threats.length, clients: wss.clients.size });
});

app.get('/api/snapshot', (_req, res) => {
  res.json(buildSnapshot());
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const alert = state.alerts.find(a => a.id === req.params.id);
  if (alert) {
    alert.acknowledged = true;
    res.json({ success: true, alert });
  } else {
    res.status(404).json({ success: false, error: 'Alert not found' });
  }
});

app.post('/api/threats/:id/mitigate', (req, res) => {
  const threat = state.threats.find(t => t.id === req.params.id);
  if (threat) {
    threat.mitigated = true;
    threat.status = 'mitigated';
    state.metrics.blockedIPs++;
    res.json({ success: true, threat });
  } else {
    res.status(404).json({ success: false, error: 'Threat not found' });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️  Cybersecurity Dashboard running at http://0.0.0.0:${PORT}`);
  console.log(`📡 WebSocket broadcasting every ${WS_INTERVAL}ms`);
});
