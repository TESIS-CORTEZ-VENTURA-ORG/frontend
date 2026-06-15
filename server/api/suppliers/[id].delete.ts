import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// Elimina (soft) un proveedor (HU-02-05).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  await backendFetch<Envelope<{ deleted: true }>>(event, `/api/suppliers/${id}`, { method: 'DELETE' })
  return ok(null)
})
