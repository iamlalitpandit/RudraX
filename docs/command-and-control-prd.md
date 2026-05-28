# PRD: RudraX Army Hierarchical Command-and-Control System

**Status**: Draft for implementation  
**Owner**: Product Manager  
**Last updated**: 2026-05-25  
**Primary stakeholders**: Chief of Staff, Deputy Chief of Staff, Backend, Frontend/TUI, Design, AI/ML, Content, Testing, DevOps  
**Related artifact**: `/root/.rudrax/agent/memory/cwd_openai-project.md`

---

## 1. Problem statement

RudraX Army is positioned as a hierarchical multi-agent command system, but the product must make that behavior real and consistent across CLI, WebUI, backend orchestration, agent naming, memory, quality gates, and final reporting.

Today, some surfaces still behave or appear like a single general-purpose assistant or flat skill directory. The user explicitly wants the main RudraX agent to operate as a permanent Chief of Staff: it receives intent, delegates substantive work to specialized agents, monitors progress, records activity, and returns consolidated results — instead of directly doing every task itself.

### User need

As a RudraX operator, I need every mission to flow through a visible command hierarchy so that:

- the main agent does not waste resources doing specialist work directly;
- specialists are selected by profile and domain;
- every task, decision, blocker, handoff, file change, and lesson is recorded;
- previous mistakes and completed work are reusable;
- final output is one coherent command report, not scattered agent responses.

### Evidence / signals

- User requested permanent Chief-of-Staff behavior.
- User requested deployment of design/engineering squads.
- User requested agent renaming by profile and removal of unrelated company/person names except RudraX and Lalit Pandit.
- User requested consistent memory so agents learn from previous mistakes and completed tasks.
- Existing README/website already promises hierarchical orchestration: Chief of Staff → Deputy → Specialists → Quality Gates → Reports.

---

## 2. Product goals and success metrics

| Goal | Metric | Target |
|---|---:|---:|
| Make hierarchy real | % substantive tasks routed through orchestration path | ≥ 95% |
| Improve transparency | Missions with visible plan, lane, agent, and status | 100% |
| Reduce repeated work | Missions that consult memory before execution | ≥ 95% |
| Improve agent accountability | Specialist tasks with owner, status, result, artifacts | 100% |
| Improve quality | Missions passing quality gate before final report | ≥ 90% |
| Reduce noisy errors | Memory/context errors per session | 0 blocking errors |
| Improve naming consistency | UI/API/doc surfaces using approved profile names | 100% outside model provider section |

---

## 3. Non-goals for first implementation pass

- Do not redesign the entire RudraX brand or website.
- Do not remove model provider company names from model/provider settings, docs, or provider selection.
- Do not delete existing skill directories just to rename display labels; preserve backward-compatible skill IDs.
- Do not force all trivial chat/admin responses through multi-agent orchestration.
- Do not change secrets, auth tokens, or provider credentials.

---

## 4. Core personas

### Primary: RudraX Operator

Runs missions through CLI/WebUI and expects command visibility, specialist delegation, memory continuity, and final reports.

### Secondary: Specialist Agent

Receives scoped tasks, reads shared memory, records output, and returns results to the Deputy/Chief instead of directly acting as the final voice.

### Tertiary: System Maintainer

Needs stable config, backward-compatible agent IDs, clean logs, testable orchestration, and recoverable memory files.

---

## 5. Required command hierarchy

Every substantive mission must follow this logical chain:

```text
User Request
  ↓
🔱 RudraX Chief of Staff
  - receives user intent
  - decides whether task is trivial or substantive
  - for substantive work, creates or requests an orchestration plan
  ↓
🎛️ Deputy Chief of Staff
  - decomposes mission into tasks and lanes
  - assigns specialist agents
  - enforces memory read/write discipline
  - monitors blockers and handoffs
  ↓
👷 Specialist Agents
  - execute domain-scoped tasks
  - produce artifacts
  - record decisions, files, blockers, and task results
  ↓
✅ Quality Gates
  - code/tests/security/design/content review as appropriate
  - failed gates route back to relevant specialist
  ↓
📋 Consolidated Report
  - one final response from Chief of Staff
  - includes status, artifacts, validation, blockers, next steps
```

### Routing rules

1. **Trivial direct response allowed**
   - greetings;
   - clarification questions;
   - short administrative confirmations;
   - explicit user request for main-agent direct execution.

2. **Substantive task must be delegated**
   - code changes;
   - design/product plans;
   - research;
   - debugging;
   - deployment;
   - security/compliance;
   - multi-step file operations;
   - anything cross-domain.

3. **Chief of Staff final voice**
   - Specialists should not independently deliver final user-facing conclusions.
   - Specialist outputs are summarized by the Chief of Staff.

