import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// Elimina una categoría de insumo (HU-02-04). El backend devuelve 409
// ('No se puede eliminar: tiene subcategorías') si tiene hijos → se muestra como toast.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  await backendFetch<Envelope<{ deleted: true }>>(event, `/api/categories/${id}`, { method: 'DELETE' })
  return ok(null)
})
