import { Buffer } from 'node:buffer'
import type { H3Event } from 'h3'
import type { AppRole } from '#shared/types/api'

export interface BackendTokens {
  accessToken: string
  refreshToken: string
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

interface MeView {
  id: string
  email: string
  name: string
  roles: string[]
}

interface JwtClaims {
  sub: string
  tenant_id: string
  roles: string[]
}

/** Base URL del backend NestJS (NUXT_API_BASE). El cliente nunca llama directo. */
export function backendBase(event: H3Event): string {
  const { apiBase } = useRuntimeConfig(event)
  if (!apiBase) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_API_BASE no configurado' })
  }
  return apiBase
}

/** Decodifica el payload del JWT (sin verificar — confiamos en el backend que lo emitió). */
function decodeClaims(token: string): JwtClaims {
  const payload = token.split('.')[1] ?? ''
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as JwtClaims
}

/**
 * Con los tokens de NestJS: obtiene el usuario (/api/auth/me), arma el `User` del
 * frontend y **sella los tokens en la sesión** (cookie httpOnly, parte `secure` →
 * nunca llega al cliente). Devuelve el `User` para la respuesta del BFF.
 */
export async function establishSession(
  event: H3Event,
  base: string,
  tokens: BackendTokens,
) {
  const me = await $fetch<ApiEnvelope<MeView>>(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  })
  const claims = decodeClaims(tokens.accessToken)
  const user = {
    id: me.data.id,
    name: me.data.name,
    email: me.data.email,
    role: (me.data.roles[0] ?? 'staff') as AppRole,
    tenantId: claims.tenant_id,
  }
  await setUserSession(event, {
    user,
    secure: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    loggedInAt: Date.now(),
  })
  return user
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

/**
 * Llama al backend NestJS inyectando el `Bearer` de la sesión (sellado en `secure`,
 * server-only). El cliente nunca ve el token. Propaga el status del backend (401/403/…).
 * Helper reutilizable para proxear rutas protegidas a medida que el backend las exponga.
 */
export async function backendFetch<T>(
  event: H3Event,
  path: string,
  opts: { method?: Method; body?: Record<string, unknown>; query?: Record<string, unknown> } = {},
): Promise<T> {
  const base = backendBase(event)
  const session = await getUserSession(event)
  const token = session.secure?.accessToken
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }
  try {
    const data = await $fetch(`${base}${path}`, {
      method: opts.method,
      body: opts.body,
      query: opts.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    // $fetch infiere TypedInternalResponse; la URL es externa (backend) → casteamos a T.
    return data as unknown as T
  } catch (error) {
    const err = error as {
      statusCode?: number
      data?: { error?: { message?: string }, message?: string }
    }
    const status = err.statusCode ?? 502
    // Propaga el mensaje del backend (envelope `error.message`) para poder
    // mostrarlo como toast en pantalla (p. ej. el 409 de borrar-con-hijos).
    const message = err.data?.error?.message ?? err.data?.message ?? 'Error del backend'
    throw createError({ statusCode: status, statusMessage: message, data: { message } })
  }
}

/**
 * Reenvía una descarga `text/csv` del backend a través del BFF (E07 · HU-07-10,
 * `?format=csv`). Pide el cuerpo CRUDO (`responseType: 'text'`, sin parsear como
 * JSON), copia las cabeceras de descarga del backend (`Content-Type` y
 * `Content-Disposition` → nombre de archivo) a la respuesta y devuelve el cuerpo
 * tal cual. El RBAC del backend corre antes (staff → 403 también para CSV).
 */
export async function proxyCsv(
  event: H3Event,
  path: string,
  query: Record<string, unknown> = {},
): Promise<string> {
  const base = backendBase(event)
  const session = await getUserSession(event)
  const token = session.secure?.accessToken
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }
  try {
    const csv = await $fetch<string>(`${base}${path}`, {
      query,
      responseType: 'text',
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' },
      onResponse({ response }) {
        // Copia las cabeceras de descarga del backend a la respuesta del BFF.
        const disposition = response.headers.get('content-disposition')
        setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
        if (disposition) setResponseHeader(event, 'content-disposition', disposition)
      },
    })
    return csv
  } catch (error) {
    const err = error as {
      statusCode?: number
      data?: { error?: { message?: string }, message?: string }
    }
    const status = err.statusCode ?? 502
    const message = err.data?.error?.message ?? err.data?.message ?? 'Error del backend'
    throw createError({ statusCode: status, statusMessage: message, data: { message } })
  }
}
