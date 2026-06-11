import { z } from 'zod'

const readSchema = z.object({
  // Sin id: marcar todas como leídas
  id: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const body = await readValidatedBody(event, readSchema.parse)

  if (body.id) {
    const notification = db.notifications.find(n => n.id === body.id)
    if (notification) notification.read = true
  }
  else {
    for (const n of db.notifications) n.read = true
  }

  return ok(db.notifications)
})
