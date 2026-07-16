/**
 * RudraX Test Helpers
 * 
 * Shared utilities and fixtures for testing RudraX modules.
 */

import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

/**
 * Create a temporary directory for test isolation.
 * Automatically cleaned up on test teardown.
 */
export function createTempDir() {
  const tmp = mkdtempSync(join(tmpdir(), "rudrax-test-"));
  return {
    path: tmp,
    cleanup: () => {
      try { rmSync(tmp, { recursive: true, force: true }); }
      catch { /* best-effort cleanup */ }
    },
  };
}

/**
 * Create a mock config object with defaults for testing.
 * Override any property with the overrides parameter.
 */
export function createMockConfig(overrides = {}) {
  return {
    agentDir: "/tmp/.rudrax-test",
    version: "4.6.0-test",
    ...overrides,
  };
}

/**
 * Wait for a condition to be true, with a timeout.
 * Useful for async operations in tests.
 */
export async function waitFor(
  conditionFn,
  { timeout = 2000, interval = 50 } = {}
) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = conditionFn();
    if (result) return result;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Timeout after ${timeout}ms waiting for condition`);
}

/**
 * Create a mock event bus for testing event-driven modules.
 */
export function createMockEventBus() {
  const handlers = new Map();
  return {
    on: (event, handler) => {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event).push(handler);
    },
    emit: (event, ...args) => {
      const eventHandlers = handlers.get(event) || [];
      eventHandlers.forEach((h) => h(...args));
    },
    off: (event, handler) => {
      const eventHandlers = handlers.get(event) || [];
      const idx = eventHandlers.indexOf(handler);
      if (idx >= 0) eventHandlers.splice(idx, 1);
    },
    clear: () => handlers.clear(),
  };
}
