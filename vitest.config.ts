import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "client"),
  test: {
    include: ["../shared/**/*.test.ts", "../server/**/*.test.ts"],
  },
});
