'use server'

import * as oracle from '@/lib/oracle'
import { getSession, isAdmin, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'

// ==================== UTILIDAD DE AUTORIZACION ====================

async function requireSession() {
  const session = await getSession()
  if (!session) {
    throw new Error('No autorizado. Inicie sesion para continuar.')
  }
  return session
}

async function requireAdmin() {
  const session = await requireSession()
  if (!isAdmin(session.user.role)) {
    throw new Error('Acceso denegado. Se requiere rol de administrador.')
  }
  return session
}

// ==================== AUTENTICACION ====================

export async function loginAction(username: string, password: string) {
  if (!username || !password) {
    return { success: false as const, error: 'Usuario y contrasena son requeridos' }
  }

  try {
    const user = await oracle.authenticateUser(username, password)

    if (!user) {
      return { success: false as const, error: 'Credenciales invalidas' }
    }

    const role = await oracle.getUserRole(user.id)
    const sessionUser = { id: user.id, name: user.name, role }
    const token = await createToken(sessionUser)

    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })

    return { success: true as const, user: sessionUser }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false as const, error: `Error de conexion: ${message}` }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function getSessionAction() {
  const session = await getSession()
  if (!session) return { user: null }
  return { user: session.user }
}

// ==================== PRODUCTOS ====================

export async function searchProducts(search?: string) {
  await requireSession()

  const products = await oracle.getProducts(search)
  return products.map((p) => ({
    M_PRODUCT_ID: p.M_PRODUCT_ID,
    VALUE: p.VALUE,
    NAME: p.NAME,
    DESCRIPTION: p.DESCRIPTION,
    CATEGORY_NAME: p.CATEGORY_NAME,
  }))
}

// ==================== PROVEEDORES ====================

export async function getSuppliers() {
  await requireAdmin()
  return oracle.getSuppliers()
}

// ==================== FICHAS DE SEGURIDAD ====================

export async function getSafetySheets(filters?: {
  productId?: number
  supplierId?: number
  search?: string
}) {
  await requireSession()

  const sheets = await oracle.getSafetySheets(filters)
  return sheets.map((s) => ({
    id: s.Z_FICHASSEGURIDAD_ID,
    value: s.VALUE,
    name: s.NAME,
    description: s.DESCRIPTION,
    help: s.HELP,
    dateTrx: s.DATETRX ? new Date(s.DATETRX).toISOString() : null,
    productName: s.PRODUCT_NAME,
    productCode: s.PRODUCT_CODE,
    supplierName: s.SUPPLIER_NAME,
    categoryName: s.CATEGORY_NAME,
    created: s.CREATED ? new Date(s.CREATED).toISOString() : null,
  }))
}

/**
 * Obtener el PDF de una ficha como base64.
 * Se usa desde el cliente para renderizar el PDF sin necesidad de API route.
 */
export async function getSafetySheetPdf(sheetId: number) {
  await requireSession()

  if (!sheetId || isNaN(sheetId)) {
    throw new Error('ID de ficha invalido')
  }

  const result = await oracle.getSafetySheetPdf(sheetId)

  if (!result) {
    throw new Error('Ficha no encontrada')
  }

  if (!result.pdfBuffer) {
    throw new Error('Esta ficha no tiene un PDF adjunto en AD_ATTACHMENT')
  }

  // Convertir Buffer a base64 para enviar al cliente
  const base64 = result.pdfBuffer.toString('base64')

  return {
    base64,
    title: result.pdfTitle || result.sheetValue,
    fileName: result.fileName || null,
    sheetValue: result.sheetValue,
    sheetName: result.sheetName,
  }
}

export async function createSafetySheet(formData: FormData) {
  const session = await requireAdmin()

  const productId = Number(formData.get('productId'))
  const supplierId = Number(formData.get('supplierId'))
  const name = (formData.get('name') as string)?.trim()
  const value = (formData.get('value') as string)?.trim()
  const description = ((formData.get('description') as string) || '').trim()
  const help = ((formData.get('help') as string) || '').trim()
  const dateTrxStr = formData.get('dateTrx') as string

  if (!productId || isNaN(productId)) {
    throw new Error('Producto requerido y debe ser un ID valido')
  }
  if (!supplierId || isNaN(supplierId)) {
    throw new Error('Proveedor requerido y debe ser un ID valido')
  }
  if (!name || name.length === 0) {
    throw new Error('Nombre de la ficha es requerido')
  }
  if (name.length > 60) {
    throw new Error('Nombre de la ficha no puede exceder 60 caracteres')
  }
  if (!value || value.length === 0) {
    throw new Error('Codigo de la ficha es requerido')
  }
  if (value.length > 40) {
    throw new Error('Codigo de la ficha no puede exceder 40 caracteres')
  }
  if (description.length > 255) {
    throw new Error('Descripcion no puede exceder 255 caracteres')
  }
  if (help.length > 2000) {
    throw new Error('Notas no pueden exceder 2000 caracteres')
  }

  await oracle.insertSafetySheet({
    productId,
    supplierId,
    name,
    value,
    description,
    help,
    dateTrx: dateTrxStr ? new Date(dateTrxStr) : new Date(),
    createdBy: session.user.id,
    userId: session.user.id,
  })

  return { success: true }
}

export async function deleteSafetySheet(sheetId: number) {
  const session = await requireAdmin()

  if (!sheetId || isNaN(sheetId)) {
    throw new Error('ID de ficha invalido')
  }

  await oracle.deleteSafetySheet(sheetId, session.user.id)

  return { success: true }
}

/*
 * ==================== AUDITORIA (COMENTADO) ====================
 * La auditoria se consulta directamente en la base de datos (tabla AUDIT_LOG).
 * Descomentar cuando se habilite la auditoria desde la interfaz web.
 *
export async function getAuditLogs(filters?: { action?: string; search?: string }) {
  await requireAdmin()

  const sanitized: { action?: string; search?: string } = {}
  if (filters?.action && typeof filters.action === 'string') {
    const allowed = ['LOGIN', 'VIEW', 'DOWNLOAD', 'PRINT', 'UPLOAD', 'UPDATE', 'DELETE']
    if (allowed.includes(filters.action.toUpperCase())) {
      sanitized.action = filters.action.toUpperCase()
    }
  }
  if (filters?.search && typeof filters.search === 'string') {
    sanitized.search = filters.search.substring(0, 100)
  }

  const logs = await oracle.getAuditLogs(sanitized)
  return logs.map((l) => ({
    AUDIT_ID: l.AUDIT_ID,
    AD_USER_ID: l.AD_USER_ID,
    ACTION: l.ACTION,
    TABLE_NAME: l.TABLE_NAME,
    RECORD_ID: l.RECORD_ID,
    DESCRIPTION: l.DESCRIPTION,
    CREATED: l.CREATED ? new Date(l.CREATED).toISOString() : null,
    USER_NAME: l.USER_NAME,
  }))
}

export async function logAuditAction(
  action: string,
  tableName: string,
  recordId: number,
  description: string,
) {
  const session = await requireSession()

  const allowed = ['LOGIN', 'VIEW', 'DOWNLOAD', 'PRINT', 'UPLOAD', 'UPDATE', 'DELETE']
  if (!allowed.includes(action.toUpperCase())) {
    throw new Error('Tipo de accion invalido')
  }

  await oracle.insertAuditLog({
    userId: session.user.id,
    action: action.toUpperCase(),
    tableName: tableName.substring(0, 50),
    recordId,
    description: description.substring(0, 500),
  })
}

export async function getMostViewedProducts() {
  await requireSession()
  return oracle.getMostViewedProducts()
}
*/
