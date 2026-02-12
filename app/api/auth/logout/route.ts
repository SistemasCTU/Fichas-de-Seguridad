import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST /api/auth/logout
export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
