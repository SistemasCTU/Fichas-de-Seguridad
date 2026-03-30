'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { useViewTracker } from '@/hooks/use-view-tracker'
import { getSafetySheets, getSafetySheetPdf } from '@/lib/actions'

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
  dateTrx: string | null
  productName: string
  productCode: string
  supplierName: string
  created: string | null
}

interface SafetySheetViewerProps {
  product: Product
  onBack: () => void
}

export function SafetySheetViewer({ product, onBack }: SafetySheetViewerProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { trackView } = useViewTracker()
  const productIsFavorite = isFavorite(product.M_PRODUCT_ID)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const { data: sheets = [], isLoading } = useSWR(
    ['safety-sheets', product.M_PRODUCT_ID],
    ([, productId]) => getSafetySheets({ productId }),
  )

  const sheet: SafetySheet | null = (sheets as SafetySheet[])[0] || null

  // Cargar PDF via Server Action cuando hay una ficha
  const loadPdf = useCallback(async (sheetId: number) => {
    setPdfLoading(true)
    setPdfError(false)
    try {
      const result = await getSafetySheetPdf(sheetId)
      // Convertir base64 a Blob URL
      const byteCharacters = atob(result.base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setPdfBlobUrl(url)
    } catch {
      setPdfError(true)
    } finally {
      setPdfLoading(false)
    }
  }, [])

  useEffect(() => {
    if (sheet) {
      loadPdf(sheet.id)
      trackView(product)
    }
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet?.id])

  function handlePrint() {
    if (!pdfBlobUrl) return
    const printWindow = window.open(pdfBlobUrl, '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    }
  }

  function handleDownload() {
    if (!sheet || !pdfBlobUrl) return
    const link = document.createElement('a')
    link.href = pdfBlobUrl
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

        {sheet && pdfBlobUrl && (
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
          {/* Sheet metadata */}
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

          {/* PDF viewer */}
          {pdfLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Cargando PDF...</span>
            </div>
          ) : pdfError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileWarning className="h-10 w-10 mb-3" />
                <p className="font-medium text-foreground mb-1">No se pudo cargar el PDF</p>
                <p className="text-sm">Verifique la conexion a la base de datos Oracle.</p>
              </CardContent>
            </Card>
          ) : pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              className="w-full border border-border rounded-md"
              style={{ height: 'calc(100vh - 200px)' }}
              title={`PDF - ${sheet.name}`}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
