# RudraX Army WebUI & CLI Upgrade Investigation Plan

**Date:** 2026-05-26  
**Scope:** Current WebUI and CLI/TUI surfaces in `/root/RudraX`  
**Requested by:** User  
**Agents represented:** Infrastructure Maintainer + Terminal Integration Specialist  
**Mode:** Investigation and planning only — no implementation changes in this plan.

---

## 1. Investigation Summary

### Surfaces reviewed

- WebUI server: `webui/server.js`
- WebUI client: `webui/index.html`, `webui/js/app.js`, `webui/js/terminal.js`, `webui/css/index.css`
- WebUI manager/service: `lib/core/webui-manager.js`, `deploy/rudrax-webui.service`, `deploy/install-webui-service.sh`, `ecosystem.config.mjs`
- CLI entry and arguments: `bin/rudrax`, `lib/main.js`, `lib/cli/args.js`, `lib/config.js`
- Packaging/deployment: `package.json`, `Dockerfile`, `docker/docker-compose.yml`, `docker/webui/Dockerfile`
- Documentation: `README.md`, `webui/README.md`, `docs/command-and-control-prd.md`, terminal docs.

### Quick validation performed

- `npm test` passed: **10 files / 124 tests**.
- `node bin/rudrax --version` returned `4.5.0`.
- `node bin/rudrax --help` renders the CLI help successfully.
- Temporary WebUI server on port `5656` returned `200` for `/api/health`.
- Protected `/api/contexts` returned `401` without token, as expected.

---

## 2. Current State Snapshot

### WebUI architecture today

The WebUI is a single-process Express + Socket.IO server with an in-memory context map and a static client:

```text
Browser
  ├─ index.html
  ├─ js/app.js
  ├─ js/terminal.js
  └─ css/index.css

Node server
  ├─ Express API routes
  ├─ Socket.IO state streaming
  ├─ AgentSession SDK bridge
  ├─ in-memory contexts Map
  ├─ JSON-file-backed blog/contact/subscriber data
  └─ child_process-based terminal bridge
```

### CLI/TUI architecture today

The CLI entrypoint is `bin/rudrax`, which imports `lib/main.js`. It supports:

- interactive TUI mode
- print mode via `--print` / `-p`
- `--mode text|json|rpc`
- sessions: `--continue`, `--resume`, `--session`, `--fork`, `--session-dir`, `--no-session`
- model/provider selection
- extensions/skills/themes/prompt templates
- package commands: `install`, `remove`, `uninstall`, `update`, `list`, `config`

There is also a WebUI binary alias in `package.json`:

- `rudrax-web` → `webui/server.js`

---

## 3. Critical Bugs & Issues Found

### P0 — Security / Reliability risks

1. **Default WebUI credentials are weak on first run**
   - Evidence: `webui/server.js` creates `admin / password` when `~/.rudrax/webui-auth.json` does not exist.
   - Risk: exposed WebUI can be taken over if deployed without changing password.
   - Plan: require first-run setup, random generated one-time password, or env-provided bootstrap secret.

2. **JWT secret rotates on every WebUI restart**
   - Evidence: `JWT_SECRET = crypto.randomBytes(32).toString('hex')` in `webui/server.js`.
   - Impact: every restart invalidates all active sessions; bad for service restarts and HA.
   - Plan: persist a secret in `~/.rudrax/webui-secret` with `0600`, or require `RUDRAX_WEBUI_JWT_SECRET` in production.

3. **No rate limiting / lockout on login**
   - Evidence: `/api/login` has password verification but no per-IP/user throttling.
   - Risk: brute-force attacks against the default or weak password.
   - Plan: add in-memory + optional persistent/IP rate limiter and audit events.

4. **Authenticated WebUI terminal provides unrestricted shell access**
   - Evidence: Socket.IO `terminal_create` spawns `$SHELL --login` with client-controllable `cwd`.
   - Risk: any authenticated browser session has full OS shell permissions of the WebUI process.
   - Plan: gate terminal behind explicit setting, RBAC permission, workspace-root confinement, command audit log, and optional sandbox-only mode.

5. **Terminal is not a real PTY**
   - Evidence: `child_process.spawn(shell, ['--login'], stdio pipes)`; resize handler only mutates global `process.env.COLUMNS/LINES`.
   - Impact: full-screen apps, Ctrl-C behavior, job control, shell prompts, resize, vim/htop/etc. can fail or behave incorrectly.
   - Plan: use `node-pty` where available with a documented fallback; track per-terminal cols/rows.

