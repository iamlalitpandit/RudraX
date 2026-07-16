import { createInterface } from "node:readline/promises";
import { chmod, cp, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { featureChoices, featureEnvironment, providerChoices } from "./catalog.js";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const defaultHome = join(homedir(), ".rudrax");

function parseEnv(text = "") {
  const values = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

function serializeEnv(values) {
  return [...values.entries()].map(([key, value]) => {
    if (/[\r\n]/.test(value)) throw new Error(`${key} cannot contain line breaks`);
    return `${key}=${value}`;
  }).join("\n") + "\n";
}

async function atomicWrite(path, content, mode = 0o600) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, content, { mode });
  await rename(temporary, path);
  await chmod(path, mode);
}

async function promptSecret(rl, label) {
  // readline cannot portably mask input; explicitly warn before reading it.
  return (await rl.question(`${label} (input will be visible; Enter to skip): `)).trim();
}

function parseSelection(answer, choices) {
  const selected = new Set();
  for (const token of answer.split(",").map((item) => item.trim()).filter(Boolean)) {
    const index = Number(token) - 1;
    if (choices[index]) selected.add(choices[index].id);
    else if (choices.some((choice) => choice.id === token)) selected.add(token);
  }
  return selected;
}

export async function installBundledAssets({ home = defaultHome, features }) {
  const agentDir = join(home, "agent");
  const selected = new Set(features);
  await mkdir(agentDir, { recursive: true });

  if (selected.has("skills")) {
    await cp(join(packageRoot, "tools", "agency", "skills"), join(agentDir, "skills"), { recursive: true, force: true });
  }

  const extensions = ["agency-manager.ts", "agency-orchestrator.ts", "tool-registry.ts"];
  if (selected.has("memory")) extensions.push("shared-memory.ts", "evolving-memory.ts");
  await mkdir(join(agentDir, "extensions"), { recursive: true });
  for (const extension of extensions) {
    const source = join(packageRoot, "tools", "agency", extension);
    if (existsSync(source)) await cp(source, join(agentDir, "extensions", extension), { force: true });
  }

  const runtimeDir = join(home, "runtime");
  await mkdir(runtimeDir, { recursive: true });
  for (const feature of selected) {
    const source = join(packageRoot, "tools", "runtime", feature);
    if (existsSync(source)) await cp(source, join(runtimeDir, feature), { recursive: true, force: true });
  }

  const manifest = {
    version: 1,
    configuredAt: new Date().toISOString(),
    features: [...selected].sort(),
    runtimeDir,
  };
  await atomicWrite(join(home, "setup.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

export async function runSetupWizard(options = {}) {
  const home = options.home ?? process.env.RUDRAX_HOME ?? defaultHome;
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  if (options.defaults) {
    const features = featureChoices.filter((choice) => choice.default).map((choice) => choice.id);
    return installBundledAssets({ home, features });
  }

  if (!options.force && (!input.isTTY || !output.isTTY)) {
    throw new Error("Setup requires an interactive terminal. Use rudrax setup --defaults for unattended setup.");
  }

  const rl = createInterface({ input, output });
  try {
    output.write("\nRudraX installation setup\n=========================\n\nModel providers:\n");
    providerChoices.forEach((provider, index) => output.write(`  ${index + 1}. ${provider.label} (${provider.id})\n`));
    const providerIndex = Number((await rl.question("Choose a provider [1]: ")).trim() || "1") - 1;
    const provider = providerChoices[providerIndex] ?? providerChoices[0];

    const envPath = join(home, ".env");
    const env = parseEnv(existsSync(envPath) ? await readFile(envPath, "utf8") : "");
    if (provider.apiKeyEnv && !provider.noAuth) {
      const apiKey = await promptSecret(rl, `${provider.label} API key`);
      if (apiKey) env.set(provider.apiKeyEnv, apiKey);
    }
    if (provider.baseUrlEnv) {
      const baseUrl = (await rl.question(`Base URL [${provider.defaultBaseUrl || "provider default"}]: `)).trim();
      if (baseUrl) env.set(provider.baseUrlEnv, baseUrl);
    }
    if (provider.modelEnv) {
      const model = (await rl.question(`Default model [${provider.defaultModel || "provider default"}]: `)).trim();
      if (model) env.set(provider.modelEnv, model);
    }
    env.set("RUDRAX_DEFAULT_PROVIDER", provider.id);

    output.write("\nOptional capabilities (comma-separated numbers):\n");
    featureChoices.forEach((feature, index) => output.write(`  ${index + 1}. ${feature.label}${feature.default ? " [default]" : ""}\n`));
    const defaults = featureChoices.filter((feature) => feature.default).map((feature, index) => featureChoices.indexOf(feature) + 1).join(",");
    const answer = (await rl.question(`Select [${defaults}]: `)).trim();
    const selected = answer ? parseSelection(answer, featureChoices) : new Set(featureChoices.filter((feature) => feature.default).map((feature) => feature.id));

    for (const feature of featureChoices.filter((item) => selected.has(item.id))) {
      for (const variable of featureEnvironment[feature.id] ?? []) {
        const current = env.get(variable) ?? "";
        const value = (await rl.question(`${variable}${current ? " [configured]" : ""} (Enter to skip): `)).trim();
        if (value) env.set(variable, value);
      }
    }

    await atomicWrite(envPath, serializeEnv(env));
    const manifest = await installBundledAssets({ home, features: selected });
    output.write(`\nRudraX configured at ${home}. Secrets saved with mode 0600.\n`);
    return { ...manifest, provider: provider.id };
  } finally {
    rl.close();
  }
}

export async function ensureFirstRunSetup(options = {}) {
  const home = options.home ?? process.env.RUDRAX_HOME ?? defaultHome;
  if (process.env.RUDRAX_SKIP_SETUP === "1" || existsSync(join(home, "setup.json"))) return false;
  if (!process.stdin.isTTY || !process.stdout.isTTY) return false;
  await runSetupWizard({ ...options, home, force: true });
  return true;
}
