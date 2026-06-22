import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const OUT = "tests/visual/audit";
const EXEC = process.env.CHROMIUM_PATH;
if (!EXEC) throw new Error("Define CHROMIUM_PATH");

const browser = await chromium.launch({ executablePath: EXEC });
mkdirSync(OUT, { recursive: true });

async function login(ctx) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ingresar`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "maria@motif.pe");
  await page.fill('input[type="password"]', "MotifDemo2026");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/app", { timeout: 20000 });
  return page;
}

// Desktop 1440
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 2200 } });
  const page = await login(ctx);
  await page.goto(`${BASE}/app/pos`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/pos-desktop.png`, fullPage: false });
  console.log("ok pos-desktop");
  // Select a table to show aside detail (click first occupied/bill card)
  const cards = page.locator(".table-card");
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    const cls = await cards.nth(i).getAttribute("class");
    if (cls && (cls.includes("cobrar") || cls.includes("demorada") || cls.includes("ocupada"))) {
      await cards.nth(i).click();
      break;
    }
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/pos-desktop-selected.png`, fullPage: false });
  console.log("ok pos-desktop-selected");
  await ctx.close();
}

// Mobile 390x844
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await login(ctx);
  await page.goto(`${BASE}/app/pos`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/pos-mobile.png`, fullPage: false });
  console.log("ok pos-mobile");
  // Rapido tab
  await page.locator(".pos-tab", { hasText: "Rápido" }).click().catch(()=>{});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/pos-mobile-rapido.png`, fullPage: false });
  console.log("ok pos-mobile-rapido");
  // Caja tab
  await page.locator(".pos-tab", { hasText: "Caja" }).click().catch(()=>{});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/pos-mobile-caja.png`, fullPage: false });
  console.log("ok pos-mobile-caja");
  await ctx.close();
}

await browser.close();
console.log("done");
