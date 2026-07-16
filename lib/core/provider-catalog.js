/**
 * Single source of truth for provider identity and RudraX-style adapters.
 * pi-ai's built-in model catalog remains authoritative where it has entries;
 * this catalog supplies metadata, aliases and practical missing adapters.
 */
const p = (id, label, transport, baseUrl, apiKeys, models, options = {}) => Object.freeze({
  id, label, aliases: options.aliases ?? [], transport, baseUrl,
  env: Object.freeze({ apiKey: apiKeys, baseUrl: options.baseUrlEnv ?? [], model: options.modelEnv ?? [], apiMode: options.apiModeEnv ?? [] }),
  models, noAuth: options.noAuth ?? false, authHeader: options.authHeader ?? 'bearer',
  builtinEnvFallback: options.builtinEnvFallback ?? false,
});

export const PROVIDER_CATALOG = Object.freeze([
  p('ollama','Ollama','openai-completions','http://127.0.0.1:11434/v1',[],['llama3.2'],{aliases:['ollama-local'],baseUrlEnv:['OLLAMA_BASE_URL'],modelEnv:['OLLAMA_MODEL'],noAuth:true}),
  p('lmstudio','LM Studio','openai-completions','http://127.0.0.1:1234/v1',['LM_API_KEY'],['local-model'],{aliases:['lm-studio','lm_studio'],baseUrlEnv:['LM_BASE_URL','LMSTUDIO_BASE_URL'],modelEnv:['LM_MODEL','LMSTUDIO_MODEL'],noAuth:true}),
  p('localai','LocalAI','openai-completions','http://127.0.0.1:8080/v1',['LOCALAI_API_KEY'],['gpt-4'],{aliases:['local-ai'],baseUrlEnv:['LOCALAI_BASE_URL'],modelEnv:['LOCALAI_MODEL'],noAuth:true}),
  p('custom','Custom endpoint','openai-completions','http://127.0.0.1:8000/v1',['CUSTOM_API_KEY'],['custom-model'],{baseUrlEnv:['CUSTOM_BASE_URL'],modelEnv:['CUSTOM_MODEL']}),
  p('openai','OpenAI','openai-responses','https://api.openai.com/v1',['OPENAI_API_KEY'],['gpt-5.4'],{aliases:['openai-api'],baseUrlEnv:['OPENAI_BASE_URL'],modelEnv:['OPENAI_MODEL']}),
  p('azure-openai-responses','Azure OpenAI','azure-openai-responses','',['AZURE_OPENAI_API_KEY','AZURE_API_KEY'],['gpt-5.2'],{aliases:['azure-openai'],baseUrlEnv:['AZURE_OPENAI_BASE_URL','AZURE_OPENAI_ENDPOINT'],modelEnv:['AZURE_OPENAI_DEPLOYMENT','AZURE_OPENAI_MODEL'],authHeader:'api-key'}),
  p('azure-foundry','Azure AI Foundry','openai-completions','',['AZURE_FOUNDRY_API_KEY','AZURE_AI_API_KEY'],['deployment'],{aliases:['azure-ai-foundry','azure-ai'],baseUrlEnv:['AZURE_FOUNDRY_ENDPOINT','AZURE_FOUNDRY_BASE_URL','AZURE_AI_ENDPOINT'],modelEnv:['AZURE_FOUNDRY_DEPLOYMENT','AZURE_FOUNDRY_MODEL','AZURE_AI_MODEL'],apiModeEnv:['AZURE_FOUNDRY_API_MODE'],authHeader:'api-key'}),
  p('anthropic','Anthropic','anthropic-messages','https://api.anthropic.com',['ANTHROPIC_API_KEY','ANTHROPIC_TOKEN'],['claude-sonnet-4-6'],{aliases:['claude','claude-code'],baseUrlEnv:['ANTHROPIC_BASE_URL'],modelEnv:['ANTHROPIC_MODEL'],authHeader:'x-api-key'}),
  p('google','Google AI Studio','google-generative-ai','https://generativelanguage.googleapis.com',['GEMINI_API_KEY','GOOGLE_API_KEY'],['gemini-2.5-pro'],{aliases:['gemini','google-gemini','google-ai-studio'],modelEnv:['GEMINI_MODEL','GOOGLE_MODEL']}),
  p('google-gemini-cli','Google Gemini CLI OAuth','google-gemini-cli','',[],['gemini-2.5-pro'],{aliases:['gemini-cli']}),
  p('google-antigravity','Google Antigravity OAuth','google-generative-ai','',[],['gemini-3.1-pro-high'],{aliases:['antigravity']}),
  p('google-vertex','Google Vertex AI','google-vertex','',[],['gemini-3-pro-preview'],{aliases:['vertex','vertex-ai','gcp-vertex'],builtinEnvFallback:true}),
  p('amazon-bedrock','Amazon Bedrock','bedrock-converse-stream','',[],['us.anthropic.claude-sonnet-4-6'],{aliases:['aws','aws-bedrock','bedrock','amazon'],builtinEnvFallback:true}),
  p('openrouter','OpenRouter','openai-completions','https://openrouter.ai/api/v1',['OPENROUTER_API_KEY'],['anthropic/claude-sonnet-4.6'],{baseUrlEnv:['OPENROUTER_BASE_URL'],modelEnv:['OPENROUTER_MODEL']}),
  p('vercel-ai-gateway','Vercel AI Gateway','openai-completions','https://ai-gateway.vercel.sh/v1',['AI_GATEWAY_API_KEY'],['anthropic/claude-sonnet-4-6'],{aliases:['vercel','ai-gateway'],baseUrlEnv:['AI_GATEWAY_BASE_URL'],modelEnv:['AI_GATEWAY_MODEL']}),
  p('github-copilot','GitHub Copilot','openai-completions','https://api.githubcopilot.com',['COPILOT_GITHUB_TOKEN'],['gpt-4o'],{aliases:['copilot','github']}),
  p('openai-codex','OpenAI Codex','openai-codex-responses','https://chatgpt.com/backend-api/codex',['OPENAI_CODEX_TOKEN'],['gpt-5.4'],{aliases:['codex']}),
  p('groq','Groq','openai-completions','https://api.groq.com/openai/v1',['GROQ_API_KEY'],['openai/gpt-oss-120b'],{baseUrlEnv:['GROQ_BASE_URL'],modelEnv:['GROQ_MODEL']}),
  p('cerebras','Cerebras','openai-completions','https://api.cerebras.ai/v1',['CEREBRAS_API_KEY'],['zai-glm-4.7'],{baseUrlEnv:['CEREBRAS_BASE_URL'],modelEnv:['CEREBRAS_MODEL']}),
  p('mistral','Mistral','openai-completions','https://api.mistral.ai/v1',['MISTRAL_API_KEY'],['devstral-medium-latest'],{baseUrlEnv:['MISTRAL_BASE_URL'],modelEnv:['MISTRAL_MODEL']}),
  p('xai','xAI','openai-completions','https://api.x.ai/v1',['XAI_API_KEY'],['grok-4.3'],{aliases:['x-ai','x.ai','grok'],baseUrlEnv:['XAI_BASE_URL'],modelEnv:['XAI_MODEL']}),
  p('deepseek','DeepSeek','openai-completions','https://api.deepseek.com/v1',['DEEPSEEK_API_KEY'],['deepseek-chat'],{aliases:['deep-seek'],baseUrlEnv:['DEEPSEEK_BASE_URL'],modelEnv:['DEEPSEEK_MODEL']}),
  p('fireworks','Fireworks AI','openai-completions','https://api.fireworks.ai/inference/v1',['FIREWORKS_API_KEY'],['accounts/fireworks/models/deepseek-v3p1'],{aliases:['fireworks-ai'],baseUrlEnv:['FIREWORKS_BASE_URL'],modelEnv:['FIREWORKS_MODEL']}),
  p('novita','Novita AI','openai-completions','https://api.novita.ai/openai/v1',['NOVITA_API_KEY'],['deepseek/deepseek-v3-0324'],{aliases:['novita-ai'],baseUrlEnv:['NOVITA_BASE_URL'],modelEnv:['NOVITA_MODEL']}),
  p('zai','Z.AI / GLM','openai-completions','https://api.z.ai/api/paas/v4',['ZAI_API_KEY','Z_AI_API_KEY','GLM_API_KEY'],['glm-5'],{aliases:['glm','z-ai','z.ai','zhipu'],baseUrlEnv:['GLM_BASE_URL','ZAI_BASE_URL'],modelEnv:['GLM_MODEL','ZAI_MODEL']}),
  p('kimi-coding','Kimi Coding','anthropic-messages','https://api.kimi.com/coding',['KIMI_API_KEY','MOONSHOT_API_KEY'],['kimi-k2-thinking'],{aliases:['kimi','moonshot'],baseUrlEnv:['KIMI_BASE_URL'],modelEnv:['KIMI_MODEL']}),
  p('kimi-coding-cn','Kimi China','openai-completions','https://api.moonshot.cn/v1',['KIMI_CN_API_KEY','MOONSHOT_API_KEY'],['kimi-k2-thinking'],{aliases:['kimi-cn','moonshot-cn'],baseUrlEnv:['KIMI_CN_BASE_URL','MOONSHOT_BASE_URL'],modelEnv:['KIMI_CN_MODEL']}),
  p('minimax','MiniMax','anthropic-messages','https://api.minimax.io/anthropic',['MINIMAX_API_KEY'],['MiniMax-M2.7'],{baseUrlEnv:['MINIMAX_BASE_URL'],modelEnv:['MINIMAX_MODEL']}),
  p('minimax-cn','MiniMax China','anthropic-messages','https://api.minimaxi.com/anthropic',['MINIMAX_CN_API_KEY','MINIMAX_API_KEY'],['MiniMax-M2.7'],{aliases:['minimax-china','minimax_cn'],baseUrlEnv:['MINIMAX_CN_BASE_URL'],modelEnv:['MINIMAX_CN_MODEL']}),
  p('alibaba','Alibaba DashScope','openai-completions','https://dashscope-intl.aliyuncs.com/compatible-mode/v1',['DASHSCOPE_API_KEY','ALIBABA_API_KEY'],['qwen3-coder-plus'],{aliases:['dashscope','aliyun','qwen'],baseUrlEnv:['DASHSCOPE_BASE_URL'],modelEnv:['DASHSCOPE_MODEL']}),
  p('alibaba-coding-plan','Alibaba Coding Plan','openai-completions','https://coding-intl.dashscope.aliyuncs.com/v1',['DASHSCOPE_API_KEY','ALIBABA_API_KEY'],['qwen3-coder-plus'],{aliases:['alibaba-coding'],baseUrlEnv:['ALIBABA_CODING_PLAN_BASE_URL'],modelEnv:['ALIBABA_CODING_PLAN_MODEL']}),
  p('arcee','Arcee AI','openai-completions','https://api.arcee.ai/api/v1',['ARCEEAI_API_KEY','ARCEE_API_KEY'],['trinity-large-preview'],{aliases:['arcee-ai'],baseUrlEnv:['ARCEE_BASE_URL'],modelEnv:['ARCEE_MODEL']}),
  p('gmi','GMI Cloud','openai-completions','https://api.gmi-serving.com/v1',['GMI_API_KEY'],['deepseek-ai/DeepSeek-V3.2'],{aliases:['gmi-cloud'],baseUrlEnv:['GMI_BASE_URL'],modelEnv:['GMI_MODEL']}),
  p('nvidia','NVIDIA NIM','openai-completions','https://integrate.api.nvidia.com/v1',['NVIDIA_API_KEY','NGC_API_KEY'],['nvidia/nemotron-3-super-120b-a12b'],{aliases:['nim','nvidia-nim','build-nvidia'],baseUrlEnv:['NVIDIA_BASE_URL'],modelEnv:['NVIDIA_MODEL']}),
  p('opencode','OpenCode Zen','openai-completions','https://opencode.ai/zen/v1',['OPENCODE_ZEN_API_KEY','OPENCODE_API_KEY'],['claude-sonnet-4-6'],{aliases:['opencode-zen','zen'],baseUrlEnv:['OPENCODE_ZEN_BASE_URL'],modelEnv:['OPENCODE_ZEN_MODEL','OPENCODE_MODEL']}),
  p('opencode-go','OpenCode Go','openai-completions','https://opencode.ai/zen/go/v1',['OPENCODE_GO_API_KEY','OPENCODE_API_KEY'],['kimi-k2.5'],{aliases:['go'],baseUrlEnv:['OPENCODE_GO_BASE_URL'],modelEnv:['OPENCODE_GO_MODEL']}),
  p('kilocode','Kilo Code','openai-completions','https://api.kilo.ai/api/gateway',['KILOCODE_API_KEY'],['anthropic/claude-sonnet-4.6'],{aliases:['kilo','kilo-code'],baseUrlEnv:['KILOCODE_BASE_URL'],modelEnv:['KILOCODE_MODEL']}),
  p('huggingface','Hugging Face','openai-completions','https://router.huggingface.co/v1',['HF_TOKEN','HUGGINGFACE_API_KEY'],['moonshotai/Kimi-K2.5'],{aliases:['hf','hugging-face'],baseUrlEnv:['HF_BASE_URL'],modelEnv:['HF_MODEL']}),
  p('xiaomi','Xiaomi MiMo','openai-completions','https://api.xiaomimimo.com/v1',['XIAOMI_API_KEY','MIMO_API_KEY'],['mimo-v2.5'],{aliases:['mimo','xiaomi-mimo'],baseUrlEnv:['XIAOMI_BASE_URL'],modelEnv:['XIAOMI_MODEL']}),
  p('tencent-tokenhub','Tencent TokenHub','openai-completions','https://tokenhub.tencentmaas.com/v1',['TOKENHUB_API_KEY','TENCENT_API_KEY'],['hy3-preview'],{aliases:['tencent','tokenhub'],baseUrlEnv:['TOKENHUB_BASE_URL'],modelEnv:['TOKENHUB_MODEL']}),
  p('ollama-cloud','Ollama Cloud','openai-completions','https://ollama.com/v1',['OLLAMA_API_KEY'],['qwen3-coder'],{baseUrlEnv:['OLLAMA_CLOUD_BASE_URL'],modelEnv:['OLLAMA_CLOUD_MODEL']}),
  p('stepfun','StepFun','openai-completions','https://api.stepfun.ai/step_plan/v1',['STEPFUN_API_KEY'],['step-3.5-flash'],{aliases:['step'],baseUrlEnv:['STEPFUN_BASE_URL'],modelEnv:['STEPFUN_MODEL']}),
  p('together','Together AI','openai-completions','https://api.together.xyz/v1',['TOGETHER_API_KEY'],['meta-llama/Llama-3.3-70B-Instruct-Turbo'],{aliases:['together-ai'],baseUrlEnv:['TOGETHER_BASE_URL'],modelEnv:['TOGETHER_MODEL']}),
]);

const BY_ID = new Map(PROVIDER_CATALOG.map(provider => [provider.id, provider]));
const ALIASES = new Map();
for (const provider of PROVIDER_CATALOG) {
  ALIASES.set(provider.id, provider.id);
  for (const alias of provider.aliases) ALIASES.set(alias.toLowerCase(), provider.id);
}
export function normalizeProviderId(value = '') {
  const key = String(value).trim().toLowerCase();
  return ALIASES.get(key) ?? key;
}
export function getProviderDefinition(value) { return BY_ID.get(normalizeProviderId(value)); }
export function firstEnvironmentValue(names, env = process.env) {
  for (const name of names ?? []) if (typeof env[name] === 'string' && env[name].trim()) return env[name].trim();
  return undefined;
}
export function publicProviderCatalog() {
  return PROVIDER_CATALOG.map(({ authHeader: _authHeader, ...provider }) => ({ ...provider, configured: false }));
}
