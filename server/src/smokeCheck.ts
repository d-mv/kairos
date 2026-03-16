import { URL } from "node:url";

async function main() {
  const baseUrl = process.env["SERVER_URL"] ?? "http://127.0.0.1:3000";
  const endpoints = ["/health", "/api/v1/projects", "/api/v1/tasks"];
  const timeout = Number(process.env["SMOKE_TIMEOUT_MS"] ?? 5000);
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    await Promise.all(
      endpoints.map(async (path) => {
        const url = new URL(path, baseUrl);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`${url} returned ${response.status}`);
        }
      }),
    );
  } finally {
    clearTimeout(timer);
  }
}

main()
  .then(() => {
    console.log("Smoke check passed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Smoke check failed:", err);
    process.exit(1);
  });
