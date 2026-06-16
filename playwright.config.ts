import { defineConfig } from '@playwright/test'

/**
 * E2E de flujos (Playwright). Maneja la UI real contra el stack vivo:
 *   - Frontend Nuxt en :3000 (lo levanta este webServer, o reusa el que esté corriendo).
 *   - Backend NestJS en :3333 (DEBE estar arriba aparte: `bun run start:prod` + Docker DB).
 *
 * Aislación: cada spec registra su PROPIO tenant (email único) vía la API del backend,
 * y la RLS los separa → los specs corren en paralelo sin pisarse (ver tests/e2e/_fixtures.ts).
 * Alcance: SOLO flujos implementados; se excluye lo que depende de servicios externos/IA
 * (chat E09, forecast E08, magic-upload/ingesta, correo, SUNAT).
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/.artifacts',
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Chromium descargado (1208); sin channel para no depender de Chrome del sistema.
    browserName: 'chromium',
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'node_modules/.bin/nuxi dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
