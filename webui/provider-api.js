import { randomUUID } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { dirname, join } from 'node:path';
import lockfile from 'proper-lockfile';
import { AuthStorage } from '../lib/core/auth-storage.js';
import { ModelRegistry } from '../lib/core/model-registry.js';
import { PROVIDER_CATALOG, firstEnvironmentValue, getProviderDefinition, normalizeProviderId } from '../lib/core/provider-catalog.js';

const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor']);
function readJson(path, fallback = {}) {
  if (!existsSync(path)) return structuredClone(fallback);
  const value = JSON.parse(readFileSync(path, 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid JSON object in ${path}`);
  return value;
}
function secureWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  chmodSync(temporary, 0o600);
  renameSync(temporary, path);
  chmodSync(path, 0o600);
}
function restoreSnapshots(snapshots) {
  for (const snapshot of [...snapshots].reverse()) {
    if (snapshot.content === undefined) {
      if (existsSync(snapshot.path)) unlinkSync(snapshot.path);
    } else {
      secureWrite(snapshot.path, JSON.parse(snapshot.content));
    }
  }
}
function recoverTransaction(journalPath) {
  if (!existsSync(journalPath)) return;
  const journal = readJson(journalPath);
  if (Array.isArray(journal.snapshots)) restoreSnapshots(journal.snapshots);
  unlinkSync(journalPath);
}
function secureWriteBatch(entries, journalPath) {
  const snapshots = entries.map(({ path }) => ({ path, content: existsSync(path) ? readFileSync(path, 'utf8') : undefined }));
  secureWrite(journalPath, { version: 1, snapshots });
  try {
    for (const entry of entries) secureWrite(entry.path, entry.value);
    unlinkSync(journalPath);
  } catch (error) {
    let restored = false;
    try {
      restoreSnapshots(snapshots);
      restored = true;
    } catch { /* leave journal for restart-time recovery */ }
    if (restored && existsSync(journalPath)) unlinkSync(journalPath);
    throw error;
  }
}
function acquireStorageLock(path) {
  let lastError;
  for (let attempt = 0; attempt < 10; attempt++) {
    try { return lockfile.lockSync(path, { realpath: false, stale: 30_000 }); }
    catch (error) {
      lastError = error;
      if (error?.code !== 'ELOCKED' || attempt === 9) throw error;
      const until = Date.now() + 20 * (attempt + 1);
      while (Date.now() < until) { /* synchronous cross-process lock retry */ }
    }
  }
  throw lastError ?? new Error('Failed to acquire provider configuration lock');
}
function withStorageLocks(paths, fn) {
  const uniquePaths = [...new Set(paths)].sort();
  for (const path of uniquePaths) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    if (!existsSync(path)) {
      try { writeFileSync(path, '{}\n', { mode: 0o600, flag: 'wx' }); }
      catch (error) { if (error?.code !== 'EEXIST') throw error; }
    }
  }
  const releases = [];
  try {
    for (const path of uniquePaths) releases.push(acquireStorageLock(path));
    const journalPath = join(dirname(uniquePaths[0]), '.provider-config-transaction.json');
    recoverTransaction(journalPath);
    return fn(journalPath);
  } finally {
    for (const release of releases.reverse()) release();
  }
}
function validateProvider(raw) {
  if (typeof raw !== 'string' || !raw.trim() || FORBIDDEN.has(raw.trim().toLowerCase())) throw new Error('Invalid provider');
  const provider = normalizeProviderId(raw);
  if (!getProviderDefinition(provider)) throw new Error(`Unknown provider: ${raw}`);
  return provider;
}
function validateText(value, label, max = 512) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > max || /[\0\r\n]/.test(value)) throw new Error(`Invalid ${label}`);
  return value.trim();
}
function isLoopbackHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host === '::1') return true;
  return isIP(host) === 4 && Number(host.split('.')[0]) === 127;
}
function hostnameMatches(hostname, allowed) {
  const host = hostname.toLowerCase();
  return host === allowed || host.endsWith(`.${allowed}`);
}
function validateUrl(value, provider) {
  const endpoint = validateText(value, 'URL', 2048);
  if (!endpoint) return undefined;
  let url;
  try { url = new URL(endpoint); } catch { throw new Error('Invalid URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Invalid URL');
  const definition = getProviderDefinition(provider);
  const loopback = isLoopbackHost(url.hostname);
  if (definition?.noAuth || provider === 'custom') {
    if (!loopback) throw new Error('Local/custom WebUI endpoints must use localhost or loopback');
    return url.toString().replace(/\/$/, '');
  }
  if (url.protocol !== 'https:') throw new Error('Cloud provider endpoints must use HTTPS');
  if (provider === 'azure-foundry' || provider === 'azure-openai-responses') {
    if (!['azure.com', 'azure.net'].some(domain => hostnameMatches(url.hostname, domain))) {
      throw new Error('Azure endpoints must use an Azure-owned hostname');
    }
    return url.toString().replace(/\/$/, '');
  }
  if (!definition?.baseUrl) throw new Error(`Endpoint overrides are not supported for ${provider}`);
  const expectedHost = new URL(definition.baseUrl).hostname;
  if (url.hostname.toLowerCase() !== expectedHost.toLowerCase()) {
    throw new Error(`Endpoint hostname must remain ${expectedHost}`);
  }
  return url.toString().replace(/\/$/, '');
}
function safeEndpointForStatus(value, provider) {
  if (!value) return undefined;
  try { return validateUrl(value, provider); } catch { return undefined; }
}

export class ProviderConfigService {
  constructor({ authPath, modelsPath, settingsPath, onSwitchModel, onConfigChange }) {
    this.authPath = authPath;
    this.modelsPath = modelsPath;
    this.settingsPath = settingsPath;
    this.onSwitchModel = onSwitchModel;
    this.onConfigChange = onConfigChange;
    // Recover an interrupted multi-file update before any state is exposed.
    withStorageLocks(this.storagePaths(), () => {});
  }
  storagePaths() {
    return [this.authPath, this.modelsPath, this.settingsPath];
  }
  modelRegistry() {
    return ModelRegistry.create(AuthStorage.create(this.authPath), this.modelsPath);
  }
  status() {
    // Recover any transaction left by another process before reading state.
    withStorageLocks(this.storagePaths(), () => {});
    const auth = readJson(this.authPath);
    const config = readJson(this.modelsPath, { providers: {} });
    const settings = readJson(this.settingsPath);
    const registry = this.modelRegistry();
    const availableProviders = new Set(registry.getAvailable().map(model => model.provider));
    const modelsByProvider = new Map();
    for (const model of registry.getAll()) {
      const list = modelsByProvider.get(model.provider) ?? [];
      if (!list.includes(model.id)) list.push(model.id);
      modelsByProvider.set(model.provider, list);
    }
    return PROVIDER_CATALOG.map(provider => {
      const entry = config.providers?.[provider.id] ?? {};
      return {
        id: provider.id, label: provider.label, aliases: provider.aliases, transport: provider.transport,
        apiMode: entry.api ?? provider.transport,
        baseUrl: provider.baseUrl, endpoint: safeEndpointForStatus(entry.baseUrl, provider.id),
        models: modelsByProvider.get(provider.id) ?? entry.models?.map(model => model.id) ?? provider.models,
        noAuth: provider.noAuth,
        hasApiKey: Boolean(auth[provider.id] || firstEnvironmentValue(provider.env.apiKey)),
        configured: availableProviders.has(provider.id),
        selected: settings.defaultProvider === provider.id,
        selectedModel: settings.defaultProvider === provider.id ? settings.defaultModel : undefined,
      };
    });
  }
  catalog() { return this.status(); }
  async configure(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid request');
    const provider = validateProvider(input.provider);
    const definition = getProviderDefinition(provider);
    const apiKey = validateText(input.apiKey, 'API key', 8192);
    if (apiKey?.startsWith('!')) throw new Error('Command-based API key values are not allowed');
    const endpoint = validateUrl(input.endpoint, provider);
    const model = validateText(input.model, 'model');
    const requestedApiMode = validateText(input.apiMode, 'API mode', 64);
    if (requestedApiMode && !['openai-completions', 'anthropic-messages'].includes(requestedApiMode)) throw new Error('Invalid API mode');
    const apiMode = requestedApiMode ?? definition.transport;
    if (!apiKey && !endpoint && !model && !requestedApiMode) throw new Error('Provide an API key, endpoint, model, or API mode');
    withStorageLocks(this.storagePaths(), (journalPath) => {
      const entries = [];
      if (apiKey) {
        const auth = readJson(this.authPath);
        auth[provider] = { type: 'api_key', key: apiKey };
        entries.push({ path: this.authPath, value: auth });
      }
      if (endpoint || model || requestedApiMode) {
        const config = readJson(this.modelsPath, { providers: {} });
        if (!config.providers || typeof config.providers !== 'object' || Array.isArray(config.providers)) config.providers = {};
        const old = config.providers[provider] ?? {};
        const id = model ?? old.models?.[0]?.id ?? definition.models[0];
        const baseUrl = endpoint ?? old.baseUrl ?? definition.baseUrl;
        if (!baseUrl) throw new Error(`Endpoint is required for ${provider}`);
        const models = model
          ? [{ id, name: id, api: apiMode }]
          : old.models?.map(existing => ({ ...existing, api: apiMode }));
        config.providers[provider] = {
          ...old,
          baseUrl,
          api: apiMode,
          ...(models ? { models } : {}),
          // Auth lives only in auth.json; this symbolic env reference contains no secret.
          apiKey: definition.env.apiKey[0] ?? 'CUSTOM_API_KEY',
        };
        entries.push({ path: this.modelsPath, value: config });
      }
      secureWriteBatch(entries, journalPath);
    });
    if (this.onConfigChange) await this.onConfigChange({ provider, action: 'configured' });
    return this.status().find(item => item.id === provider);
  }
  async remove(rawProvider) {
    const provider = validateProvider(rawProvider);
    withStorageLocks(this.storagePaths(), (journalPath) => {
      const auth = readJson(this.authPath);
      delete auth[provider];
      const config = readJson(this.modelsPath, { providers: {} });
      if (config.providers && typeof config.providers === 'object') delete config.providers[provider];
      const settings = readJson(this.settingsPath);
      if (settings.defaultProvider === provider) { delete settings.defaultProvider; delete settings.defaultModel; }
      secureWriteBatch([
        { path: this.authPath, value: auth },
        { path: this.modelsPath, value: config },
        { path: this.settingsPath, value: settings },
      ], journalPath);
    });
    if (this.onConfigChange) await this.onConfigChange({ provider, action: 'removed' });
    return { ok: true, provider };
  }
  async switchModel(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid request');
    const provider = validateProvider(input.provider);
    const model = validateText(input.model, 'model');
    const context = validateText(input.context, 'context', 256);
    if (!model) throw new Error('Invalid model');
    if (!context) throw new Error('Context is required to switch the active model');
    const available = this.status().find(item => item.id === provider)?.models ?? [];
    if (!available.includes(model)) throw new Error(`Unknown model for ${provider}`);
    const registry = this.modelRegistry();
    const selected = registry.find(provider, model);
    if (!selected || !registry.hasConfiguredAuth(selected)) throw new Error(`Provider ${provider} is not configured`);
    if (!this.onSwitchModel) throw new Error('Active model switching is unavailable');
    await this.onSwitchModel({ provider, model, context });
    withStorageLocks(this.storagePaths(), () => {
      const settings = readJson(this.settingsPath);
      settings.defaultProvider = provider;
      settings.defaultModel = model;
      secureWrite(this.settingsPath, settings);
    });
    return { ok: true, provider, model, context };
  }
}

export function createProviderHandlers(service) {
  const run = fn => async (req, res) => { try { return res.json(await fn(req)); } catch (error) { return res.status(400).json({ error: error.message }); } };
  return {
    catalog: (_req, res) => res.json({ providers: service.catalog() }),
    status: (_req, res) => res.json({ providers: service.status() }),
    configure: run(req => service.configure(req.body)),
    remove: run(req => service.remove(req.params.provider)),
    switchModel: run(req => service.switchModel(req.body)),
    models: (req, res) => {
      try {
        const provider = validateProvider(req.params.provider);
        const item = service.status().find(entry => entry.id === provider);
        return res.json({ provider, models: item.models, selected: item.selected });
      } catch (error) { return res.status(400).json({ error: error.message }); }
    },
  };
}

export function mountProviderApi(app, { authPath, modelsPath, settingsPath, onSwitchModel, onConfigChange }) {
  const handlers = createProviderHandlers(new ProviderConfigService({ authPath, modelsPath, settingsPath, onSwitchModel, onConfigChange }));
  app.get('/api/providers/catalog', handlers.catalog);
  app.get('/api/providers/status', handlers.status);
  app.put('/api/providers/:provider', (req, res) => handlers.configure({ ...req, body: { ...req.body, provider: req.params.provider } }, res));
  app.delete('/api/providers/:provider', handlers.remove);
  app.get('/api/providers/:provider/models', handlers.models);
  app.put('/api/models/active', handlers.switchModel);
  return handlers;
}
