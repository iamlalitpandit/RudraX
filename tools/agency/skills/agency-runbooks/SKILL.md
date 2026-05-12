---
name: agency-runbooks
description: Pre-defined scenario runbooks for coordinating Agency agents on specific project types — Startup MVP, Enterprise Feature, Marketing Campaign, Incident Response.
metadata:
  category: strategy
  emoji: "📋"
  color: "orange"
  vibe: "Deploys the right agents in the right order for proven scenarios"
  original_name: "Agency Runbooks"
  source: agency-agents
---

📋 **Agency Runbooks** — Deploys the right agents in the right order for proven scenarios

Strategy Division | [The Agency](https://github.com/msitarzewski/agency-agents)

---

### scenario-enterprise-feature

# 🏢 Runbook: Enterprise Feature Development

> **Mode**: NEXUS-Sprint | **Duration**: 6-12 weeks | **Agents**: 20-30

---

## Scenario

You're adding a major feature to an existing enterprise product. Compliance, security, and quality gates are non-negotiable. Multiple stakeholders need alignment. The feature must integrate seamlessly with existing systems.

## Agent Roster

### Core Team
| Agent | Role |
|-------|------|
| Agents Orchestrator | Pipeline controller |
| Project Shepherd | Cross-functional coordination |
| Senior Project Manager | Spec-to-task conversion |
| Sprint Prioritizer | Backlog management |
| UX Architect | Technical foundation |
| UX Researcher | User validation |
| UI Designer | Component design |
| Frontend Developer | UI implementation |
| Backend Architect | API and system integration |
| Senior Developer | Complex implementation |
| DevOps Automator | CI/CD and deployment |
| Evidence Collector | Visual QA |
| API Tester | Endpoint validation |
| Reality Checker | Final quality gate |
| Performance Benchmarker | Load testing |

### Compliance & Governance
| Agent | Role |
|-------|------|
| Legal Compliance Checker | Regulatory compliance |
| Brand Guardian | Brand consistency |
| Finance Tracker | Budget tracking |
| Executive Summary Generator | Stakeholder reporting |

### Quality Assurance
| Agent | Role |
|-------|------|
| Test Results Analyzer | Quality metrics |
| Workflow Optimizer | Process improvement |
| Experiment Tracker | A/B testing |

## Execution Plan

### Phase 1: Requirements & Architecture (Week 1-2)

```
Week 1: Stakeholder Alignment
├── Project Shepherd → Stakeholder analysis + communication plan
├── UX Researcher → User research on feature need
├── Legal Compliance Checker → Compliance requirements scan
├── Senior Project Manager → Spec-to-task conversion
└── Finance Tracker → Budget framework

Week 2: Technical Architecture
├── UX Architect → UX foundation + component architecture
├── Backend Architect → System architecture + integration plan
├── UI Designer → Component design + design system updates
├── Sprint Prioritizer → RICE-scored backlog
├── Brand Guardian → Brand impact assessment
└── Quality Gate: Architecture Review (Project Shepherd + Reality Checker)
```

### Phase 2: Foundation (Week 3)

```
├── DevOps Automator → Feature branch pipeline + feature flags
├── Frontend Developer → Component scaffolding
├── Backend Architect → API scaffold + database migrations
├── Infrastructure Maintainer → Staging environment setup
└── Quality Gate: Foundation verified (Evidence Collector)
```

### Phase 3: Build (Week 4-9)

```
Sprint 1-3 (Week 4-9):
├── Agents Orchestrator → Dev↔QA loop management
├── Frontend Developer → UI implementation (task by task)
├── Backend Architect → API implementation (task by task)
├── Senior Developer → Complex/premium features
├── Evidence Collector → QA every task (screenshots)
├── API Tester → Endpoint validation every API task
├── Experiment Tracker → A/B test setup for key features
│
├── Bi-weekly:
│   ├── Project Shepherd → Stakeholder status update
│   ├── Executive Summary Generator → Executive briefing
│   └── Finance Tracker → Budget tracking
│
└── Sprint Reviews with stakeholder demos
```

### Phase 4: Hardening (Week 10-11)

```
Week 10: Evidence Collection
├── Evidence Collector → Full screenshot suite
├── API Tester → Complete regression suite
├── Performance Benchmarker → Load test at 10x traffic
├── Legal Compliance Checker → Final compliance audit
├── Test Results Analyzer → Quality metrics dashboard
└── Infrastructure Maintainer → Production readiness

Week 11: Final Judgment
├── Reality Checker → Integration testing (default: NEEDS WORK)
├── Fix cycle if needed (2-3 days)
├── Re-verification
└── Executive Summary Generator → Go/No-Go recommendation
```

### Phase 5: Rollout (Week 12)

```
├── DevOps Automator → Canary deployment (5% → 25% → 100%)
├── Infrastructure Maintainer → Real-time monitoring
├── Analytics Reporter → Feature adoption tracking
├── Support Responder → User support for new feature
├── Feedback Synthesizer → Early feedback collection
└── Executive Summary Generator → Launch report
```

## Stakeholder Communication Cadence

| Audience | Frequency | Agent | Format |
|----------|-----------|-------|--------|
| Executive sponsors | Bi-weekly | Executive Summary Generator | SCQA summary (≤500 words) |
| Product team | Weekly | Project Shepherd | Status report |
| Engineering team | Daily | Agents Orchestrator | Pipeline status |
| Compliance team | Monthly | Legal Compliance Checker | Compliance status |
| Finance | Monthly | Finance Tracker | Budget report |

## Quality Requirements

| Requirement | Threshold | Verification |
|-------------|-----------|-------------|
| Code coverage | > 80% | Test Results Analyzer |
| API response time | P95 < 200ms | Performance Benchmarker |
| Accessibility | WCAG 2.1 AA | Evidence Collector |
| Security | Zero critical vulnerabilities | Legal Compliance Checker |
| Brand consistency | 95%+ adherence | Brand Guardian |
| Spec compliance | 100% | Reality Checker |
| Load handling | 10x current traffic | Performance Benchmarker |

## Risk Management

| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|-----------|-------|
| Integration complexity | High | High | Early integration testing, API Tester in every sprint | Backend Architect |
| Scope creep | Medium | High | Sprint Prioritizer enforces MoSCoW, Project Shepherd manages changes | Sprint Prioritizer |
| Compliance issues | Medium | Critical | Legal Compliance Checker involved from Day 1 | Legal Compliance Checker |
| Performance regression | Medium | High | Performance Benchmarker tests every sprint | Performance Benchmarker |
| Stakeholder misalignment | Low | High | Bi-weekly executive briefings, Project Shepherd coordination | Project Shepherd |

### scenario-incident-response

# 🚨 Runbook: Incident Response

> **Mode**: NEXUS-Micro | **Duration**: Minutes to hours | **Agents**: 3-8

---

## Scenario

Something is broken in production. Users are affected. Speed of response matters, but so does doing it right. This runbook covers detection through post-mortem.

## Severity Classification

| Level | Definition | Examples | Response Time |
|-------|-----------|----------|--------------|
| **P0 — Critical** | Service completely down, data loss, security breach | Database corruption, DDoS attack, auth system failure | Immediate (all hands) |
| **P1 — High** | Major feature broken, significant performance degradation | Payment processing down, 50%+ error rate, 10x latency | < 1 hour |
| **P2 — Medium** | Minor feature broken, workaround available | Search not working, non-critical API errors | < 4 hours |
| **P3 — Low** | Cosmetic issue, minor inconvenience | Styling bug, typo, minor UI glitch | Next sprint |

## Response Teams by Severity

### P0 — Critical Response Team
| Agent | Role | Action |
|-------|------|--------|
| **Infrastructure Maintainer** | Incident commander | Assess scope, coordinate response |
| **DevOps Automator** | Deployment/rollback | Execute rollback if needed |
| **Backend Architect** | Root cause investigation | Diagnose system issues |
| **Frontend Developer** | UI-side investigation | Diagnose client-side issues |
| **Support Responder** | User communication | Status page updates, user notifications |
| **Executive Summary Generator** | Stakeholder communication | Real-time executive updates |

### P1 — High Response Team
| Agent | Role |
|-------|------|
| **Infrastructure Maintainer** | Incident commander |
| **DevOps Automator** | Deployment support |
| **Relevant Developer Agent** | Fix implementation |
| **Support Responder** | User communication |

### P2 — Medium Response
| Agent | Role |
|-------|------|
| **Relevant Developer Agent** | Fix implementation |
| **Evidence Collector** | Verify fix |

### P3 — Low Response
| Agent | Role |
|-------|------|
| **Sprint Prioritizer** | Add to backlog |

## Incident Response Sequence

### Step 1: Detection & Triage (0-5 minutes)

```
TRIGGER: Alert from monitoring / User report / Agent detection

Infrastructure Maintainer:
1. Acknowledge alert
2. Assess scope and impact
   - How many users affected?
   - Which services are impacted?
   - Is data at risk?
3. Classify severity (P0/P1/P2/P3)
4. Activate appropriate response team
5. Create incident channel/thread

Output: Incident classification + response team activated
```

### Step 2: Investigation (5-30 minutes)

```
PARALLEL INVESTIGATION:

Infrastructure Maintainer:
├── Check system metrics (CPU, memory, network, disk)
├── Review error logs
├── Check recent deployments
└── Verify external dependencies

Backend Architect (if P0/P1):
├── Check database health
├── Review API error rates
├── Check service communication
└── Identify failing component

DevOps Automator:
├── Review recent deployment history
├── Check CI/CD pipeline status
├── Prepare rollback if needed
└── Verify infrastructure state

Output: Root cause identified (or narrowed to component)
```

### Step 3: Mitigation (15-60 minutes)

```
DECISION TREE:

IF caused by recent deployment:
  → DevOps Automator: Execute rollback
  → Infrastructure Maintainer: Verify recovery
  → Evidence Collector: Confirm fix

IF caused by infrastructure issue:
  → Infrastructure Maintainer: Scale/restart/failover
  → DevOps Automator: Support infrastructure changes
  → Verify recovery

IF caused by code bug:
  → Relevant Developer Agent: Implement hotfix
  → Evidence Collector: Verify fix
  → DevOps Automator: Deploy hotfix
  → Infrastructure Maintainer: Monitor recovery

IF caused by external dependency:
  → Infrastructure Maintainer: Activate fallback/cache
  → Support Responder: Communicate to users
  → Monitor for external recovery

THROUGHOUT:
  → Support Responder: Update status page every 15 minutes
  → Executive Summary Generator: Brief stakeholders (P0 only)
```

### Step 4: Resolution Verification (Post-fix)

```
Evidence Collector:
1. Verify the fix resolves the issue
2. Screenshot evidence of working state
3. Confirm no new issues introduced

Infrastructure Maintainer:
1. Verify all metrics returning to normal
2. Confirm no cascading failures
3. Monitor for 30 minutes post-fix

API Tester (if API-related):
1. Run regression on affected endpoints
2. Verify response times normalized
3. Confirm error rates at baseline

Output: Incident resolved confirmation
```

### Step 5: Post-Mortem (Within 48 hours)

```
Workflow Optimizer leads post-mortem:

1. Timeline reconstruction
   - When was the issue introduced?
   - When was it detected?
   - When was it resolved?
   - Total user impact duration

2. Root cause analysis
   - What failed?
   - Why did it fail?
   - Why wasn't it caught earlier?
   - 5 Whys analysis

3. Impact assessment
   - Users affected
   - Revenue impact
   - Reputation impact
   - Data impact

4. Prevention measures
   - What monitoring would have caught this sooner?
   - What testing would have prevented this?
   - What process changes are needed?
   - What infrastructure changes are needed?

5. Action items
   - [Action] → [Owner] → [Deadline]
   - [Action] → [Owner] → [Deadline]
   - [Action] → [Owner] → [Deadline]

Output: Post-Mortem Report → Sprint Prioritizer adds prevention tasks to backlog
```

## Communication Templates

### Status Page Update (Support Responder)
```
[TIMESTAMP] — [SERVICE NAME] Incident

Status: [Investigating / Identified / Monitoring / Resolved]
Impact: [Description of user impact]
Current action: [What we're doing about it]
Next update: [When to expect the next update]
```

### Executive Update (Executive Summary Generator — P0 only)
```
INCIDENT BRIEF — [TIMESTAMP]

SITUATION: [Service] is [down/degraded] affecting [N users/% of traffic]
CAUSE: [Known/Under investigation] — [Brief description if known]
ACTION: [What's being done] — ETA [time estimate]
IMPACT: [Business impact — revenue, users, reputation]
NEXT UPDATE: [Timestamp]
```

## Escalation Matrix

| Condition | Escalate To | Action |
|-----------|------------|--------|
| P0 not resolved in 30 min | Studio Producer | Additional resources, vendor escalation |
| P1 not resolved in 2 hours | Project Shepherd | Resource reallocation |
| Data breach suspected | Legal Compliance Checker | Regulatory notification assessment |
| User data affected | Legal Compliance Checker + Executive Summary Generator | GDPR/CCPA notification |
| Revenue impact > $X | Finance Tracker + Studio Producer | Business impact assessment |

### scenario-marketing-campaign

# 📢 Runbook: Multi-Channel Marketing Campaign

> **Mode**: NEXUS-Micro to NEXUS-Sprint | **Duration**: 2-4 weeks | **Agents**: 10-15

---

## Scenario

You're launching a coordinated marketing campaign across multiple channels. Content needs to be platform-specific, brand-consistent, and data-driven. The campaign needs to drive measurable acquisition and engagement.

## Agent Roster

### Campaign Core
| Agent | Role |
|-------|------|
| Social Media Strategist | Campaign lead, cross-platform strategy |
| Content Creator | Content production across all formats |
| Growth Hacker | Acquisition strategy, funnel optimization |
| Brand Guardian | Brand consistency across all channels |
| Analytics Reporter | Performance tracking and optimization |

### Platform Specialists
| Agent | Role |
|-------|------|
| Twitter Engager | Twitter/X campaign execution |
| TikTok Strategist | TikTok content and growth |
| Instagram Curator | Instagram visual content |
| Reddit Community Builder | Reddit authentic engagement |
| App Store Optimizer | App store presence (if mobile) |

### Support
| Agent | Role |
|-------|------|
| Trend Researcher | Market timing and trend alignment |
| Experiment Tracker | A/B testing campaign variations |
| Executive Summary Generator | Campaign reporting |
| Legal Compliance Checker | Ad compliance, disclosure requirements |

## Execution Plan

### Week 1: Strategy & Content Creation

```
Day 1-2: Campaign Strategy
├── Social Media Strategist → Cross-platform campaign strategy
│   ├── Campaign objectives and KPIs
│   ├── Target audience definition
│   ├── Platform selection and budget allocation
│   ├── Content calendar (4-week plan)
│   └── Engagement strategy per platform
│
├── Trend Researcher → Market timing analysis
│   ├── Trending topics to align with
│   ├── Competitor campaign analysis
│   └── Optimal launch timing
│
├── Growth Hacker → Acquisition funnel design
│   ├── Landing page optimization plan
│   ├── Conversion funnel mapping
│   ├── Viral mechanics (referral, sharing)
│   └── Channel budget allocation
│
├── Brand Guardian → Campaign brand guidelines
│   ├── Campaign-specific visual guidelines
│   ├── Messaging framework
│   ├── Tone and voice for campaign
│   └── Do's and don'ts
│
└── Legal Compliance Checker → Ad compliance review
    ├── Disclosure requirements
    ├── Platform-specific ad policies
    └── Regulatory constraints

Day 3-5: Content Production
├── Content Creator → Multi-format content creation
│   ├── Blog posts / articles
│   ├── Email sequences
│   ├── Landing page copy
│   ├── Video scripts
│   └── Social media copy (platform-adapted)
│
├── Twitter Engager → Twitter-specific content
│   ├── Launch thread (10-15 tweets)
│   ├── Daily engagement tweets
│   ├── Reply templates
│   └── Hashtag strategy
│
├── TikTok Strategist → TikTok content plan
│   ├── Video concepts (3-5 videos)
│   ├── Hook strategies
│   ├── Trending audio/format alignment
│   └── Posting schedule
│
├── Instagram Curator → Instagram content
│   ├── Feed posts (carousel, single image)
│   ├── Stories content
│   ├── Reels concepts
│   └── Visual aesthetic guidelines
│
└── Reddit Community Builder → Reddit strategy
    ├── Subreddit targeting
    ├── Value-first post drafts
    ├── Comment engagement plan
    └── AMA preparation (if applicable)
```

### Week 2: Launch & Activate

```
Day 1: Pre-Launch
├── All content queued and scheduled
├── Analytics tracking verified
├── A/B test variants configured
├── Landing pages live and tested
└── Team briefed on engagement protocols

Day 2-3: Launch
├── Twitter Engager → Launch thread + real-time engagement
├── Instagram Curator → Launch posts + stories
├── TikTok Strategist → Launch videos
├── Reddit Community Builder → Authentic community posts
├── Content Creator → Blog post published + email blast
├── Growth Hacker → Paid campaigns activated
└── Analytics Reporter → Real-time dashboard monitoring

Day 4-5: Optimize
├── Analytics Reporter → First 48-hour performance report
├── Growth Hacker → Channel optimization based on data
├── Experiment Tracker → A/B test early results
├── Social Media Strategist → Engagement strategy adjustment
└── Content Creator → Response content based on reception
```

### Week 3-4: Sustain & Optimize

```
Daily:
├── Platform agents → Engagement and content posting
├── Analytics Reporter → Daily performance snapshot
└── Growth Hacker → Funnel optimization

Weekly:
├── Social Media Strategist → Campaign performance review
├── Experiment Tracker → A/B test results and new tests
├── Content Creator → New content based on performance data
└── Analytics Reporter → Weekly campaign report

End of Campaign:
├── Analytics Reporter → Comprehensive campaign analysis
├── Growth Hacker → ROI analysis and channel effectiveness
├── Executive Summary Generator → Campaign executive summary
└── Social Media Strategist → Lessons learned and recommendations
```

## Campaign Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| Total reach | [Target based on budget] | Social Media Strategist |
| Engagement rate | > 3% average across platforms | Platform agents |
| Click-through rate | > 2% on CTAs | Growth Hacker |
| Conversion rate | > 5% landing page | Growth Hacker |
| Cost per acquisition | < [Target CAC] | Growth Hacker |
| Brand sentiment | Net positive | Brand Guardian |
| Content pieces published | [Target count] | Content Creator |
| A/B tests completed | ≥ 5 | Experiment Tracker |

## Platform-Specific KPIs

| Platform | Primary KPI | Secondary KPI | Agent |
|----------|------------|---------------|-------|
| Twitter/X | Impressions + engagement rate | Follower growth | Twitter Engager |
| TikTok | Views + completion rate | Follower growth | TikTok Strategist |
| Instagram | Reach + saves | Profile visits | Instagram Curator |
| Reddit | Upvotes + comment quality | Referral traffic | Reddit Community Builder |
| Email | Open rate + CTR | Unsubscribe rate | Content Creator |
| Blog | Organic traffic + time on page | Backlinks | Content Creator |
| Paid ads | ROAS + CPA | Quality score | Growth Hacker |

## Brand Consistency Checkpoints

| Checkpoint | When | Agent |
|-----------|------|-------|
| Content review before publishing | Every piece | Brand Guardian |
| Visual consistency audit | Weekly | Brand Guardian |
| Voice and tone check | Weekly | Brand Guardian |
| Compliance review | Before launch + weekly | Legal Compliance Checker |

### scenario-startup-mvp

# 🚀 Runbook: Startup MVP Build

> **Mode**: NEXUS-Sprint | **Duration**: 4-6 weeks | **Agents**: 18-22

---

## Scenario

You're building a startup MVP — a new product that needs to validate product-market fit quickly. Speed matters, but so does quality. You need to go from idea to live product with real users in 4-6 weeks.

## Agent Roster

### Core Team (Always Active)
| Agent | Role |
|-------|------|
| Agents Orchestrator | Pipeline controller |
| Senior Project Manager | Spec-to-task conversion |
| Sprint Prioritizer | Backlog management |
| UX Architect | Technical foundation |
| Frontend Developer | UI implementation |
| Backend Architect | API and database |
| DevOps Automator | CI/CD and deployment |
| Evidence Collector | QA for every task |
| Reality Checker | Final quality gate |

### Growth Team (Activated Week 3+)
| Agent | Role |
|-------|------|
| Growth Hacker | Acquisition strategy |
| Content Creator | Launch content |
| Social Media Strategist | Social campaign |

### Support Team (As Needed)
| Agent | Role |
|-------|------|
| Brand Guardian | Brand identity |
| Analytics Reporter | Metrics and dashboards |
| Rapid Prototyper | Quick validation experiments |
| AI Engineer | If product includes AI features |
| Performance Benchmarker | Load testing before launch |
| Infrastructure Maintainer | Production setup |

## Week-by-Week Execution

### Week 1: Discovery + Architecture (Phase 0 + Phase 1 compressed)

```
Day 1-2: Compressed Discovery
├── Trend Researcher → Quick competitive scan (1 day, not full report)
├── UX Architect → Wireframe key user flows
└── Senior Project Manager → Convert spec to task list

Day 3-4: Architecture
├── UX Architect → CSS design system + component architecture
├── Backend Architect → System architecture + database schema
├── Brand Guardian → Quick brand foundation (colors, typography, voice)
└── Sprint Prioritizer → RICE-scored backlog + sprint plan

Day 5: Foundation Setup
├── DevOps Automator → CI/CD pipeline + environments
├── Frontend Developer → Project scaffolding
├── Backend Architect → Database + API scaffold
└── Quality Gate: Architecture Package approved
```

### Week 2-3: Core Build (Phase 2 + Phase 3)

```
Sprint 1 (Week 2):
├── Agents Orchestrator manages Dev↔QA loop
├── Frontend Developer → Core UI (auth, main views, navigation)
├── Backend Architect → Core API (auth, CRUD, business logic)
├── Evidence Collector → QA every completed task
├── AI Engineer → ML features if applicable
└── Sprint Review at end of week

Sprint 2 (Week 3):
├── Continue Dev↔QA loop for remaining features
├── Growth Hacker → Design viral mechanics + referral system
├── Content Creator → Begin launch content creation
├── Analytics Reporter → Set up tracking and dashboards
└── Sprint Review at end of week
```

### Week 4: Polish + Hardening (Phase 4)

```
Day 1-2: Quality Sprint
├── Evidence Collector → Full screenshot suite
├── Performance Benchmarker → Load testing
├── Frontend Developer → Fix QA issues
├── Backend Architect → Fix API issues
└── Brand Guardian → Brand consistency audit

Day 3-4: Reality Check
├── Reality Checker → Final integration testing
├── Infrastructure Maintainer → Production readiness
└── DevOps Automator → Production deployment prep

Day 5: Gate Decision
├── Reality Checker verdict
├── IF NEEDS WORK: Quick fix cycle (2-3 days)
├── IF READY: Proceed to launch
└── Executive Summary Generator → Stakeholder briefing
```

### Week 5-6: Launch + Growth (Phase 5)

```
Week 5: Launch
├── DevOps Automator → Production deployment
├── Growth Hacker → Activate acquisition channels
├── Content Creator → Publish launch content
├── Social Media Strategist → Cross-platform campaign
├── Analytics Reporter → Real-time monitoring
└── Support Responder → User support active

Week 6: Optimize
├── Growth Hacker → Analyze and optimize channels
├── Feedback Synthesizer → Collect early user feedback
├── Experiment Tracker → Launch A/B tests
├── Analytics Reporter → Week 1 analysis
└── Sprint Prioritizer → Plan iteration sprint
```

## Key Decisions

| Decision Point | When | Who Decides |
|---------------|------|-------------|
| Go/No-Go on concept | End of Day 2 | Studio Producer |
| Architecture approval | End of Day 4 | Senior Project Manager |
| Feature scope for MVP | Sprint planning | Sprint Prioritizer |
| Production readiness | Week 4 Day 5 | Reality Checker |
| Launch timing | After Reality Checker READY | Studio Producer |

## Success Criteria

| Metric | Target |
|--------|--------|
| Time to live product | ≤ 6 weeks |
| Core features complete | 100% of MVP scope |
| First users onboarded | Within 48 hours of launch |
| System uptime | > 99% in first week |
| User feedback collected | ≥ 50 responses in first 2 weeks |

## Common Pitfalls & Mitigations

| Pitfall | Mitigation |
|---------|-----------|
| Scope creep during build | Sprint Prioritizer enforces MoSCoW — "Won't" means won't |
| Over-engineering for scale | Rapid Prototyper mindset — validate first, scale later |
| Skipping QA for speed | Evidence Collector runs on EVERY task — no exceptions |
| Launching without monitoring | Infrastructure Maintainer sets up monitoring in Week 1 |
| No feedback mechanism | Analytics + feedback collection built into Sprint 1 |

## 🤝 Handoff Templates

# 📋 NEXUS Handoff Templates

> Standardized templates for every type of agent-to-agent handoff in the NEXUS pipeline. Consistent handoffs prevent context loss — the #1 cause of multi-agent coordination failure.

---

## 1. Standard Handoff Template

Use for any agent-to-agent work transfer.

```markdown
# NEXUS Handoff Document

## Metadata
| Field | Value |
|-------|-------|
| **From** | [Agent Name] ([Division]) |
| **To** | [Agent Name] ([Division]) |
| **Phase** | Phase [N] — [Phase Name] |
| **Task Reference** | [Task ID from Sprint Prioritizer backlog] |
| **Priority** | [Critical / High / Medium / Low] |
| **Timestamp** | [YYYY-MM-DDTHH:MM:SSZ] |

## Context
**Project**: [Project name]
**Current State**: [What has been completed so far — be specific]
**Relevant Files**:
- [file/path/1] — [what it contains]
- [file/path/2] — [what it contains]
**Dependencies**: [What this work depends on being complete]
**Constraints**: [Technical, timeline, or resource constraints]

## Deliverable Request
**What is needed**: [Specific, measurable deliverable description]
**Acceptance criteria**:
- [ ] [Criterion 1 — measurable]
- [ ] [Criterion 2 — measurable]
- [ ] [Criterion 3 — measurable]
**Reference materials**: [Links to specs, designs, previous work]

## Quality Expectations
**Must pass**: [Specific quality criteria for this deliverable]
**Evidence required**: [What proof of completion looks like]
**Handoff to next**: [Who receives the output and what format they need]
```

---

## 2. QA Feedback Loop — PASS

Use when Evidence Collector or other QA agent approves a task.

```markdown
# NEXUS QA Verdict: PASS ✅

## Task
| Field | Value |
|-------|-------|
| **Task ID** | [ID] |
| **Task Description** | [Description] |
| **Developer Agent** | [Agent Name] |
| **QA Agent** | [Agent Name] |
| **Attempt** | [N] of 3 |
| **Timestamp** | [YYYY-MM-DDTHH:MM:SSZ] |

## Verdict: PASS

## Evidence
**Screenshots**:
- Desktop (1920x1080): [filename/path]
- Tablet (768x1024): [filename/path]
- Mobile (375x667): [filename/path]

**Functional Verification**:
- [x] [Acceptance criterion 1] — verified
- [x] [Acceptance criterion 2] — verified
- [x] [Acceptance criterion 3] — verified

**Brand Consistency**: Verified — colors, typography, spacing match design system
**Accessibility**: Verified — keyboard navigation, contrast ratios, semantic HTML
**Performance**: [Load time measured] — within acceptable range

## Notes
[Any observations, minor suggestions for future improvement, or positive callouts]

## Next Action
→ Agents Orchestrator: Mark task complete, advance to next task in backlog
```

---

## 3. QA Feedback Loop — FAIL

Use when Evidence Collector or other QA agent rejects a task.

```markdown
# NEXUS QA Verdict: FAIL ❌

## Task
| Field | Value |
|-------|-------|
| **Task ID** | [ID] |
| **Task Description** | [Description] |
| **Developer Agent** | [Agent Name] |
| **QA Agent** | [Agent Name] |
| **Attempt** | [N] of 3 |
| **Timestamp** | [YYYY-MM-DDTHH:MM:SSZ] |

## Verdict: FAIL

## Issues Found

### Issue 1: [Category] — [Severity: Critical/High/Medium/Low]
**Description**: [Exact description of the problem]
**Expected**: [What should happen according to acceptance criteria]
**Actual**: [What actually happens]
**Evidence**: [Screenshot filename or test output]
**Fix instruction**: [Specific, actionable instruction to resolve]
**File(s) to modify**: [Exact file paths]

### Issue 2: [Category] — [Severity]
**Description**: [...]
**Expected**: [...]
**Actual**: [...]
**Evidence**: [...]
**Fix instruction**: [...]
**File(s) to modify**: [...]

[Continue for all issues found]

## Acceptance Criteria Status
- [x] [Criterion 1] — passed
- [ ] [Criterion 2] — FAILED (see Issue 1)
- [ ] [Criterion 3] — FAILED (see Issue 2)

## Retry Instructions
**For Developer Agent**:
1. Fix ONLY the issues listed above
2. Do NOT introduce new features or changes
3. Re-submit for QA when all issues are addressed
4. This is attempt [N] of 3 maximum

**If attempt 3 fails**: Task will be escalated to Agents Orchestrator
```

---

## 4. Escalation Report

Use when a task exceeds 3 retry attempts.

```markdown
# NEXUS Escalation Report 🚨

## Task
| Field | Value |
|-------|-------|
| **Task ID** | [ID] |
| **Task Description** | [Description] |
| **Developer Agent** | [Agent Name] |
| **QA Agent** | [Agent Name] |
| **Attempts Exhausted** | 3/3 |
| **Escalation To** | [Agents Orchestrator / Studio Producer] |
| **Timestamp** | [YYYY-MM-DDTHH:MM:SSZ] |

## Failure History

### Attempt 1
- **Issues found**: [Summary]
- **Fixes applied**: [What the developer changed]
- **Result**: FAIL — [Why it still failed]

### Attempt 2
- **Issues found**: [Summary]
- **Fixes applied**: [What the developer changed]
- **Result**: FAIL — [Why it still failed]

### Attempt 3
- **Issues found**: [Summary]
- **Fixes applied**: [What the developer changed]
- **Result**: FAIL — [Why it still failed]

## Root Cause Analysis
**Why the task keeps failing**: [Analysis of the underlying problem]
**Systemic issue**: [Is this a one-off or pattern?]
**Complexity assessment**: [Was the task properly scoped?]

## Recommended Resolution
- [ ] **Reassign** to different developer agent ([recommended agent])
- [ ] **Decompose** into smaller sub-tasks ([proposed breakdown])
- [ ] **Revise approach** — architecture/design change needed
- [ ] **Accept** current state with documented limitations
- [ ] **Defer** to future sprint

## Impact Assessment
**Blocking**: [What other tasks are blocked by this]
**Timeline Impact**: [How this affects the overall schedule]
**Quality Impact**: [What quality compromises exist if we accept current state]

## Decision Required
**Decision maker**: [Agents Orchestrator / Studio Producer]
**Deadline**: [When decision is needed to avoid further delays]
```

---

## 5. Phase Gate Handoff

Use when transitioning between NEXUS phases.

```markdown
# NEXUS Phase Gate Handoff

## Transition
| Field | Value |
|-------|-------|
| **From Phase** | Phase [N] — [Name] |
| **To Phase** | Phase [N+1] — [Name] |
| **Gate Keeper(s)** | [Agent Name(s)] |
| **Gate Result** | [PASSED / FAILED] |
| **Timestamp** | [YYYY-MM-DDTHH:MM:SSZ] |

## Gate Criteria Results
| # | Criterion | Threshold | Result | Evidence |
|---|-----------|-----------|--------|----------|
| 1 | [Criterion] | [Threshold] | ✅ PASS / ❌ FAIL | [Evidence reference] |
| 2 | [Criterion] | [Threshold] | ✅ PASS / ❌ FAIL | [Evidence reference] |
| 3 | [Criterion] | [Threshold] | ✅ PASS / ❌ FAIL | [Evidence reference] |

## Documents Carried Forward
1. [Document name] — [Purpose for next phase]
2. [Document name] — [Purpose for next phase]
3. [Document name] — [Purpose for next phase]

## Key Constraints for Next Phase
- [Constraint 1 from this phase's findings]
- [Constraint 2 from this phase's findings]

## Agent Activation for Next Phase
| Agent | Role | Priority |
|-------|------|----------|
| [Agent 1] | [Role in next phase] | [Immediate / Day 2 / As needed] |
| [Agent 2] | [Role in next phase] | [Immediate / Day 2 / As needed] |

## Risks Carried Forward
| Risk | Severity | Mitigation | Owner |
|------|----------|------------|-------|
| [Risk] | [P0-P3] | [Mitigation plan] | [Agent] |
```

---

## 6. Sprint Handoff

Use at sprint boundaries.

```markdown
# NEXUS Sprint Handoff

## Sprint Summary
| Field | Value |
|-------|-------|
| **Sprint** | [Number] |
| **Duration** | [Start date] → [End date] |
| **Sprint Goal** | [Goal statement] |
| **Velocity** | [Planned] / [Actual] story points |

## Completion Status
| Task ID | Description | Status | QA Attempts | Notes |
|---------|-------------|--------|-------------|-------|
| [ID] | [Description] | ✅ Complete | [N] | [Notes] |
| [ID] | [Description] | ✅ Complete | [N] | [Notes] |
| [ID] | [Description] | ⚠️ Carried Over | [N] | [Reason] |

## Quality Metrics
- **First-pass QA rate**: [X]%
- **Average retries**: [N]
- **Tasks completed**: [X/Y]
- **Story points delivered**: [N]

## Carried Over to Next Sprint
| Task ID | Description | Reason | Priority |
|---------|-------------|--------|----------|
| [ID] | [Description] | [Why not completed] | [RICE score] |

## Retrospective Insights
**What went well**: [Key successes]
**What to improve**: [Key improvements]
**Action items**: [Specific changes for next sprint]

## Next Sprint Preview
**Sprint goal**: [Proposed goal]
**Key tasks**: [Top priority items]
**Dependencies**: [Cross-team dependencies]
```

---

## 7. Incident Handoff

Use during incident response.

```markdown
# NEXUS Incident Handoff

## Incident
| Field | Value |
|-------|-------|
| **Severity** | [P0 / P1 / P2 / P3] |
| **Detected by** | [Agent or system] |
| **Detection time** | [Timestamp] |
| **Assigned to** | [Agent Name] |
| **Status** | [Investigating / Mitigating / Resolved / Post-mortem] |

## Description
**What happened**: [Clear description of the incident]
**Impact**: [Who/what is affected and how severely]
**Timeline**:
- [HH:MM] — [Event]
- [HH:MM] — [Event]
- [HH:MM] — [Event]

## Current State
**Systems affected**: [List]
**Workaround available**: [Yes/No — describe if yes]
**Estimated resolution**: [Time estimate]

## Actions Taken
1. [Action taken and result]
2. [Action taken and result]

## Handoff Context
**For next responder**:
- [What's been tried]
- [What hasn't been tried yet]
- [Suspected root cause]
- [Relevant logs/metrics to check]

## Stakeholder Communication
**Last update sent**: [Timestamp]
**Next update due**: [Timestamp]
**Communication channel**: [Where updates are posted]
```

---

## Usage Guide

| Situation | Template to Use |
|-----------|----------------|
| Assigning work to another agent | Standard Handoff (#1) |
| QA approves a task | QA PASS (#2) |
| QA rejects a task | QA FAIL (#3) |
| Task exceeds 3 retries | Escalation Report (#4) |
| Moving between phases | Phase Gate Handoff (#5) |
| End of sprint | Sprint Handoff (#6) |
| System incident | Incident Handoff (#7) |

## 🔔 Agent Activation Prompts

# 🎯 NEXUS Agent Activation Prompts

> Ready-to-use prompt templates for activating any agent within the NEXUS pipeline. Copy, customize the `[PLACEHOLDERS]`, and deploy.

---

## Pipeline Controller

### Agents Orchestrator — Full Pipeline
```
You are the Agents Orchestrator executing the NEXUS pipeline for [PROJECT NAME].

Mode: NEXUS-[Full/Sprint/Micro]
Project specification: [PATH TO SPEC]
Current phase: Phase [N] — [Phase Name]

NEXUS Protocol:
1. Read the project specification thoroughly
2. Activate Phase [N] agents per the NEXUS playbook (strategy/playbooks/phase-[N]-*.md)
3. Manage all handoffs using the NEXUS Handoff Template
4. Enforce quality gates before any phase advancement
5. Track all tasks with the NEXUS Pipeline Status Report format
6. Run Dev↔QA loops: Developer implements → Evidence Collector tests → PASS/FAIL decision
7. Maximum 3 retries per task before escalation
8. Report status at every phase boundary

Quality principles:
- Evidence over claims — require proof for all quality assessments
- No phase advances without passing its quality gate
- Context continuity — every handoff carries full context
- Fail fast, fix fast — escalate after 3 retries

Available agents: See strategy/nexus-strategy.md Section 10 for full coordination matrix
```

### Agents Orchestrator — Dev↔QA Loop
```
You are the Agents Orchestrator managing the Dev↔QA loop for [PROJECT NAME].

Current sprint: [SPRINT NUMBER]
Task backlog: [PATH TO SPRINT PLAN]
Active developer agents: [LIST]
QA agents: Evidence Collector, [API Tester / Performance Benchmarker as needed]

For each task in priority order:
1. Assign to appropriate developer agent (see assignment matrix)
2. Wait for implementation completion
3. Activate Evidence Collector for QA validation
4. IF PASS: Mark complete, move to next task
5. IF FAIL (attempt < 3): Send QA feedback to developer, retry
6. IF FAIL (attempt = 3): Escalate — reassign, decompose, or defer

Track and report:
- Tasks completed / total
- First-pass QA rate
- Average retries per task
- Blocked tasks and reasons
- Overall sprint progress percentage
```

---

## Engineering Division

### Frontend Developer
```
You are Frontend Developer working within the NEXUS pipeline for [PROJECT NAME].

Phase: [CURRENT PHASE]
Task: [TASK ID] — [TASK DESCRIPTION]
Acceptance criteria: [SPECIFIC CRITERIA FROM TASK LIST]

Reference documents:
- Architecture: [PATH TO ARCHITECTURE SPEC]
- Design system: [PATH TO CSS DESIGN SYSTEM]
- Brand guidelines: [PATH TO BRAND GUIDELINES]
- API specification: [PATH TO API SPEC]

Implementation requirements:
- Follow the design system tokens exactly (colors, typography, spacing)
- Implement mobile-first responsive design
- Ensure WCAG 2.1 AA accessibility compliance
- Optimize for Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Write component tests for all new components

When complete, your work will be reviewed by Evidence Collector.
Do NOT add features beyond the acceptance criteria.
```

### Backend Architect
```
You are Backend Architect working within the NEXUS pipeline for [PROJECT NAME].

Phase: [CURRENT PHASE]
Task: [TASK ID] — [TASK DESCRIPTION]
Acceptance criteria: [SPECIFIC CRITERIA FROM TASK LIST]

Reference documents:
- System architecture: [PATH TO SYSTEM ARCHITECTURE]
- Database schema: [PATH TO SCHEMA]
- API specification: [PATH TO API SPEC]
- Security requirements: [PATH TO SECURITY SPEC]

Implementation requirements:
- Follow the system architecture specification exactly
- Implement proper error handling with meaningful error codes
- Include input validation for all endpoints
- Add authentication/authorization as specified
- Ensure database queries are optimized with proper indexing
- API response times must be < 200ms (P95)

When complete, your work will be reviewed by API Tester.
Security is non-negotiable — implement defense in depth.
```

### AI Engineer
```
You are AI Engineer working within the NEXUS pipeline for [PROJECT NAME].

Phase: [CURRENT PHASE]
Task: [TASK ID] — [TASK DESCRIPTION]
Acceptance criteria: [SPECIFIC CRITERIA FROM TASK LIST]

Reference documents:
- ML system design: [PATH TO ML ARCHITECTURE]
- Data pipeline spec: [PATH TO DATA SPEC]
- Integration points: [PATH TO INTEGRATION SPEC]

Implementation requirements:
- Follow the ML system design specification
- Implement bias testing across demographic groups
- Include model monitoring and drift detection
- Ensure inference latency < 100ms for real-time features
- Document model performance metrics (accuracy, F1, etc.)
- Implement proper error handling for model failures

When complete, your work will be reviewed by Test Results Analyzer.
AI ethics and safety are mandatory — no shortcuts.
```

### DevOps Automator
```
You are DevOps Automator working within the NEXUS pipeline for [PROJECT NAME].

Phase: [CURRENT PHASE]
Task: [TASK ID] — [TASK DESCRIPTION]

Reference documents:
- System architecture: [PATH TO SYSTEM ARCHITECTURE]
- Infrastructure requirements: [PATH TO INFRA SPEC]

Implementation requirements:
- Automation-first: eliminate all manual processes
- Include security scanning in all pipelines
- Implement zero-downtime deployment capability
- Configure monitoring and alerting for all services
- Create rollback procedures for every deployment
- Document all infrastructure as code

When complete, your work will be reviewed by Performance Benchmarker.
Reliability is the priority — 99.9% uptime target.
```

### Rapid Prototyper
```
You are Rapid Prototyper working within the NEXUS pipeline for [PROJECT NAME].

Phase: [CURRENT PHASE]
Task: [TASK ID] — [TASK DESCRIPTION]
Time constraint: [MAXIMUM DAYS]

Core hypothesis to validate: [WHAT WE'RE TESTING]
Success metrics: [HOW WE MEASURE VALIDATION]

Implementation requirements:
- Speed over perfection — working prototype in [N] days
- Include user feedback collection from day one
- Implement basic analytics tracking
- Use rapid development stack (Next.js, Supabase, Clerk, shadcn/ui)
- Focus on core user flow only — no edge cases
- Document assumptions and what's being tested

When complete, your work will be reviewed by Evidence Collector.
Build only what's needed to test the hypothesis.
```

---

## Design Division

### UX Architect
```
You are UX Architect working within the NEXUS pipeline for [PROJECT NAME].

Phase: [CURRENT PHASE]
Task: Create technical architecture and UX foundation

Reference documents:
- Brand identity: [PATH TO BRAND GUIDELINES]
- User research: [PATH TO UX RESEARCH]
- Project specification: [PATH TO SPEC]

Deliverables:
1. CSS Design System (variables, tokens, scales)
2. Layout Framework (Grid/Flexbox patterns, responsive breakpoints)
3. Component Architecture (naming conventions, hierarchy)
4. Information Architecture (page flow, content hierarchy)
5. Theme System (light/dark/system toggle)
6. Accessibility Foundation (WCAG 2.1 AA baseline)

Requirements:
- Include light/dark/system theme toggle
- Mobile-first responsive strategy
- Developer-ready specifications (no ambiguity)
- Use semantic color naming (not hardcoded values)
```

### Brand Guardian
```
You are Brand Guardian working within the NEXUS pipeline for [PROJECT NAME].

Phase: [CURRENT PHASE]
Task: [Brand identity development / Brand consistency audit]

Reference documents:
- User research: [PATH TO UX RESEARCH]
- Market analysis: [PATH TO MARKET RESEARCH]
- Existing brand assets: [PATH IF ANY]

Deliverables:
1. Brand Foundation (purpose, vision, mission, values, personality)
2. Visual Identity System (colors as CSS variables, typography, spacing)
3. Brand Voice and Messaging Architecture
4. Brand Usage Guidelines
5. [If audit]: Brand Consistency Report with specific deviations

Requirements:
- All colors provided as hex values ready for CSS implementation
- Typography specified with Google Fonts or system font stacks
- Voice guidelines with do/don't examples
- Accessibility-compliant color combinations (WCAG AA contrast)
```

---

## Testing Division

### Evidence Collector — Task QA
```
You are Evidence Collector performing QA within the NEXUS Dev↔QA loop.

Task: [TASK ID] — [TASK DESCRIPTION]
Developer: [WHICH AGENT IMPLEMENTED THIS]
Attempt: [N] of 3 maximum
Application URL: [URL]

Validation checklist:
1. Acceptance criteria met: [LIST SPECIFIC CRITERIA]
2. Visual verification:
   - Desktop screenshot (1920x1080)
   - Tablet screenshot (768x1024)
   - Mobile screenshot (375x667)
3. Interaction verification:
   - [Specific interactions to test]
4. Brand consistency:
   - Colors match design system
   - Typography matches brand guidelines
   - Spacing follows design tokens
5. Accessibility:
   - Keyboard navigation works
   - Screen reader compatible
   - Color contrast sufficient

Verdict: PASS or FAIL
If FAIL: Provide specific issues with screenshot evidence and fix instructions.
Use the NEXUS QA Feedback Loop Protocol format.
```

### Reality Checker — Final Integration
```
You are Reality Checker performing final integration testing for [PROJECT NAME].

YOUR DEFAULT VERDICT IS: NEEDS WORK
You require OVERWHELMING evidence to issue a READY verdict.

MANDATORY PROCESS:
1. Reality Check Commands — verify what was actually built
2. QA Cross-Validation — cross-reference all previous QA findings
3. End-to-End Validation — test COMPLETE user journeys (not individual features)
4. Specification Reality Check — quote EXACT spec text vs. actual implementation

Evidence required:
- Screenshots: Desktop, tablet, mobile for EVERY page
- User journeys: Complete flows with before/after screenshots
- Performance: Actual measured load times
- Specification: Point-by-point compliance check

Remember:
- First implementations typically need 2-3 revision cycles
- C+/B- ratings are normal and acceptable
- "Production ready" requires demonstrated excellence
- Trust evidence over claims
- No more "A+ certifications" for basic implementations
```

### API Tester
```
You are API Tester validating endpoints within the NEXUS pipeline.

Task: [TASK ID] — [API ENDPOINTS TO TEST]
API base URL: [URL]
Authentication: [AUTH METHOD AND CREDENTIALS]

Test each endpoint for:
1. Happy path (valid request → expected response)
2. Authentication (missing/invalid token → 401/403)
3. Validation (invalid input → 400/422 with error details)
4. Not found (invalid ID → 404)
5. Rate limiting (excessive requests → 429)
6. Response format (correct JSON structure, data types)
7. Response time (< 200ms P95)

Report format: Pass/Fail per endpoint with response details
Include: curl commands for reproducibility
```

---

## Product Division

### Sprint Prioritizer
```
You are Sprint Prioritizer planning the next sprint for [PROJECT NAME].

Input:
- Current backlog: [PATH TO BACKLOG]
- Team velocity: [STORY POINTS PER SPRINT]
- Strategic priorities: [FROM STUDIO PRODUCER]
- User feedback: [FROM FEEDBACK SYNTHESIZER]
- Analytics data: [FROM ANALYTICS REPORTER]

Deliverables:
1. RICE-scored backlog (Reach × Impact × Confidence / Effort)
2. Sprint selection based on velocity capacity
3. Task dependencies and ordering
4. MoSCoW classification
5. Sprint goal and success criteria

Rules:
- Never exceed team velocity by more than 10%
- Include 20% buffer for unexpected issues
- Balance new features with tech debt and bug fixes
- Prioritize items blocking other teams
```

---

## Support Division

### Executive Summary Generator
```
You are Executive Summary Generator creating a [MILESTONE/PERIOD] summary for [PROJECT NAME].

Input documents:
[LIST ALL INPUT REPORTS]

Output requirements:
- Total length: 325-475 words (≤ 500 max)
- SCQA framework (Situation-Complication-Question-Answer)
- Every finding includes ≥ 1 quantified data point
- Bold strategic implications
- Order by business impact
- Recommendations with owner + timeline + expected result

Sections:
1. SITUATION OVERVIEW (50-75 words)
2. KEY FINDINGS (125-175 words, 3-5 insights)
3. BUSINESS IMPACT (50-75 words, quantified)
4. RECOMMENDATIONS (75-100 words, prioritized Critical/High/Medium)
5. NEXT STEPS (25-50 words, ≤ 30-day horizon)

Tone: Decisive, factual, outcome-driven
No assumptions beyond provided data
```

---

## Quick Reference: Which Prompt for Which Situation

| Situation | Primary Prompt | Support Prompts |
|-----------|---------------|-----------------|
| Starting a new project | Orchestrator — Full Pipeline | — |
| Building a feature | Orchestrator — Dev↔QA Loop | Developer + Evidence Collector |
| Fixing a bug | Backend/Frontend Developer | API Tester or Evidence Collector |
| Running a campaign | Content Creator | Social Media Strategist + platform agents |
| Preparing for launch | See Phase 5 Playbook | All marketing + DevOps agents |
| Monthly reporting | Executive Summary Generator | Analytics Reporter + Finance Tracker |
| Incident response | Infrastructure Maintainer | DevOps Automator + relevant developer |
| Market research | Trend Researcher | Analytics Reporter |
| Compliance audit | Legal Compliance Checker | Executive Summary Generator |
| Performance issue | Performance Benchmarker | Infrastructure Maintainer |
