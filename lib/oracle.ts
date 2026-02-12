/**
 * Conexion a Base de Datos Oracle
 *
 * Driver: Oracle en OraClient12Home1
 * DBQ: XE
 * UID: consulta_fseguridad
 * PWD: FichasSeguridad!
 *
 * Esquema principal: IDECURTIT
 * Tabla de fichas: Z_FICHASSEGURIDAD
 *
 * Configurar en .env.local:
 * ORACLE_USER=consulta_fseguridad
 * ORACLE_PASSWORD=FichasSeguridad!
 * ORACLE_CONNECTION_STRING=localhost:1521/XE
 */

import oracledb from 'oracledb'

// Campos obligatorios segun la instancia de iDempiere
const AD_CLIENT_ID = 1000002 // Curtiduria Tungurahua
const AD_ORG_ID = 1000002 // CTU
const M_PRODUCT_CATEGORY_ID = 1000003 // MP QUIMICOS

// Esquema donde residen las tablas de iDempiere
const SCHEMA = 'IDECURTIT'

// Configuracion de conexion
const dbConfig = {
  user: process.env.ORACLE_USER || 'consulta_fseguridad',
  password: process.env.ORACLE_PASSWORD || 'FichasSeguridad!',
  connectionString: process.env.ORACLE_CONNECTION_STRING || 'localhost:1521/XE',
}

// Pool de conexiones
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

// ==================== USUARIOS (AD_USER) ====================
export async function authenticateUser(username: string, password: string) {
  const sql = `
    SELECT AD_USER_ID, NAME, PASSWORD, ISACTIVE
    FROM ${SCHEMA}.AD_USER
    WHERE NAME = :username
      AND AD_CLIENT_ID = ${AD_CLIENT_ID}
      AND ISACTIVE = 'Y'
  `
  const rows = await query<{ AD_USER_ID: number; NAME: string; PASSWORD: string }>(sql, {
    username,
  })
  if (rows.length === 0) return null

  const user = rows[0]
  // Verificar password
  if (user.PASSWORD !== password) return null

  return { id: user.AD_USER_ID, name: user.NAME }
}

// Obtener rol del usuario desde AD_ROLE
export async function getUserRole(userId: number): Promise<'admin' | 'operador'> {
  const sql = `
    SELECT r.NAME AS ROLE_NAME
    FROM ${SCHEMA}.AD_USER_ROLES ur
    JOIN ${SCHEMA}.AD_ROLE r ON ur.AD_ROLE_ID = r.AD_ROLE_ID
    WHERE ur.AD_USER_ID = :userId
      AND ur.AD_CLIENT_ID = ${AD_CLIENT_ID}
      AND ur.ISACTIVE = 'Y'
      AND r.ISACTIVE = 'Y'
  `
  const rows = await query<{ ROLE_NAME: string }>(sql, { userId })

  // Si tiene rol Admin o System Administrator, es admin
  const isAdmin = rows.some(
    (r) =>
      r.ROLE_NAME.toLowerCase().includes('admin') ||
      r.ROLE_NAME.toLowerCase().includes('administrator')
  )

  return isAdmin ? 'admin' : 'operador'
}

// ==================== PRODUCTOS (M_PRODUCT) ====================
// Solo productos de categoria MP QUIMICOS (ID: 1000003)
export async function getProducts(search?: string) {
  let sql = `
    SELECT p.M_PRODUCT_ID, p.VALUE, p.NAME, p.DESCRIPTION,
           pc.NAME AS CATEGORY_NAME
    FROM ${SCHEMA}.M_PRODUCT p
    LEFT JOIN ${SCHEMA}.M_PRODUCT_CATEGORY pc ON p.M_PRODUCT_CATEGORY_ID = pc.M_PRODUCT_CATEGORY_ID
    WHERE p.AD_CLIENT_ID = ${AD_CLIENT_ID}
      AND p.AD_ORG_ID = ${AD_ORG_ID}
      AND p.ISACTIVE = 'Y'
      AND p.M_PRODUCT_CATEGORY_ID = ${M_PRODUCT_CATEGORY_ID}
  `

  const params: Record<string, unknown> = {}

  if (search) {
    sql += ` AND (UPPER(p.NAME) LIKE UPPER(:search) OR UPPER(p.VALUE) LIKE UPPER(:search) OR UPPER(p.DESCRIPTION) LIKE UPPER(:search))`
    params.search = `%${search}%`
  }

  sql += ` ORDER BY p.NAME`

  return query<{
    M_PRODUCT_ID: number
    VALUE: string
    NAME: string
    DESCRIPTION: string
    CATEGORY_NAME: string
  }>(sql, params)
}

// ==================== PROVEEDORES (C_BPARTNER) ====================
export async function getSuppliers() {
  const sql = `
    SELECT C_BPARTNER_ID, VALUE, NAME
    FROM ${SCHEMA}.C_BPARTNER
    WHERE AD_CLIENT_ID = ${AD_CLIENT_ID}
      AND ISACTIVE = 'Y'
      AND ISVENDOR = 'Y'
    ORDER BY NAME
  `
  return query<{ C_BPARTNER_ID: number; VALUE: string; NAME: string }>(sql)
}

