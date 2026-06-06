const { spawn } = require("node:child_process");

const children = [];

function run(name, command, args, env = {}) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (!signal && code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code);
    }
  });
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("backend", "npm", ["--prefix", "nextstop-backend", "start"], {
  PORT: process.env.PORT || "5001",
});

run("frontend", "next", ["dev", "--webpack"]);
