import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { getAuditLogsMock } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Solo administradores pueden ver el registro de auditoria' },
        { status: 403 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || undefined
    const search = searchParams.get('search') || undefined

    const logs = getAuditLogsMock({ action, search })

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.AUDIT_ID,
        userId: log.AD_USER_ID,
        userName: log.USER_NAME,
        action: log.ACTION,
        tableName: log.TABLE_NAME,
        recordId: log.RECORD_ID,
        description: log.DESCRIPTION,
        created: log.CREATED,
        AUDIT_ID: log.AUDIT_ID,
        AD_USER_ID: log.AD_USER_ID,
        USER_NAME: log.USER_NAME,
        ACTION: log.ACTION,
        TABLE_NAME: log.TABLE_NAME,
        RECORD_ID: log.RECORD_ID,
        DESCRIPTION: log.DESCRIPTION,
        CREATED: log.CREATED,
      })),
    })
  } catch (error) {
    console.error('Audit error:', error)
    return NextResponse.json(
      { error: 'Error al obtener registros de auditoria' },
      { status: 500 },
    )
  }
}
