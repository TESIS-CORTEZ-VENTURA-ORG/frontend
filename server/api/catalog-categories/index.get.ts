import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }
export interface CategoryView {
  id: string
  name: string
  parentId: string | null
}

// Proxy autenticado → backend GET /api/categories (HU-02-04). Lista plana;
// la jerarquía se arma en el cliente con `parentId`.
export default defineEventHandler(async (event) => {
  const res = await backendFetch<Envelope<CategoryView[]>>(event, '/api/categories')
  return ok(res.data, { totalCount: res.data.length, page: 1 })
})
