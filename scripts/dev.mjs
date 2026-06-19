#!/usr/bin/env node
/**
 * Reliable local dev — clears stale Next.js cache before each start so
 * hot reload does not leave broken chunk references (500 / blank page).
 */
import { spawn } from "node:child_process";
import { cleanDevCaches, killDevServers } from "./next-helpers.mjs";

const root = process.cwd();
const useTurbo = process.argv.includes("--turbopack");

function log(message) {
  process.stdout.write(`${message}\n`);
}

killDevServers();
cleanDevCaches(root);

log("[dev] Starting with a fresh cache (webpack — stable hot reload)…");

const nextArgs = ["next", "dev"];
if (useTurbo) {
  nextArgs.push("--turbopack");
  log("[dev] Turbopack enabled — use `npm run dev` without turbo if issues return.");
}

const child = spawn("npx", nextArgs, {
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
  console.error("[dev] Failed to start Next.js:", error);
  process.exit(1);
});
