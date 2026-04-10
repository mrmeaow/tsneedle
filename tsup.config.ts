import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/reflect.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  target: ["node18"],
  platform: "neutral",
  minify: false,
  sourcemap: true,
});
