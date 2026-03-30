import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createToken } from '@/lib/auth'
import { authenticateUserMock, getUserRoleMock, insertAuditLogMock } from '@/lib/mock-data'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contrasena son requeridos' },
        { status: 400 },
      )
    }

    const user = authenticateUserMock(username, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales invalidas' },
        { status: 401 },
      )
    }

    const role = getUserRoleMock(user.id)

    const sessionUser = {
      id: user.id,
      name: user.name,
      role,
    }

    const token = await createToken(sessionUser)

    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })

    insertAuditLogMock({
      userId: user.id,
      action: 'LOGIN',
      tableName: 'AD_USER',
      recordId: user.id,
      description: `Inicio de sesion: ${user.name}`,
    })

    return NextResponse.json({
      success: true,
      user: sessionUser,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