// ==================== FICHAS DE SEGURIDAD (Z_FICHASSEGURIDAD) ====================
/**
 * Esquema IDECURTIT:
 *   Z_FICHASSEGURIDAD_ID  NUMBER(10)     PK
 *   Z_FICHASSEGURIDAD_UU  VARCHAR2(36)   UUID
 *   AD_CLIENT_ID          NUMBER(10)
 *   AD_ORG_ID             NUMBER(10)
 *   AD_USER_ID            NUMBER(10)     usuario responsable
 *   CREATED               DATE
 *   CREATEDBY             NUMBER(10)
 *   DATETRX               DATE           fecha de la ficha
 *   DESCRIPTION           VARCHAR2(255)  descripcion corta
 *   HELP                  VARCHAR2(2000) descripcion larga / notas
 *   ISACTIVE              CHAR(1)
 *   NAME                  VARCHAR2(60)   nombre de la ficha
 *   UPDATED               DATE
 *   UPDATEDBY             NUMBER(10)
 *   VALUE                 VARCHAR2(40)   codigo/referencia
 *   C_BPARTNER_ID         NUMBER(10)     proveedor
 *   M_PRODUCT_ID          NUMBER(10)     producto quimico
 *
 * Los PDFs se almacenan en AD_ATTACHMENT vinculados al registro
 * mediante AD_TABLE_ID (de Z_FICHASSEGURIDAD) y RECORD_ID (Z_FICHASSEGURIDAD_ID).
 */

export async function getSafetySheets(productId?: number) {
  let sql = `
    SELECT zf.Z_FICHASSEGURIDAD_ID, zf.M_PRODUCT_ID, zf.C_BPARTNER_ID,
           zf.VALUE, zf.NAME, zf.DESCRIPTION, zf.HELP,
           zf.DATETRX, zf.ISACTIVE,
           zf.CREATED, zf.CREATEDBY, zf.UPDATED, zf.UPDATEDBY,
           zf.AD_USER_ID,
           p.NAME AS PRODUCT_NAME, p.VALUE AS PRODUCT_CODE,
           bp.NAME AS SUPPLIER_NAME
    FROM ${SCHEMA}.Z_FICHASSEGURIDAD zf
    JOIN ${SCHEMA}.M_PRODUCT p ON zf.M_PRODUCT_ID = p.M_PRODUCT_ID
    LEFT JOIN ${SCHEMA}.C_BPARTNER bp ON zf.C_BPARTNER_ID = bp.C_BPARTNER_ID
    WHERE zf.AD_CLIENT_ID = ${AD_CLIENT_ID}
      AND zf.AD_ORG_ID = ${AD_ORG_ID}
      AND zf.ISACTIVE = 'Y'
  `

  const params: Record<string, unknown> = {}

  if (productId) {
    sql += ` AND zf.M_PRODUCT_ID = :productId`
    params.productId = productId
  }

  sql += ` ORDER BY zf.CREATED DESC`

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
  }>(sql, params)
}

/**
 * Obtener el PDF adjunto de una ficha de seguridad.
 * Los PDFs se almacenan como AD_ATTACHMENT.
 * Se busca por AD_TABLE_ID (tabla Z_FICHASSEGURIDAD) y RECORD_ID (el ID de la ficha).
 *
 * Primero obtenemos el AD_TABLE_ID de Z_FICHASSEGURIDAD, luego buscamos el attachment.
 */
