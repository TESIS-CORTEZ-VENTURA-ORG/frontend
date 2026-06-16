import type { ApiResponse } from '#shared/types/api'
import type { CashClose, CashClosePreview } from '#shared/types/domain'

// HU-04-08 · Cierre Z (caja). El backend agrega las ventas del turno por método de
// pago: el preview NO persiste, el POST cierra el turno (manager/owner) y la lista
// es el historial inmutable.

/** Preview del turno abierto (ventana desde el último cierre). */
export function useCashClosePreview() {
  return useQuery({
    key: () => ['cash-close', 'preview'] as const,
    query: () => $fetch<ApiResponse<CashClosePreview>>('/api/cash-close/preview').then(r => r.data),
  })
}

/** Historial de cierres Z (más reciente primero). */
export function useCashCloses() {
  return useQuery({
    key: () => ['cash-close', 'list'] as const,
    query: () => $fetch<ApiResponse<CashClose[]>>('/api/cash-close').then(r => r.data),
  })
}

/** Ejecuta el Cierre Z y refresca preview + historial. */
export function useDoCashClose() {
  const cache = useQueryCache()
  return useMutation({
    mutation: () =>
      $fetch<ApiResponse<CashClose>>('/api/cash-close', { method: 'POST' }).then(r => r.data),
    onSettled: () => {
      cache.invalidateQueries({ key: ['cash-close', 'preview'] })
      cache.invalidateQueries({ key: ['cash-close', 'list'] })
    },
  })
}
