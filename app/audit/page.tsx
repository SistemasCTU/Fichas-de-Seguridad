/**
 * COMENTADO: Pagina de auditoria.
 * La auditoria se consulta directamente en la base de datos (tabla AUDIT_LOG).
 * Descomentar cuando se habilite la visualizacion desde la interfaz web.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'

export default function AuditPage() {
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
        <p>Auditoria deshabilitada. Consulte directamente la tabla AUDIT_LOG en la base de datos.</p>
      </main>
    </div>
  )
}

/*
  CODIGO ORIGINAL COMENTADO - Descomentar para habilitar auditoria web:

  import { AuditLogs } from '@/components/audit-logs'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent } from '@/components/ui/card'
  import { Loader2, AlertTriangle } from 'lucide-react'

  // ... (ver git history para el codigo completo)
*/