6. **Open Socket.IO CORS**
   - Evidence: `cors: { origin: '*', methods: ['GET', 'POST'] }`.
   - Risk: token-bearing clients are still protected by auth, but open CORS increases attack surface and makes production hardening weaker.
   - Plan: allow `RUDRAX_WEBUI_ALLOWED_ORIGINS`, default localhost-only in production.

7. **No standard HTTP hardening middleware**
   - Evidence: no Helmet/CSP/security headers/rate limits/compression visible in server setup.
   - Plan: add Helmet, CSP compatible with local assets, request IDs, structured logs, compression, and rate limits.

8. **CDN dependency breaks offline/air-gapped terminal**
   - Evidence: `webui/index.html` loads xterm assets from `cdn.jsdelivr.net`.
   - Impact: terminal unavailable in offline / air-gapped installs despite RudraX positioning as self-hostable.
   - Plan: vendor xterm assets through npm/local static serving; add Subresource Integrity only if external CDN remains optional.

### P1 — Product/reliability issues

9. **WebUI contexts are in-memory only**
   - Evidence: `const contexts = new Map()` in `webui/server.js`.
   - Impact: active WebUI chats disappear on restart; no multi-process scaling; memory grows until process restart.
   - Plan: persist context metadata and link to session manager; add retention and cleanup policy.

10. **Shallow health check**
    - Evidence: `/api/health` returns static `status: ok` and feature list.
    - Impact: process can be “healthy” even if settings/session storage, model registry, WebSocket, memory, terminal, or disk is broken.
    - Plan: split `/api/health/live` and `/api/health/ready`, include dependency checks and degraded states.

11. **Mock/demo security dashboard data is mixed into production WebUI**
    - Evidence: inline “Security - Live simulation of cyber threats” and random threat generation.
    - Impact: users may confuse simulated metrics with real security telemetry.
    - Plan: label demo mode clearly, disable by default in production, support real provider adapters later.

12. **Several advanced capability endpoints return placeholders**
    - Evidence: `/api/evaluations`, `/api/knowledge-graph/:contextId`, `/api/vector-store/:contextId`, `/api/bus/:contextId`, `/api/costs/:contextId`, `/api/workflows`, `/api/schedules`, `/api/custom-tools` return empty/static data.
    - Impact: UI advertises capabilities that may not be wired to real backends.
    - Plan: add capability status model: `available | configured | demo | unavailable`, and hide/label incomplete features.

13. **Version/agent-count/documentation drift**
    - Evidence examples:
      - `README.md`: 349 agents, 32 categories.
      - `webui/README.md`: 191+ agents.
      - `package.json` description: 192 specialists.
      - WebUI `CONFIG`: 349 agents, category count 45.
    - Impact: confusing and lowers trust.
    - Plan: generate these numbers from one source of truth during build/startup.

14. **No WebUI API integration tests**
    - Evidence: existing tests cover unit/smoke, but no endpoint/auth/socket tests found.
    - Plan: add tests for auth, contexts, health, settings, terminal gating, and WebSocket authentication.

15. **Admin page route is publicly reachable**
    - Evidence: `/admin/blog` serves `admin/blog.html` without `authGuard`; some admin APIs are guarded.
    - Impact: page exposure may be acceptable, but it looks inconsistent and can leak admin UI surface.
    - Plan: guard admin pages too, or redirect unauthenticated users to login.

16. **Settings endpoint is not persistent**
    - Evidence: `/api/settings` returns hardcoded values; `PUT` returns modified object but does not save.
    - Impact: user changes do not survive reload/restart.
    - Plan: route through `SettingsManager` or a WebUI settings file.

17. **Email config has hardcoded admin recipient**
    - Evidence: `adminTo: 'admin@neelverse.org'` in `webui/server.js`.
    - Risk: deployments may accidentally send contact/subscribe data to wrong recipient.
    - Plan: require `RUDRAX_EMAIL_ADMIN_TO`, default log-only when unset.

18. **File-backed contact/subscriber/blog JSON writes need concurrency protection**
    - Evidence: JSON files under `webui/data/` are read/written directly.
    - Impact: concurrent writes can corrupt or lose data.
    - Plan: use atomic write + lock or move to a small SQLite store.

