# 📦 Changelog

All notable changes to RudraX Army will be documented in this file.

## [Unreleased]

### Added
- First-run setup command for provider selection and optional capability installation
- Bundled browser, web, media, memory, debug, Telegram, and WhatsApp runtime helpers
- Persistent evolving-memory extension and installation documentation

### Security
- Setup configuration files are written atomically with mode `0600`
- Gateway runtimes fail closed unless explicit Telegram chat IDs or WhatsApp numbers are allowed
- Setup rejects environment values containing line breaks

## [4.6.0] — 2026-07

### Added
- Universal provider catalog with 43 cloud, routed, and local integrations
- Azure AI Foundry support for OpenAI-compatible and Anthropic-compatible endpoints
- Secure WebUI provider setup, model discovery, credential status, and live model switching
- Local provider support for Ollama, LM Studio, LocalAI, and custom endpoints
- Provider integration tests with real streaming against a local mock server
- Branded project banner, refreshed documentation, and discoverability metadata

### Security
- Credential files use mode `0600`
- Provider APIs redact stored secrets
- Endpoint validation blocks metadata targets, unsafe host overrides, and credential-bearing URLs
- Multi-file provider updates use coordinated locks and crash-recovery journaling

### Project
- Project authorship standardized to Lalit Pandit
- Runtime and skill documentation standardized under the RudraX brand

## [4.5.0] — 2026-05

### ✨ Added
- 🧠 Evolving Memory System — Self-learning with pattern detection, auto-skill creation
- 🔎 Vector Knowledge Base — 256-dim semantic search & RAG (in-process, no external deps)
- 📡 Agent Communication Bus — Pub/sub messaging with priority queuing
- 🛡️ 3-Tier Approval Gates — Human-in-the-loop safety with auto-timeout
- 🔍 Self-Reflection Engine — Pre/post execution quality scoring
- 📊 Full Observability — Distributed tracing with waterfall visualization
- 🌐 Web Search — DuckDuckGo integration (no API key needed)
- ⚙️ DAG Workflow Engine — Parallel lanes, error policies, 4 built-in workflows
- 🕸️ Knowledge Graph — Entity-relationship store with traversal
- 🔧 Dynamic Tool Registry — Agent-created tools (bash, JS, composite)
- 💰 Cost Tracker — Per-model pricing with budget limits
- ⏰ Task Scheduler — Recurring agent/workflow execution
- 🏆 Agent Evaluator — Standard benchmarks with 4-dimension scoring
- 🖼️ Multi-Modal Engine — Image analysis and processing
- 🛡️ Safety Guardrails — PII detection, code safety, hallucination checking
- 📦 Code Sandbox — Secure execution for 6 languages
- 🤖 170 Reusable Operational Skills — Curated for RudraX workflows
- 🎨 Cybersecurity Dashboard — Live threat simulation & monitoring
- 🎛️ WebUI Overhaul — 20+ new features, real-time socket streaming
- 👤 JWT Authentication — PBKDF2-SHA512 password hashing

### 📚 Documentation
- Full README rewrite with architecture diagram
- 16 new documentation files in `docs/`
- RUDRAX_INTEGRATION.md guide
- EVOLVING_MEMORY_README.md

---

## [4.0.0] — 2026-04

### ✨ Added
- Multi-agent command system with 179 agents
- 9 pre-configured squads (startup, security, growth, etc.)
- Agency Manager extension
- Skill system with 179+ specialized skills

---

## [3.0.0] — 2026-03

### 🔄 Changed
- Migrated to @imlalitpandit/pi-* packages
- WebUI with Express + Socket.IO
- TUI framework integration

---

## [2.0.0] — 2026-02

### ✨ Added
- First public release
- Agent framework with tool execution
- Terminal interface (TUI)
- Web search capability

---

## [1.0.0] — 2026-01

### ✨ Added
- Foundation release
- Core chat and tool execution
- Basic agent session management
