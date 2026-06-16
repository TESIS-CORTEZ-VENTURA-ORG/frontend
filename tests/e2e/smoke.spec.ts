import { test, expect, registerTenant, loginUI, seedUser } from './_fixtures'

// Verifica el harness completo contra el stack vivo: registro (API) + login (UI) +
// aislación por tenant + seed de usuario staff (DB). Si esto pasa, los demás specs
// pueden apoyarse en las fixtures.
test.describe('smoke E2E (harness)', () => {
  test('registro + login por la UI llega a /app', async ({ page, request }) => {
    const t = await registerTenant(request)
    await loginUI(page, t.email, t.password)
    await expect(page).toHaveURL(/\/app(\/|$)/)
  })

  test('fixture owner deja la app autenticada', async ({ owner }) => {
    await expect(owner.page).toHaveURL(/\/app(\/|$)/)
    await expect(owner.page.locator('body')).toBeVisible()
  })

  test('seedUser(staff) permite login por la UI', async ({ page, request }) => {
    const t = await registerTenant(request)
    const staff = seedUser(t.tenantId, 'staff')
    await loginUI(page, staff.email, staff.password)
    await expect(page).toHaveURL(/\/app(\/|$)/)
  })
})
