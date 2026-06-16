import type { CashClose } from '#shared/types/domain'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// HU-04-08 · Historial de cierres Z (desc por closedAt). Proxy autenticado.
export default defineEventHandler(async (event) => {
  const res = await backendFetch<Envelope<CashClose[]>>(event, '/api/cash-close')
  return ok(res.data, { totalCount: res.data.length, page: 1 })
})
