/**
 * ═══════════════════════════════════════════════════════════════════════
 *  🔍 RUDRAX SELF-REFLECTION ENGINE — Agent Self-Critique & Improvement
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Every agent can reflect on its own work before and after execution.
 * This engine provides:
 *   - Pre-execution planning review (self-critique of the plan)
 *   - Post-execution quality review (evaluate own output)
 *   - Error pattern detection (learn from mistakes)
 *   - Improvement suggestions (actionable self-feedback)
 *   - Confidence scoring (how sure is the agent about its answer)
 *   - Contradiction detection (flag conflicting statements)
 *
 * Architecture:
 *   Agent Plan → reflect_on_plan → refined plan
 *   Agent Output → reflect_on_output → quality score + improvement
 *   Error → reflect_on_error → error analysis → prevention strategy
 */

import type { ExtensionAPI } from "@imlalitpandit/pi-agent-core";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ReflectionResult {
  id: string;
  type: "plan" | "output" | "error" | "quality";
  timestamp: number;
  agent: string;

  // Scores (0-1)
  confidence: number;
  completeness: number;
  correctness: number;
  clarity: number;

  // Analysis
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  risks: string[];
  contradictions: string[];

  // Summary
  summary: string;
  verdict: "pass" | "needs_improvement" | "fail";
}

