import { buildRecipeDetail } from '../../utils/e02-adapter'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  }
  return ok(await buildRecipeDetail(event, id))
})
