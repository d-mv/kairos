import { chromium } from "playwright";

const targets = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 1100 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    screenshot: "/tmp/kairos-login-desktop.png",
  },
  {
    name: "mobile",
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    hasTouch: true,
    screenshot: "/tmp/kairos-login-mobile.png",
  },
];

const browser = await chromium.launch({ headless: true });

for (const target of targets) {
  const context = await browser.newContext({
    viewport: target.viewport,
    userAgent: target.userAgent,
    isMobile: target.isMobile ?? false,
    hasTouch: target.hasTouch ?? false,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await page.screenshot({ path: target.screenshot, fullPage: true });

  const summary = {
    title: await page.title(),
    headingTexts: await page.locator("h1, h2").allTextContents(),
    buttonTexts: await page.locator("button").allTextContents(),
    bodyClass: await page.locator("body").getAttribute("class"),
  };
  console.log(JSON.stringify({ target: target.name, summary }, null, 2));
  await context.close();
}

await browser.close();
