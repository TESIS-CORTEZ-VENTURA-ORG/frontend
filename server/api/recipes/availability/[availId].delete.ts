import { removeAvailability } from '../../../utils/e02-adapter'

export default defineEventHandler(async (event) => {
  const availId = getRouterParam(event, 'availId')
  if (!availId) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  await removeAvailability(event, availId)
  return ok(null)
})
