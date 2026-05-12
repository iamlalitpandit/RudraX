#!/usr/bin/env node
/**
 * RudraX Web UI Launcher
 * 
 * Usage: node webui/launch.js [port]
 * 
 * Starts the RudraX Web UI server and opens it in the default browser.
 */

import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.argv[2] || process.env.RUDRAX_WEBUI_PORT || '5555', 10);

console.log(`
  ╔══════════════════════════════════════════╗
  ║        🔥 RudraX Web UI Server 🔥        ║
  ║     Build · Break · Deploy               ║
  ╠══════════════════════════════════════════╣
  ║  Starting server on port ${PORT}...          ║
  ╚══════════════════════════════════════════╝
`);

// Import and start the server
const { default: express } = await import('express');

console.log('  → Installing dependencies if needed...');
console.log('  → Starting RudraX Web UI...\n');

// Dynamic import the server
const serverModule = await import(join(__dirname, 'server.js'));