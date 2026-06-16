import type { ApiResponse } from '#shared/types/api'

/**
 * E11 · HU-11-03/04/05 — Importación del histórico de ventas (CSV) para alimentar
 * el forecast desde el día 1 (cold-start). El BFF (`server/api/sales-history/
 * import.post.ts`) proxea `POST /api/sales-history/import` del backend NestJS, que
 * parsea/valida/importa de forma **idempotente** (por fecha+plato+ref) y devuelve
 * el reporte con la línea exacta de cada error. `dryRun=true` ejecuta solo la
 * pre-validación (HU-11-05) sin escribir (`created=0`). RBAC `manage Report`
 * (owner/manager; staff → 403).
 */

export interface SalesImportReport {
  total: number
  created: number
  updated: number
  failed: number
  errors: { line: number, message: string }[]
  dryRun: boolean
}

export function useImportSalesHistory() {
  return useMutation({
    mutation: ({ content, dryRun }: { content: string, dryRun?: boolean }) =>
      $fetch<ApiResponse<SalesImportReport>>('/api/sales-history/import', {
        method: 'POST',
        body: { content, dryRun },
      }).then(r => r.data),
  })
}
