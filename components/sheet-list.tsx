'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FileText, Search, Trash2, Download, Eye, Loader2 } from 'lucide-react'
import useSWR, { mutate } from 'swr'

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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SheetList() {
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data, isLoading } = useSWR('/api/safety-sheets', fetcher)

  const sheets: SafetySheet[] = data?.sheets || []

  const filteredSheets = sheets.filter(
    (s) =>
      s.productName?.toLowerCase().includes(search.toLowerCase()) ||
      s.productCode?.toLowerCase().includes(search.toLowerCase()) ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.value?.toLowerCase().includes(search.toLowerCase()) ||
      s.supplierName?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete() {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/safety-sheets/${deleteId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        mutate('/api/safety-sheets')
      }
    } catch (error) {
      console.error('Error deleting sheet:', error)
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Fichas Registradas
            </CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fichas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSheets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search
                ? 'No se encontraron fichas con esos criterios'
                : 'No hay fichas registradas'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="hidden md:table-cell">Proveedor</TableHead>
                    <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSheets.map((sheet) => (
                    <TableRow key={sheet.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {sheet.value}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{sheet.name}</div>
                        {sheet.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {sheet.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{sheet.productName}</div>
                        <div className="text-xs text-muted-foreground">{sheet.productCode}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{sheet.supplierName}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatDate(sheet.dateTrx)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver PDF"
                            onClick={() => window.open(`/api/safety-sheets/${sheet.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Descargar"
                            asChild
                          >
                            <a
                              href={`/api/safety-sheets/${sheet.id}`}
                              download={`${sheet.value}.pdf`}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar"
                            onClick={() => setDeleteId(sheet.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion desactivara la ficha de seguridad (soft delete). La ficha no sera
              eliminada permanentemente pero no estara disponible para los usuarios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
