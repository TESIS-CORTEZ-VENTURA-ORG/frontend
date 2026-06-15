import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }
export interface UnitView {
  id: string
  code: string
  name: string
  family: 'mass' | 'volume' | 'count'
  factorToBase: number
}

// Proxy autenticado → backend GET /api/units (HU-02-03). El backend devuelve un
// shape ya frontend-friendly; el BFF solo reenvía con el Bearer de la sesión.
export default defineEventHandler(async (event) => {
  const res = await backendFetch<Envelope<UnitView[]>>(event, '/api/units')
  return ok(res.data, { totalCount: res.data.length, page: 1 })
})
