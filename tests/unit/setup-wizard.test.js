import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installBundledAssets } from "../../lib/setup/setup-wizard.js";

describe("RudraX setup", () => {
  it("installs selected skills, tools and memory with a private manifest", async () => {
    const home = await mkdtemp(join(tmpdir(), "rudrax-setup-"));
    const manifest = await installBundledAssets({ home, features: ["skills", "browser", "memory"] });
    expect(manifest.features).toEqual(["browser", "memory", "skills"]);
    expect(await readFile(join(home, "agent", "skills", "github-code-review", "SKILL.md"), "utf8")).toContain("name: github-code-review");
    expect(await readFile(join(home, "runtime", "browser", "browser_tool.py"), "utf8")).toContain("RudraX optional runtime tools");
    expect(await readFile(join(home, "agent", "extensions", "evolving-memory.ts"), "utf8")).toContain("learn_from_experience");
    expect((await stat(join(home, "setup.json"))).mode & 0o777).toBe(0o600);
  });
});
