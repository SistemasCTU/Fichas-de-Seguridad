import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMostViewedProductsMock } from '@/lib/mock-data'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const products = getMostViewedProductsMock()

    return NextResponse.json({
      favorites: products.map((p) => ({
        id: p.M_PRODUCT_ID,
        code: p.VALUE,
        name: p.NAME,
        viewCount: p.VIEW_COUNT,
        M_PRODUCT_ID: p.M_PRODUCT_ID,
        VALUE: p.VALUE,
        NAME: p.NAME,
        VIEW_COUNT: p.VIEW_COUNT,
      })),
    })
  } catch (error) {
    console.error('Favorites error:', error)
    return NextResponse.json(
      { error: 'Error al obtener favoritos' },
      { status: 500 },
    )
  }
}
