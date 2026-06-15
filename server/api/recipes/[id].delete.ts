import { deleteRecipe } from '../../utils/e02-adapter'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  }
  await deleteRecipe(event, id)
  return ok(null)
})