export async function getSafetySheetPdf(sheetId: number) {
  // Obtener AD_TABLE_ID para la tabla Z_FICHASSEGURIDAD
  const tableSql = `
    SELECT AD_TABLE_ID
    FROM ${SCHEMA}.AD_TABLE
    WHERE TABLENAME = 'Z_FICHASSEGURIDAD'
      AND AD_CLIENT_ID = ${AD_CLIENT_ID}
  `
  const tableRows = await query<{ AD_TABLE_ID: number }>(tableSql)
  if (tableRows.length === 0) return null

  const adTableId = tableRows[0].AD_TABLE_ID

  // Obtener datos de la ficha
  const sheetSql = `
    SELECT Z_FICHASSEGURIDAD_ID, NAME, VALUE
    FROM ${SCHEMA}.Z_FICHASSEGURIDAD
    WHERE Z_FICHASSEGURIDAD_ID = :sheetId
      AND AD_CLIENT_ID = ${AD_CLIENT_ID}
      AND ISACTIVE = 'Y'
  `
  const sheetRows = await query<{
    Z_FICHASSEGURIDAD_ID: number
    NAME: string
    VALUE: string
  }>(sheetSql, { sheetId })
  if (sheetRows.length === 0) return null

  // Buscar el attachment (PDF) asociado a esta ficha
  const attachSql = `
    SELECT a.AD_ATTACHMENT_ID, a.TITLE, a.BINARYDATA
    FROM ${SCHEMA}.AD_ATTACHMENT a
    WHERE a.AD_TABLE_ID = :adTableId
      AND a.RECORD_ID = :sheetId
      AND a.AD_CLIENT_ID = ${AD_CLIENT_ID}
  `
  const attachRows = await query<{
    AD_ATTACHMENT_ID: number
    TITLE: string
    BINARYDATA: Buffer
  }>(attachSql, { adTableId, sheetId })

  const sheet = sheetRows[0]

  return {
    id: sheet.Z_FICHASSEGURIDAD_ID,
    name: sheet.NAME,
    value: sheet.VALUE,
    attachment: attachRows.length > 0 ? attachRows[0] : null,
  }
}

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
    INSERT INTO ${SCHEMA}.Z_FICHASSEGURIDAD (
      Z_FICHASSEGURIDAD_ID, AD_CLIENT_ID, AD_ORG_ID, ISACTIVE,
      CREATED, CREATEDBY, UPDATED, UPDATEDBY,
      Z_FICHASSEGURIDAD_UU, M_PRODUCT_ID, C_BPARTNER_ID,
      NAME, VALUE, DESCRIPTION, HELP, DATETRX, AD_USER_ID
    ) VALUES (
      ${SCHEMA}.Z_FICHASSEGURIDAD_SEQ.NEXTVAL, ${AD_CLIENT_ID}, ${AD_ORG_ID}, 'Y',
      SYSDATE, :createdBy, SYSDATE, :createdBy,
      SYS_GUID(), :productId, :supplierId,
      :name, :value, :description, :help, :dateTrx, :userId
    )
  `
  return execute(sql, {
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

export async function deleteSafetySheet(sheetId: number, updatedBy: number) {
  const sql = `
    UPDATE ${SCHEMA}.Z_FICHASSEGURIDAD
    SET ISACTIVE = 'N', UPDATED = SYSDATE, UPDATEDBY = :updatedBy
    WHERE Z_FICHASSEGURIDAD_ID = :sheetId
      AND AD_CLIENT_ID = ${AD_CLIENT_ID}
  `
  return execute(sql, { sheetId, updatedBy })
}

// ==================== AUDITORIA ====================
/**
 * Tabla custom AUDIT_LOG - debe crearse
 * Se crea en el esquema del usuario de conexion (CONSULTA_FSEGURIDAD)
 */
export async function insertAuditLog(data: {
  userId: number
  action: string
  tableName: string
  recordId: number
  description: string
}) {
  const sql = `
    INSERT INTO AUDIT_LOG (
      AUDIT_ID, AD_USER_ID, ACTION, TABLE_NAME, RECORD_ID, DESCRIPTION, CREATED
    ) VALUES (
      AUDIT_LOG_SEQ.NEXTVAL, :userId, :action, :tableName, :recordId, :description, SYSDATE
    )
  `
  return execute(sql, data)
}

export async function getAuditLogs(filters?: { action?: string; search?: string }) {
  let sql = `
    SELECT a.AUDIT_ID, a.AD_USER_ID, a.ACTION, a.TABLE_NAME, a.RECORD_ID,
           a.DESCRIPTION, a.CREATED, u.NAME AS USER_NAME
    FROM AUDIT_LOG a
    LEFT JOIN ${SCHEMA}.AD_USER u ON a.AD_USER_ID = u.AD_USER_ID
    WHERE 1=1
  `

  const params: Record<string, unknown> = {}

  if (filters?.action) {
    sql += ` AND a.ACTION = :action`
    params.action = filters.action
  }

  if (filters?.search) {
    sql += ` AND (UPPER(a.DESCRIPTION) LIKE UPPER(:search) OR UPPER(u.NAME) LIKE UPPER(:search))`
    params.search = `%${filters.search}%`
  }

  sql += ` ORDER BY a.CREATED DESC FETCH FIRST 100 ROWS ONLY`

  return query<{
    AUDIT_ID: number
    AD_USER_ID: number
    ACTION: string
    TABLE_NAME: string
    RECORD_ID: number
    DESCRIPTION: string
    CREATED: Date
    USER_NAME: string
  }>(sql, params)
}

// ==================== FAVORITOS (Productos mas buscados) ====================
export async function getMostViewedProducts() {
  const sql = `
    SELECT p.M_PRODUCT_ID, p.VALUE, p.NAME, COUNT(a.AUDIT_ID) AS VIEW_COUNT
    FROM AUDIT_LOG a
    JOIN ${SCHEMA}.M_PRODUCT p ON a.RECORD_ID = p.M_PRODUCT_ID
    WHERE a.TABLE_NAME = 'Z_FICHASSEGURIDAD'
      AND a.ACTION = 'VIEW'
      AND a.CREATED >= SYSDATE - 30
    GROUP BY p.M_PRODUCT_ID, p.VALUE, p.NAME
    ORDER BY VIEW_COUNT DESC
    FETCH FIRST 10 ROWS ONLY
  `
  return query<{ M_PRODUCT_ID: number; VALUE: string; NAME: string; VIEW_COUNT: number }>(sql)
}

export async function closePool() {
  if (pool) {
    await pool.close(0)
    pool = null
  }
}
