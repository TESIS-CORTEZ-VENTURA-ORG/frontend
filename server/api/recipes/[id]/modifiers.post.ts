import { z } from 'zod'
import { addModifier } from '../../../utils/e02-adapter'

const schema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().optional(),
  required: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const body = await readValidatedBody(event, schema.parse)
  return ok(await addModifier(event, id, body))
})
