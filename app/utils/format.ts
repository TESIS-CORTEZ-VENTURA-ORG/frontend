/** Formato de moneda local: S/ 1,234.50 (TP1 es solo PEN). */
export function formatPEN(value: number): string {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Hora local corta: 19:45 */
export function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Lima',
  })
}

/** Fecha local corta: 10 jun */
export function formatShortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Lima',
  })
}

/** Tiempo relativo: "hace 4 min", "hace 2 h", "ayer" */
export function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.round(diffMs / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

/** Minutos transcurridos desde una fecha: "1 h 25 min" */
export function elapsed(isoDate: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60_000))
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  return `${h} h ${mins % 60} min`
}
