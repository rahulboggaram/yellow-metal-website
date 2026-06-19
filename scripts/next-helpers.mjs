import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

export function killDevServers() {
  if (process.platform === "win32") return;

  for (const port of ["3000", "3001"]) {
    try {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, {
        stdio: "ignore",
      });
    } catch {
      // Nothing listening on this port.
    }
  }
}

export function cleanDevCaches(root = process.cwd()) {
  const targets = [
    join(root, ".next"),
    join(root, "node_modules", ".cache"),
  ];

  for (const target of targets) {
    if (!existsSync(target)) continue;
    try {
      rmSync(target, { recursive: true, force: true });
    } catch {
      try {
        execSync(`chmod -R u+w ${JSON.stringify(target)} 2>/dev/null`, {
          stdio: "ignore",
        });
        rmSync(target, { recursive: true, force: true });
      } catch {
        process.stdout.write(`[dev] Warning: could not remove ${target}\n`);
      }
    }
  }
}
