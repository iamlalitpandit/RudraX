/**
 * ═══════════════════════════════════════════════════════════════════════
 *  🛡️ RUDRAX GUARDRAILS — Safety, Content Filtering & Validation
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Multi-layer safety system for agent outputs:
 *   - Content filtering (toxicity, bias, PII detection)
 *   - Output validation (JSON validity, code safety)
 *   - Hallucination detection (unsupported claims)
 *   - PII redaction (emails, API keys, IPs, phone numbers)
 *   - Code safety scan (dangerous patterns)
 *   - Consistency check (self-contradiction detection)
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface GuardrailResult {
  passed: boolean;
  category: string;
  confidence: number;
  details: string[];
  severity: "info" | "warning" | "blocking";
  suggestions: string[];
}

// PII Patterns
const PII_PATTERNS: { name: string; pattern: RegExp; severity: "info" | "warning" | "blocking" }[] = [
  { name: "Email", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, severity: "warning" },
  { name: "API Key", pattern: /\b(sk-[A-Za-z0-9]{20,}|api[-_]?key[-_]?[=:]["']?[A-Za-z0-9]{16,}|[A-Za-z0-9_-]{32,})\b/gi, severity: "blocking" },
  { name: "IP Address", pattern: /\b(\d{1,3}\.){3}\d{1,3}\b/g, severity: "info" },
  { name: "Phone", pattern: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, severity: "warning" },
  { name: "SSN", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, severity: "blocking" },
  { name: "Credit Card", pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, severity: "blocking" },
  { name: "Private Key Marker", pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, severity: "blocking" },
];

// Dangerous code patterns
const DANGEROUS_PATTERNS: { name: string; pattern: RegExp; severity: "info" | "warning" | "blocking" }[] = [
  { name: "eval() usage", pattern: /\beval\s*\(/g, severity: "warning" },
  { name: "exec() usage", pattern: /\b(Function\s*\(|child_process\.exec\s*\()/g, severity: "warning" },
  { name: "process.env leak", pattern: /\bprocess\.env\./g, severity: "info" },
  { name: "require('child_process')", pattern: /require\s*\(\s*['"]child_process['"]\s*\)/g, severity: "info" },
  { name: "fs.write to sensitive path", pattern: /fs\.writeFileSync?\s*\(\s*["']\/(etc|var|root|proc)/g, severity: "warning" },
  { name: "rm -rf /", pattern: /\brm\s+-rf\s+\//g, severity: "blocking" },
  { name: "Dangerous SQL", pattern: /\b(DROP\s+(TABLE|DATABASE)|TRUNCATE\s+TABLE)\b/gi, severity: "blocking" },
];

function checkPII(text: string): GuardrailResult {
  const findings: string[] = [];
  let maxSeverity: "info" | "warning" | "blocking" = "info";

  for (const { name, pattern, severity } of PII_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      findings.push(`Found ${matches.length} potential ${name} match(es)`);
      if (severity === "blocking") maxSeverity = "blocking";
      else if (severity === "warning" && maxSeverity !== "blocking") maxSeverity = "warning";
    }
  }

  const severityOrder = { info: 0, warning: 1, blocking: 2 };
  return {
    passed: maxSeverity !== "blocking",
    category: "PII Detection",
    confidence: findings.length > 0 ? 0.9 : 0.1,
    details: findings,
    severity: maxSeverity,
    suggestions: findings.length > 0 ? ["Redact detected PII before sharing", "Replace with placeholders"] : [],
  };
}

function checkCodeSafety(text: string): GuardrailResult {
  // Check code blocks
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  const findings: string[] = [];
  let maxSeverity: "info" | "warning" | "blocking" = "info";

  for (const block of codeBlocks) {
    for (const { name, pattern, severity } of DANGEROUS_PATTERNS) {
      if (pattern.test(block)) {
        findings.push(`⚠️ ${name}`);
        if (severity === "blocking") maxSeverity = "blocking";
        else if (severity === "warning" && maxSeverity !== "blocking") maxSeverity = "warning";
      }
    }
  }

  return {
    passed: maxSeverity !== "blocking",
    category: "Code Safety",
    confidence: findings.length > 0 ? 0.85 : 0.05,
    details: findings,
    severity: maxSeverity,
    suggestions: findings.length > 0 ? ["Review dangerous code patterns", "Add warnings for unsafe operations"] : [],
  };
}

function checkConsistency(text: string): GuardrailResult {
  const lines = text.split("\n").filter(l => l.trim());
  const contradictions: string[] = [];

  // Check for contradictory statements
  const affirmativePatterns = [
    { yes: /\b(yes|correct|right|agree|confirmed)\b/i, no: /\b(no|incorrect|wrong|disagree|rejected)\b/i },
  ];

  for (const { yes, no } of affirmativePatterns) {
    const yesCount = (text.match(yes) || []).length;
    const noCount = (text.match(no) || []).length;
    if (yesCount > 2 && noCount > 2) {
      contradictions.push(`Mixed signals: ${yesCount} affirmatives vs ${noCount} negatives`);
    }
  }

  // Check for numerical contradictions
  const numbers = text.match(/\b(\d+)\b/g) || [];
  const uniqueNums = new Set(numbers);
  if (numbers.length > 5 && uniqueNums.size < numbers.length * 0.3) {
    contradictions.push("Repeated numbers may indicate copy-paste or inconsistency");
  }

  return {
    passed: contradictions.length === 0,
    category: "Consistency",
    confidence: contradictions.length > 0 ? 0.6 : 0.95,
    details: contradictions,
    severity: contradictions.length > 0 ? "warning" : "info",
    suggestions: contradictions.length > 0 ? ["Review for self-contradictions", "Ensure consistent messaging"] : [],
  };
}

function checkHallucination(text: string): GuardrailResult {
  const hallucinationIndicators = [
    /\b(according to (our|my|this) (research|analysis|data))\b(?!\s*:?\s*(source|reference|link))/gi,
    /\b(I (found|discovered|determined) that\b(?!.*(source|reference|documentation)))/gi,
    /\b(based on my (analysis|research|findings))\b(?!.*(source|reference|data))/gi,
  ];

  const flags: string[] = [];
  for (const pattern of hallucinationIndicators) {
    const matches = text.match(pattern);
    if (matches) flags.push(`Unsupported claim: "${matches[0].trim()}" without citation`);
  }

  // Check for absolute certainty without evidence
  const absoluteClaims = (text.match(/\b(always|never|everyone|nobody|guaranteed|impossible)\b/gi) || []).length;
  if (absoluteClaims > 3) flags.push(`${absoluteClaims} absolute statements without qualifiers`);

  return {
    passed: flags.length === 0,
    category: "Hallucination Check",
    confidence: flags.length > 0 ? 0.5 : 0.9,
    details: flags,
    severity: flags.length > 0 ? "warning" : "info",
    suggestions: flags.length > 0 ? ["Add sources/citations for claims", "Use qualifiers like 'likely', 'based on available information'"] : [],
  };
}

function runAllGuardrails(text: string): GuardrailResult[] {
  return [checkPII(text), checkCodeSafety(text), checkConsistency(text), checkHallucination(text)];
}

function hasBlockingIssues(results: GuardrailResult[]): boolean {
  return results.some(r => r.severity === "blocking" && !r.passed);
}

function formatGuardrailSummary(results: GuardrailResult[]): string {
  const blocking = results.filter(r => r.severity === "blocking" && !r.passed);
  const warnings = results.filter(r => r.severity === "warning" && r.details.length > 0);

  let output = "<guardrails>\n🛡️ **Guardrail Check Results**\n\n";

  if (blocking.length > 0) {
    output += "🔴 **BLOCKING ISSUES** — Must fix before output:\n";
    for (const r of blocking) {
      output += `  • ${r.category}: ${r.details.join(", ")}\n`;
    }
    output += "\n";
  }

  if (warnings.length > 0) {
    output += "🟡 **Warnings:**\n";
    for (const r of warnings) {
      output += `  • ${r.category}: ${r.details.join(", ")}\n`;
    }
    output += "\n";
  }

  const allClean = blocking.length === 0 && warnings.length === 0;
  if (allClean) output += "✅ All guardrails passed. Output is safe.\n";

  output += "</guardrails>\n";
  return output;
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("guardrails", {
    description: "Safety Guardrails: validate output safety. Usage: /guardrails <check|status|config>",
    getArgumentCompletions(prefix: string) {
      return ["check", "status", "config"].filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "status";
      const content = parts.slice(1).join(" ");

      if (sub === "check" && content) {
        const results = runAllGuardrails(content);
        if (hasBlockingIssues(results)) {
          ctx.ui.notify(`🔴 **Guardrails: BLOCKED**\n${formatGuardrailSummary(results)}`, "warn");
        } else {
          ctx.ui.notify(`✅ **Guardrails: PASSED**\n${formatGuardrailSummary(results)}`, "info");
        }
        return;
      }

      if (sub === "status") {
        ctx.ui.notify("🛡️ **Guardrails Active:**\n• PII Detection — Email, API keys, SSN, Credit Cards\n• Code Safety — eval, exec, dangerous commands\n• Consistency — Self-contradiction detection\n• Hallucination Check — Unsupported claims", "info");
        return;
      }

      ctx.ui.notify("Usage: /guardrails <check 'content'|status>", "info");
    },
  });

  pi.registerTool({
    name: "guardrails_check",
    label: "Check Output Safety",
    description: "Run all safety guardrails on output before delivering to user. Checks for PII, dangerous code, contradictions, and unsupported claims.",
    promptSnippet: "Validate output safety before delivery",
    promptGuidelines: [
      "Always run guardrails_check before delivering outputs containing code or sensitive information.",
      "If blocking issues are found, DO NOT output the content until fixed.",
      "Redact any PII found, remove dangerous code patterns, and add citations.",
    ],
    parameters: Type.Object({
      content: Type.String({ description: "The output content to validate" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const results = runAllGuardrails(params.content);
      const blocked = hasBlockingIssues(results);

      if (blocked) {
        ctx.ui.notify("🔴 Guardrails detected blocking issues. Review before output.", "warn");
      }

      return {
        content: [{
          type: "text",
          text: blocked
            ? `🔴 **Output BLOCKED by guardrails**\n${formatGuardrailSummary(results)}\n\n**Action required:** Fix the blocking issues before delivering this output.`
            : `✅ **All guardrails passed**\n${formatGuardrailSummary(results)}`,
        }],
        details: {
          passed: !blocked,
          blocked,
          categories: results.map(r => ({ category: r.category, passed: r.passed, severity: r.severity, details: r.details })),
        },
      };
    },
  });

  pi.registerTool({
    name: "guardrails_redact_pii",
    label: "Redact PII from Content",
    description: "Automatically detect and redact personally identifiable information (PII) from content.",
    promptSnippet: "Redact PII from output",
    parameters: Type.Object({
      content: Type.String({ description: "Content containing PII to redact" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      let redacted = params.content;
      const redactions: { type: string; count: number }[] = [];

      for (const { name, pattern } of PII_PATTERNS) {
        const matches = redacted.match(pattern);
        if (matches) {
          redacted = redacted.replace(pattern, (match) => `[REDACTED_${name.toUpperCase()}]`);
          redactions.push({ type: name, count: matches.length });
        }
      }

      if (redactions.length === 0) {
        return { content: [{ type: "text", text: "✅ No PII detected in content." }], details: { redacted: false } };
      }

      return {
        content: [{ type: "text", text: `🛡️ **PII Redacted**\n${redactions.map(r => `• ${r.count} ${r.type} pattern(s) redacted`).join("\n")}\n\n---\n${redacted}` }],
        details: { redacted: true, redactions },
      };
    },
  });

  // Hook: Auto-run guardrails on assistant output
  pi.on("before_agent_start", async (event, _ctx) => {
    // Inject guardrail awareness
    return {
      systemPrompt: event.systemPrompt + `\n\n<guardrails-aware>\nBefore delivering any output to the user, you MUST:\n1. Check for PII (emails, API keys, SSN, credit cards) and redact them\n2. Check code for dangerous patterns (eval, rm -rf, etc.)\n3. Check for self-contradictions\n4. Support claims with sources\nUse guardrails_check to validate output before delivery.\n</guardrails-aware>\n`,
    };
  });

  return { runAllGuardrails, checkPII, checkCodeSafety, checkConsistency, checkHallucination, formatGuardrailSummary, hasBlockingIssues };
}
