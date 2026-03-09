import useSWR from 'swr'

interface ViewRecord {
  M_PRODUCT_ID: number
  VALUE: string
  NAME: string
  viewCount: number
  lastViewed: number
}

const STORAGE_KEY = 'safety-sheets-views'
const MAX_TRACKED = 50

function getViewsFromStorage(): ViewRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveViewsToStorage(views: ViewRecord[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
  } catch {
    // Storage full or unavailable
  }
}

export function useViewTracker() {
  const { data, mutate } = useSWR<ViewRecord[]>(
    'local:view-tracker',
    () => getViewsFromStorage(),
    {
      fallbackData: [],
      revalidateOnFocus: false,
    }
  )

  const views = data || []

  function trackView(product: { M_PRODUCT_ID: number; VALUE: string; NAME: string }) {
    const existing = views.find((v) => v.M_PRODUCT_ID === product.M_PRODUCT_ID)
    let updated: ViewRecord[]

    if (existing) {
      updated = views.map((v) =>
        v.M_PRODUCT_ID === product.M_PRODUCT_ID
          ? { ...v, viewCount: v.viewCount + 1, lastViewed: Date.now(), NAME: product.NAME, VALUE: product.VALUE }
          : v
      )
    } else {
      updated = [
        ...views,
        {
          M_PRODUCT_ID: product.M_PRODUCT_ID,
          VALUE: product.VALUE,
          NAME: product.NAME,
          viewCount: 1,
          lastViewed: Date.now(),
        },
      ]
    }

    // Limitar a los ultimos MAX_TRACKED productos
    if (updated.length > MAX_TRACKED) {
      updated = updated
        .sort((a, b) => b.lastViewed - a.lastViewed)
        .slice(0, MAX_TRACKED)
    }

    saveViewsToStorage(updated)
    mutate(updated, false)
  }

  function getMostViewed(limit = 10): ViewRecord[] {
    return [...views]
      .filter((v) => v.viewCount >= 2)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit)
  }

  return {
    views,
    trackView,
    getMostViewed,
  }
}
