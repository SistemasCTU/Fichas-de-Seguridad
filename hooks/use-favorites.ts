import useSWR from 'swr'

interface FavoriteProduct {
  M_PRODUCT_ID: number
  VALUE: string
  NAME: string
}

const STORAGE_KEY = 'safety-sheets-favorites'

function getFavoritesFromStorage(): FavoriteProduct[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveFavoritesToStorage(favorites: FavoriteProduct[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch {
    // Storage full or unavailable
  }
}

export function useFavorites() {
  const { data, mutate } = useSWR<FavoriteProduct[]>(
    'local:favorites',
    () => getFavoritesFromStorage(),
    {
      fallbackData: [],
      revalidateOnFocus: false,
    }
  )

  const favorites = data || []

  function addFavorite(product: FavoriteProduct) {
    const exists = favorites.some((f) => f.M_PRODUCT_ID === product.M_PRODUCT_ID)
    if (exists) return

    const updated = [
      ...favorites,
      { M_PRODUCT_ID: product.M_PRODUCT_ID, VALUE: product.VALUE, NAME: product.NAME },
    ]
    saveFavoritesToStorage(updated)
    mutate(updated, false)
  }

  function removeFavorite(productId: number) {
    const updated = favorites.filter((f) => f.M_PRODUCT_ID !== productId)
    saveFavoritesToStorage(updated)
    mutate(updated, false)
  }

  function toggleFavorite(product: FavoriteProduct) {
    const exists = favorites.some((f) => f.M_PRODUCT_ID === product.M_PRODUCT_ID)
    if (exists) {
      removeFavorite(product.M_PRODUCT_ID)
    } else {
      addFavorite(product)
    }
  }

  function isFavorite(productId: number) {
    return favorites.some((f) => f.M_PRODUCT_ID === productId)
  }

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  }
}
