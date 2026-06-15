import { getTableDetail } from '../../utils/pos-adapter'

// Proxy autenticado → backend E03 (GET /api/tables/:id → {table, order}).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const detail = await getTableDetail(event, id)
  return ok(detail)
})
