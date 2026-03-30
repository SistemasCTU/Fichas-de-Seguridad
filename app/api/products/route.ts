import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getProductsMock } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined

    const products = getProductsMock(search)

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.M_PRODUCT_ID,
        code: p.VALUE,
        name: p.NAME,
        description: p.DESCRIPTION,
        category: p.CATEGORY_NAME,
        M_PRODUCT_ID: p.M_PRODUCT_ID,
        VALUE: p.VALUE,
        NAME: p.NAME,
        DESCRIPTION: p.DESCRIPTION,
      })),
    })
  } catch (error) {
    console.error('Products error:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 },
    )
  }
}
