import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    typecheck: {
      include: ["tests/types/**/*.ts"],
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/reflect.ts",
        "src/**/index.ts",
        "src/utils/**",
        "src/decorators/**",
        "src/metadata/**",
        "src/binding/provider.ts",
        "src/binding/register-options.ts",
        "src/context/resolution-context.ts",
        "src/binding/binding.ts",
      ],
      thresholds: {
        branches: 60,
        functions: 45,
        lines: 40,
        statements: 40,
      },
    },
  },
});
