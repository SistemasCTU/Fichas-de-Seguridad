/**
 * Datos de prueba para demostrar el sistema sin conexion a Oracle.
 *
 * Usuarios:
 *   admin   / admin123   -> rol admin
 *   operador / oper123   -> rol operador
 */

// ==================== USUARIOS ====================
export interface MockUser {
  id: number
  name: string
  password: string
  role: 'admin' | 'operador'
}

export const MOCK_USERS: MockUser[] = [
  { id: 1, name: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, name: 'operador', password: 'oper123', role: 'operador' },
]

export function authenticateUserMock(username: string, password: string) {
  const user = MOCK_USERS.find(
    (u) => u.name === username && u.password === password,
  )
  if (!user) return null
  return { id: user.id, name: user.name }
}

export function getUserRoleMock(userId: number): 'admin' | 'operador' {
  const user = MOCK_USERS.find((u) => u.id === userId)
  return user?.role ?? 'operador'
}

// ==================== PRODUCTOS ====================
export interface MockProduct {
  M_PRODUCT_ID: number
  VALUE: string
  NAME: string
  DESCRIPTION: string
  CATEGORY_NAME: string
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    M_PRODUCT_ID: 1001,
    VALUE: 'QM-001',
    NAME: 'Acido Sulfurico',
    DESCRIPTION: 'Acido sulfurico concentrado H2SO4 al 98%',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
  {
    M_PRODUCT_ID: 1002,
    VALUE: 'QM-002',
    NAME: 'Acido Formico',
    DESCRIPTION: 'Acido formico HCOOH al 85%',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
  {
    M_PRODUCT_ID: 1003,
    VALUE: 'QM-003',
    NAME: 'Sulfato de Cromo',
    DESCRIPTION: 'Sulfato basico de cromo Cr2(SO4)3 33%',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
  {
    M_PRODUCT_ID: 1004,
    VALUE: 'QM-004',
    NAME: 'Bicarbonato de Sodio',
    DESCRIPTION: 'Bicarbonato de sodio NaHCO3 grado industrial',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
  {
    M_PRODUCT_ID: 1005,
    VALUE: 'QM-005',
    NAME: 'Sulfuro de Sodio',
    DESCRIPTION: 'Sulfuro de sodio Na2S en escamas 60%',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
  {
    M_PRODUCT_ID: 1006,
    VALUE: 'QM-006',
    NAME: 'Cal Hidratada',
    DESCRIPTION: 'Hidroxido de calcio Ca(OH)2 polvo fino',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
  {
    M_PRODUCT_ID: 1007,
    VALUE: 'QM-007',
    NAME: 'Formiato de Sodio',
    DESCRIPTION: 'Formiato de sodio HCOONa 95%',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
  {
    M_PRODUCT_ID: 1008,
    VALUE: 'QM-008',
    NAME: 'Quebracho ATO',
    DESCRIPTION: 'Extracto de quebracho para curtido vegetal',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
  {
    M_PRODUCT_ID: 1009,
    VALUE: 'QM-009',
    NAME: 'Grasa Sulfonada',
    DESCRIPTION: 'Grasa sulfonada para engrase de cuero',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
  {
    M_PRODUCT_ID: 1010,
    VALUE: 'QM-010',
    NAME: 'Resina Acrilica',
    DESCRIPTION: 'Resina acrilica para acabado de cuero',
    CATEGORY_NAME: 'MP QUIMICOS',
  },
]

export function getProductsMock(search?: string) {
  if (!search) return MOCK_PRODUCTS
  const s = search.toUpperCase()
  return MOCK_PRODUCTS.filter(
    (p) =>
      p.NAME.toUpperCase().includes(s) ||
      p.VALUE.toUpperCase().includes(s) ||
      p.DESCRIPTION.toUpperCase().includes(s),
  )
}

// ==================== PROVEEDORES ====================
export interface MockSupplier {
  C_BPARTNER_ID: number
  VALUE: string
  NAME: string
}

export const MOCK_SUPPLIERS: MockSupplier[] = [
  { C_BPARTNER_ID: 2001, VALUE: 'PROV-001', NAME: 'Quimica Suiza' },
  { C_BPARTNER_ID: 2002, VALUE: 'PROV-002', NAME: 'BASF Ecuador' },
  { C_BPARTNER_ID: 2003, VALUE: 'PROV-003', NAME: 'Brenntag Ecuador' },
  { C_BPARTNER_ID: 2004, VALUE: 'PROV-004', NAME: 'Stahl Holdings' },
  { C_BPARTNER_ID: 2005, VALUE: 'PROV-005', NAME: 'TFL Ledertechnik' },
]

export function getSuppliersMock() {
  return MOCK_SUPPLIERS
}

// ==================== FICHAS DE SEGURIDAD (Z_FICHASSEGURIDAD) ====================
export interface MockSafetySheet {
  Z_FICHASSEGURIDAD_ID: number
  M_PRODUCT_ID: number
  C_BPARTNER_ID: number
  VALUE: string
  NAME: string
  DESCRIPTION: string
  HELP: string
  DATETRX: string
  ISACTIVE: 'Y' | 'N'
  CREATED: string
  CREATEDBY: number
  AD_USER_ID: number
  PRODUCT_NAME: string
  PRODUCT_CODE: string
  SUPPLIER_NAME: string
}

const now = new Date().toISOString()

export const MOCK_SAFETY_SHEETS: MockSafetySheet[] = [
  {
    Z_FICHASSEGURIDAD_ID: 3001,
    M_PRODUCT_ID: 1001,
    C_BPARTNER_ID: 2001,
    VALUE: 'FS-001',
    NAME: 'Ficha Acido Sulfurico - Quimica Suiza',
    DESCRIPTION: 'Ficha de seguridad acido sulfurico concentrado',
    HELP: 'Producto altamente corrosivo. Manipular con EPP completo.',
    DATETRX: '2025-01-15',
    ISACTIVE: 'Y',
    CREATED: now,
    CREATEDBY: 1,
    AD_USER_ID: 1,
    PRODUCT_NAME: 'Acido Sulfurico',
    PRODUCT_CODE: 'QM-001',
    SUPPLIER_NAME: 'Quimica Suiza',
  },
  {
    Z_FICHASSEGURIDAD_ID: 3002,
    M_PRODUCT_ID: 1001,
    C_BPARTNER_ID: 2001,
    VALUE: 'FS-001-A',
    NAME: 'Ficha Acido Sulfurico - version anterior',
    DESCRIPTION: 'Version anterior de ficha acido sulfurico',
    HELP: '',
    DATETRX: '2024-03-01',
    ISACTIVE: 'Y',
    CREATED: '2024-03-01T10:00:00.000Z',
    CREATEDBY: 1,
    AD_USER_ID: 1,
    PRODUCT_NAME: 'Acido Sulfurico',
    PRODUCT_CODE: 'QM-001',
    SUPPLIER_NAME: 'Quimica Suiza',
  },
  {
    Z_FICHASSEGURIDAD_ID: 3003,
    M_PRODUCT_ID: 1002,
    C_BPARTNER_ID: 2002,
    VALUE: 'FS-002',
    NAME: 'Ficha Acido Formico - BASF',
    DESCRIPTION: 'Ficha de seguridad acido formico 85%',
    HELP: 'Inflamable. Almacenar lejos de fuentes de calor.',
    DATETRX: '2025-02-10',
    ISACTIVE: 'Y',
    CREATED: now,
    CREATEDBY: 1,
    AD_USER_ID: 1,
    PRODUCT_NAME: 'Acido Formico',
    PRODUCT_CODE: 'QM-002',
    SUPPLIER_NAME: 'BASF Ecuador',
  },
  {
    Z_FICHASSEGURIDAD_ID: 3004,
    M_PRODUCT_ID: 1003,
    C_BPARTNER_ID: 2003,
    VALUE: 'FS-003',
    NAME: 'Ficha Sulfato de Cromo - Brenntag',
    DESCRIPTION: 'Ficha de seguridad sulfato basico de cromo',
    HELP: 'Toxico por inhalacion. Usar mascarilla con filtro.',
    DATETRX: '2025-04-01',
    ISACTIVE: 'Y',
    CREATED: now,
    CREATEDBY: 1,
    AD_USER_ID: 1,
    PRODUCT_NAME: 'Sulfato de Cromo',
    PRODUCT_CODE: 'QM-003',
    SUPPLIER_NAME: 'Brenntag Ecuador',
  },
  {
    Z_FICHASSEGURIDAD_ID: 3005,
    M_PRODUCT_ID: 1005,
    C_BPARTNER_ID: 2004,
    VALUE: 'FS-005',
    NAME: 'Ficha Sulfuro de Sodio - Stahl',
    DESCRIPTION: 'Ficha de seguridad sulfuro de sodio 60%',
    HELP: 'Reacciona violentamente con acidos. Genera gas toxico H2S.',
    DATETRX: '2025-05-20',
    ISACTIVE: 'Y',
    CREATED: now,
    CREATEDBY: 1,
    AD_USER_ID: 1,
    PRODUCT_NAME: 'Sulfuro de Sodio',
    PRODUCT_CODE: 'QM-005',
    SUPPLIER_NAME: 'Stahl Holdings',
  },
  {
    Z_FICHASSEGURIDAD_ID: 3006,
    M_PRODUCT_ID: 1006,
    C_BPARTNER_ID: 2005,
    VALUE: 'FS-006',
    NAME: 'Ficha Cal Hidratada - TFL',
    DESCRIPTION: 'Ficha de seguridad hidroxido de calcio',
    HELP: 'Irritante para piel y ojos. Usar guantes y gafas.',
    DATETRX: '2025-06-01',
    ISACTIVE: 'Y',
    CREATED: now,
    CREATEDBY: 1,
    AD_USER_ID: 1,
    PRODUCT_NAME: 'Cal Hidratada',
    PRODUCT_CODE: 'QM-006',
    SUPPLIER_NAME: 'TFL Ledertechnik',
  },
]

export function getSafetySheetsMock(productId?: number) {
  let sheets = MOCK_SAFETY_SHEETS.filter((s) => s.ISACTIVE === 'Y')
  if (productId) {
    sheets = sheets.filter((s) => s.M_PRODUCT_ID === productId)
  }
  return sheets
}

// ==================== AUDITORIA ====================
export interface MockAuditLog {
  AUDIT_ID: number
  AD_USER_ID: number
  ACTION: string
  TABLE_NAME: string
  RECORD_ID: number
  DESCRIPTION: string
  CREATED: string
  USER_NAME: string
}

let auditIdCounter = 5000
const auditStore: MockAuditLog[] = [
  {
    AUDIT_ID: 4001,
    AD_USER_ID: 1,
    ACTION: 'LOGIN',
    TABLE_NAME: 'AD_USER',
    RECORD_ID: 1,
    DESCRIPTION: 'Inicio de sesion: admin',
    CREATED: '2026-02-11T08:00:00.000Z',
    USER_NAME: 'admin',
  },
  {
    AUDIT_ID: 4002,
    AD_USER_ID: 2,
    ACTION: 'VIEW',
    TABLE_NAME: 'Z_FICHASSEGURIDAD',
    RECORD_ID: 3001,
    DESCRIPTION: 'Visualizo ficha Acido Sulfurico (FS-001)',
    CREATED: '2026-02-11T08:15:00.000Z',
    USER_NAME: 'operador',
  },
  {
    AUDIT_ID: 4003,
    AD_USER_ID: 2,
    ACTION: 'DOWNLOAD',
    TABLE_NAME: 'Z_FICHASSEGURIDAD',
    RECORD_ID: 3003,
    DESCRIPTION: 'Descargo ficha Acido Formico (FS-002)',
    CREATED: '2026-02-11T09:30:00.000Z',
    USER_NAME: 'operador',
  },
  {
    AUDIT_ID: 4004,
    AD_USER_ID: 1,
    ACTION: 'UPLOAD',
    TABLE_NAME: 'Z_FICHASSEGURIDAD',
    RECORD_ID: 3004,
    DESCRIPTION: 'Creo ficha Sulfato de Cromo (FS-003)',
    CREATED: '2026-02-11T10:00:00.000Z',
    USER_NAME: 'admin',
  },
  {
    AUDIT_ID: 4005,
    AD_USER_ID: 1,
    ACTION: 'DELETE',
    TABLE_NAME: 'Z_FICHASSEGURIDAD',
    RECORD_ID: 3002,
    DESCRIPTION: 'Elimino ficha version anterior Acido Sulfurico (FS-001-A)',
    CREATED: '2026-02-10T14:20:00.000Z',
    USER_NAME: 'admin',
  },
]

export function insertAuditLogMock(data: {
  userId: number
  action: string
  tableName: string
  recordId: number
  description: string
}) {
  const userName =
    MOCK_USERS.find((u) => u.id === data.userId)?.name ?? 'desconocido'
  auditStore.unshift({
    AUDIT_ID: ++auditIdCounter,
    AD_USER_ID: data.userId,
    ACTION: data.action,
    TABLE_NAME: data.tableName,
    RECORD_ID: data.recordId,
    DESCRIPTION: data.description,
    CREATED: new Date().toISOString(),
    USER_NAME: userName,
  })
}

export function getAuditLogsMock(filters?: {
  action?: string
  search?: string
}) {
  let logs = [...auditStore]
  if (filters?.action) {
    logs = logs.filter((l) => l.ACTION === filters.action)
  }
  if (filters?.search) {
    const s = filters.search.toUpperCase()
    logs = logs.filter(
      (l) =>
        l.DESCRIPTION.toUpperCase().includes(s) ||
        l.USER_NAME.toUpperCase().includes(s),
    )
  }
  return logs.slice(0, 100)
}

// ==================== FAVORITOS ====================
export function getMostViewedProductsMock() {
  return [
    { M_PRODUCT_ID: 1001, VALUE: 'QM-001', NAME: 'Acido Sulfurico', VIEW_COUNT: 42 },
    { M_PRODUCT_ID: 1003, VALUE: 'QM-003', NAME: 'Sulfato de Cromo', VIEW_COUNT: 35 },
    { M_PRODUCT_ID: 1005, VALUE: 'QM-005', NAME: 'Sulfuro de Sodio', VIEW_COUNT: 28 },
    { M_PRODUCT_ID: 1002, VALUE: 'QM-002', NAME: 'Acido Formico', VIEW_COUNT: 22 },
    { M_PRODUCT_ID: 1006, VALUE: 'QM-006', NAME: 'Cal Hidratada', VIEW_COUNT: 18 },
    { M_PRODUCT_ID: 1008, VALUE: 'QM-008', NAME: 'Quebracho ATO', VIEW_COUNT: 15 },
    { M_PRODUCT_ID: 1010, VALUE: 'QM-010', NAME: 'Resina Acrilica', VIEW_COUNT: 11 },
    { M_PRODUCT_ID: 1009, VALUE: 'QM-009', NAME: 'Grasa Sulfonada', VIEW_COUNT: 9 },
  ]
}
