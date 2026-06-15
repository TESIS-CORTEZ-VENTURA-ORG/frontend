import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }
export interface SupplierView {
  id: string
  ruc: string
  name: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  paymentTerms: string | null
  leadTimeDays: number | null
  active: boolean
}

// Proxy autenticado → backend GET /api/suppliers (HU-02-05).
export default defineEventHandler(async (event) => {
  const res = await backendFetch<Envelope<SupplierView[]>>(event, '/api/suppliers')
  return ok(res.data, { totalCount: res.data.length, page: 1 })
})
