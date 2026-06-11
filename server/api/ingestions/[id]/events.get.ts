/**
 * SSE de progreso de una ingesta (frontend_context.md §6).
 * Simula el worker BullMQ: valida "fila a fila" e inyecta algunos errores.
 */
export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const ingestion = db.ingestions.find(i => i.id === id)
  if (!ingestion) {
    throw createError({ statusCode: 404, statusMessage: 'Ingesta no encontrada' })
  }

  const stream = createEventStream(event)
  const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

  const SAMPLE_ERRORS = [
    { field: 'fecha', message: 'Formato de fecha inválido (se esperaba DD/MM/YYYY)' },
    { field: 'total', message: 'Monto negativo no permitido' },
    { field: 'producto', message: 'Producto no mapeado al catálogo' },
  ]

  const run = async (): Promise<void> => {
    ingestion.status = 'processing'
    await stream.push({ event: 'status', data: JSON.stringify({ status: 'processing' }) })

    const step = Math.ceil(ingestion.totalRows / 12)
    while (ingestion.processedRows < ingestion.totalRows) {
      await sleep(350)
      ingestion.processedRows = Math.min(ingestion.processedRows + step, ingestion.totalRows)

      // ~3 errores repartidos en el proceso
      if (ingestion.errors.length < 3 && ingestion.processedRows > (ingestion.errors.length + 1) * ingestion.totalRows / 4) {
        const sample = SAMPLE_ERRORS[ingestion.errors.length]
        if (sample) {
          ingestion.errors.push({ row: ingestion.processedRows - Math.floor(step / 2), ...sample })
        }
      }

      await stream.push({
        event: 'progress',
        data: JSON.stringify({
          processedRows: ingestion.processedRows,
          totalRows: ingestion.totalRows,
          errors: ingestion.errors,
        }),
      })
    }

    ingestion.status = ingestion.errors.length > 0 ? 'success' : 'success'
    await stream.push({
      event: 'done',
      data: JSON.stringify({
        status: ingestion.status,
        imported: ingestion.totalRows - ingestion.errors.length,
        errors: ingestion.errors,
      }),
    })
    await stream.close()
  }

  run().catch(() => stream.close())

  return stream.send()
})
