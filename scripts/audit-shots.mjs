/**
 * Auditoría visual anti-"look de IA" — captura las vistas clave en desktop
 * (1440×900). Robusto: cada shot en try/catch, públicas primero (sin sesión),
 * luego login demo y vistas de app. Una falla no aborta el resto.
 *
 * Uso: CHROMIUM_PATH=... node scripts/audit-shots.mjs   (dev server en :3000)
 * Salida: tests/visual/audit/*.png
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "tests/visual/audit";
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "maria@motif.pe";
const DEMO_PASSWORD = process.env.NUXT_DEMO_PASSWORD ?? "MotifDemo2026";
const EXEC = process.env.CHROMIUM_PATH;
if (!EXEC) throw new Error("Define CHROMIUM_PATH");

const PUBLIC = [
  ["landing", "/"],
  ["login", "/ingresar"],
];
const APP = [
  ["dashboard", "/app"],
  ["pos-mesas", "/app/pos"],
  ["reportes", "/app/reportes"],
  ["recetas", "/app/recetas"],
  ["inventario", "/app/inventario"],
  ["chat", "/app/chat"],
  ["costeo", "/app/costeo"],
];

const hideDevtools = `
  const css = '#nuxt-devtools-container{display:none!important}'
  const add = () => { const s=document.createElement('style'); s.textContent=css; document.head?.appendChild(s) }
  if (document.head) add(); document.addEventListener('DOMContentLoaded', add)
`;

async function snap(page, name) {
  try {
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log(`  ok ${name}`);
  } catch (e) {
    console.log(`  FAIL ${name}: ${e.message}`);
  }
}

const browser = await chromium.launch({ executablePath: EXEC });
mkdirSync(OUT, { recursive: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 2200 },
});
await ctx.addInitScript(hideDevtools);
const page = await ctx.newPage();

console.log("— Públicas (sin sesión)");
for (const [name, route] of PUBLIC) {
  await page
    .goto(`${BASE}${route}`, { waitUntil: "networkidle" })
    .catch(() => {});
  await snap(page, name);
}

console.log("— Login demo");
let loggedIn = false;
try {
  await page.goto(`${BASE}/ingresar`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/app", { timeout: 15000 });
  loggedIn = true;
  console.log("  login OK");
} catch (e) {
  console.log(`  login FAIL: ${e.message} — se omiten vistas de app`);
}

if (loggedIn) {
  console.log("— App (sesión demo)");
  for (const [name, route] of APP) {
    await page
      .goto(`${BASE}${route}`, { waitUntil: "networkidle" })
      .catch(() => {});
    await snap(page, name);
  }
}

await browser.close();
console.log(`\nListo → ${OUT}/  (loggedIn=${loggedIn})`);
