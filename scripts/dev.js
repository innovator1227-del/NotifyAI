import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const services = [
  {
    name: "server",
    args: ["node_modules/nodemon/bin/nodemon.js", "src/index.js"],
    directory: "server",
  },
  {
    name: "client",
    args: ["node_modules/vite/bin/vite.js"],
    directory: "client",
  },
];

let stopping = false;
const children = services.map(({ name, args, directory }) => {
  const child = spawn(process.execPath, args, {
    cwd: join(root, directory),
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`[${name}] ${error.message}`);
    process.exitCode = 1;
    stopAll("SIGTERM");
  });

  child.on("exit", (code) => {
    if (!stopping) {
      if (code !== 0) process.exitCode = code || 1;
      stopAll("SIGTERM");
    }
  });

  return child;
});

function stopAll(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill(signal);
  }
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