### P2 — CLI/TUI issues and gaps

19. **CLI help still describes “AI coding assistant” not RudraX Army command hierarchy**
    - Evidence: `lib/cli/args.js` help header says `AI coding assistant with read, bash, edit, write tools`.
    - Impact: mismatch with RudraX Army / Chief of Staff positioning.
    - Plan: update help copy, examples, and first-run messaging around Chief → Deputy → Specialists.

20. **No first-class `rudrax webui` CLI command**
    - Evidence: package scripts and `/webui` TUI extension exist, but CLI package commands do not include `webui start|stop|status`.
    - Impact: users must know `npm run webui`, `rudrax-web`, or TUI slash command.
    - Plan: add CLI command group: `rudrax webui start|stop|status|restart|open|logs`.

21. **PM2 script documentation mismatch**
    - Evidence: `ecosystem.config.mjs` comments mention `npm run webui:pm2`, but `package.json` has no `webui:pm2*` scripts.
    - Plan: either add scripts or remove/update comments.

22. **Offline env var drift between source maps/docs and built files**
    - Evidence: built `lib/main.js` uses `RUDRAX_OFFLINE`; source-map content still references `PI_OFFLINE` in some locations.
    - Impact: confusing for maintainers/debuggers.
    - Plan: regenerate build artifacts/source maps from current source consistently.

23. **CLI lacks a visible doctor/diagnostics command**
    - Evidence: diagnostics module exists, but help does not expose `rudrax doctor`.
    - Plan: add `rudrax doctor` covering Node version, package integrity, config path, auth/model status, WebUI status, socket port, terminal PTY support, and writable dirs.

24. **CLI/TUI has no obvious terminal capability self-check**
    - Evidence: docs explain terminal compatibility, but startup does not surface term protocol status.
    - Plan: add terminal feature detection in `doctor` and optional startup warning for limited terminals.

---

## 4. Upgrade Ideas — WebUI

### 4.1 Reliability and operations

- Add `/api/health/live` and `/api/health/ready`.
- Add structured JSON logs with request ID and socket ID correlation.
- Add metrics endpoint (`/api/metrics`) for process memory, context count, active terminals, active agent runs, socket count, error counts.
- Add admin-visible “System Status” panel:
  - model registry status
  - configured providers
  - memory/session path health
  - WebSocket connection status
  - terminal backend status: `node-pty | child_process fallback | disabled`
  - disk usage for `~/.rudrax`
- Add graceful shutdown readiness flip before closing sockets.
- Add context/session retention policy and maximum in-memory context count.

### 4.2 Security hardening

- First-run secure setup wizard.
- Persistent JWT secret or explicit production secret requirement.
- Login rate limiting and failed-login audit log.
- Optional 2FA/TOTP for WebUI admin.
- RBAC roles:
  - `viewer`: read-only dashboard/chat history
  - `operator`: chat/orchestrate
  - `admin`: settings/users/terminal
  - `shell`: terminal access
- Terminal disabled by default in production unless `RUDRAX_WEBUI_TERMINAL_ENABLED=true`.
- Restrict terminal cwd to workspace root unless explicitly allowed.
- Add Helmet security headers and CSP.
- Add allowed origin config.
- Store browser token more safely; at minimum shorten expiry and add refresh/logout invalidation. Consider httpOnly same-site cookies for WebUI.

### 4.3 UX/product improvements

- Replace static capability marketing cards with live capability states.
- Add “Mission Control” page showing:
  - active plan lanes
  - active agents
  - memory writes
  - blockers/handoffs
  - quality gates
- Add “Activity Timeline” with filter by agent/tool/error/system.
- Add WebUI onboarding checklist:
  - set password
  - configure model provider
  - verify memory path
  - run doctor
  - create first mission
- Add user-facing API error toasts with request IDs.
- Add persistent settings for theme/font/sidebar/orchestrator layout.
- Improve docs count consistency through generated constants.

### 4.4 Data/storage

- Move blog/contact/subscriber storage from raw JSON files to SQLite or atomic JSON store.
- Persist context metadata and latest UI state.
- Add export/import for WebUI settings.
- Add backup guidance for `~/.rudrax`.

---

## 5. Upgrade Ideas — CLI/TUI & Terminal

### 5.1 First-class CLI commands

Add a top-level command group:

