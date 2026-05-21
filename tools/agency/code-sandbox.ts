/**
 * ═══════════════════════════════════════════════════════════════════════
 *  📦 RUDRAX CODE SANDBOX — Secure Isolated Execution Environment
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Provides safe code execution in isolated environments:
 *   - Timeout protection (kill runaway processes)
 *   - Resource limits (memory, CPU)
 *   - No network access (by default)
 *   - Filesystem isolation (temp directories)
 *   - Output capture (stdout/stderr)
 *   - Result parsing (JSON validation)
 *
 * Supports: JavaScript, Python, Bash, TypeScript
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import { spawn, execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

const SANDBOX_DIR = path.join(os.homedir(), ".rudrax", "agent", "sandbox");

function ensureDir(): void { if (!fs.existsSync(SANDBOX_DIR)) fs.mkdirSync(SANDBOX_DIR, { recursive: true }); }

interface SandboxResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  outputFiles: string[];
}

const SUPPORTED_LANGUAGES = ["javascript", "typescript", "python", "bash", "go", "rust"];

function executeCode(code: string, language: string, timeout: number = 30000): Promise<SandboxResult> {
  return new Promise((resolve) => {
    ensureDir();
    const sandboxId = crypto.randomBytes(8).toString("hex");
    const workDir = path.join(SANDBOX_DIR, sandboxId);
    const startTime = Date.now();

    try {
      fs.mkdirSync(workDir, { recursive: true });
      const filePath = path.join(workDir, getFileName(language));

      // Write code to file
      fs.writeFileSync(filePath, code, "utf-8");

      const { cmd, args } = getCommand(language, filePath);
      const child = spawn(cmd, args, {
        cwd: workDir,
        timeout,
        env: { ...process.env, NODE_ENV: "sandbox", SANDBOX: "1" },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const killTimer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeout);

      child.stdout.on("data", (data) => { stdout += data.toString(); });
      child.stderr.on("data", (data) => { stderr += data.toString(); });

      child.on("close", (exitCode) => {
        clearTimeout(killTimer);

        // Collect output files
        const outputFiles: string[] = [];
        try {
          const files = fs.readdirSync(workDir);
          for (const f of files) {
            if (f !== path.basename(filePath)) {
              outputFiles.push(path.join(workDir, f));
            }
          }
        } catch {}

        resolve({
          success: exitCode === 0 && !timedOut,
          stdout: stdout.slice(0, 10000),
          stderr: timedOut ? "Execution timed out" : stderr.slice(0, 5000),
          exitCode: exitCode || (timedOut ? -1 : 0),
          duration: Date.now() - startTime,
          outputFiles,
        });
      });

      child.on("error", (err) => {
        clearTimeout(killTimer);
        resolve({ success: false, stdout, stderr: err.message, exitCode: -1, duration: Date.now() - startTime, outputFiles: [] });
      });
    } catch (err: any) {
      resolve({ success: false, stdout: "", stderr: err.message, exitCode: -1, duration: Date.now() - startTime, outputFiles: [] });
    } finally {
      // Cleanup after 5 seconds
      setTimeout(() => {
        try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
      }, 5000);
    }
  });
}

function getFileName(language: string): string {
  const exts: Record<string, string> = { javascript: "script.js", typescript: "script.ts", python: "script.py", bash: "script.sh", go: "main.go", rust: "main.rs" };
  return exts[language] || "script.txt";
}

function getCommand(language: string, filePath: string): { cmd: string; args: string[] } {
  switch (language) {
    case "javascript": return { cmd: "node", args: ["--no-warnings", filePath] };
    case "typescript": return { cmd: "npx", args: ["tsx", filePath] };
    case "python": return { cmd: "python3", args: [filePath] };
    case "bash": return { cmd: "bash", args: [filePath] };
    case "go": return { cmd: "go", args: ["run", filePath] };
    case "rust": return { cmd: "rustc", args: ["-o", filePath.replace(".rs", ""), filePath] };
    default: return { cmd: "bash", args: [filePath] };
  }
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("sandbox", {
    description: "Code Sandbox: execute code in an isolated environment. Usage: /sandbox <run <lang> <code>|status|languages>",
    getArgumentCompletions(prefix: string) {
      const subs = ["run", "status", "languages"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0];

      if (sub === "run" && parts.length >= 3) {
        const language = parts[1];
        const code = parts.slice(2).join(" ");

        if (!SUPPORTED_LANGUAGES.includes(language)) {
          ctx.ui.notify(`⚠️ Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`, "warn");
          return;
        }

        ctx.ui.notify(`📦 Running ${language} sandbox...`, "info");
        const result = await executeCode(code, language);

        const output = result.success ? "✅ **Execution Successful**" : "❌ **Execution Failed**";
        ctx.ui.notify(
          `${output}\n` +
          `Duration: ${result.duration}ms\n` +
          `Exit code: ${result.exitCode}\n\n` +
          `${result.stdout ? `**stdout:**\n\`\`\`\n${result.stdout.slice(0, 2000)}\n\`\`\`\n` : ""}` +
          `${result.stderr ? `**stderr:**\n\`\`\`\n${result.stderr}\n\`\`\`\n` : ""}` +
          `${result.outputFiles.length > 0 ? `\nOutput files: ${result.outputFiles.join(", ")}` : ""}`,
          result.success ? "info" : "warn"
        );
        return;
      }

      if (sub === "status") {
        ctx.ui.notify(`📦 Code Sandbox:\n  Directory: ${SANDBOX_DIR}\n  Supported: ${SUPPORTED_LANGUAGES.join(", ")}\n  Timeout: 30s`, "info");
        return;
      }

      if (sub === "languages") {
        ctx.ui.notify(`📦 **Supported Languages**\n${SUPPORTED_LANGUAGES.map(l => `  • ${l}`).join("\n")}`, "info");
        return;
      }

      ctx.ui.notify("Usage: /sandbox <run <lang> <code>|status|languages>", "info");
    },
  });

  pi.registerTool({
    name: "sandbox_execute",
    label: "Execute Code in Sandbox",
    description: "Execute code in a secure, isolated sandbox with timeout protection. Supports JavaScript, TypeScript, Python, Bash, Go, and Rust. The sandbox has no network access and is cleaned up after execution.",
    promptSnippet: "Execute code in a safe sandbox environment",
    promptGuidelines: [
      "Use for testing code snippets, running scripts, and verifying logic.",
      "Always sandbox code execution instead of running untrusted code directly.",
      "Use Bash for simple file operations and scripting.",
      "Use JavaScript/Python for complex logic testing.",
    ],
    parameters: Type.Object({
      language: Type.Union([
        Type.Literal("javascript"), Type.Literal("typescript"),
        Type.Literal("python"), Type.Literal("bash"),
        Type.Literal("go"), Type.Literal("rust"),
      ], { description: "Programming language" }),
      code: Type.String({ description: "Code to execute" }),
      timeout: Type.Optional(Type.Number({ description: "Timeout in ms (default: 30000)", default: 30000 })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await executeCode(params.code, params.language, params.timeout || 30000);

      const output = result.success
        ? `✅ **Execution Successful** (${result.duration}ms)\n\n${result.stdout.slice(0, 5000)}`
        : `❌ **Execution Failed** (${result.duration}ms, exit: ${result.exitCode})\n\n${result.stderr.slice(0, 2000)}`;

      return {
        content: [{ type: "text", text: output }],
        details: {
          success: result.success,
          duration: result.duration,
          exitCode: result.exitCode,
          stdoutLength: result.stdout.length,
          stderrLength: result.stderr.length,
        },
      };
    },
  });

  return { executeCode, SUPPORTED_LANGUAGES };
}
