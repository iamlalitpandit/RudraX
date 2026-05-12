/**
 * RudraX Web UI — Terminal Module
 * xterm.js integration for embedded terminal
 * 
 * Requires:
 *   - xterm.js (CDN)
 *   - xterm-addon-fit (CDN)
 *   - xterm-addon-web-links (CDN)
 *   - WebSocket connection to server terminal endpoint
 */

// ─── Terminal Initialization ────────────────────────────────────────────────

function initTerminal() {
  const container = document.getElementById('terminal-container');
  if (!container) {
    console.error('[RudraX] Terminal container not found');
    return;
  }

  // Check if xterm.js is available
  if (typeof Terminal === 'undefined') {
    container.innerHTML = `
      <div style="padding:16px;color:#ff6b6b;font-family:monospace;font-size:13px;">
        ⚠️ xterm.js not loaded. Terminal requires an internet connection for the CDN.<br>
        Alternatively, install node-pty for a native terminal experience.<br><br>
        <strong>Fallback:</strong> Use the chat input with shell commands prefixed by <code>!</code>
      </div>
    `;
    return;
  }

  // Create terminal instance
  const term = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    theme: getTerminalTheme(),
    scrollback: 5000,
    allowProposedApi: true,
    allowTransparency: false,
    convertEol: true,
    lineHeight: 1.2,
  });

  // Fit addon
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);

  // Web links addon
  try {
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    term.loadAddon(webLinksAddon);
  } catch (e) {
    // Non-critical
  }

  // Open terminal in container
  term.open(container);

  // Fit to container
  setTimeout(() => {
    try {
      fitAddon.fit();
    } catch (e) {
      // Container might not be visible yet
    }
    term.focus();
  }, 100);

  // Store references
  state.terminal = term;
  state.terminalFit = fitAddon;

  // ─── Terminal Input ───────────────────────────────────────────────────

  term.onData((data) => {
    if (state.socket?.connected) {
      state.socket.emit('terminal_input', data);
    }
  });

  // Handle resize
  term.onResize(({ cols, rows }) => {
    if (state.socket?.connected) {
      state.socket.emit('terminal_resize', { cols, rows });
    }
  });

  // ─── ResizeObserver ──────────────────────────────────────────────────

  const resizeObserver = new ResizeObserver(() => {
    try {
      fitAddon.fit();
    } catch (e) {
      // Ignore resize errors
    }
  });
  resizeObserver.observe(container);

  // ─── Welcome Message ─────────────────────────────────────────────────

  term.writeln('\x1b[1;33m');
  term.writeln('  ╔══════════════════════════════════════════╗');
  term.writeln('  ║     🔥 RudraX Terminal 🔥               ║');
  term.writeln('  ╚══════════════════════════════════════════╝');
  term.writeln('\x1b[0m');
  term.writeln('\x1b[2m💡 Tip: This is a basic shell. Install node-pty for full PTY support (vim, htop, etc.)\x1b[0m');
  term.writeln('');

  // ─── Connect to Server Terminal ───────────────────────────────────────

  if (state.socket?.connected) {
    state.socket.emit('terminal_create', { cwd: '/' });
  } else {
    term.writeln('\x1b[31m⚠️ Not connected to server. Waiting for connection...\x1b[0m');

    // Retry on connect
    const onConnect = () => {
      state.socket.emit('terminal_create', { cwd: '/' });
      state.socket.off('connect', onConnect);
    };
    state.socket?.on('connect', onConnect);
  }

  // ─── Theme Handling ───────────────────────────────────────────────────

  // Watch for theme changes
  const themeObserver = new MutationObserver(() => {
    if (state.terminal) {
      state.terminal.options.theme = getTerminalTheme();
    }
  });
  themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

// ─── Terminal Theme ────────────────────────────────────────────────────────

function getTerminalTheme() {
  const isLight = document.body.classList.contains('light-mode');
  if (isLight) {
    return {
      background: '#fafafa',
      foreground: '#1a1a1a',
      cursor: '#ff6b35',
      cursorAccent: '#fafafa',
      selectionBackground: 'rgba(255, 107, 53, 0.3)',
      selectionForeground: '#1a1a1a',
      black: '#1a1a1a',
      red: '#e74c3c',
      green: '#27ae60',
      yellow: '#f39c12',
      blue: '#3498db',
      magenta: '#9b59b6',
      cyan: '#00bcd4',
      white: '#f0f0f0',
      brightBlack: '#666',
      brightRed: '#e74c3c',
      brightGreen: '#2ecc71',
      brightYellow: '#f1c40f',
      brightBlue: '#3498db',
      brightMagenta: '#9b59b6',
      brightCyan: '#00bcd4',
      brightWhite: '#ffffff',
    };
  }
  return {
    background: '#0f0f0f',
    foreground: '#f0f0f0',
    cursor: '#ff6b35',
    cursorAccent: '#0f0f0f',
    selectionBackground: 'rgba(255, 107, 53, 0.3)',
    selectionForeground: '#f0f0f0',
    black: '#1a1a1a',
    red: '#e74c3c',
    green: '#27ae60',
    yellow: '#f39c12',
    blue: '#3498db',
    magenta: '#9b59b6',
    cyan: '#00bcd4',
    white: '#f0f0f0',
    brightBlack: '#666',
    brightRed: '#ff6b6b',
    brightGreen: '#2ecc71',
    brightYellow: '#ffd166',
    brightBlue: '#5dade2',
    brightMagenta: '#af7ac5',
    brightCyan: '#48c9b0',
    brightWhite: '#ffffff',
  };
}

// ─── Terminal Paste Handling ────────────────────────────────────────────────

// Handle bracketed paste mode (xterm.js sends special sequences)
// This is handled automatically by xterm.js's onData callback

// ─── Terminal Keyboard Shortcuts ───────────────────────────────────────────

// Additional terminal-specific shortcuts are handled in app.js
// Ctrl+` toggles terminal panel
// The terminal captures all keyboard input when focused