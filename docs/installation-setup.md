# RudraX installation setup

Run the interactive setup after installing RudraX:

```bash
npm install
npm run setup
# or: rudrax setup
```

On the first interactive `rudrax` launch, the same wizard opens automatically. CI and containers can install default local capabilities without prompts:

```bash
rudrax setup --defaults
```

The wizard configures:

- one of the providers in the RudraX provider catalog;
- the bundled 349-skill library;
- browser automation, web, image/video/vision/TTS, debug and daemon tools;
- persistent shared and evolving memory;
- Telegram and WhatsApp/Baileys gateways.

Configuration is saved under `~/.rudrax`: secrets in `.env` (mode `0600`), selected features in `setup.json`, skills/extensions under `agent/`, and optional runtimes under `runtime/`. Re-run `rudrax setup` whenever configuration changes.

## Gateways

Telegram requires `TELEGRAM_BOT_TOKEN`; optionally set `TELEGRAM_ALLOWED_CHAT_IDS`. Start with:

```bash
node ~/.rudrax/runtime/telegram/gateway.js
```

WhatsApp requires Node dependencies in its isolated runtime:

```bash
cd ~/.rudrax/runtime/whatsapp
npm install
node gateway.js
```

Scan the displayed QR code. Set `WHATSAPP_ALLOWED_NUMBERS` before exposing the gateway. Authentication state defaults to `~/.rudrax/whatsapp-auth`.

## Runtime tools

The Python runtime is standard-library-first and provides a common CLI. Examples:

```bash
python ~/.rudrax/runtime/web/web_tools.py web fetch --url https://example.com
python ~/.rudrax/runtime/memory/memory_tool.py memory set --key preference --value concise
python ~/.rudrax/runtime/memory/memory_tool.py memory get --key preference
python ~/.rudrax/runtime/debug/debug_helpers.py debug status
```

Provider-backed operations fail closed when their required API key is not configured.
