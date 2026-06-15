import { listMovements } from '../../utils/inventory-adapter'

// Proxy autenticado → backend GET /api/inventory/movements (E05, HU-05-01). Kardex
// filtrable por insumo. Mapea al `InventoryMovement` del frontend (date=createdAt,
// user=userId; la razón de merma se conserva en `note`).
export default defineEventHandler(async (event) => {
  const { ingredientId } = getQuery(event)
  const id = typeof ingredientId === 'string' && ingredientId ? ingredientId : undefined
  const movements = await listMovements(event, id)
  return ok(movements, { totalCount: movements.length, page: 1 })
})