```bash
rudrax webui start [--port 5555] [--open]
rudrax webui stop
rudrax webui restart
rudrax webui status
rudrax webui logs [--follow]
rudrax webui doctor
```

Add diagnostics:

```bash
rudrax doctor
rudrax doctor --json
rudrax doctor --fix
```

Doctor should check:

- Node/runtime version
- package version and package dir
- config dir permissions
- auth/model config presence
- WebUI port availability
- WebUI process/PID sanity
- terminal capability/PTY availability
- xterm local assets installed
- writable session/memory/log dirs
- Docker sandbox availability, if enabled

### 5.2 Terminal integration upgrades

- Use `node-pty` for real PTY support.
- Per-terminal dimensions on spawn and resize.
- Shell allowlist and configurable shell command.
- Workspace-root confinement and visible current cwd.
- Terminal sessions list with reconnect support.
- Scrollback search and “copy last command output”.
- Paste protection for multiline/large paste.
- Clear visual distinction between host shell and sandbox shell.
- Audit log terminal command starts/stops and shell session metadata.
- Add terminal backend status in UI and `rudrax doctor`.

### 5.3 CLI/TUI messaging alignment

- Update `--help` header and examples to RudraX Army language.
- Add examples for `/skill`, `/orchestrate`, squads, memory, and WebUI management.
- Add a startup banner that clearly says whether WebUI is running and how to open it.
- Add consistent environment variable list for RudraX naming only.

---

## 6. Proposed Execution Plan

### Phase 0 — Safety baseline and tests

1. Add endpoint tests for `/api/health`, auth, protected routes, settings, admin routes.
2. Add WebSocket auth tests.
3. Add CLI tests for future `webui` and `doctor` commands.
4. Add a no-network WebUI smoke test to catch CDN-only assets.

### Phase 1 — Security hardening

1. Replace default password flow with first-run bootstrap.
2. Persist JWT secret and add token/session invalidation path.
3. Add rate limiting and audit log for auth.
4. Add Helmet/CSP and allowed origin config.
5. Gate terminal by config/RBAC.

### Phase 2 — Terminal correctness

1. Add `node-pty` backend.
2. Keep child_process fallback but mark degraded.
3. Add resize, cwd confinement, command/session audit metadata.
4. Vendor xterm assets locally.
5. Add terminal status UI.

### Phase 3 — CLI operational commands

1. Add `rudrax webui ...` command group.
2. Add `rudrax doctor` with JSON output.
3. Add log tailing and process/PID validation.
4. Update docs and help output.

### Phase 4 — WebUI reliability and persistence

1. Add real liveness/readiness checks.
2. Add metrics endpoint and status panel.
3. Persist WebUI settings.
4. Persist context metadata or link contexts to session files.
5. Add context retention/cleanup.

### Phase 5 — Product polish and consistency

1. Generate agent counts/category counts/version from one source.
2. Mark demo/incomplete capabilities clearly.
3. Add onboarding checklist.
4. Improve Mission Control and activity timeline filters.
5. Update `README.md`, `webui/README.md`, and deploy docs.

---

## 7. Acceptance Criteria

- WebUI can run offline without CDN dependencies.
- First-run WebUI cannot be accessed with universal default credentials.
- WebUI restart does not unexpectedly log out users unless configured.
- `/api/health/ready` detects storage/config/socket critical failures.
- `rudrax doctor --json` reports actionable status across CLI, WebUI, config, terminal, and models.
- `rudrax webui status/start/stop/restart/logs` works without npm knowledge.
- Terminal supports real PTY behavior when backend is installed.
- Terminal can be disabled or sandboxed in production.
- Agent/version/category counts are consistent across README, WebUI, API, and package metadata.
- Existing tests remain green and new endpoint/socket/CLI tests cover the upgraded behavior.

---

## 8. Non-goals for this plan

- No code implementation in this investigation pass.
- No visual redesign beyond planning recommendations.
- No production deployment changes until security gating and tests are added.
- No removal of existing CLI/TUI behavior; changes should be backward-compatible.

---

## 9. Terminal Integration Specialist Appendix

### 9.1 Extra CLI/TUI observations

