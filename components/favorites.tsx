'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, TrendingUp, Heart, X } from 'lucide-react'
import useSWR from 'swr'
import { useFavorites } from '@/hooks/use-favorites'

interface Favorite {
  M_PRODUCT_ID: number
  VALUE: string
  NAME: string
  VIEW_COUNT: number
}

interface FavoritesProps {
  onSelectProduct: (product: { M_PRODUCT_ID: number; VALUE: string; NAME: string }) => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function Favorites({ onSelectProduct }: FavoritesProps) {
  const { data, isLoading } = useSWR('/api/favorites', fetcher)
  const { favorites: userFavorites, removeFavorite } = useFavorites()

  const frequentProducts: Favorite[] = data?.favorites || []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <Card key={i} className="h-fit">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-10 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const hasFrequent = frequentProducts.length > 0
  const hasUserFavorites = userFavorites.length > 0

  if (!hasFrequent && !hasUserFavorites) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Favoritos - Izquierda */}
      <Card className="h-fit">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            Mis Favoritos
            {hasUserFavorites && (
              <span className="text-xs font-normal bg-primary/10 text-primary rounded-full px-1.5 py-0.5 leading-none">
                {userFavorites.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {!hasUserFavorites ? (
            <div className="text-center py-6 text-muted-foreground">
              <Heart className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs font-medium">Sin favoritos aun</p>
              <p className="text-xs mt-0.5">
                Presiona el corazon en un producto para agregarlo.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {userFavorites.map((product) => (
                <div key={product.M_PRODUCT_ID} className="relative group">
                  <Button
                    variant="outline"
                    onClick={() => onSelectProduct(product)}
                    className="h-auto w-full justify-start gap-3 px-3 py-2 hover:bg-primary/5 hover:border-primary transition-all bg-transparent"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="text-xs font-medium truncate block">{product.NAME}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {product.VALUE}
                      </span>
                    </div>
                  </Button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFavorite(product.M_PRODUCT_ID)
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                    title="Quitar de favoritos"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frecuentes - Derecha */}
      <Card className="h-fit">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-secondary" />
            Productos Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {!hasFrequent ? (
            <div className="text-center py-6 text-muted-foreground">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs">No hay productos frecuentes aun.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {frequentProducts.map((product) => (
                <Button
                  key={product.M_PRODUCT_ID}
                  variant="outline"
                  onClick={() => onSelectProduct(product)}
                  className="h-auto w-full justify-start gap-3 px-3 py-2 hover:bg-primary/5 hover:border-primary transition-all bg-transparent"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 text-left flex-1">
                    <span className="text-xs font-medium truncate block">{product.NAME}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {product.VALUE}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {product.VIEW_COUNT} vistas
                  </span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
