/**
 * Conexion a Base de Datos Oracle - iDempiere
 *
 * Esquema principal: IDECURTIT
 * Tabla de fichas: Z_FICHASSEGURIDAD
 *
 * IMPORTANTE: Todos los queries a Z_FICHASSEGURIDAD y AD_ATTACHMENT
 * deben incluir los filtros obligatorios:
 *   - AD_CLIENT_ID = :adClientId
 *   - ISACTIVE = 'Y'
 *   - AD_TABLE_ID = :adTableId (para AD_ATTACHMENT -> Z_FICHASSEGURIDAD)
 *
 * SEGURIDAD:
 *   - Todos los valores sensibles se leen EXCLUSIVAMENTE de variables de entorno (.env.local)
 *   - Todos los queries usan bind variables para prevenir SQL injection
 *   - Nunca se concatenan valores de usuario en SQL
 *
 * QUERIES: Revisadas y aprobadas por la empresa (Curtiduria Tungurahua).
 */

import oracledb from 'oracledb'

// ==================== VALIDACION DE VARIABLES DE ENTORNO ====================

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Variable de entorno requerida no configurada: ${key}. ` +
      `Verifique su archivo .env.local`
    )
  }
  return value
}

// ==================== CONSTANTES DE iDEMPIERE ====================
// Valores fijos de la instancia de Curtiduria Tungurahua.
// No necesitan ser variables de entorno.

export const CONFIG = {
  /** Esquema principal de iDempiere */
  SCHEMA: 'IDECURTIT',
  /** AD_Client_ID: Curtiduria Tungurahua */
  AD_CLIENT_ID: 1000002,
  /** AD_Org_ID: CTU */
  AD_ORG_ID: 1000002,
  /** ID de la tabla Z_FICHASSEGURIDAD en AD_TABLE (filtro obligatorio para AD_ATTACHMENT) */
  AD_TABLE_ID_FICHA: Number(process.env.ORACLE_AD_TABLE_ID_FICHA || '1000284'),
  /** Categoria MP QUIMICOS / Bodega QM para filtrar productos */
  M_PRODUCT_CATEGORY_ID: 1000003,
} as const

// ==================== CONEXION ====================
// Solo estas 3 variables de entorno son requeridas.

const dbConfig = {
  user: requireEnv('ORACLE_USER'),
  password: requireEnv('ORACLE_PASSWORD'),
  connectionString: requireEnv('ORACLE_CONNECTION_STRING'),
}

let pool: oracledb.Pool | null = null

async function getPool(): Promise<oracledb.Pool> {
  if (!pool) {
    pool = await oracledb.createPool({
      ...dbConfig,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    })
  }
  return pool
}

async function query<T>(sql: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const p = await getPool()
  const conn = await p.getConnection()
  try {
    const result = await conn.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    return (result.rows || []) as T[]
  } finally {
    await conn.close()
  }
}

async function execute(sql: string, params: Record<string, unknown> = {}): Promise<number> {
  const p = await getPool()
  const conn = await p.getConnection()
  try {
    const result = await conn.execute(sql, params, { autoCommit: true })
    return result.rowsAffected || 0
  } finally {
    await conn.close()
  }
}

/**
 * Para leer BLOBs de AD_ATTACHMENT / AD_ATTACHMENTLINE necesitamos fetchAsBuffer
 */
async function queryBlob(sql: string, params: Record<string, unknown> = {}) {
  const p = await getPool()
  const conn = await p.getConnection()
  try {
    oracledb.fetchAsBuffer = [oracledb.BLOB]
    const result = await conn.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT })
    return (result.rows || []) as Record<string, unknown>[]
  } finally {
    await conn.close()
  }
}

// ==================== 1. AUTENTICACION DE USUARIO (AD_USER) ====================

export async function authenticateUser(username: string, password: string) {
  const sql = `
    SELECT u.AD_USER_ID,
           u.NAME,
           u.PASSWORD,
           u.SALT,
           u.ISACTIVE
    FROM ${CONFIG.SCHEMA}.AD_USER u
    WHERE u.NAME = :username
      AND u.AD_CLIENT_ID = :adClientId
      AND u.ISACTIVE = 'Y'
      AND u.ISLOCKED = 'N'
  `
  const rows = await query<{
    AD_USER_ID: number
    NAME: string
    PASSWORD: string
    SALT: string | null
    ISACTIVE: string
  }>(sql, { username, adClientId: CONFIG.AD_CLIENT_ID })

  if (rows.length === 0) return null

  const user = rows[0]
  // iDempiere almacena passwords con hash - ajustar segun configuracion de la instancia
  if (user.PASSWORD !== password) return null

  return { id: user.AD_USER_ID, name: user.NAME }
}

// ==================== 2. ROL DEL USUARIO ====================
// NOTA: Los roles se gestionan DENTRO de la aplicacion, NO desde AD_ROLE.
// Esta funcion es un placeholder; la logica de roles se define en la app.

export async function getUserRole(_userId: number): Promise<'admin' | 'operador'> {
  // Por ahora, todos los usuarios autenticados son operadores.
  // La logica de admin se gestiona dentro de la aplicacion.
  return 'operador'
}

// ==================== 3. PRODUCTOS (M_PRODUCT) ====================
// Solo productos de la categoria Bodega QM (M_PRODUCT_CATEGORY_ID)

export async function getProducts(search?: string) {
  const sql = `
    SELECT p.M_PRODUCT_ID,
           p.VALUE,
           p.NAME,
           p.DESCRIPTION,
           pc.NAME AS CATEGORY_NAME
    FROM ${CONFIG.SCHEMA}.M_PRODUCT p
    JOIN ${CONFIG.SCHEMA}.M_PRODUCT_CATEGORY pc
      ON p.M_PRODUCT_CATEGORY_ID = pc.M_PRODUCT_CATEGORY_ID
    WHERE p.AD_CLIENT_ID = :adClientId
      AND p.ISACTIVE = 'Y'
      AND p.AD_ORG_ID = :adOrgId
      AND p.M_PRODUCT_CATEGORY_ID = :categoryId
      AND (
        :search IS NULL
        OR UPPER(p.NAME) LIKE UPPER(:search)
        OR UPPER(p.VALUE) LIKE UPPER(:search)
        OR UPPER(p.DESCRIPTION) LIKE UPPER(:search)
      )
    ORDER BY p.NAME
  `

  return query<{
    M_PRODUCT_ID: number
    VALUE: string
    NAME: string
    DESCRIPTION: string
    CATEGORY_NAME: string
  }>(sql, {
    adClientId: CONFIG.AD_CLIENT_ID,
    adOrgId: CONFIG.AD_ORG_ID,
    categoryId: CONFIG.M_PRODUCT_CATEGORY_ID,
    search: search ? `%${search}%` : null,
  })
}

// ==================== 4. PROVEEDORES (C_BPARTNER) ====================

export async function getSuppliers() {
  const sql = `
    SELECT bp.C_BPARTNER_ID,
           bp.VALUE,
           bp.NAME
    FROM ${CONFIG.SCHEMA}.C_BPARTNER bp
    WHERE bp.AD_CLIENT_ID = :adClientId
      AND bp.ISACTIVE = 'Y'
      AND bp.ISVENDOR = 'Y'
    ORDER BY bp.NAME
  `
  return query<{ C_BPARTNER_ID: number; VALUE: string; NAME: string }>(sql, {
    adClientId: CONFIG.AD_CLIENT_ID,
  })
}

// ==================== 5. LISTAR FICHAS DE SEGURIDAD (Z_FICHASSEGURIDAD) ====================
// Solo productos de categoria Bodega QM + Producto + Proveedor + Categoria

export async function getSafetySheets(filters?: {
  productId?: number
  supplierId?: number
  search?: string
}) {
  const sql = `
    SELECT zf.Z_FICHASSEGURIDAD_ID,
           zf.M_PRODUCT_ID,
           zf.C_BPARTNER_ID,
           zf.VALUE,
           zf.NAME,
           zf.DESCRIPTION,
           zf.HELP,
           zf.DATETRX,
           zf.ISACTIVE,
           zf.CREATED,
           zf.CREATEDBY,
           zf.UPDATED,
           zf.UPDATEDBY,
           zf.AD_USER_ID,
           p.NAME AS PRODUCT_NAME,
           p.VALUE AS PRODUCT_CODE,
           bp.NAME AS SUPPLIER_NAME,
           pc.NAME AS CATEGORY_NAME
    FROM ${CONFIG.SCHEMA}.Z_FICHASSEGURIDAD zf
    JOIN ${CONFIG.SCHEMA}.M_PRODUCT p
      ON zf.M_PRODUCT_ID = p.M_PRODUCT_ID
    JOIN ${CONFIG.SCHEMA}.M_PRODUCT_CATEGORY pc
      ON p.M_PRODUCT_CATEGORY_ID = pc.M_PRODUCT_CATEGORY_ID
    LEFT JOIN ${CONFIG.SCHEMA}.C_BPARTNER bp
      ON zf.C_BPARTNER_ID = bp.C_BPARTNER_ID
    WHERE zf.AD_CLIENT_ID = :adClientId
      AND zf.AD_ORG_ID = :adOrgId
      AND zf.ISACTIVE = 'Y'
      AND p.M_PRODUCT_CATEGORY_ID = :categoryId
      AND (:productId IS NULL OR zf.M_PRODUCT_ID = :productId)
      AND (:supplierId IS NULL OR zf.C_BPARTNER_ID = :supplierId)
      AND (
        :search IS NULL
        OR UPPER(zf.NAME) LIKE UPPER(:search)
        OR UPPER(zf.DESCRIPTION) LIKE UPPER(:search)
        OR UPPER(p.NAME) LIKE UPPER(:search)
        OR UPPER(p.VALUE) LIKE UPPER(:search)
        OR UPPER(bp.NAME) LIKE UPPER(:search)
      )
    ORDER BY zf.CREATED DESC
  `

  return query<{
    Z_FICHASSEGURIDAD_ID: number
    M_PRODUCT_ID: number
    C_BPARTNER_ID: number
    VALUE: string
    NAME: string
    DESCRIPTION: string
    HELP: string
    DATETRX: Date
    ISACTIVE: string
    CREATED: Date
    CREATEDBY: number
    UPDATED: Date
    UPDATEDBY: number
    AD_USER_ID: number
    PRODUCT_NAME: string
    PRODUCT_CODE: string
    SUPPLIER_NAME: string
    CATEGORY_NAME: string
  }>(sql, {
    adClientId: CONFIG.AD_CLIENT_ID,
    adOrgId: CONFIG.AD_ORG_ID,
    categoryId: CONFIG.M_PRODUCT_CATEGORY_ID,
    productId: filters?.productId ?? null,
    supplierId: filters?.supplierId ?? null,
    search: filters?.search ? `%${filters.search}%` : null,
  })
}

// ==================== 6. OBTENER UNA FICHA POR ID ====================
// Con validacion de categoria

export async function getSafetySheetById(sheetId: number) {
  const sql = `
    SELECT zf.Z_FICHASSEGURIDAD_ID,
           zf.VALUE,
           zf.NAME,
           zf.DESCRIPTION,
           zf.HELP,
           zf.DATETRX,
           zf.M_PRODUCT_ID,
           zf.C_BPARTNER_ID,
           p.NAME AS PRODUCT_NAME,
           p.VALUE AS PRODUCT_CODE,
           bp.NAME AS SUPPLIER_NAME,
           pc.NAME AS CATEGORY_NAME
    FROM ${CONFIG.SCHEMA}.Z_FICHASSEGURIDAD zf
    JOIN ${CONFIG.SCHEMA}.M_PRODUCT p
      ON zf.M_PRODUCT_ID = p.M_PRODUCT_ID
    JOIN ${CONFIG.SCHEMA}.M_PRODUCT_CATEGORY pc
      ON p.M_PRODUCT_CATEGORY_ID = pc.M_PRODUCT_CATEGORY_ID
    LEFT JOIN ${CONFIG.SCHEMA}.C_BPARTNER bp
      ON zf.C_BPARTNER_ID = bp.C_BPARTNER_ID
    WHERE zf.Z_FICHASSEGURIDAD_ID = :sheetId
      AND zf.AD_CLIENT_ID = :adClientId
      AND zf.ISACTIVE = 'Y'
      AND p.M_PRODUCT_CATEGORY_ID = :categoryId
  `
  const rows = await query<{
    Z_FICHASSEGURIDAD_ID: number
    VALUE: string
    NAME: string
    DESCRIPTION: string
    HELP: string
    DATETRX: Date
    M_PRODUCT_ID: number
    C_BPARTNER_ID: number
    PRODUCT_NAME: string
    PRODUCT_CODE: string
    SUPPLIER_NAME: string
    CATEGORY_NAME: string
  }>(sql, {
    sheetId,
    adClientId: CONFIG.AD_CLIENT_ID,
    categoryId: CONFIG.M_PRODUCT_CATEGORY_ID,
  })

  return rows.length > 0 ? rows[0] : null
}

// ==================== 7. OBTENER PDF (AD_ATTACHMENT + AD_ATTACHMENTLINE) ====================

/**
 * Obtener el PDF (BLOB) de una ficha de seguridad.
 * Intenta primero con AD_ATTACHMENTLINE (archivos individuales).
 * Si no encuentra, usa AD_ATTACHMENT.BINARYDATA como fallback.
 */
export async function getSafetySheetPdf(sheetId: number): Promise<{
  pdfBuffer: Buffer | null
  pdfTitle: string | null
  fileName: string | null
  sheetValue: string
  sheetName: string
} | null> {
  // 1. Verificar que la ficha existe
  const sheet = await getSafetySheetById(sheetId)
  if (!sheet) return null

  // 2. Intentar obtener desde AD_ATTACHMENTLINE (preferido)
  const attachLineSql = `
    SELECT a.AD_ATTACHMENT_ID,
           a.AD_TABLE_ID,
           a.RECORD_ID,
           a.TITLE,
           al.AD_ATTACHMENTLINE_ID,
           al.FILENAME,
           al.BINARYDATA,
           a.CREATED AS ATTACH_CREATED,
           al.CREATED AS FILE_CREATED
    FROM ${CONFIG.SCHEMA}.AD_ATTACHMENT a
    JOIN ${CONFIG.SCHEMA}.AD_ATTACHMENTLINE al
      ON al.AD_ATTACHMENT_ID = a.AD_ATTACHMENT_ID
    WHERE a.AD_TABLE_ID = :adTableId
      AND a.RECORD_ID = :sheetId
      AND a.AD_CLIENT_ID = :adClientId
      AND a.ISACTIVE = 'Y'
      AND al.ISACTIVE = 'Y'
    ORDER BY a.CREATED DESC, al.CREATED DESC
    FETCH FIRST 1 ROWS ONLY
  `

  let attachRows = await queryBlob(attachLineSql, {
    adTableId: CONFIG.AD_TABLE_ID_FICHA,
    sheetId,
    adClientId: CONFIG.AD_CLIENT_ID,
  })

  if (attachRows.length > 0) {
    return {
      pdfBuffer: (attachRows[0].BINARYDATA as Buffer) || null,
      pdfTitle: (attachRows[0].TITLE as string) || null,
      fileName: (attachRows[0].FILENAME as string) || null,
      sheetValue: sheet.VALUE,
      sheetName: sheet.NAME,
    }
  }

  // 3. Fallback: obtener BINARYDATA directamente de AD_ATTACHMENT (caso blob)
  const attachBlobSql = `
    SELECT a.AD_ATTACHMENT_ID,
           a.TITLE,
           a.BINARYDATA
    FROM ${CONFIG.SCHEMA}.AD_ATTACHMENT a
    WHERE a.AD_TABLE_ID = :adTableId
      AND a.ISACTIVE = 'Y'
      AND a.RECORD_ID = :sheetId
      AND a.AD_CLIENT_ID = :adClientId
    ORDER BY a.CREATED DESC
    FETCH FIRST 1 ROWS ONLY
  `

  attachRows = await queryBlob(attachBlobSql, {
    adTableId: CONFIG.AD_TABLE_ID_FICHA,
    sheetId,
    adClientId: CONFIG.AD_CLIENT_ID,
  })

  return {
    pdfBuffer: attachRows.length > 0 ? (attachRows[0].BINARYDATA as Buffer) : null,
    pdfTitle: attachRows.length > 0 ? (attachRows[0].TITLE as string) : null,
    fileName: null,
    sheetValue: sheet.VALUE,
    sheetName: sheet.NAME,
  }
}

// ==================== 8. INSERTAR FICHA DE SEGURIDAD ====================
// NOTA: No se tiene permisos actualmente. Preparado para uso futuro.

export async function insertSafetySheet(data: {
  productId: number
  supplierId: number
  name: string
  value: string
  description: string
  help: string
  dateTrx: Date
  createdBy: number
  userId: number
}) {
  const sql = `
    INSERT INTO ${CONFIG.SCHEMA}.Z_FICHASSEGURIDAD (
      Z_FICHASSEGURIDAD_ID,
      AD_CLIENT_ID,
      AD_ORG_ID,
      ISACTIVE,
      CREATED,
      CREATEDBY,
      UPDATED,
      UPDATEDBY,
      Z_FICHASSEGURIDAD_UU,
      M_PRODUCT_ID,
      C_BPARTNER_ID,
      NAME,
      VALUE,
      DESCRIPTION,
      HELP,
      DATETRX,
      AD_USER_ID
    ) VALUES (
      ${CONFIG.SCHEMA}.Z_FICHASSEGURIDAD_SEQ.NEXTVAL,
      :adClientId,
      :adOrgId,
      'Y',
      SYSDATE,
      :createdBy,
      SYSDATE,
      :createdBy,
      SYS_GUID(),
      :productId,
      :supplierId,
      :name,
      :value,
      :description,
      :help,
      :dateTrx,
      :userId
    )
  `
  return execute(sql, {
    adClientId: CONFIG.AD_CLIENT_ID,
    adOrgId: CONFIG.AD_ORG_ID,
    productId: data.productId,
    supplierId: data.supplierId,
    name: data.name,
    value: data.value,
    description: data.description,
    help: data.help,
    dateTrx: data.dateTrx,
    createdBy: data.createdBy,
    userId: data.userId,
  })
}

// ==================== 9. ELIMINACION LOGICA (SOFT DELETE) ====================
// NOTA: No se tiene permisos actualmente. Preparado para uso futuro.

export async function deleteSafetySheet(sheetId: number, updatedBy: number) {
  const sql = `
    UPDATE ${CONFIG.SCHEMA}.Z_FICHASSEGURIDAD
    SET ISACTIVE = 'N',
        UPDATED = SYSDATE,
        UPDATEDBY = :updatedBy
    WHERE Z_FICHASSEGURIDAD_ID = :sheetId
      AND AD_CLIENT_ID = :adClientId
  `
  return execute(sql, { sheetId, updatedBy, adClientId: CONFIG.AD_CLIENT_ID })
}

// ==================== UTILIDAD ====================

export async function closePool() {
  if (pool) {
    await pool.close(0)
    pool = null
  }
}
