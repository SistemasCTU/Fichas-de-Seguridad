'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  Printer,
  Calendar,
  Building2,
  AlertCircle,
  Loader2,
  Heart,
  FileWarning,
} from 'lucide-react'
import useSWR from 'swr'
import { useFavorites } from '@/hooks/use-favorites'

interface Product {
  M_PRODUCT_ID: number
  VALUE: string
  NAME: string
  DESCRIPTION?: string
}

interface SafetySheet {
  id: number
  value: string
  name: string
  description: string
  help: string
  dateTrx: string
  productName: string
  productCode: string
  supplierName: string
  created: string
}

interface SafetySheetViewerProps {
  product: Product
  onBack: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SafetySheetViewer({ product, onBack }: SafetySheetViewerProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const productIsFavorite = isFavorite(product.M_PRODUCT_ID)
  const [pdfError, setPdfError] = useState(false)

  const { data, isLoading } = useSWR(
    `/api/safety-sheets?productId=${product.M_PRODUCT_ID}`,
    fetcher,
  )

  const sheets: SafetySheet[] = data?.sheets || []
  // Use the first (most recent) sheet for this product
  const sheet = sheets[0] || null

  function handlePrint() {
    if (!sheet) return
    const pdfUrl = `/api/safety-sheets/${sheet.id}`
    const printWindow = window.open(pdfUrl, '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    }
  }

  function handleDownload() {
    if (!sheet) return
    const link = document.createElement('a')
    link.href = `/api/safety-sheets/${sheet.id}`
    link.download = `${sheet.value}-${product.NAME}.pdf`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="shrink-0 bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{product.NAME}</h2>
              <p className="text-sm text-muted-foreground">Codigo: {product.VALUE}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(product)}
              title={productIsFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              className="shrink-0"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  productIsFavorite
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              />
            </Button>
          </div>
        </div>

        {sheet && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        )}
      </div>

      {!sheet ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Sin fichas de seguridad
            </h3>
            <p className="text-muted-foreground text-center">
              Este producto no tiene fichas de seguridad registradas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Sheet metadata bar */}
          <Card>
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {sheet.value}
                  </Badge>
                  <span className="font-medium text-foreground">{sheet.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{sheet.supplierName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {sheet.dateTrx
                      ? new Date(sheet.dateTrx).toLocaleDateString('es-EC')
                      : 'N/A'}
                  </span>
                </div>
                {sheet.help && (
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-xs">{sheet.help}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PDF viewer - full width */}
          <Card>
            <CardContent className="p-0">
              {pdfError ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileWarning className="h-10 w-10 mb-3" />
                  <p className="font-medium text-foreground mb-1">No se pudo cargar el PDF</p>
                  <p className="text-sm">
                    En produccion, el PDF se carga desde la base de datos Oracle.
                  </p>
                </div>
              ) : (
                <iframe
                  src={`/api/safety-sheets/${sheet.id}`}
                  className="w-full rounded-lg"
                  style={{ minHeight: '70vh' }}
                  title={`PDF - ${sheet.name}`}
                  onError={() => setPdfError(true)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
