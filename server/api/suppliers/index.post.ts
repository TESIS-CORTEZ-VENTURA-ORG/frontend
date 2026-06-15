import { z } from 'zod'
import { backendFetch } from '../../utils/backend'
import type { SupplierView } from './index.get'

interface Envelope<T> { success: boolean, data: T }

const createSupplierSchema = z.object({
  ruc: z.string().regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos'),
  name: z.string().min(1),
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(1).optional(),
  paymentTerms: z.string().min(1).optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
})

// Crea un proveedor (HU-02-05). 409 si el RUC ya existe en el tenant.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createSupplierSchema.parse)
  const res = await backendFetch<Envelope<SupplierView>>(event, '/api/suppliers', {
    method: 'POST',
    body,
  })
  return ok(res.data)
})
