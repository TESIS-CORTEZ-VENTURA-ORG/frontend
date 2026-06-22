import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
const BASE = "http://localhost:3000";
const OUT = "tests/visual/audit";
const EXEC = process.env.CHROMIUM_PATH;
if (!EXEC) throw new Error("Define CHROMIUM_PATH");
const browser = await chromium.launch({ executablePath: EXEC });
mkdirSync(OUT, { recursive: true });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/ingresar`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "maria@motif.pe");
await page.fill('input[type="password"]', "MotifDemo2026");
await page.click('button[type="submit"]');
await page.waitForURL("**/app", { timeout: 20000 });
await page.goto(`${BASE}/app/pos`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
// full pos for context
await page.screenshot({ path: `${OUT}/aside-context.png`, fullPage: false });
// clip the aside (no selection => overview + attention)
const aside = page.locator(".pos-aside");
await aside.screenshot({ path: `${OUT}/aside-current.png` });
console.log("ok aside-current");
await browser.close();
console.log("done");
