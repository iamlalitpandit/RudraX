# 🧬 Evolving Memory System

> **Self-learning intelligence engine for RudraX Agent.** 
> Inspired by [RudraX](https://github.com/iamlalitpandit/RudraX)'s memory architecture.
> Ported and extended with autonomous skill evolution.

---

## 🎯 What Is This?

This is a **living memory system** that makes RudraX smarter over time. Unlike regular agent skills that are static, this system:

1. **Learns from every task** — What worked, what failed, what patterns emerged
2. **Tracks user preferences** — How you like to communicate, work, and organize
3. **Detects repeated patterns** — When you do something 3+ times, it offers to create a skill
4. **Auto-creates skills** — Converts detected patterns into reusable agent skills
5. **Self-reviews** — Periodically reflects on its own performance

It's like an apprentice that gets better every day.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EVOLVING MEMORY                           │
├──────────────────┬──────────────────┬──────────────────┐    │
│ 🧠 learning.md   │ 👤 user-context  │ 🔬 evolution.md  │    │
│                  │   .md            │                  │    │
│ Lessons learned  │ User preferences │ Skill versions   │    │
│ Patterns found   │ Communication    │ Proposals        │    │
│ Pitfalls avoided │ style            │ Effectiveness    │    │
└──────────────────┴──────────────────┴──────────────────┘    │
        │               │                │                     │
        └───────────────┴────────────────┘                     │
                        │                                      │
              ┌─────────▼──────────┐                           │
              │ Pattern Detection  │ ←── Detects repeated      │
              │       Engine       │     work → new skills     │
              └────────────────────┘                           │
                        │                                      │
              ┌─────────▼──────────┐                           │
              │   Self-Review      │ ←── Reflects on work      │
              │   Every N turns    │     extracts lessons      │
              └────────────────────┘                           │
                        │                                      │
              ┌─────────▼──────────┐                           │
              │ Frozen Snapshot    │ ←── Injected in system    │
              │ at session start   │     prompt (stable cache) │
              └────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Memory Stores

### 🧠 `~/.rudrax/agent/evolution/learning.md`
**What the system has learned from work.**
- **Lessons Learned** — Verified techniques, conventions, pitfalls
- **Detected Patterns** — Repeated workflows that could become skills

### 👤 `~/.rudrax/agent/evolution/user-context.md`
**What the system knows about YOU.**
- Communication preferences (Hindi/English, casual/formal)
- Tool preferences
- Naming conventions
- Organizational style

### 🔬 `~/.rudrax/agent/evolution/evolution.md`
**How skills grow and change.**
- Skill version history
- Effectiveness scores
- Pending improvement proposals

### 📓 `~/.rudrax/agent/evolution/journal.md`
**Detailed work log.**
- Every significant task performed
- What worked, what failed
- What would be done differently

---

## 🛠️ Built-in Tools

The LLM can call these tools to interact with the learning system:

### `learn_from_experience`
Record something new learned from work.

```
type: "technique" | "convention" | "pitfall" | "user_preference" | "pattern"
observation: "What I noticed"
lesson: "What to remember and apply"
tags: ["category", "another"]
related_skills: ["skill-name"]
```

### `reflect_on_work`
After completing a task, reflect on what happened.

```
task: "What I did"
result: "success" | "partial" | "failure"
approach: "How I approached it"
tools_used: ["tool1", "tool2"]
what_worked: ["specific thing 1", "specific thing 2"]
mistakes: ["error 1", "error 2"]
would_do_differently: "What to change next time"
```

### `evolve_skill`
Propose an improvement to an existing skill.

```
skill_name: "github-code-review"
change_description: "Add step to check for merge conflicts"
auto_apply: false
```

### `read_my_mind`
Read accumulated wisdom before starting work.

```
topic: "git"  // optional filter
type: "lessons" | "patterns" | "user" | "skills"
verified_only: true
```

---

## ⌨️ User Commands

Use these commands in the RudraX chat:

| Command | What it does |
|---------|-------------|
| `/evolve` | Show system evolution status |
| `/evolve status` | Detailed stats |
| `/evolve skills` | See skill effectiveness scores |
| `/evolve patterns` | Detected patterns (ready to convert?) |
| `/evolve lessons` | Recently learned lessons |
| `/evolve user` | User preferences learned |
| `/evolve journal` | Recent work entries |
| `/evolve reflect` | Self-reflection on recent work |
| `/evolve snapshot` | Full learning snapshot injected in prompt |
| `/evolve learn` | Manually add a lesson |
| `/evolve reset` | Archive and reset all memory |

---

## 🔄 How Skill Auto-Creation Works

1. **You do something repeatedly** — e.g., always run `find + grep + sed` together
2. **Pattern detected** — System notices the tool combo in `reflect_on_work`
3. **Evidence builds** — After 3 repetitions, pattern is "ready"
4. **Skill generated** — System auto-creates `SKILL.md` in `~/.rudrax/agent/skills/auto-xxx/`
5. **You review** — Run `/agency activate auto-xxx` to test, or refine manually

---

## 📈 Learning Cycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Work    │───▶│  Reflect │───▶│  Learn   │───▶│  Apply   │
│          │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      │                                              │
      └──────────────────────────────────────────────┘
                    (Get smarter each loop)
```

**Trigger points:**
- After each completed task → Agent calls `reflect_on_work`
- When a pattern repeats 3x → Auto-skill proposal
- Every 10 turns → Auto-reflection reminder
- Session start → Frozen learning snapshot injected

---

## 🔧 Configuration

Edit these constants at the top of `evolving-memory.ts`:

| Constant | Default | Description |
|----------|---------|-------------|
| `PATTERN_REPEAT_THRESHOLD` | 3 | Repetitions before auto-skill |
| `AUTO_REFLECT_TURNS` | 10 | Auto-reflect every N turns |
| `MAX_SNAPSHOT_CHARS` | 1500 | Max chars injected in prompt |
| `MAX_LEARNED_ENTRIES` | 100 | Max lessons to keep |
| `MAX_JOURNAL_ENTRIES` | 50 | Max journal entries |

---

## 💡 Pro Tips

1. **Always use `reflect_on_work`** after tasks — it's the #1 source of learning
2. **Mark lessons verified** when you confirm they work — builds confidence
3. **Review `/evolve patterns`** — manually approve pattern → skill conversion
4. **Check `/evolve snapshot`** before big tasks — see what you already know
5. **Reset with care** — `/evolve reset` archives everything before clearing

---

## 🚀 Example Workflow

```
# Do some work...
You: "Create a web scraper for Reddit"
# Agent works, uses several tools...

# After completion, agent calls:
🔧 reflect_on_work(
  task: "Create Reddit web scraper",
  result: "success",
  approach: "Used requests + BeautifulSoup + regex",
  tools_used: ["bash", "write", "read"],
  what_worked: ["requests was simpler than selenium"],
  mistakes: ["Forgetting User-Agent header", "Regex too greedy"],
  would_do_differently: "Use feedparser for RSS feeds instead"
)

# Later, you do another scraper...
# Agent notices pattern of "requests + BeautifulSoup"
# After 3rd time, suggests creating a skill
🔄 Pattern "Web scraping with requests+BS" ready for skill conversion!

# Auto-created skill at:
# ~/.rudrax/agent/skills/auto-web-scraping-with-requests-bs/SKILL.md

# You can now:
/agency activate auto-web-scraping-with-requests-bs
```

---

## 🔗 Related Systems

| System | Purpose |
|--------|---------|
| `shared-memory.ts` | Project-specific cross-agent communication |
| `vector-knowledge.ts` | Semantic search over large documents |
| `evolving-memory.ts` | **This system** — self-learning and skill evolution |

---

**Status:** ✅ Installed and ready to learn.
**Skills currently available:** 349 (ready for evolution).
**Let's get to work! 🚀**
