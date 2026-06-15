import { z } from 'zod'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }
interface ImportReport {
  total: number
  created: number
  updated: number
  failed: number
  errors: { line: number, message: string }[]
}

const schema = z.object({ content: z.string().min(1) })

// HU-02-02 · Carga masiva de insumos: proxy autenticado a POST /api/ingredients/import.
// El cliente lee el archivo CSV/Excel y envía su texto; el backend valida e importa.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  const res = await backendFetch<Envelope<ImportReport>>(event, '/api/ingredients/import', {
    method: 'POST',
    body,
  })
  return ok(res.data)
})
