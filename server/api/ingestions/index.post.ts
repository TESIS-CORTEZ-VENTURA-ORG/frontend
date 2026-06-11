import { z } from 'zod'
import type { Ingestion } from '#shared/types/domain'

const createIngestionSchema = z.object({
  fileName: z.string().min(1),
  source: z.string().default('TumiSoft'),
  totalRows: z.number().int().positive().default(480),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const body = await readValidatedBody(event, createIngestionSchema.parse)

  const ingestion: Ingestion = {
    id: nextId(db, 'ing-job'),
    fileName: body.fileName,
    source: body.source,
    status: 'queued',
    totalRows: body.totalRows,
    processedRows: 0,
    errors: [],
    createdAt: new Date().toISOString(),
  }
  db.ingestions.unshift(ingestion)

  return ok(ingestion)
})
