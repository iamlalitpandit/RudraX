import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ESM support
    globals: false,
    environment: "node",
    
    // Test file patterns
    include: ["tests/**/*.test.js", "tests/**/*.spec.js"],
    exclude: ["node_modules", "lib"],
    
    // Coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["lib/**/*.js"],
      exclude: [
        "node_modules",
        "lib/**/*.d.ts",
        "lib/**/*.js.map",
      ],
      thresholds: {
        statements: 10,
        branches: 5,
        functions: 10,
        lines: 10,
      },
    },

    // Timeout for CI
    testTimeout: 10000,
    hookTimeout: 10000,

    // Retry flaky tests
    retry: 0,

    // Verbose output
    verbose: true,
  },
});
