import { z } from 'zod'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// E11 · HU-11-03/04/05 — Reporte de importación del histórico de ventas.
// Espeja `SalesImportReport` del backend (ingestion/sales-history-import.service):
// idempotente por (fecha+plato+ref); `dryRun` valida sin escribir (created=0).
interface SalesImportReport {
  total: number
  created: number
  updated: number
  failed: number
  errors: { line: number, message: string }[]
  dryRun: boolean
}

// `content`: texto crudo del CSV (cabecera + filas) que el cliente leyó del
// archivo; `dryRun`: pre-validación sin persistir (HU-11-05).
const schema = z.object({
  content: z.string().min(1),
  dryRun: z.boolean().optional(),
})

/**
 * E11 · HU-11-03/04/05 — Carga masiva del histórico de ventas: proxy autenticado
 * a `POST /api/sales-history/import` del backend NestJS. El backend parsea,
 * valida e importa (idempotente) y devuelve el reporte con la línea exacta de
 * cada error. RBAC `manage Report` (owner/manager; staff → 403, que se propaga).
 */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  const res = await backendFetch<Envelope<SalesImportReport>>(event, '/api/sales-history/import', {
    method: 'POST',
    body,
  })
  return ok(res.data)
})
