import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// Elimina una unidad de medida (HU-02-03). El backend devuelve 409 si está en uso.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  await backendFetch<Envelope<{ deleted: true }>>(event, `/api/units/${id}`, { method: 'DELETE' })
  return ok(null)
})
