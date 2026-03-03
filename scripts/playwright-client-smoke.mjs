import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);

const baseUrl = process.env.KAIROS_CLIENT_BASE_URL ?? "http://127.0.0.1:5175";

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
  await page.getByText("Capture launch feedback").first().waitFor({ timeout: 15000 });
}

async function main() {
  let user = null;

  try {
    user = await runJsonScript("scripts/create-ui-pass-user.mjs");
    await runJsonScript("scripts/seed-ui-pass-workspace.mjs", [user.email, user.password]);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

    await login(page, user.email, user.password);

    const beforeDarkMode = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    await page.getByRole("button", { name: "Open workspace menu" }).click();
    await page
      .locator("button")
      .filter({ hasText: /Switch to (dark|light)/i })
      .first()
      .click();
    await page.waitForFunction(
      (previous) => document.documentElement.classList.contains("dark") !== previous,
      beforeDarkMode,
    );

    await page.getByRole("button", { name: "Open workspace menu" }).click();
    await page.locator("button").filter({ hasText: "MCP API key..." }).first().click();
    await page.getByRole("heading", { name: "MCP API key" }).waitFor({ timeout: 10000 });
    await page.getByText("Current key", { exact: true }).waitFor({ timeout: 10000 });
    await page.keyboard.press("Escape");

    const newTaskTitle = `Smoke inbox task ${Date.now()}`;
    await page.getByPlaceholder("Add a task...").first().fill(newTaskTitle);
    await page.keyboard.press("Enter");
    await page.getByText(newTaskTitle).first().waitFor({ timeout: 10000 });

    await page.getByText("Capture launch feedback").first().click();
    await page.getByRole("heading", { name: "Task Details" }).waitFor({ timeout: 10000 });
    const detailPanel = page
      .locator("div.fixed")
      .filter({ has: page.getByRole("heading", { name: "Task Details" }) })
      .first();

    const nextTitle = `Capture launch feedback smoke ${Date.now()}`;
    const titleInput = detailPanel.locator('input[type="text"]').first();
    await titleInput.fill(nextTitle);
    await detailPanel.getByText("Description").click();
    await detailPanel.locator("textarea").fill("Smoke test updated description");
    await detailPanel.getByText("Priority").click();
    await page.waitForTimeout(800);
    await detailPanel.getByText("Saved").waitFor({ timeout: 10000 });
    await titleInput.waitFor({ timeout: 10000 });
    const savedTitle = await titleInput.inputValue();
    if (savedTitle !== nextTitle) {
      throw new Error(`Expected saved title to be "${nextTitle}" but received "${savedTitle}"`);
    }

    console.log(
      JSON.stringify({
        ok: true,
        baseUrl,
        createdTaskTitle: newTaskTitle,
        updatedTaskTitle: nextTitle,
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
