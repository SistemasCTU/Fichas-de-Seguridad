'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, FileText, Loader2, Heart, X } from 'lucide-react'
import useSWR from 'swr'
import { useFavorites } from '@/hooks/use-favorites'
import { searchProducts } from '@/lib/actions'

interface Product {
  M_PRODUCT_ID: number
  VALUE: string
  NAME: string
  DESCRIPTION?: string
  CATEGORY_NAME?: string
}

interface ProductSearchProps {
  onSelectProduct: (product: Product) => void
}

export function ProductSearch({ onSelectProduct }: ProductSearchProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: products = [], isLoading } = useSWR(
    debouncedSearch.length >= 2 ? ['products', debouncedSearch] : null,
    ([, q]) => searchProducts(q),
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(product: Product) {
    onSelectProduct(product)
    setSearch('')
    setIsOpen(false)
  }

  function handleClear() {
    setSearch('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const showResults = isOpen && debouncedSearch.length >= 2

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar por nombre, codigo o descripcion..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (search.length >= 2) setIsOpen(true)
          }}
          className="pl-12 pr-12 h-14 text-lg border-2 focus:border-primary"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
          {search.length > 0 && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showResults && (
        <Card className="absolute z-50 w-full mt-2 shadow-xl border-2 max-h-[420px] overflow-hidden flex flex-col">
          <CardHeader className="py-3 px-4 border-b shrink-0">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>
                {isLoading
                  ? 'Buscando...'
                  : products.length === 0
                    ? 'Sin resultados'
                    : `${products.length} producto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`}
              </span>
              {debouncedSearch && (
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {`"${debouncedSearch}"`}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Buscando productos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium">No se encontraron productos</p>
                <p className="text-sm mt-1">Intente con otro termino de busqueda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead className="w-24">Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Descripcion</TableHead>
                    <TableHead className="w-12 text-center">Fav</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow
                      key={product.M_PRODUCT_ID}
                      className="cursor-pointer hover:bg-primary/5 transition-colors"
                      onClick={() => handleSelect(product)}
                    >
                      <TableCell className="text-center text-muted-foreground text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          {product.VALUE}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                          <span className="font-medium text-sm">{product.NAME}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {product.DESCRIPTION || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(product)
                          }}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors inline-flex"
                          title={
                            isFavorite(product.M_PRODUCT_ID)
                              ? 'Quitar de favoritos'
                              : 'Agregar a favoritos'
                          }
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              isFavorite(product.M_PRODUCT_ID)
                                ? 'fill-red-500 text-red-500'
                                : 'text-muted-foreground hover:text-red-500'
                            }`}
                          />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
