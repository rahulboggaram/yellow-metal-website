#!/usr/bin/env node
/**
 * Production build — stops the dev server first because both share `.next`.
 * Running `next build` while `next dev` is active corrupts dev chunks and
 * causes "__webpack_modules__[moduleId] is not a function" at runtime.
 */
import { spawn } from "node:child_process";
import { killDevServers } from "./next-helpers.mjs";

const root = process.cwd();

killDevServers();
process.stdout.write(
  "[build] Stopped dev server (if running). Dev and build cannot run together.\n",
);

const child = spawn("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("[build] Failed to start Next.js build:", error);
  process.exit(1);
});