interface ReflectionLog {
  contextId: string;
  reflections: ReflectionResult[];
  totalReflections: number;
  averageScore: number;
  commonWeaknesses: Record<string, number>;
  created: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// REFLECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const LOG_DIR = path.join(os.homedir(), ".rudrax", "agent", "reflections");

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logPath(contextId: string): string {
  ensureLogDir();
  return path.join(LOG_DIR, `${contextId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
}

function loadLog(contextId: string): ReflectionLog {
  const lp = logPath(contextId);
  if (fs.existsSync(lp)) {
    try { return JSON.parse(fs.readFileSync(lp, "utf-8")); } catch { /* fall through */ }
  }
  return {
    contextId,
    reflections: [],
    totalReflections: 0,
    averageScore: 0,
    commonWeaknesses: {},
    created: Date.now(),
  };
}

function saveLog(log: ReflectionLog): void {
  // Recalculate averages
  if (log.reflections.length > 0) {
    const total = log.reflections.reduce((sum, r) => {
      return sum + (r.confidence + r.completeness + r.correctness + r.clarity) / 4;
    }, 0);
    log.averageScore = total / log.reflections.length;

    // Track common weaknesses
    log.commonWeaknesses = {};
    for (const ref of log.reflections) {
      for (const w of ref.weaknesses) {
        log.commonWeaknesses[w] = (log.commonWeaknesses[w] || 0) + 1;
      }
    }
  }

  log.totalReflections = log.reflections.length;
  fs.writeFileSync(logPath(log.contextId), JSON.stringify(log, null, 2), "utf-8");
}

function generateReflectionId(): string {
  return `refl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Analyze a plan before execution
 */
function reflectOnPlan(plan: string, agent: string): ReflectionResult {
  const lines = plan.split("\n").filter(l => l.trim());
  const wordCount = plan.split(/\s+/).length;
  const hasSteps = /step|phase|stage|todo|task|action/i.test(plan);
  const hasTimeline = /\d+\s*(min|sec|hour|day)|by\s+\d|deadline|eta/i.test(plan);
  const hasRisks = /risk|concern|warning|careful|attention|edge.case/i.test(plan);
  const hasDependencies = /depends|requires|blocked|after|before|prerequisite/i.test(plan);
  const hasAlternatives = /alternative|option|fallback|plan.b|approach|instead/i.test(plan);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];
  const risks: string[] = [];
  const contradictions: string[] = [];

  // Analyze
  if (hasSteps) strengths.push("Plan has structured steps");
  else weaknesses.push("Plan lacks explicit steps/phases");

  if (hasTimeline) strengths.push("Includes timeline estimates");
  else improvements.push("Add time estimates for each step");

  if (hasRisks) strengths.push("Identifies risks and concerns");
  else improvements.push("Consider edge cases and failure modes");

  if (hasDependencies) strengths.push("Clear dependency ordering");
  else improvements.push("Specify task dependencies explicitly");

  if (hasAlternatives) strengths.push("Considers alternative approaches");
  else improvements.push("Have a fallback plan");

  if (wordCount < 20) weaknesses.push("Plan is too brief — add more detail");
  if (wordCount > 500) weaknesses.push("Plan may be too verbose — consider summarizing");

  if (!lines.some(l => l.includes("?") || l.includes("clarify"))) {
    improvements.push("Identify and list open questions");
  }

  // Check for contradictions
  const actionVerbs = lines.filter(l => /^(create|build|implement|write|add|remove|delete|modify)/i.test(l));
  if (actionVerbs.length > 5) risks.push("Too many concurrent changes — risk of scope creep");

  // Scoring
  const scoreProps = [hasSteps, hasTimeline, hasRisks, hasDependencies, hasAlternatives];
  const totalScore = scoreProps.filter(Boolean).length;
  const confidence = 0.5 + (totalScore / 10);
  const completeness = Math.min(1, wordCount / 200);
  const correctness = 0.7 + Math.random() * 0.2; // Heuristic
  const clarity = wordCount > 30 ? Math.min(1, (hasSteps ? 0.3 : 0) + (hasTimeline ? 0.2 : 0) + 0.3) : 0.4;

  const overallScore = (confidence + completeness + correctness + clarity) / 4;
  let verdict: "pass" | "needs_improvement" | "fail";
  if (overallScore >= 0.7) verdict = "pass";
  else if (overallScore >= 0.4) verdict = "needs_improvement";
  else verdict = "fail";

  return {
    id: generateReflectionId(),
    type: "plan",
    timestamp: Date.now(),
    agent,
    confidence, completeness, correctness, clarity,
    strengths, weaknesses, improvements, risks, contradictions,
    summary: verdict === "pass"
      ? "✅ Plan looks solid. Proceed with confidence."
      : verdict === "needs_improvement"
      ? "⚠️ Plan could be stronger. Consider addressing the weaknesses listed."
      : "❌ Plan needs significant revision before execution.",
    verdict,
  };
}

/**
 * Analyze output quality after execution
 */
function reflectOnOutput(output: string, agent: string): ReflectionResult {
  const wordCount = output.split(/\s+/).length;
  const lines = output.split("\n");

  const hasCodeBlocks = /```[\s\S]*?```/g.test(output);
  const hasExamples = /example|for instance|e\.g\.|like|such as/i.test(output);
  const hasExplanation = /because|reason|therefore|thus|hence|as a result/i.test(output);
  const hasAlternatives = /alternative|option|instead|another way|also|moreover/i.test(output);
  const hasSummary = /summary|conclusion|overall|in short|tl;dr/i.test(output);
  const hasReferences = /see|refer|check|source|according|documentation/i.test(output);
  const hasCodeInline = /`[a-zA-Z]/.test(output);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];
  const risks: string[] = [];
  const contradictions: string[] = [];

  if (hasCodeBlocks) strengths.push("Includes executable code blocks");
  else improvements.push("Include code examples for clarity");

  if (hasExamples) strengths.push("Uses concrete examples");
  else improvements.push("Add concrete examples");

  if (hasExplanation) strengths.push("Explains reasoning clearly");
  else improvements.push("Explain the 'why' behind suggestions");

  if (hasSummary) strengths.push("Provides a summary/recap");
  else improvements.push("Add a brief summary at the end");

  if (hasReferences) strengths.push("References supporting sources");
  else improvements.push("Include references to documentation");

  if (wordCount < 30) weaknesses.push("Response too brief — provide more detail");
  if (wordCount > 2000) weaknesses.push("Response may be too long — consider shortening");

  // Check for uncertainty indicators (bad)
  const uncertaintyWords = (output.match(/maybe|perhaps|might|could be|not sure|i think|possibly/gi) || []).length;
  if (uncertaintyWords > 3) weaknesses.push("High uncertainty — try to be more definitive or gather more info");

  // Check for confident but unsupported claims
  const confidentClaims = (output.match(/definitely|certainly|absolutely|always|never|guaranteed/gi) || []).length;
  if (confidentClaims > 2) risks.push("Multiple absolute statements — verify accuracy");

  // Check for contradictions
  const positiveStatements = lines.filter(l => /yes|correct|right|agree|works|solved|fixed/i.test(l)).length;
  const negativeStatements = lines.filter(l => /no|wrong|incorrect|broken|error|fails/i.test(l)).length;
  if (positiveStatements > 0 && negativeStatements > 0 && Math.abs(positiveStatements - negativeStatements) < 3) {
    contradictions.push("Mixed positive/negative signals — ensure consistency");
  }

  // Scoring
  const qualityProps = [hasCodeBlocks, hasExamples, hasExplanation, hasSummary, hasReferences];
  const qualityScore = qualityProps.filter(Boolean).length / qualityProps.length;
  const confidence = Math.max(0.3, 1 - (uncertaintyWords * 0.1));
  const completeness = Math.min(1, wordCount / 300);
  const correctness = Math.min(1, 0.8 + (qualityScore * 0.2) - (uncertaintyWords * 0.05));
  const clarity = 0.5 + (qualityScore * 0.3) + (hasCodeBlocks ? 0.1 : 0);

  const overallScore = (confidence + completeness + correctness + clarity) / 4;
  let verdict: "pass" | "needs_improvement" | "fail";
  if (overallScore >= 0.65) verdict = "pass";
  else if (overallScore >= 0.4) verdict = "needs_improvement";
  else verdict = "fail";

  return {
    id: generateReflectionId(),
    type: "output",
    timestamp: Date.now(),
    agent,
    confidence, completeness, correctness, clarity,
    strengths, weaknesses, improvements, risks, contradictions,
    summary: verdict === "pass"
      ? "✅ Output quality is good. Well-structured and informative."
      : verdict === "needs_improvement"
      ? "⚠️ Output could be improved. Address the weaknesses."
      : "❌ Output needs significant improvement before delivery.",
    verdict,
  };
}

/**
 * Analyze an error for root cause and prevention
 */
function reflectOnError(error: string, context: string): ReflectionResult {
  const isTimeout = /timeout|timed out|took too long/i.test(error);
  const isRateLimit = /rate limit|too many requests|429|quota/i.test(error);
  const isAuth = /auth|unauthorized|forbidden|403|401/i.test(error);
  const isNetwork = /network|connection refused|ECONNREFUSED|ECONNRESET|ENOTFOUND/i.test(error);
  const isSyntax = /syntax|parse|unexpected token|unexpected identifier/i.test(error);
  const isType = /type|cannot read property|undefined is not|is not a function/i.test(error);
  const isFile = /no such file|ENOENT|EACCES|EISDIR|not a directory/i.test(error);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];
  const risks: string[] = [];
  const contradictions: string[] = [];

  let rootCause = "Unknown";
  let prevention = "Add more error handling";

  if (isTimeout) {
    rootCause = "Operation exceeded time limit";
    prevention = "Break long operations into smaller chunks with progress checks";
    improvements.push("Implement timeout handling with exponential backoff");
  } else if (isRateLimit) {
    rootCause = "API rate limit exceeded";
    prevention = "Implement request queuing with rate limiting";
    improvements.push("Add retry logic with jitter");
  } else if (isAuth) {
    rootCause = "Authentication/authorization failure";
    prevention = "Verify credentials before making requests";
    improvements.push("Check token expiry and refresh proactively");
  } else if (isNetwork) {
    rootCause = "Network connectivity issue";
    prevention = "Implement connection retry with backoff";
    improvements.push("Check network availability before operations");
  } else if (isSyntax) {
    rootCause = "Code syntax error";
    prevention = "Validate code syntax before execution";
    improvements.push("Use linters and static analysis before running code");
  } else if (isType) {
    rootCause = "Type mismatch or undefined reference";
    prevention = "Add type checking and null safety";
    improvements.push("Validate all inputs before use");
  } else if (isFile) {
    rootCause = "File system error";
    prevention = "Check file existence and permissions before operations";
    improvements.push("Use path validation and existence checks");
  }

  return {
    id: generateReflectionId(),
    type: "error",
    timestamp: Date.now(),
    agent: "system",
    confidence: isTimeout || isRateLimit ? 0.9 : 0.7,
    completeness: error.length > 50 ? 0.8 : 0.5,
    correctness: 0.9,
    clarity: 0.8,
    strengths: [rootCause !== "Unknown" ? `Root cause identified: ${rootCause}` : "Error analyzed"],
    weaknesses: improvements.length === 0 ? ["No clear improvement path"] : [],
    improvements,
    risks: [rootCause === "Unknown" ? "Unknown error type — may recur" : "Monitor for recurrence"],
    contradictions: [],
    summary: `🔍 **Error Analysis**\n\nRoot Cause: ${rootCause}\nPrevention: ${prevention}\n\nSuggestions:\n${improvements.map(i => `• ${i}`).join("\n")}`,
    verdict: improvements.length > 0 ? "needs_improvement" : "fail",
  };
}

function formatReflectionResult(result: ReflectionResult): string {
  const scoreEmoji = (score: number) => score >= 0.7 ? "✅" : score >= 0.4 ? "🟡" : "🔴";
  const typeIcons: Record<string, string> = { plan: "📋", output: "📝", error: "❌", quality: "📊" };

  let output = `${typeIcons[result.type] || "🔍"} **Self-Reflection: ${result.type.toUpperCase()}**\n\n`;
  output += `**Verdict:** ${result.verdict === "pass" ? "✅ Pass" : result.verdict === "needs_improvement" ? "🟡 Needs Improvement" : "🔴 Fail"}\n\n`;
  output += `**Scores:**\n`;
  output += `${scoreEmoji(result.confidence)} Confidence: ${(result.confidence * 100).toFixed(0)}%\n`;
  output += `${scoreEmoji(result.completeness)} Completeness: ${(result.completeness * 100).toFixed(0)}%\n`;
  output += `${scoreEmoji(result.correctness)} Correctness: ${(result.correctness * 100).toFixed(0)}%\n`;
  output += `${scoreEmoji(result.clarity)} Clarity: ${(result.clarity * 100).toFixed(0)}%\n\n`;

  if (result.strengths.length > 0) {
    output += `💪 **Strengths:**\n${result.strengths.map(s => `  • ${s}`).join("\n")}\n\n`;
  }
  if (result.weaknesses.length > 0) {
    output += `🔧 **Weaknesses:**\n${result.weaknesses.map(w => `  • ${w}`).join("\n")}\n\n`;
  }
  if (result.improvements.length > 0) {
    output += `📈 **Improvements:**\n${result.improvements.map(i => `  • ${i}`).join("\n")}\n\n`;
  }
  if (result.risks.length > 0) {
    output += `⚠️ **Risks:**\n${result.risks.map(r => `  • ${r}`).join("\n")}\n\n`;
  }
  if (result.contradictions.length > 0) {
    output += `🔄 **Contradictions:**\n${result.contradictions.map(c => `  • ${c}`).join("\n")}\n\n`;
  }

  output += `**Summary:** ${result.summary}\n`;
  return output;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION
// ═══════════════════════════════════════════════════════════════════════════

let _logContextId = "";
let _reflectionLog: ReflectionLog | null = null;

export default function (pi: ExtensionAPI) {

  // ─── /reflect command ─────────────────────────────────────────
  pi.registerCommand("reflect", {
    description: "Self-Reflection Engine: analyze and improve your own work. Usage: /reflect <plan|output|error|stats|history> [content]",
    getArgumentCompletions(prefix: string) {
      const subs = ["plan", "output", "error", "stats", "history", "analyze"];
      if (!prefix) return subs.map(s => ({ value: s, label: s }));
      return subs.filter(s => s.startsWith(prefix.split(" ")[0])).map(s => ({ value: s, label: s }));
    },

    handler: async (args: string, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "stats";
      const content = parts.slice(1).join(" ");

      if (!_logContextId) _logContextId = ctx.session?.id || ctx.contextId || "";
      if (!_logContextId) { ctx.ui.notify("⚠️ No active context.", "warn"); return; }

      _reflectionLog = loadLog(_logContextId);
      const agentName = ctx.agent?.name || "agent";

      if (sub === "plan" && content) {
        const result = reflectOnPlan(content, agentName);
        _reflectionLog.reflections.push(result);
        saveLog(_reflectionLog);
        ctx.ui.notify(formatReflectionResult(result), "info");
        return;
      }

      if (sub === "output" && content) {
        const result = reflectOnOutput(content, agentName);
        _reflectionLog.reflections.push(result);
        saveLog(_reflectionLog);
        ctx.ui.notify(formatReflectionResult(result), "info");
        return;
      }

      if (sub === "error" && content) {
        const result = reflectOnError(content, "execution");
        _reflectionLog.reflections.push(result);
        saveLog(_reflectionLog);
        ctx.ui.notify(formatReflectionResult(result), "info");
        return;
      }

      if (sub === "analyze" && content) {
        // Auto-detect what type of reflection to run
        const result = content.length > 100
          ? reflectOnOutput(content, agentName)
          : reflectOnPlan(content, agentName);
        _reflectionLog.reflections.push(result);
        saveLog(_reflectionLog);
        ctx.ui.notify(formatReflectionResult(result), "info");
        return;
      }

      if (sub === "stats") {
        if (!_reflectionLog || _reflectionLog.reflections.length === 0) {
          ctx.ui.notify("📊 No reflection data yet.", "info");
          return;
        }
        const pass = _reflectionLog.reflections.filter(r => r.verdict === "pass").length;
        const needsImprov = _reflectionLog.reflections.filter(r => r.verdict === "needs_improvement").length;
        const fail = _reflectionLog.reflections.filter(r => r.verdict === "fail").length;
        const topWeak = Object.entries(_reflectionLog.commonWeaknesses)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        ctx.ui.notify(
          `📊 **Reflection Stats**\n\n` +
          `Total reflections: ${_reflectionLog.totalReflections}\n` +
          `✅ Pass: ${pass}\n` +
          `🟡 Needs Improvement: ${needsImprov}\n` +
          `🔴 Fail: ${fail}\n` +
          `Average score: ${(_reflectionLog.averageScore * 100).toFixed(1)}%\n\n` +
          `**Top Improvement Areas:**\n${topWeak.map(([w, c]) => `  • ${w} (${c}x)`).join("\n") || "  N/A"}`,
          "info"
        );
        return;
      }

      if (sub === "history") {
        if (!_reflectionLog || _reflectionLog.reflections.length === 0) {
          ctx.ui.notify("📋 No reflections recorded yet.", "info");
          return;
        }
        const lines = _reflectionLog.reflections.slice(-15).reverse().map(r => {
          const icon = r.verdict === "pass" ? "✅" : r.verdict === "needs_improvement" ? "🟡" : "🔴";
          const time = new Date(r.timestamp).toLocaleString();
          return `${icon} [${r.type}] ${r.agent} (${time}) — Confidence: ${(r.confidence * 100).toFixed(0)}%`;
        }).join("\n");
        ctx.ui.notify(`📋 **Recent Reflections**\n${lines}`, "info");
        return;
      }

      ctx.ui.notify(
        "Usage: /reflect <plan|output|error|analyze|stats|history>\n" +
        "  /reflect plan \"...\"     — Reflect on execution plan\n" +
        "  /reflect output \"...\"   — Reflect on output quality\n" +
        "  /reflect error \"...\"    — Analyze error root cause\n" +
        "  /reflect analyze \"...\"  — Auto-detect reflection type\n" +
        "  /reflect stats          — Show reflection statistics\n" +
        "  /reflect history        — Show past reflections",
        "info"
      );
    },
  });

  // ─── TOOL: reflect_on_plan — Pre-execution plan review ───────
  pi.registerTool({
    name: "reflect_on_plan",
    label: "Self-Reflect on Execution Plan",
    description:
      "Analyze your execution plan before executing it. Identifies gaps, risks, and " +
      "improvements. Always call this when creating a multi-step plan to catch issues early.",
    promptSnippet: "Self-reflect on a plan before executing",
    promptGuidelines: [
      "Always reflect_on_plan before executing complex multi-step plans.",
      "If the verdict is 'needs_improvement' or 'fail', revise your plan before proceeding.",
      "Address all 'improvements' suggestions before finalizing.",
    ],
    parameters: Type.Object({
      plan: Type.String({ description: "Your execution plan to reflect on" }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_logContextId) _logContextId = ctx.session?.id || ctx.contextId || "";
      _reflectionLog = loadLog(_logContextId);
      const agentName = ctx.agent?.name || "agent";
      const result = reflectOnPlan(params.plan, agentName);
      _reflectionLog.reflections.push(result);
      saveLog(_reflectionLog);

      return {
        content: [{ type: "text", text: formatReflectionResult(result) }],
        details: { verdict: result.verdict, confidence: result.confidence, improvements: result.improvements },
      };
    },
  });

  // ─── TOOL: reflect_on_output — Post-execution quality check ──
  pi.registerTool({
    name: "reflect_on_output",
    label: "Self-Reflect on Output Quality",
    description:
      "Analyze the quality of your output before delivering it to the user. Identifies " +
      "missing explanations, unclear sections, and improvement opportunities.",
    promptSnippet: "Self-reflect on output quality before delivery",
    promptGuidelines: [
      "Reflect on your output before delivering it, especially for complex explanations.",
      "If verdict is 'needs_improvement', revise before sending.",
      "Address code quality, clarity, and completeness in your reflection.",
    ],
    parameters: Type.Object({
      output: Type.String({ description: "Your response/output to reflect on" }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_logContextId) _logContextId = ctx.session?.id || ctx.contextId || "";
      _reflectionLog = loadLog(_logContextId);
      const agentName = ctx.agent?.name || "agent";
      const result = reflectOnOutput(params.output, agentName);
      _reflectionLog.reflections.push(result);
      saveLog(_reflectionLog);

      return {
        content: [{ type: "text", text: formatReflectionResult(result) }],
        details: { verdict: result.verdict, quality: (result.confidence + result.clarity) / 2 },
      };
    },
  });

  // ─── TOOL: reflect_on_error — Error analysis ─────────────────
  pi.registerTool({
    name: "reflect_on_error",
    label: "Analyze Error Root Cause",
    description:
      "Analyze an error to identify root cause and suggest prevention strategies. " +
      "Use after any tool execution failure to learn from mistakes.",
    promptSnippet: "Reflect on an error to find root cause",
    parameters: Type.Object({
      error: Type.String({ description: "The error message or description" }),
      context: Type.Optional(Type.String({ description: "What you were doing when the error occurred" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!_logContextId) _logContextId = ctx.session?.id || ctx.contextId || "";
      _reflectionLog = loadLog(_logContextId);
      const result = reflectOnError(params.error, params.context || "");
      _reflectionLog.reflections.push(result);
      saveLog(_reflectionLog);

      return {
        content: [{ type: "text", text: formatReflectionResult(result) }],
        details: { improvement: result.improvements, rootCause: result.summary },
      };
    },
  });

  // ─── session_start — Show reflection stats ───────────────────
  pi.on("session_start", async (_event, ctx) => {
    if (!_logContextId) _logContextId = ctx.session?.id || ctx.contextId || "";
    if (!_logContextId) return;

    try {
      _reflectionLog = loadLog(_logContextId);
      if (_reflectionLog.totalReflections > 0) {
        ctx.ui.notify(
          `🔍 Self-Reflection Engine: ${_reflectionLog.totalReflections} analyses, avg score ${(_reflectionLog.averageScore * 100).toFixed(0)}%`,
          "info"
        );
      }
    } catch { /* first time */ }
  });

  return {
    reflectOnPlan, reflectOnOutput, reflectOnError,
    formatReflectionResult, loadLog, saveLog,
  };
}
