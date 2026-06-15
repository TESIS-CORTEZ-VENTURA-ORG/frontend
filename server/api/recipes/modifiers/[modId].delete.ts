import { removeModifier } from '../../../utils/e02-adapter'

export default defineEventHandler(async (event) => {
  const modId = getRouterParam(event, 'modId')
  if (!modId) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  await removeModifier(event, modId)
  return ok(null)
})
