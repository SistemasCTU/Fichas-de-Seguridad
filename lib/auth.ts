import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fichas-seguridad-secret-key-2024'
)

export type UserRole = 'admin' | 'operador'

export interface SessionUser {
  id: number
  name: string
  role: UserRole
}

export interface Session {
  user: SessionUser
  expires: Date
}

// Create JWT token
export async function createToken(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(JWT_SECRET)
  
  return token
}

// Verify JWT token
export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const user = payload.user as SessionUser
    return {
      user,
      expires: new Date(payload.exp! * 1000)
    }
  } catch {
    return null
  }
}

// Get session from cookies
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  
  if (!token) return null
  
  return verifyToken(token)
}

// Simple password hash comparison (for demo - in production use bcrypt with Oracle stored hashes)
export function verifyPassword(inputPassword: string, storedPassword: string): boolean {
  // The Oracle DB may store passwords in different formats
  // Adjust this based on how passwords are stored in AD_USER
  return inputPassword === storedPassword
}

// Role-based access control
export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function canManageSheets(role: UserRole): boolean {
  return role === 'admin'
}

export function canViewSheets(role: UserRole): boolean {
  return role === 'admin' || role === 'operador'
}
