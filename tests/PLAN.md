# RudraX Testing Plan & Strategy

## 🎯 Testing Philosophy

RudraX is a complex multi-agent orchestration framework. Our testing strategy prioritizes:

1. **Correctness** — Core logic works as expected under all conditions
2. **Stability** — No regressions across releases (v4.5.0+)
3. **Isolation** — Tests run without external dependencies (no API keys, no network)
4. **Coverage** — Start with critical paths, expand iteratively

## 🧪 Test Framework

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Runner** | [Vitest](https://vitest.dev/) v3+ | Fast, ESM-native, Jest-compatible API, built-in coverage |
| **Environment** | Node (no jsdom) | All modules are Node.js native — no DOM needed |
| **Coverage** | v8 provider | Built-in, fast, accurate line/branch/function coverage |
| **Assertions** | Vitest built-in | `expect`, `vi.mock`, `vi.spyOn` — no extra deps |

## 📁 Directory Structure

```
tests/
├── PLAN.md                           # This file — strategy & conventions
├── helpers.js                        # Shared test utilities (temp dirs, mock configs)
├── smoke.test.js                     # Smoke tests — verify lib/index.js exports
├── unit/                             # Unit tests — one file per source module
│   ├── event-bus.test.js
│   ├── source-info.test.js
│   ├── output-guard.test.js
│   ├── resolve-config-value.test.js
│   ├── frontmatter.test.js
│   └── ...                           # Add as coverage expands
├── integration/                      # Integration tests — module interactions
│   └── ...                           # Future: config + session interaction
└── e2e/                              # End-to-end tests — full pipeline
    └── ...                           # Future: CLI mode, RPC mode
```

## 🏗️ Module Priority Matrix

Modules are prioritized by **impact × risk**:

| Tier | Module | Priority | Test Type | Notes |
|------|--------|----------|-----------|-------|
| P0 | `lib/core/config.js` | 🚨 Critical | Unit+Smoke | Config drives everything |
| P0 | `lib/core/session-manager.js` | 🚨 Critical | Unit | Session integrity = data safety |
| P0 | `lib/core/model-registry.js` | 🚨 Critical | Unit | Model resolution accuracy |
| P0 | `lib/core/tools/` (all 14 tools) | 🚨 Critical | Unit | Tool correctness = agent reliability |
| P1 | `lib/core/event-bus.js` | ✅ Done | Unit | ✅ 7 tests covering emit/on/clear/errors |
| P1 | `lib/core/source-info.js` | ✅ Done | Unit | ✅ 3 tests |
| P1 | `lib/core/output-guard.js` | ✅ Done | Unit | ✅ 6 tests covering takeover/restore |
| P1 | `lib/core/resolve-config-value.js` | ✅ Done | Unit | ✅ 7 tests covering env/shell/caching |
| P2 | `lib/core/bash-executor.js` | 📋 Next | Unit+Mock | Requires stdout mock |
| P2 | `lib/core/auth-storage.js` | 📋 Next | Unit+Mock | File I/O, encrypt |
| P2 | `lib/utils/frontmatter.js` | 📋 Next | Unit | Pure functions |
| P2 | `lib/cli/args.js` | 📋 Next | Unit | CLI argument parsing |
| P3 | `lib/core/sdk.js` | 🔜 Later | Unit+Integration | Programmatic API |
| P3 | `lib/core/agent-session.js` | 🔜 Later | Unit | Complex state machine |
| P3 | `lib/modes/` | 🔜 Later | Unit | Mode selection/routing |
| P4 | `lib/core/extensions/` | 🔜 Later | Unit | Extension loader/runner |
| P4 | `lib/ui/` components | 🔜 Later | Smoke | UI rendering (limited Node testing) |
| P4 | `webui/` | 🔜 Later | E2E | Browser-based testing |

## 📐 Test Conventions

### File Naming
```
tests/unit/<module-name>.test.js     # Unit tests
tests/integration/<feature>.test.js  # Integration tests
tests/e2e/<flow>.test.js             # End-to-end tests
tests/smoke.test.js                  # Single smoke test file
```

### Naming
- **Test suites**: `describe("ModuleName", ...)` — PascalCase for module
- **Test cases**: `it("should do X when Y", ...)` — descriptive English
- **Edge cases**: Use `it("should handle empty X", ...)`, `it("should handle error when Y", ...)`

### Standards
- **Isolation**: Each test file cleans up after itself
- **No network**: Tests must not call external APIs (mock instead)
- **No filesystem**: Use `createTempDir()` from helpers for temp files
- **Deterministic**: No random data that makes tests flaky
- **Fast**: Individual tests should complete in <100ms

## 📊 Coverage Targets

| Metric | Current | Target (v4.5) | Target (v4.6) |
|--------|---------|---------------|---------------|
| Statements | ~2% | 15% | 40% |
| Branches | ~1% | 10% | 30% |
| Functions | ~3% | 20% | 45% |
| Lines | ~2% | 15% | 40% |

## 🚀 CI Integration

Tests run via:
```bash
npm test            # Full suite
npm run test:unit   # Unit tests only
npm run test:smoke  # Fast smoke tests
npm run test:coverage  # With coverage report
```

## 📝 Running Tests

```bash
# Quick smoke test
npm run test:smoke

# Full test suite
npm test

# Watch mode during development
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npx vitest run tests/unit/event-bus.test.js
```

## 🔮 Roadmap

### v4.5.0 (Current)
- ✅ Vitest test infrastructure
- ✅ Smoke tests for lib/index.js exports
- ✅ Unit tests: event-bus, source-info, output-guard, resolve-config-value
- 📋 Testing strategy documented (this file)

### v4.5.1
- [ ] Unit tests: bash-executor, auth-storage, frontmatter
- [ ] Unit tests: cli/args, cli/config-selector
- [ ] Integration tests: session-manager + auth-storage interaction

### v4.6.0
- [ ] Full unit test coverage for all lib/core modules
- [ ] Integration tests for tool orchestration
- [ ] E2E tests for CLI modes (print, interactive, RPC)
- [ ] CI pipeline integration
- [ ] Regression test suite for API stability
