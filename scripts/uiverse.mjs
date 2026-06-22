/**
 * Lee uiverse.io con un Chrome headless real (evita el 403 anti-bot del fetch simple).
 * Sirve para INSPIRARSE: extrae el HTML/CSS de un componente + screenshot, o navega
 * una categoría/búsqueda y lista los componentes con su link.
 *
 * Uso:
 *   CHROME="<ruta chrome.exe>" node scripts/uiverse.mjs <url>
 *     - url de componente  → vuelca HTML+CSS + tests/visual/audit/uiverse-pick.png
 *     - url de categoría/galería (ej. https://uiverse.io/cards) → screenshot + lista de links
 *
 * NOTA DE USO: el código de uiverse es open-source (MIT) pensado para reutilizar, PERO
 * no se pega crudo: se extrae la TÉCNICA y se re-skinnea a los tokens de GastronomIA
 * (--terracotta/--crema/--espresso…, spacing 8pt, nuestros radios) para mantener coherencia.
 */
import { chromium } from "playwright-core";

const arg = process.argv[2];
const CHROME = process.env.CHROME;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

if (!CHROME || !arg) {
  console.error("Falta CHROME=<ruta chrome.exe> o el arg <url>");
  process.exit(1);
}

const b = await chromium.launch({
  executablePath: CHROME,
  args: ["--no-sandbox"],
});
const ctx = await b.newContext({
  userAgent: UA,
  viewport: { width: 1440, height: 1000 },
});
const p = await ctx.newPage();

await p.goto(arg, { waitUntil: "domcontentloaded", timeout: 35000 });
await p.waitForTimeout(3500);

console.log("URL:", arg, "\nTITLE:", await p.title());

// Código del componente (si es una página de componente)
const code = await p.evaluate(() =>
  Array.from(document.querySelectorAll("pre, code, textarea"))
    .map((e) => e.innerText || e.value || "")
    .filter(
      (t) => t && t.length > 20 && !/Permission is hereby granted/i.test(t),
    ),
);
if (code.length) {
  console.log("\n===== CÓDIGO =====");
  code.forEach((c, i) => console.log(`\n--- bloque ${i} ---\n${c}`));
}

// Links a componentes (si es galería/categoría/búsqueda)
const links = await p.evaluate(() =>
  [
    ...new Set(
      Array.from(document.querySelectorAll("a[href]"))
        .map((a) => a.getAttribute("href"))
        .filter(
          (h) =>
            /^\/[^/]+\/[^/]+$/.test(h) &&
            !/^\/(elements|challenges|blog|design|pricing|login|signup|cards|buttons|loaders|inputs|forms|tooltips)/.test(
              h,
            ),
        ),
    ),
  ].slice(0, 12),
);
if (links.length) {
  console.log("\n===== COMPONENTES (link) =====");
  links.forEach((l) => console.log("https://uiverse.io" + l));
}

await p.screenshot({
  path: "tests/visual/audit/uiverse-pick.png",
  fullPage: false,
});
console.log("\nScreenshot → tests/visual/audit/uiverse-pick.png");
await b.close();
