import { chromium } from "playwright";

const [email, password, areaId, projectId] = process.argv.slice(2);

if (!email || !password || !areaId || !projectId) {
  throw new Error(
    "Usage: node scripts/playwright-auth-pass.mjs <email> <password> <areaId> <projectId>",
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

const targets = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 1100 },
    isMobile: false,
    hasTouch: false,
  },
  {
    name: "mobile",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
];

const browser = await chromium.launch({ headless: true });

for (const target of targets) {
  const context = await browser.newContext({
    viewport: target.viewport,
    isMobile: target.isMobile,
    hasTouch: target.hasTouch,
  });
  const page = await context.newPage();

  await login(page);
  await page.screenshot({ path: `/tmp/kairos-${target.name}-inbox.png`, fullPage: true });

  await page.goto(`http://127.0.0.1:5173/area/${areaId}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Product" }).waitFor({ timeout: 15000 });
  await page.screenshot({ path: `/tmp/kairos-${target.name}-area.png`, fullPage: true });

  await page.goto(`http://127.0.0.1:5173/project/${projectId}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Design system" }).waitFor({ timeout: 15000 });
  await page.getByText("Polish authenticated shell").first().waitFor({ timeout: 15000 });
  await page.screenshot({ path: `/tmp/kairos-${target.name}-project.png`, fullPage: true });

  console.log(JSON.stringify({ target: target.name, finalUrl: page.url() }));
  await context.close();
}

await browser.close();
