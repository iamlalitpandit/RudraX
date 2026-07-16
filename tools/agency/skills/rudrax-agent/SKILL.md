---
name: rudrax-agent
description: "Configure, operate, troubleshoot, and extend RudraX."
metadata:
  category: ai-agents
  emoji: "🔱"
  color: "orange"
  vibe: "Build. Break. Deploy. Orchestrate."
  original_name: "rudrax-agent"
---

# RudraX operator skill

Use this skill when a task involves installing, configuring, operating, troubleshooting, or extending RudraX.

## Project identity

RudraX is a hierarchical multi-agent runtime developed by Lalit Pandit. The runtime combines 349 specialist agents, 43 model-provider integrations, tactical squads, a WebUI, terminal interfaces, persistent memory, quality gates, and operational controls.

- Repository: https://github.com/iamlalitpandit/RudraX
- Website: https://rudrax.cloud
- Local configuration: `~/.rudrax/agent/`
- WebUI default port: `5555`

## Quick start

```bash
git clone https://github.com/iamlalitpandit/RudraX.git
cd RudraX
npm install
npm start
```

Open `http://localhost:5555` and change the default local password before exposing the service to a network.

## Common commands

```bash
npm start
npm run webui
npm run lint
npm test
npm run test:coverage
rudrax --list-models
rudrax --provider <provider> --model <model>
```

## Configuration files

```text
~/.rudrax/agent/auth.json       provider credentials
~/.rudrax/agent/models.json     custom providers and model definitions
~/.rudrax/agent/settings.json   runtime defaults
```

Credential files must remain mode `0600`. Never print or return raw keys from APIs.

## Provider troubleshooting

1. Run `rudrax --list-models` and confirm the provider/model appears.
2. Verify the expected environment variable or stored credential exists.
3. Confirm the endpoint includes the path required by the vendor.
4. For Azure AI Foundry, verify endpoint, deployment, API mode, and `api-key` authentication.
5. For local providers, confirm the server is running and the endpoint is explicitly configured.
6. Use a local mock server before testing a new adapter against paid APIs.

## WebUI troubleshooting

1. Check `/api/health`.
2. Authenticate before calling provider-management routes.
3. Inspect server logs for context/model-switch errors.
4. Confirm `auth.json`, `models.json`, and `settings.json` are writable only by the current user.
5. Run the provider unit tests after changing catalog or persistence logic.

## Extension rules

- Keep provider identity in `lib/core/provider-catalog.js`.
- Reuse existing transports rather than duplicating HTTP clients.
- Do not mark a provider configured until its credential or explicit local configuration resolves.
- Keep dynamic values out of HTML interpolation; use DOM APIs.
- Add regression tests for aliases, redaction, endpoint validation, selection, and real transport calls.
- Run lint, tests, coverage, packaging, and a WebUI smoke test before publishing.

## Verification checklist

```bash
npm ci
npm run lint
npm test
npm run test:coverage
npm pack --dry-run
git diff --check
```

A task is complete only after the requested runtime path has been exercised and the result has been verified.
