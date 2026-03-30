'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Heart, X, TrendingUp, Eye } from 'lucide-react'
import { useFavorites } from '@/hooks/use-favorites'
import { useViewTracker } from '@/hooks/use-view-tracker'

interface FavoritesProps {
  onSelectProduct: (product: { M_PRODUCT_ID: number; VALUE: string; NAME: string }) => void
}

export function Favorites({ onSelectProduct }: FavoritesProps) {
  const { favorites: userFavorites, removeFavorite } = useFavorites()
  const { getMostViewed } = useViewTracker()

  const mostViewed = getMostViewed(10)
  const hasUserFavorites = userFavorites.length > 0
  const hasMostViewed = mostViewed.length > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {/* Favoritos */}
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
              <p className="text-xs mt-0.5">Presiona el corazon en un producto para agregarlo.</p>
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
                      <span className="font-mono text-[10px] text-muted-foreground">{product.VALUE}</span>
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

      {/* Productos Frecuentes */}
      <Card className="h-fit">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" />
            Productos Frecuentes
            {hasMostViewed && (
              <span className="text-xs font-normal bg-primary/10 text-primary rounded-full px-1.5 py-0.5 leading-none">
                {mostViewed.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {!hasMostViewed ? (
            <div className="text-center py-6 text-muted-foreground">
              <Eye className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs font-medium">Sin productos frecuentes</p>
              <p className="text-xs mt-0.5">Los productos que consultes frecuentemente apareceran aqui.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {mostViewed.map((record) => (
                <Button
                  key={record.M_PRODUCT_ID}
                  variant="outline"
                  onClick={() =>
                    onSelectProduct({
                      M_PRODUCT_ID: record.M_PRODUCT_ID,
                      VALUE: record.VALUE,
                      NAME: record.NAME,
                    })
                  }
                  className="h-auto w-full justify-start gap-3 px-3 py-2 hover:bg-primary/5 hover:border-primary transition-all bg-transparent"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 text-left flex-1">
                    <span className="text-xs font-medium truncate block">{record.NAME}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{record.VALUE}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <Eye className="h-3 w-3" />
                    {record.viewCount}
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