- The interactive TUI already has mature terminal concepts: Kitty keyboard protocol docs, terminal title updates, Ctrl-Z suspension/resume handling, clipboard support, terminal debug dump, and extension custom components.
- The CLI help and terminal setup docs still reference upstream/pi language in several places, while the product brand is RudraX Army. This is not a runtime bug, but it is a supportability issue because users will search for the wrong config paths and environment names.
- The startup banner is large and assumes enough terminal width. It uses `termWidth - 2`/`innerWidth`; narrow terminals should be tested for wrapping, negative widths, and excessive vertical occupation.
- WebUI auto-start is best-effort inside interactive mode. Good UX, but operationally it can surprise users by opening/starting a long-lived service unless settings make this explicit.
- CLI print/RPC modes correctly avoid interactive terminal requirements, but a future `doctor` command should explicitly report `stdin.isTTY`, terminal size, color depth, Kitty keyboard support likelihood, tmux/screen status, SSH status, and clipboard backend.

### 9.2 Extra WebUI terminal bugs / risks

1. **Pseudo-terminal absence is the main correctness bug**
   - Current browser terminal is xterm.js on the frontend but plain stdio pipes on the backend.
   - Result: browser looks like a terminal, but backend behavior is not terminal-compatible for many TUIs and shells.

2. **Resize handling is ineffective and globally unsafe**
   - The server handles `terminal_resize` by setting `process.env.COLUMNS` and `process.env.LINES` on the WebUI process.
   - This does not resize the child shell and can leak dimensions across all requests/terminals.

3. **Client sends `terminal_create` with `cwd: '/'`**
   - Evidence: `webui/js/terminal.js` creates sessions at `/`.
   - Impact: poor user context and possible permission confusion. Default should be repository/workspace cwd or user-configured workspace root.

4. **Terminal lifecycle is tied only to Socket.IO connection**
   - Disconnect kills the shell immediately.
   - There is no reconnect, session restore, named terminal, or explicit “detached terminal” model.

5. **No backpressure or output throttling for terminal data**
   - Large commands can flood `terminal_data` events and UI writes.
   - Plan should include output chunking, max scrollback, and drop/slow-consumer policy.

6. **No paste safety model**
   - Browser xterm forwards pasted input directly to shell.
   - Plan should include bracketed paste support checks, large-paste confirmation, and multiline paste warning.

7. **No terminal audit metadata**
   - Current code can log terminal creation, but does not store shell, cwd, user, duration, exit code, or command transcript metadata.
   - Full keystroke logging is sensitive and should be opt-in; session metadata audit should be default for admin/security review.

8. **Terminal dependency path is CDN-only**
   - xterm is used from `cdn.jsdelivr.net`, while package dependencies do not include `@xterm/xterm` or addons.
   - Plan: vendor frontend terminal assets locally and expose a “terminal assets loaded” health check.

### 9.3 Terminal upgrade design recommendation

Recommended backend abstraction:

```text
TerminalManager
  ├─ PtyTerminalBackend        # node-pty preferred
  ├─ PipeTerminalBackend       # current child_process fallback, degraded
  ├─ DisabledTerminalBackend   # production/off mode
  └─ SandboxTerminalBackend    # optional Docker/Kali or constrained workspace shell
```

Each terminal session should track:

- session ID
- socket/user ID
- backend type
- shell command
- cwd/workspace root
- cols/rows
- start time / end time / exit code
- byte counters in/out
- last activity timestamp
- audit events: create, resize, reconnect, kill, exit, error

### 9.4 Terminal-specific test plan

- Unit-test terminal backend selection: node-pty available, node-pty missing, terminal disabled, sandbox enabled.
- Integration-test Socket.IO auth requirement for terminal events.
- Integration-test resize updates per-terminal dimensions, not global process env.
- Integration-test cwd confinement rejects `cwd: '/'` or traversal when workspace root is enforced.
- E2E-test xterm asset loading with network disabled.
- E2E-test large output command does not freeze UI.
- Manual terminal matrix:
  - macOS Terminal/iTerm2/Ghostty
  - WezTerm/Kitty
  - VS Code integrated terminal
  - Windows Terminal/WSL
  - tmux/screen over SSH
  - narrow terminal: 60 columns
  - low color / no truecolor terminal

### 9.5 Priority order from terminal perspective

1. Gate/disable WebUI terminal in production until hardened.
2. Vendor xterm assets locally.
3. Introduce `node-pty` backend with proper resize.
4. Add workspace-root confinement and terminal config.
5. Add `rudrax doctor` terminal diagnostics.
6. Add reconnectable terminal sessions and audit metadata.
7. Improve paste/backpressure/large-output handling.
