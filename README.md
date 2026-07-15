# 🔱 RudraX Army v4.5.0

[![Website](https://img.shields.io/badge/Website-rudrax.cloud-B45309?style=flat-square)](https://rudrax.cloud)
[![Agents](https://img.shields.io/badge/Agents-349-B45309?style=flat-square)](https://rudrax.cloud/autonomous-agents)
[![Playground](https://img.shields.io/badge/Try%20Now-Playground-B45309?style=flat-square)](https://rudrax.cloud/playground)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green?style=flat-square)
![Version](https://img.shields.io/badge/version-4.5.0-gold?style=flat-square)

> **India's largest open-source multi-agent AI orchestration platform — 349 specialized agents, 32 categories, 9 tactical squads.**

RudraX Army is a **hierarchical command-and-control multi-agent system**. Instead of a single AI trying to do everything, you get a **Chief of Staff** that strategically delegates tasks through a **Deputy Chief of Staff** to **349 specialized agents** across **32 operational divisions**.

🌟 **Completely free & open source** — MIT licensed. Bring your own API keys.

---

## 🚀 Quick Start

```bash
git clone https://github.com/iamlalitpandit/RudraX.git
cd RudraX
npm install
npm start
```

Then open **http://localhost:5555** in your browser.

### Model providers

RudraX bootstraps the pi-ai built-ins plus Hermes-style adapters for Azure AI Foundry, OpenAI/Azure OpenAI, Anthropic, Gemini/Vertex, Bedrock, OpenRouter, Ollama/LM Studio/LocalAI and the major hosted inference services. Configure them in **WebUI → Settings → Model Provider**, in `~/.rudrax/agent/auth.json` / `models.json`, or with the variables documented in [`.env.example`](.env.example).

Selection order is deterministic: a saved **configured** provider/model, then an authenticated cloud model, then WebUI Ollama discovery. Azure Foundry uses `AZURE_FOUNDRY_ENDPOINT`, `AZURE_FOUNDRY_DEPLOYMENT` (or `AZURE_FOUNDRY_MODEL`) and `AZURE_FOUNDRY_API_KEY`; its key is sent as the `api-key` header. Endpoint variables override catalog URLs and model variables override representative catalog models.

| Provider group | Provider IDs | Primary credential variables |
|---|---|---|
| OpenAI / Azure | `openai`, `openai-codex`, `azure-openai-responses`, `azure-foundry` | `OPENAI_API_KEY`, OAuth, `AZURE_OPENAI_API_KEY`, `AZURE_FOUNDRY_API_KEY` |
| Anthropic / Google / AWS | `anthropic`, `google` (`gemini`), `google-vertex`, `amazon-bedrock` | `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` or `GEMINI_API_KEY`, ADC, AWS credential chain |
| Routers / fast inference | `openrouter`, `groq`, `cerebras`, `fireworks`, `novita`, `together` | `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `FIREWORKS_API_KEY`, `NOVITA_API_KEY`, `TOGETHER_API_KEY` |
| Open-model clouds | `deepseek`, `zai`, `kimi-coding`, `minimax`, `alibaba`, `arcee`, `gmi`, `nvidia` | `DEEPSEEK_API_KEY`, `GLM_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `DASHSCOPE_API_KEY`, `ARCEEAI_API_KEY`, `GMI_API_KEY`, `NVIDIA_API_KEY` |
| Other hosted providers | `xai`, `mistral`, `opencode`, `opencode-go`, `kilocode`, `huggingface`, `xiaomi`, `tencent-tokenhub`, `ollama-cloud`, `stepfun` | See [`.env.example`](.env.example) for exact names and aliases |
| Local / custom | `ollama`, `lmstudio`, `localai`, `custom` | Local adapters need an explicit endpoint; remote custom endpoints also require `CUSTOM_API_KEY` |

Azure AI Foundry example:

```bash
export AZURE_FOUNDRY_ENDPOINT="https://YOUR-RESOURCE.openai.azure.com/openai/v1"
export AZURE_FOUNDRY_DEPLOYMENT="YOUR-DEPLOYMENT"
export AZURE_FOUNDRY_API_KEY="YOUR_KEY"
npm start -- --provider azure-foundry --model "$AZURE_FOUNDRY_DEPLOYMENT"
```

Custom OpenAI-compatible endpoint (`~/.rudrax/agent/models.json`):

```json
{
  "providers": {
    "custom": {
      "baseUrl": "https://llm.example.com/v1",
      "api": "openai-completions",
      "apiKey": "CUSTOM_API_KEY",
      "models": [{ "id": "my-model", "name": "my-model" }]
    }
  }
}
```

CLI discovery and selection:

```bash
rudrax --list-models
rudrax --provider anthropic --model claude-sonnet-4-6
rudrax --provider google --model gemini-2.5-pro
```

Provider management REST endpoints are authenticated and never return secrets:

- `GET /api/providers/catalog` and `GET /api/providers/status`
- `PUT /api/providers/:provider` with `{ "apiKey", "endpoint", "model" }`
- `DELETE /api/providers/:provider`
- `GET /api/providers/:provider/models`
- `PUT /api/models/active` with `{ "provider", "model", "context" }`

Credential and model files are written with mode `0600`. Only HTTP(S) endpoint overrides and known provider IDs are accepted.

Or try it instantly at **[rudrax.cloud/playground](https://rudrax.cloud/playground)** — no installation required!

---

## 🎯 What Makes RudraX Different?

| Feature | RudraX Army | Others |
|---------|------------|--------|
| **Agent Count** | 349 pre-built agents | 10-50 typically |
| **Categories** | 32 (engineering, design, finance, marketing, legal, healthcare, game dev, XR, DevOps, AI/ML, support, content & more) | 3-5 |
| **Tactical Squads** | 9 pre-assembled multi-agent teams | None |
| **Orchestration** | Hierarchical (Chief of Staff → Deputy → Specialists) | Flat / Sequential |
| **Pricing** | **$0 — Free & Open Source** | $20-200/mo per user |
| **Infrastructure** | Bring your own server (air-gap ready) | Cloud-only |
| **Models** | Any LLM (OpenAI, Anthropic, Google, Ollama local) | Vendor locked |
| **Auth** | JWT, RBAC, audit trails | Often basic |
| **Memory** | Vector KB, cross-session, Honcho integration | Context window only |

---

## ✨ Features

### 🧠 349 Pre-Built Agents
Specialized AI agents spanning software engineering, design, marketing, finance, game development, healthcare, legal, DevOps, XR/spatial computing, AI/ML, content creation, support, research, security, and 20+ more categories. Each agent has a focused skill set and personality.

### 👥 9 Tactical Squads
Pre-assembled multi-agent teams for common missions:
- **Startup Squad** — MVP in 24 hours (design + code + content)
- **Enterprise Squad** — Full product lifecycle management
- **Security Squad** — Code audit, threat modeling, compliance
- **QA Lead Squad** — Testing, benchmarking, code review
- **AI Infra Squad** — Model deployment, fine-tuning, optimization
- **Web3 Squad** — Smart contracts, DeFi, blockchain audit
- **Growth Squad** — Marketing, SEO, analytics, conversion
- **Incident Squad** — 24/7 monitoring, triage, remediation
- **Full Product Squad** — Everything squad for end-to-end delivery

### 🎛️ Agency Orchestrator
Hierarchical command system:
1. 🔱 **Chief of Staff** — Analyzes intent, creates execution plans
2. 🎛️ **Deputy Chief of Staff** — Deploys specialist agents, manages pipelines
3. 👷 **Specialist Agents** — Execute domain-specific tasks
4. ✅ **Quality Gates** — Dev↔QA refinement loops
5. 📋 **Consolidated Reports** — Structured output with artifacts

### 🔒 Enterprise Security
- JWT authentication with role-based access control
- PII detection guardrails (SSN, email, API keys)
- Code sandboxing and approval gates
- Audit logging and session management
- Air-gapped deployment support

### 💾 Persistent Memory
- Vector-based knowledge base with semantic search
- Cross-session user modeling via Honcho
- Conversation summaries and compaction
- Context budget enforcement

### 🌐 Every Interface
- **Beautiful WebUI** — Dark-themed dashboard with terminal, agent status, capabilities grid
- **REST API** — All functionality available via HTTP endpoints
- **MCP Server** — Model Context Protocol support for agent-to-agent communication
- **WebSocket** — Real-time agent streaming and state updates
- **CLI Tools** — Headless operation and automation
- **Webhook Subscriptions** — Event-driven agent runs

---

## 📋 Architecture

```
User Request 
    ↓
🔱 Chief of Staff (Intent Analysis)
    ↓
🎛️ Deputy Chief of Staff (Task Decomposition)
    ↓
┌─────────────────────────────────────────────┐
│  👷 Specialist Agent 1   👷 Specialist Agent 2 │
│  👷 Specialist Agent 3   👷 Specialist Agent 4 │
│  ... (up to 349 agents)                       │
└─────────────────────────────────────────────┘
    ↓
✅ Quality Check → Dev↔QA Loop
    ↓
📋 Response Synthesis
    ↓
User Response
```

---

## 🛡️ Agent Categories (32 Total)

| Category | Count | Category | Count |
|----------|-------|----------|-------|
| Engineering | 42 | AI/ML | 28 |
| Marketing | 18 | Finance | 12 |
| Design | 16 | Game Dev | 24 |
| DevOps | 14 | Content | 14 |
| Support | 16 | Healthcare | 8 |
| Legal | 8 | XR / Spatial | 10 |
| Research | 10 | Security | 8 |
| Recruitment | 6 | HR | 6 |
| Hospitality | 6 | Real Estate | 6 |
| Supply Chain | 6 | Education | 6 |
| *Plus 10 more categories* | | | |

**Full directory**: [rudrax.cloud/autonomous-agents](https://rudrax.cloud/autonomous-agents)

---

## 📖 Documentation

Full documentation at **[rudrax.cloud](https://rudrax.cloud)**

- [Army Page](https://rudrax.cloud/army) — Open-source overview
- [Playground](https://rudrax.cloud/playground) — Try agents live
- [Autonomous Agents](https://rudrax.cloud/autonomous-agents) — Complete agent directory
- [Dashboard](https://rudrax.cloud/dashboard) — Real-time monitoring
- [Blog](https://rudrax.cloud/blog) — AI insights & tutorials

---

## 🤝 Contributing

We welcome contributions of all kinds!

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing`)
5. **Open** a Pull Request

Or suggest ideas at **[rudrax.cloud/contact](https://rudrax.cloud/contact)**

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

Built with ❤️ by **[Lalit Pandit](https://github.com/iamlalitpandit)** & the RudraX community.

---

<p align="center">
  <a href="https://rudrax.cloud"><strong>rudrax.cloud</strong></a> ·
  <a href="https://rudrax.cloud/army">About</a> ·
  <a href="https://rudrax.cloud/playground">Playground</a> ·
  <a href="https://rudrax.cloud/contact">Contact</a>
</p>
