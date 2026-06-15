import { alertsAsShopping } from '../../utils/inventory-adapter'

// Lista de Compras (E05). El backend NO persiste una lista de compras (es una
// conveniencia del frontend) → se **siembra desde las alertas de stock bajo**
// (GET /api/inventory/alerts). Cada ítem queda identificado por su `ingredientId`.
// El estado "marcado" y los ítems agregados a mano viven en el cliente
// (composable `useShoppingList` con overlay reactivo); registrar las compras crea
// movimientos `purchase` reales. Ver frontend_context.md §11c.
export default defineEventHandler(async (event) => {
  const items = await alertsAsShopping(event)
  return ok(items, { totalCount: items.length, page: 1 })
})