---

## 6. Agent renaming policy

### Objective

All user-facing agent names must describe the agent's profile/function and avoid unrelated company or person names. Allowed person/company names are:

- RudraX
- Lalit Pandit
- model provider names only inside model/provider sections

### Backward compatibility rule

- Keep internal `skillName` / directory IDs stable for compatibility.
- Add a display-name normalization layer for UI/API/report surfaces.
- Later migration may add `display_name` frontmatter to every `SKILL.md`.

### Display-name generation rules

1. Remove broad category prefixes where redundant:
   - `engineering-frontend-developer` → `Frontend Developer`
   - `marketing-content-creator` → `Content Creator`
   - `testing-api-tester` → `API Tester`

2. Preserve meaningful domain acronyms:
   - AI, ML, API, UI, UX, SEO, DevOps, MCP, LLM, RAG, XR, BCI, Web3

3. Avoid raw slug fragments in UI:
   - Bad: `developer`, `frontend-developer`, `engineering-frontend-developer`
   - Good: `Frontend Developer`

4. Squad labels should be mission-oriented:
   - `Startup Squad`
   - `Security Squad`
   - `Growth Squad`
   - `Incident Squad`

5. Disallowed names outside provider sections:
   - third-party product/company names used as agent identity;
   - unrelated individual names;
   - imported skill source names as primary agent name.

### Acceptance criteria

- [ ] `/api/skills` returns both stable ID and sanitized `displayName`.
- [ ] WebUI agent list uses `displayName`.
- [ ] Active agent badge uses `displayName`.
- [ ] Orchestration lanes use `displayName`.
- [ ] Activity log uses `displayName`.
- [ ] Final report uses `displayName`.
- [ ] Search still works by display name, skill ID, category, and description.
- [ ] No provider/company names are removed from model provider settings.

---

## 7. Orchestration memory requirements

### Objective

Create a consistent, durable memory ledger that every agent and orchestration section can use to avoid repeated mistakes and wasted work.

### Canonical memory location

Default workspace fallback:

```text
/root/.rudrax/agent/memory/cwd_openai-project.md
```

Runtime memory files should still support session-specific context IDs when available.

### Required memory sections

```markdown
## Project Overview
## Project Structure
## Mission Ledger
## Active Plan
## Task Board
## Agent Registry Snapshot
## Activity Log
## Decisions
## Handoffs
## Quality Gates
## Files Changed
## Validation Results
## Lessons Learned
## Blockers
## Resource Savings
## Notes
```

### Memory event schema

Every orchestration event should be recordable as:

```json
{
  "id": "evt_<timestamp>_<shortid>",
  "timestamp": "ISO-8601",
  "missionId": "mission_<id>",
  "planId": "plan_<id>",
  "taskId": "task_<id>",
  "agentId": "engineering-frontend-developer",
  "agentDisplayName": "Frontend Developer",
  "role": "specialist | deputy | chief | quality_gate",
  "type": "task_result | decision | blocker | handoff | file_changed | validation | lesson | quality_gate",
  "status": "pending | in_progress | completed | blocked | failed",
  "summary": "short human-readable summary",
  "artifacts": ["/path/to/file"],
  "validation": ["npm test"],
  "nextAgent": "optional-agent-id",
  "lesson": "optional reusable lesson"
}
```

### Memory rules

- Every agent must read memory before starting.
- Every agent must write memory after completion.
- Every file change must be listed.
- Every blocker must include owner and next step.
- Every quality gate must record pass/fail and evidence.
- Every repeated failure must create or update a lesson.
- The Chief of Staff final report must cite memory-backed artifacts and validation.

### Acceptance criteria

- [ ] Memory tools do not fail when no session context exists.
- [ ] Workspace fallback memory is auto-created.
- [ ] Every orchestration plan writes a mission record.
- [ ] Every dispatched task writes to task board.
- [ ] Every completed task writes result and artifacts.
- [ ] Quality gates write validation evidence.
- [ ] Lessons learned can be queried by keyword/agent/task type.

---

## 8. Quality gates

### Required gates by task type

| Task type | Required quality gate |
|---|---|
| Code change | syntax check + relevant tests + code review |
| Frontend/WebUI | syntax check + visual/UX checklist + accessibility basics |
| Backend/API | route/schema check + error handling + tests |
| Memory/orchestration | context fallback test + read/write test + schema check |
| Security/auth | secret scan + permission review + rollback plan |
| Docs/content | naming policy check + accuracy review |
| Deployment | health check + process check + rollback artifact |

### Gate behavior

- Passing gates unlock consolidated final reporting.
- Failed gates create a blocker or route back to the owner agent.
- Chief of Staff must not declare production-ready unless gate evidence exists.

### Acceptance criteria

