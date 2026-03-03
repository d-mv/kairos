import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function prefixOutput(stream, prefix) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    const lines = chunk.split("\n").filter(Boolean);
    for (const line of lines) {
      console.log(`[${prefix}] ${line}`);
    }
  });
}

function startServer(name, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  prefixOutput(child.stdout, name);
  prefixOutput(child.stderr, name);

  return child;
}

async function waitForUrl(url, label, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${label} at ${url}`);
}

async function runJsonScript(script, args = []) {
  const { stdout } = await execFileAsync("node", [script, ...args], {
    cwd: process.cwd(),
    env: process.env,
  });

  const line = stdout
    .trim()
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .at(-1);

  if (!line) {
    throw new Error(`${script} produced no output`);
  }

  return JSON.parse(line);
}

async function main() {
  let user = null;
  const processes = [];

  try {
    const server = startServer("server", "pnpm", ["--filter", "@kairos/server", "dev"]);
    const client = startServer("client", "pnpm", [
      "--filter",
      "@kairos/client",
      "dev",
      "--host",
      "127.0.0.1",
    ]);
    processes.push(client, server);

    await waitForUrl("http://127.0.0.1:3000/health", "API server");
    await waitForUrl("http://127.0.0.1:5173/", "client dev server");

    user = await runJsonScript("scripts/create-ui-pass-user.mjs");
    const seed = await runJsonScript("scripts/seed-ui-pass-workspace.mjs", [
      user.email,
      user.password,
    ]);

    await execFileAsync(
      "node",
      ["scripts/playwright-auth-audit.mjs", user.email, user.password, seed.projectId],
      {
        cwd: process.cwd(),
        env: process.env,
        maxBuffer: 1024 * 1024,
      },
    );

    console.log(
      JSON.stringify({
        ok: true,
        projectId: seed.projectId,
        screenshots: [
          "/tmp/kairos-audit-desktop-dark-project.png",
          "/tmp/kairos-audit-mobile-nav-open.png",
          "/tmp/kairos-audit-mobile-inbox.png",
        ],
      }),
    );
  } finally {
    if (user?.userId) {
      try {
        await runJsonScript("scripts/delete-ui-pass-user.mjs", [user.userId]);
      } catch (error) {
        console.error("[cleanup] failed to delete temp user", error);
      }
    }

    for (const child of processes.reverse()) {
      if (!child.killed) {
        child.kill("SIGINT");
      }
    }

    await Promise.all(
      processes.map(
        (child) =>
          new Promise((resolve) => {
            child.once("exit", () => resolve(null));
          }),
      ),
    );
  }
}

await main();
