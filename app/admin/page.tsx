'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { UploadSheet } from '@/components/upload-sheet'
import { SheetList } from '@/components/sheet-list'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Upload, List, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
    if (!loading && user && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, loading, isAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
              <p className="text-muted-foreground mb-4">
                Solo los administradores pueden acceder a esta página.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  function handleUploadSuccess() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Administración de Fichas
          </h1>
          <p className="text-muted-foreground">
            Gestione las fichas de seguridad de productos químicos
          </p>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Fichas Existentes
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir Nueva
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <SheetList key={refreshKey} />
          </TabsContent>

          <TabsContent value="upload">
            <UploadSheet onSuccess={handleUploadSuccess} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