- [ ] Orchestrator plan includes gate tasks for applicable missions.
- [ ] Gate results appear in memory.
- [ ] Final report includes validation commands and status.
- [ ] Failed gate blocks final completion until resolved or explicitly waived.

---

## 9. Consolidated reporting requirements

Final Chief of Staff response should use this structure:

```markdown
## Mission Status
✅ Complete / ⚠️ Partial / ❌ Blocked

## What Changed
- concise bullets

## Agents Deployed
- Agent Display Name — responsibility — status

## Artifacts
- path or URL

## Validation
- command/check — result

## Memory Updates
- memory file/path updated
- lessons recorded

## Blockers / Risks
- none or listed

## Next Steps
- prioritized follow-up actions
```

### Acceptance criteria

- [ ] Final response is one consolidated report.
- [ ] It does not expose raw internal chaos unless needed.
- [ ] It names agents by sanitized display profile.
- [ ] It includes artifacts and validation evidence.
- [ ] It includes unresolved blockers and next steps.

---

## 10. Functional requirements by team

### Backend / Orchestration

1. Make Chief-of-Staff behavior permanent in system prompt/config.
2. Add route/service-level `displayName` normalization for skills.
3. Ensure `/api/orchestrator/plan` records mission, lanes, tasks, owners, statuses.
4. Ensure all dispatch/completion events write to memory.
5. Add fallback context resolution when no session ID exists.
6. Add quality gate task injection based on task category.
7. Add consolidated report builder that consumes task results and memory.

### Frontend / TUI

1. Show hierarchy rail in WebUI and CLI/TUI status surfaces.
2. Display sanitized profile names everywhere.
3. Show active plan, lane status, active specialist, quality gates, memory status.
4. Make orchestration memory visible as a learning ledger.
5. Avoid noisy duplicate event listeners and repeated error toasts.

### Design / UX

1. Define visual hierarchy using command roles:
   - Chief = strategic / top-level;
   - Deputy = operational control;
   - Specialists = execution;
   - Gates = verification;
   - Report = final synthesis.
2. Use consistent icons, spacing, typography, and color semantics.
3. Ensure responsive layout for orchestrator panel and activity terminal.

### AI/ML / Agent Intelligence

1. Improve agent selection based on task taxonomy.
2. Use memory to prevent repeating completed tasks.
3. Capture lessons from failed gates and repeated blockers.
4. Recommend agent/squad based on mission type.

### Content / Documentation

1. Update README/docs to match actual implementation.
2. Document naming policy.
3. Document memory schema and required agent protocol.
4. Document final report format.

### Testing / QA

1. Add tests for display-name normalization.
2. Add tests for context fallback memory.
3. Add orchestrator plan lifecycle tests.
4. Add WebUI smoke checks for hierarchy elements.
5. Add regression tests to ensure provider names remain in provider sections only.

### DevOps

1. Provide safe restart/reload procedure.
2. Preserve backups before migration.
3. Add health checks for WebUI/API/orchestrator.
4. Add rollback instructions using snapshot archive.

---

## 11. Implementation phases

### Phase 1 — Foundation

- Permanent Chief-of-Staff directive.
- Display-name normalization.
- WebUI/TUI hierarchy visibility.
- Memory fallback fix.

### Phase 2 — Orchestration ledger

- Mission Ledger section.
- Structured task lifecycle events.
- Quality Gate section.
- Lessons Learned section.

### Phase 3 — Quality and reporting

- Gate injection.
- Consolidated report builder.
- Test coverage.
- Documentation update.

### Phase 4 — Agent catalog cleanup

- Add `display_name` frontmatter to skills.
- Audit all agent descriptions for disallowed names.
- Preserve compatibility with existing skill IDs.

---

## 12. Open questions

1. Should raw imported skill source metadata remain hidden in UI but available in developer diagnostics?
2. Should every task require a Deputy step, or can Chief directly dispatch one specialist for simple non-trivial tasks?
3. Should memory be Markdown-first, JSONL-first, or dual-write Markdown + JSONL?
4. Should quality gates be mandatory or user-waivable per mission?

---

## 13. Definition of done

RudraX Army is considered a real hierarchical command-and-control system when:

- [ ] Main agent permanently behaves as Chief of Staff.
- [ ] Substantive tasks are delegated to specialists through a visible plan.
- [ ] UI/CLI consistently shows the hierarchy.
- [ ] Agents are displayed by sanitized profile names.
- [ ] Memory records every mission, task, decision, handoff, file, gate, lesson, and blocker.
- [ ] Quality gates exist and block false completion.
- [ ] Final user response is a consolidated Chief-of-Staff report.
- [ ] Tests validate naming, memory fallback, orchestration lifecycle, and reporting.
