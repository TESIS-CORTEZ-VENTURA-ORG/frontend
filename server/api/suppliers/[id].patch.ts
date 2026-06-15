import { z } from 'zod'
import { backendFetch } from '../../utils/backend'
import type { SupplierView } from './index.get'

interface Envelope<T> { success: boolean, data: T }

const patchSupplierSchema = z.object({
  ruc: z.string().regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos').optional(),
  name: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(1).optional(),
  paymentTerms: z.string().min(1).optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
})

// Edita un proveedor (HU-02-05).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const body = await readValidatedBody(event, patchSupplierSchema.parse)
  const res = await backendFetch<Envelope<SupplierView>>(event, `/api/suppliers/${id}`, {
    method: 'PATCH',
    body,
  })
  return ok(res.data)
})
