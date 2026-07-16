import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { getProviders, streamSimple } from '@imlalitpandit/pi-ai';
import { AuthStorage } from '../../lib/core/auth-storage.js';
import { ModelRegistry } from '../../lib/core/model-registry.js';
import {
  PROVIDER_CATALOG,
  getProviderDefinition,
  normalizeProviderId,
} from '../../lib/core/provider-catalog.js';
import { findInitialModel } from '../../lib/core/model-resolver.js';
import { ProviderConfigService, createProviderHandlers } from '../../webui/provider-api.js';

const required = [
  'ollama','lmstudio','openai','azure-openai-responses','azure-foundry','anthropic','google','google-vertex',
  'amazon-bedrock','openrouter','github-copilot','openai-codex','groq','cerebras','mistral','xai','deepseek',
  'fireworks','novita','zai','kimi-coding','kimi-coding-cn','minimax','minimax-cn','alibaba','alibaba-coding-plan',
  'arcee','gmi','nvidia','opencode','opencode-go','kilocode','huggingface','xiaomi','tencent-tokenhub',
  'ollama-cloud','stepfun','together','localai','custom',
];

const envKeys = new Set();
function setEnv(values) {
  for (const [key, value] of Object.entries(values)) {
    envKeys.add(key);
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
afterEach(() => { for (const key of envKeys) delete process.env[key]; envKeys.clear(); });

describe('provider catalog', () => {
  it('is the broad single source of RudraX-style provider metadata', () => {
    expect(required.every(id => PROVIDER_CATALOG.some(p => p.id === id))).toBe(true);
    expect(getProviders().every(id => PROVIDER_CATALOG.some(p => p.id === id))).toBe(true);
    for (const provider of PROVIDER_CATALOG) {
      expect(provider).toEqual(expect.objectContaining({ id: expect.any(String), aliases: expect.any(Array), transport: expect.any(String), env: expect.any(Object), models: expect.any(Array), noAuth: expect.any(Boolean) }));
      expect(provider.models.length).toBeGreaterThan(0);
    }
  });

  it('normalizes practical aliases without changing unknown custom slugs', () => {
    expect(normalizeProviderId('Gemini')).toBe('google');
    expect(normalizeProviderId('AWS')).toBe('amazon-bedrock');
    expect(normalizeProviderId('opencode-zen')).toBe('opencode');
    expect(normalizeProviderId('my-proxy')).toBe('my-proxy');
    expect(getProviderDefinition('claude').id).toBe('anthropic');
  });
});

describe('registry bootstrap and auth', () => {
  it('preserves pi-ai built-ins, adds missing adapters, and never duplicates provider/model', () => {
    const registry = ModelRegistry.inMemory(AuthStorage.inMemory());
    const models = registry.getAll();
    expect(models.some(m => m.provider === 'anthropic')).toBe(true);
    expect(models.some(m => m.provider === 'azure-foundry')).toBe(true);
    expect(models.some(m => m.provider === 'deepseek')).toBe(true);
    const keys = models.map(m => `${m.provider}\0${m.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('uses explicit provider env endpoint/model overrides ahead of catalog defaults', () => {
    setEnv({ DEEPSEEK_BASE_URL: 'https://proxy.example/v1', DEEPSEEK_MODEL: 'deepseek-test' });
    const registry = ModelRegistry.inMemory(AuthStorage.inMemory());
    const model = registry.find('deepseek', 'deepseek-test');
    expect(model.baseUrl).toBe('https://proxy.example/v1');
  });

  it('resolves catalog key aliases and enables local no-auth adapters only when explicitly configured', async () => {
    setEnv({ GLM_API_KEY: 'alias-secret', LM_BASE_URL: 'http://127.0.0.1:1234/v1' });
    const auth = AuthStorage.inMemory();
    expect(await auth.getApiKey('zai')).toBe('alias-secret');
    const registry = ModelRegistry.inMemory(auth);
    expect(registry.getAvailable().some(m => m.provider === 'lmstudio')).toBe(true);
    expect(registry.getAvailable().some(m => m.provider === 'localai')).toBe(false);
  });

  it('supports Azure Foundry endpoint/deployment env, Anthropic mode, and sends api-key header', async () => {
    setEnv({ AZURE_FOUNDRY_ENDPOINT: 'https://unit.services.ai.azure.com/models', AZURE_FOUNDRY_DEPLOYMENT: 'deployment-a', AZURE_FOUNDRY_API_KEY: 'azure-secret', AZURE_FOUNDRY_API_MODE: 'anthropic' });
    const auth = AuthStorage.inMemory();
    const registry = ModelRegistry.inMemory(auth);
    const model = registry.find('azure-foundry', 'deployment-a');
    expect(model.baseUrl).toBe('https://unit.services.ai.azure.com/models');
    expect(model.api).toBe('anthropic-messages');
    const resolved = await registry.getApiKeyAndHeaders(model);
    expect(resolved).toEqual(expect.objectContaining({ ok: true, apiKey: 'azure-secret', headers: expect.objectContaining({ 'api-key': 'azure-secret', Authorization: null }) }));
  });

  it('selects an authenticated saved model before another authenticated cloud model', async () => {
    const registry = ModelRegistry.inMemory(AuthStorage.inMemory({
      anthropic: { type: 'api_key', key: 'x' },
      deepseek: { type: 'api_key', key: 'y' },
    }));
    let result = await findInitialModel({ scopedModels: [], isContinuing: false, defaultProvider: 'deepseek', defaultModelId: 'deepseek-chat', modelRegistry: registry });
    expect(result.model.provider).toBe('deepseek');
    result = await findInitialModel({ scopedModels: [], isContinuing: false, modelRegistry: registry });
    expect(result.model.provider).toBe('anthropic');
  });

  it('does not select an unauthenticated saved cloud model', async () => {
    const registry = ModelRegistry.inMemory(AuthStorage.inMemory({ anthropic: { type: 'api_key', key: 'x' } }));
    const result = await findInitialModel({ scopedModels: [], isContinuing: false, defaultProvider: 'deepseek', defaultModelId: 'deepseek-chat', modelRegistry: registry });
    expect(result.model.provider).toBe('anthropic');
  });

  it('uses a configured API key for a custom endpoint instead of discarding it as no-auth', async () => {
    const auth = AuthStorage.inMemory({ custom: { type: 'api_key', key: 'custom-secret' } });
    const registry = ModelRegistry.inMemory(auth);
    const resolved = await registry.getApiKeyAndHeaders(registry.find('custom', 'custom-model'));
    expect(resolved.apiKey).toBe('custom-secret');
  });
});

describe('provider configuration service and handlers', () => {
  it('redacts secrets, validates IDs/URLs, rejects prototype pollution, and persists mode 0600', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rudrax-provider-'));
    const service = new ProviderConfigService({ authPath: join(dir, 'auth.json'), modelsPath: join(dir, 'models.json'), settingsPath: join(dir, 'settings.json') });
    await service.configure({ provider: 'deepseek', apiKey: 'top-secret', endpoint: 'https://api.deepseek.com/v1', model: 'deepseek-chat' });
    const status = service.status();
    expect(JSON.stringify(status)).not.toContain('top-secret');
    expect(status.find(x => x.id === 'deepseek')).toEqual(expect.objectContaining({ configured: true, hasApiKey: true, endpoint: 'https://api.deepseek.com/v1' }));
    expect(statSync(join(dir, 'auth.json')).mode & 0o777).toBe(0o600);
    expect(statSync(join(dir, 'models.json')).mode & 0o777).toBe(0o600);
    await expect(service.configure({ provider: '__proto__', apiKey: 'x' })).rejects.toThrow(/provider/i);
    await expect(service.configure({ provider: 'deepseek', apiKey: '!printf stolen' })).rejects.toThrow(/command/i);
    await expect(service.configure({ provider: 'deepseek', endpoint: 'file:///etc/passwd' })).rejects.toThrow(/url/i);
  });

  it('rejects credential-bearing/private remote URLs before persisting any submitted key', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rudrax-provider-transaction-'));
    const authPath = join(dir, 'auth.json');
    const service = new ProviderConfigService({ authPath, modelsPath: join(dir, 'models.json'), settingsPath: join(dir, 'settings.json') });
    await expect(service.configure({ provider: 'deepseek', apiKey: 'must-not-persist', endpoint: 'https://proxy.example/v1?api_key=leak', model: 'deepseek-chat' })).rejects.toThrow(/url/i);
    expect(existsSync(authPath) ? readFileSync(authPath, 'utf8') : '{}').not.toContain('must-not-persist');
    await expect(service.configure({ provider: 'deepseek', apiKey: 'must-not-persist', endpoint: 'https://169.254.169.254/latest', model: 'deepseek-chat' })).rejects.toThrow(/hostname|private|link-local/i);
    await expect(service.configure({ provider: 'localai', endpoint: 'http://169.254.169.254/latest', model: 'local-model' })).rejects.toThrow(/localhost|loopback/i);
    await expect(service.configure({ provider: 'localai', endpoint: 'http://127.attacker.example/v1', model: 'local-model' })).rejects.toThrow(/localhost|loopback/i);
    expect(existsSync(authPath) ? readFileSync(authPath, 'utf8') : '{}').not.toContain('must-not-persist');
    await service.configure({ provider: 'localai', endpoint: 'http://127.0.0.1:8080/v1', model: 'local-model' });
    expect(service.status().find(item => item.id === 'localai').configured).toBe(true);
    writeFileSync(join(dir, 'models.json'), JSON.stringify({ providers: { deepseek: { baseUrl: 'https://api.deepseek.com/v1?api_key=legacy-secret' } } }));
    expect(JSON.stringify(service.status())).not.toContain('legacy-secret');
  });

  it('reports environment-authenticated providers and rejects an Azure key without an endpoint', () => {
    setEnv({ DEEPSEEK_API_KEY: 'env-secret', AZURE_FOUNDRY_API_KEY: 'azure-key-without-endpoint' });
    const dir = mkdtempSync(join(tmpdir(), 'rudrax-provider-env-'));
    const service = new ProviderConfigService({ authPath: join(dir, 'auth.json'), modelsPath: join(dir, 'models.json'), settingsPath: join(dir, 'settings.json') });
    const status = service.status();
    expect(status.find(item => item.id === 'deepseek')).toEqual(expect.objectContaining({ configured: true, hasApiKey: true }));
    expect(status.find(item => item.id === 'azure-foundry').configured).toBe(false);
  });

  it('does not treat a symbolic unresolved provider key as configured', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rudrax-unresolved-key-'));
    const service = new ProviderConfigService({
      authPath: join(dir, 'auth.json'), modelsPath: join(dir, 'models.json'), settingsPath: join(dir, 'settings.json'),
      onSwitchModel: async () => {},
    });
    await service.configure({ provider: 'deepseek', model: 'unauthenticated-model' });
    expect(service.status().find(item => item.id === 'deepseek')).toEqual(expect.objectContaining({ configured: false, hasApiKey: false }));
    await expect(service.switchModel({ provider: 'deepseek', model: 'unauthenticated-model', context: 'ctx' })).rejects.toThrow(/not configured/i);
  });

  it('recovers an interrupted transaction before exposing provider status', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rudrax-journal-recovery-'));
    const authPath = join(dir, 'auth.json');
    const modelsPath = join(dir, 'models.json');
    const settingsPath = join(dir, 'settings.json');
    for (const path of [authPath, modelsPath, settingsPath]) writeFileSync(path, '{}\n', { mode: 0o600 });
    writeFileSync(authPath, JSON.stringify({ deepseek: { type: 'api_key', key: 'partial-secret' } }));
    writeFileSync(join(dir, '.provider-config-transaction.json'), JSON.stringify({
      version: 1,
      snapshots: [authPath, modelsPath, settingsPath].map(path => ({ path, content: '{}\n' })),
    }), { mode: 0o600 });
    const service = new ProviderConfigService({ authPath, modelsPath, settingsPath });
    expect(JSON.stringify(service.status())).not.toContain('partial-secret');
    expect(existsSync(join(dir, '.provider-config-transaction.json'))).toBe(false);
  });

  it('does not persist a model selection when the live context switch fails', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rudrax-switch-rollback-'));
    const settingsPath = join(dir, 'settings.json');
    const service = new ProviderConfigService({
      authPath: join(dir, 'auth.json'), modelsPath: join(dir, 'models.json'), settingsPath,
      onSwitchModel: async () => { throw new Error('Context not found'); },
    });
    await service.configure({ provider: 'deepseek', apiKey: 'test-key' });
    await expect(service.switchModel({ provider: 'deepseek', model: 'deepseek-chat', context: 'missing' })).rejects.toThrow('Context not found');
    const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : {};
    expect(settings.defaultProvider).toBeUndefined();
  });

  it('handler logic configures, lists all registry models, switches the live context and removes without importing the listening server', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rudrax-handlers-'));
    const switches = [];
    const service = new ProviderConfigService({
      authPath: join(dir, 'auth.json'), modelsPath: join(dir, 'models.json'), settingsPath: join(dir, 'settings.json'),
      onSwitchModel: async selection => switches.push(selection),
    });
    const handlers = createProviderHandlers(service);
    const response = () => ({ code: 200, body: null, status(n) { this.code = n; return this; }, json(v) { this.body = v; return this; } });
    let res = response();
    await handlers.configure({ body: { provider: 'openrouter', apiKey: 'secret', model: 'openai/gpt-4o' } }, res);
    expect(res.code).toBe(200);
    const persistedRegistry = ModelRegistry.create(AuthStorage.create(join(dir, 'auth.json')), join(dir, 'models.json'));
    expect(persistedRegistry.getError()).toBeUndefined();
    expect(persistedRegistry.find('openrouter', 'openai/gpt-4o')).toBeTruthy();
    res = response(); handlers.catalog({}, res);
    expect(res.body.providers.some(p => p.id === 'openrouter')).toBe(true);
    expect(res.body.providers.find(p => p.id === 'openrouter').models.length).toBeGreaterThan(1);
    expect(JSON.stringify(res.body)).not.toContain('secret');
    res = response(); await handlers.switchModel({ body: { provider: 'openrouter', model: 'openai/gpt-4o', context: 'ctx-1' } }, res);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual(expect.objectContaining({ defaultProvider: 'openrouter', defaultModel: 'openai/gpt-4o' }));
    expect(switches).toEqual([{ provider: 'openrouter', model: 'openai/gpt-4o', context: 'ctx-1' }]);
    res = response(); await handlers.remove({ params: { provider: 'openrouter' } }, res);
    expect(res.body.ok).toBe(true);
  });

  it('smokes a newly-added adapter through pi-ai against a real local HTTP server', async () => {
    let received;
    const server = createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        received = { url: req.url, headers: req.headers, body: JSON.parse(body) };
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write('data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1,"model":"mock-model","choices":[{"index":0,"delta":{"role":"assistant","content":"ok"},"finish_reason":null}]}\n\n');
        res.write('data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1,"model":"mock-model","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}\n\n');
        res.end('data: [DONE]\n\n');
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const endpoint = `http://127.0.0.1:${server.address().port}/v1`;
    try {
      setEnv({ AZURE_FOUNDRY_ENDPOINT: endpoint, AZURE_FOUNDRY_DEPLOYMENT: 'mock-model', AZURE_FOUNDRY_API_KEY: 'test-only-key' });
      const registry = ModelRegistry.inMemory(AuthStorage.inMemory());
      const model = registry.find('azure-foundry', 'mock-model');
      const auth = await registry.getApiKeyAndHeaders(model);
      let final;
      for await (const event of streamSimple(model, { messages: [{ role: 'user', content: 'ping', timestamp: Date.now() }] }, { apiKey: auth.apiKey, headers: auth.headers })) {
        if (event.type === 'done') final = event.message;
      }
      expect(final.content).toEqual([{ type: 'text', text: 'ok' }]);
      expect(received.url).toBe('/v1/chat/completions');
      expect(received.body.model).toBe('mock-model');
      expect(received.body.stream).toBe(true);
      expect(received.headers['api-key']).toBe('test-only-key');
      expect(received.headers.authorization).toBeUndefined();
    } finally { await new Promise(resolve => server.close(resolve)); }
  });
});
