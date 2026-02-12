'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { ProductSearch } from '@/components/product-search'
import { Favorites } from '@/components/favorites'
import { SafetySheetViewer } from '@/components/safety-sheet-viewer'
import { Loader2 } from 'lucide-react'

interface Product {
  M_PRODUCT_ID: number
  VALUE: string
  NAME: string
  DESCRIPTION?: string
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {selectedProduct ? (
          <SafetySheetViewer
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
          />
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Buscar Fichas de Seguridad
              </h2>
              <p className="text-muted-foreground">
                Ingrese el nombre, código o descripción del producto químico
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <ProductSearch onSelectProduct={setSelectedProduct} />
            </div>

            <div className="mt-8">
              <Favorites onSelectProduct={setSelectedProduct} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
