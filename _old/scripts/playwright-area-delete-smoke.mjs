import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);

const baseUrl = process.env.KAIROS_CLIENT_BASE_URL ?? "http://localhost:4173";

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

async function login(page, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/inbox", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

async function main() {
  let user = null;

  try {
    user = await runJsonScript("scripts/create-ui-pass-user.mjs");
    const seed = await runJsonScript("scripts/seed-ui-pass-workspace.mjs", [
      user.email,
      user.password,
    ]);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

    await login(page, user.email, user.password);
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.goto(`${baseUrl}/area/${seed.areaId}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Product" }).waitFor({ timeout: 10000 });
    await page.getByText("Draft area onboarding").first().waitFor({ timeout: 10000 });
    await page.getByText("Design system").first().waitFor({ timeout: 10000 });

    await page.getByRole("button", { name: "Delete area" }).click();
    await page.waitForURL("**/inbox", { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    await page.getByText("Draft area onboarding").first().waitFor({ timeout: 10000 });
    await page.locator(`a[href="/project/${seed.projectId}"]`).first().waitFor({ timeout: 10000 });

    console.log(
      JSON.stringify({
        ok: true,
        baseUrl,
        deletedAreaId: seed.areaId,
        projectId: seed.projectId,
        areaTaskId: seed.areaTaskId,
      }),
    );

    await browser.close();
  } finally {
    if (user?.userId) {
      await runJsonScript("scripts/delete-ui-pass-user.mjs", [user.userId]);
    }
  }
}

await main();
