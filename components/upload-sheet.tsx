'use client'

import React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Loader2, CheckCircle } from 'lucide-react'
import useSWR from 'swr'

interface UploadSheetProps {
  onSuccess?: () => void
}

interface Product {
  M_PRODUCT_ID: number
  VALUE: string
  NAME: string
}

interface Supplier {
  C_BPARTNER_ID: number
  VALUE: string
  NAME: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function UploadSheet({ onSuccess }: UploadSheetProps) {
  const [productId, setProductId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [help, setHelp] = useState('')
  const [dateTrx, setDateTrx] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: productsData } = useSWR('/api/products', fetcher)
  const { data: suppliersData } = useSWR('/api/suppliers', fetcher)

  const products: Product[] = productsData?.products || []
  const suppliers: Supplier[] = suppliersData?.suppliers || []

  function resetForm() {
    setProductId('')
    setSupplierId('')
    setName('')
    setValue('')
    setDescription('')
    setHelp('')
    setDateTrx('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!productId || !supplierId || !name || !value) {
      setError('Complete todos los campos requeridos')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('productId', productId)
      formData.append('supplierId', supplierId)
      formData.append('name', name)
      formData.append('value', value)
      formData.append('description', description)
      formData.append('help', help)
      formData.append('dateTrx', dateTrx || new Date().toISOString())

      const res = await fetch('/api/safety-sheets', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la ficha')
      }

      setSuccess(true)
      resetForm()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la ficha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Registrar Ficha de Seguridad
        </CardTitle>
        <CardDescription>
          Complete el formulario para registrar una nueva ficha en Z_FICHASSEGURIDAD. El PDF se
          adjunta desde iDempiere (AD_ATTACHMENT).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Ficha de seguridad creada exitosamente</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Product */}
            <div className="space-y-2">
              <Label htmlFor="product">Producto *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.M_PRODUCT_ID} value={p.M_PRODUCT_ID.toString()}>
                      {p.VALUE} - {p.NAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier */}
            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor (Casa Quimica) *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.C_BPARTNER_ID} value={s.C_BPARTNER_ID.toString()}>
                      {s.NAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value (code) */}
            <div className="space-y-2">
              <Label htmlFor="value">Codigo (VALUE) *</Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ej: FS-001"
                maxLength={40}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la ficha de seguridad"
                maxLength={60}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="dateTrx">Fecha de la ficha</Label>
              <Input
                id="dateTrx"
                type="date"
                value={dateTrx}
                onChange={(e) => setDateTrx(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripcion corta"
              maxLength={255}
            />
          </div>

          {/* Help / Notes */}
          <div className="space-y-2">
            <Label htmlFor="help">Notas (HELP)</Label>
            <Textarea
              id="help"
              value={help}
              onChange={(e) => setHelp(e.target.value)}
              placeholder="Notas adicionales, informacion de peligrosidad, etc."
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
              Limpiar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Registrar Ficha
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
