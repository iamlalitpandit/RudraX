# 🤝 Contributing to RudraX Army

First off, thank you for considering contributing to RudraX! 🎉

## 🌟 Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🐛 How to Report a Bug

1. **Search existing issues** — Check if the bug has already been reported
2. **Create a bug report** — Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
3. **Include**:
   - Clear title and description
   - Steps to reproduce (with code if possible)
   - Expected vs actual behavior
   - Environment: OS, Node version, RudraX version
   - Screenshots or logs (if applicable)

---

## 💡 How to Request a Feature

1. **Check existing discussions** — Search issues and [Discussions](https://github.com/iamlalitpandit/RudraX/discussions)
2. **Create a feature request** — Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)
3. **Include**:
   - Problem statement and use case
   - Proposed solution
   - Alternatives considered
   - Example usage (if possible)

---

## 🔧 Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup
```bash
# Fork and clone
git clone https://github.com/your-username/RudraX.git
cd RudraX

# Set up remote
git remote add upstream https://github.com/iamlalitpandit/RudraX.git

# Install dependencies
npm install

# Verify setup
npm test
```

### Development Workflow
```bash
# Create a branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of your change"

# Keep up to date
git fetch upstream
git rebase upstream/main

# Push and create PR
git push origin feature/your-feature-name
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run linting
npm run lint

# Build
npm run build
```

---

## 📝 Pull Request Guidelines

1. **PRs should be focused** — One feature/fix per PR
2. **Use conventional commits** — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
3. **Write clear descriptions** — What and why, not just how
4. **Add tests** — For new features and bug fixes
5. **Keep it small** — Under 400 lines preferred. Large changes → discuss first
6. **Pass CI** — All checks must pass before merge
7. **Reference issues** — `Closes #123` or `Related to #456`

### PR Title Format
```
feat: add web-search agent capability
fix: resolve approval-gate timeout race condition
docs: update README with new agent categories
refactor: simplify DAG workflow engine
test: add coverage for communication bus
```

---

## 📂 Code Organization

```
RudraX/
├── bin/              # CLI entry points
├── lib/              # Core engine (agent session, tools, CLI modes)
├── tools/            # Agent tools & extensions
│   ├── agency/       # Agent capabilities + 179 skill files
│   └── integrated/   # Integrated tool suite
├── webui/            # Web interface (Express + Socket.IO)
├── docs/             # Documentation (16+ markdown files)
├── docker/           # Docker deployment configs
├── deploy/           # systemd + PM2 deployment
└── cybersecurity-dashboard/  # Live threat monitoring
```

---

## 🏗️ Architecture Overview

```
User 🔱
  │
  ▼
Chief of Staff ─── Strategic Commander
  │
  ▼
Deputy Chief of Staff ─── Operational Commander
  │
  ├── Squad A (pre-configured multi-agent team)
  ├── Squad B
  └── Agent N (specialist)
```

Each agent has access to 15 advanced capabilities (vector knowledge, approval gates, reflection engine, etc.). When contributing, consider how your change affects this hierarchy.

---

## 📋 Development Tips

- **Use `npm run webui:dev`** for hot-reload development
- **Check `docs/`** for understanding components (tui.md, extensions.md, themes.md)
- **Run linter before committing**: `npm run lint`
- **New capabilities** go in `tools/agency/` as separate TypeScript modules
- **New tools** go in `tools/integrated/`
- **WebUI changes** in `webui/` (server.js, index.html, js/, css/)

---

## ❓ Questions?

- Open a [Discussion](https://github.com/iamlalitpandit/RudraX/discussions)
- Telegram: [@imlalitpandit](https://t.me/imlalitpandit)
- Email: lalittheonly@gmail.com

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.
