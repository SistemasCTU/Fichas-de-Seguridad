'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction, logoutAction, getSessionAction } from '@/lib/actions'

export type UserRole = 'admin' | 'operador'

export interface User {
  id: number
  name: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const data = await getSessionAction()
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(username: string, password: string) {
    try {
      const result = await loginAction(username, password)

      if (!result.success) {
        return { success: false, error: result.error }
      }

      setUser(result.user)

      setTimeout(() => {
        router.push('/dashboard')
      }, 100)

      return { success: true }
    } catch {
      return { success: false, error: 'Error de conexion' }
    }
  }

  async function logout() {
    try {
      await logoutAction()
    } catch {
      // Continuar con logout aunque falle
    }
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
