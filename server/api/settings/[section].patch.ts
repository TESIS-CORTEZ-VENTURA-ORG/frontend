import type { AppSettings } from '#shared/types/domain'

const SECTIONS = ['business', 'hours', 'payments', 'tables', 'tax', 'menu'] as const
type Section = typeof SECTIONS[number]

function isSection(value: string | undefined): value is Section {
  return SECTIONS.includes(value as Section)
}

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const section = getRouterParam(event, 'section')
  if (!isSection(section)) {
    throw createError({ statusCode: 404, statusMessage: 'Sección de ajustes no válida' })
  }

  // El mock acepta el shape del cliente tal cual; la API real valida con Zod compartido
  const body = await readBody<Partial<AppSettings[Section]>>(event)
  Object.assign(db.settings[section] as object, body)

  return ok(db.settings[section])
})
