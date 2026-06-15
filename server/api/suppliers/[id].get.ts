import { backendFetch } from '../../utils/backend'
import type { SupplierView } from './index.get'

interface Envelope<T> { success: boolean, data: T }

// Proxy autenticado → backend GET /api/suppliers/:id (HU-02-05).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const res = await backendFetch<Envelope<SupplierView>>(event, `/api/suppliers/${id}`)
  return ok(res.data)
})
