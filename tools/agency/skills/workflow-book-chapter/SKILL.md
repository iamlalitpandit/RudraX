---
name: workflow-book-chapter
description: Multi-agent workflow example demonstrating how to coordinate Agency agents for a real project scenario.
metadata:
  category: strategy
  emoji: "🔄"
  source: Lalit Pandit
  author: Lalit Pandit
  url: https://github.com/iamlalitpandit/RudraX
---

## 🎛️ DEPUTY CHIEF OF STAFF REPORTING PROTOCOL

> **PRIORITY DIRECTIVE**: If this task was assigned to you by the `agents-orchestrator` (🎛️ Deputy Chief of Staff), treat it as **HIGHEST PRIORITY** and execute immediately.

### Upon Task Completion, you MUST:

1. **Report BACK to the Deputy Chief of Staff** (`agents-orchestrator`) with:
   - Task completion status (`✅ COMPLETE` / `⚠️ PARTIAL` / `❌ FAILED`)
   - Summary of outputs produced
   - Any blockers encountered and how they were resolved
   - Files created or modified (full paths)
   - Quality assessment of your own output

2. **Escalate to the Chief of Staff** (`rudrax-chief-of-staff`) if:
   - The task requires cross-domain coordination beyond your scope
   - You encounter a blocker the Deputy cannot resolve
   - The output needs executive approval before delivery to the user
   - Critical security, compliance, or financial implications exist

3. **Update the Active Plan** by including in your report:
   ```
   📊 PLAN UPDATE — [agent-name]
   Task ID: [task-id]
   Status: [status]
   Deliverables: [list]
   Next Steps: [if any]
   ```

4. **Never deliver final output directly to the user** unless explicitly authorized by the Chief of Staff. All outputs route through the command hierarchy.

---


# Workflow Example: Book Chapter Development

> A focused single-agent workflow for turning rough source material into a strategic first-person chapter draft with explicit revision loops.

## When to Use This

Use this workflow when an author has voice notes, fragments, or strategic notes, but not yet a clean chapter draft. The goal is not generic ghostwriting. The goal is to produce a chapter that strengthens category positioning, preserves the author's voice, and exposes open editorial decisions clearly.

## Agent Used

| Agent | Role |
|-------|------|
| Book Co-Author | Converts source material into a versioned chapter draft with editorial notes and next-step questions |

## Example Activation

```text
Activate Book Co-Author.

Book goal: Build authority around practical AI adoption for Mittelstand companies.
Target audience: Owners and operational leaders of 20-200 person businesses.
Chapter topic: Why most AI projects fail before implementation starts.
Desired draft maturity: First substantial draft.

Raw material:
- Voice memo: "The real failure happens in expectation setting, not tooling."
- Notes: Leaders buy software before defining the operational bottleneck.
- Story fragment: We nearly rolled out the wrong automation in a cabinetmaking workflow because the actual problem was quoting delays, not production throughput.
- Positioning angle: Practical realism over hype.

Produce:
1. Chapter objective and strategic role in the book
2. Any clarification questions you need
3. Chapter 2 - Version 1 - ready for review
4. Editorial notes on assumptions and proof gaps
5. Specific next-step revision requests
```

## Expected Output Shape

The Book Co-Author should respond in five parts:

1. `Target Outcome`
2. `Chapter Draft`
3. `Editorial Notes`
4. `Feedback Loop`
5. `Next Step`

## Quality Bar

- The draft stays in first-person voice
- The chapter has one clear promise and internal logic
- Claims are tied to source material or flagged as assumptions
- Generic motivational language is removed
- The output ends with explicit revision questions, not a vague handoff
