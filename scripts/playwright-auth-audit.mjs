import { chromium } from "playwright";

const [email, password, projectId] = process.argv.slice(2);

if (!email || !password || !projectId) {
  throw new Error(
    "Usage: node scripts/playwright-auth-audit.mjs <email> <password> <projectId>",
  );
}

async function login(page) {
  await page.goto("http://127.0.0.1:5173/login", { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/inbox", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.getByText("Capture launch feedback").first().waitFor({ timeout: 15000 });
}

async function auditDesktop() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  await login(page);

  const newTaskTitle = `Audit optimistic inbox task ${Date.now()}`;
  await page.getByPlaceholder("Add a task...").last().fill(newTaskTitle);
  await page.keyboard.press("Enter");
  await page.getByText(newTaskTitle).first().waitFor({ timeout: 10000 });

  await page.goto(`http://127.0.0.1:5173/project/${projectId}`, { waitUntil: "networkidle" });
  await page.getByText("Polish authenticated shell").click();
  await page.getByRole("heading", { name: "Task Details" }).waitFor({ timeout: 10000 });
  const inspector = page.locator("div.fixed").filter({ has: page.getByRole("heading", { name: "Task Details" }) }).first();

  const titleInput = inspector.locator('input[type="text"]').first();
  await titleInput.fill("Polish authenticated shell audit");
  await page.waitForTimeout(700);
  await inspector.locator("select").first().selectOption("4");
  await page.waitForTimeout(1500);

  await page.getByRole("button", { name: /Switch to dark theme/i }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));

  await page.screenshot({ path: "/tmp/kairos-audit-desktop-dark-project.png", fullPage: true });
  const summary = {
    darkClass: await page.evaluate(() => document.documentElement.classList.contains("dark")),
    hasUpdatedTitle: await page.getByText("Polish authenticated shell audit").count(),
    hasNewInboxTask: newTaskTitle,
    savedBadgeCount: await page.getByText("Saved").count(),
    savingBadgeCount: await page.getByText("Saving").count(),
    notSavedBadgeCount: await page.getByText("Not saved").count(),
  };

  if (!summary.darkClass) {
    throw new Error("Dark theme was not applied during desktop audit");
  }
  if (summary.hasUpdatedTitle < 1) {
    throw new Error("Task title update was not reflected in the UI");
  }
  if (summary.savedBadgeCount < 1) {
    throw new Error("Task inspector did not show a Saved badge");
  }
  if (summary.notSavedBadgeCount > 0) {
    throw new Error("Task inspector showed a Not saved badge during the audit");
  }

  console.log(JSON.stringify({ target: "desktop", summary }));
  await context.close();
  await browser.close();
}

async function auditMobile() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await login(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByText("New project").waitFor({ timeout: 10000 });
  await page.screenshot({ path: "/tmp/kairos-audit-mobile-nav-open.png", fullPage: true });
  await page.getByRole("button", { name: "Close navigation" }).click();
  await page.getByRole("button", { name: "Open navigation" }).waitFor({ timeout: 10000 });
  await page.screenshot({ path: "/tmp/kairos-audit-mobile-inbox.png", fullPage: true });

  console.log(JSON.stringify({ target: "mobile", summary: { navOpened: true } }));
  await context.close();
  await browser.close();
}

await auditDesktop();
await auditMobile();
