/**
 * COMENTADO: Pagina de administracion de fichas.
 * La gestion de fichas (crear, eliminar) se hace directamente en la base de datos / iDempiere.
 * Descomentar cuando se habilite la gestion desde la interfaz web.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        <p>Administracion deshabilitada. La gestion se realiza directamente en la base de datos.</p>
      </main>
    </div>
  )
}

/*
  CODIGO ORIGINAL COMENTADO - Descomentar para habilitar administracion web:

  import { useState } from 'react'
  import { UploadSheet } from '@/components/upload-sheet'
  import { SheetList } from '@/components/sheet-list'
  import { Button } from '@/components/ui/button'
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import { Loader2, Upload, List, AlertTriangle } from 'lucide-react'
  import { Card, CardContent } from '@/components/ui/card'

  // ... (ver git history para el codigo completo)
*/
