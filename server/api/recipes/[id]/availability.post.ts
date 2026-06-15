import { z } from 'zod'
import { addAvailability } from '../../../utils/e02-adapter'

const minute = z.number().int().min(0).max(1440)
const schema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  startMinute: minute,
  endMinute: minute,
}).refine(w => w.endMinute > w.startMinute, { message: 'El fin debe ser mayor que el inicio' })

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const body = await readValidatedBody(event, schema.parse)
  return ok(await addAvailability(event, id, body))
})
