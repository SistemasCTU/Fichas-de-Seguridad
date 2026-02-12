import { NextResponse } from 'next/server'
import { getSuppliersMock } from '@/lib/mock-data'

export async function GET() {
  try {
    const suppliers = getSuppliersMock()
    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Error getting suppliers:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
      { status: 500 },
    )
  }
}
