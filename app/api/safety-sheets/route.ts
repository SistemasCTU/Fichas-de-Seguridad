import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import {
  getSafetySheetsMock,
  getSuppliersMock,
  insertAuditLogMock,
} from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const getSuppliersList = searchParams.get("suppliers");

    if (getSuppliersList === "true") {
      const suppliers = getSuppliersMock();
      return NextResponse.json({
        suppliers: suppliers.map((s) => ({
          id: s.C_BPARTNER_ID,
          code: s.VALUE,
          name: s.NAME,
        })),
      });
    }

    const sheets = getSafetySheetsMock(
      productId ? parseInt(productId) : undefined
    );

    return NextResponse.json({
      sheets: sheets.map((s) => ({
        id: s.Z_FICHASSEGURIDAD_ID,
        value: s.VALUE,
        name: s.NAME,
        description: s.DESCRIPTION,
        help: s.HELP,
        dateTrx: s.DATETRX,
        productId: s.M_PRODUCT_ID,
        productName: s.PRODUCT_NAME,
        productCode: s.PRODUCT_CODE,
        supplierId: s.C_BPARTNER_ID,
        supplierName: s.SUPPLIER_NAME,
        created: s.CREATED,
      })),
    });
  } catch (error) {
    console.error("Safety sheets error:", error);
    return NextResponse.json(
      { error: "Error al obtener fichas de seguridad" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Solo administradores pueden subir fichas" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const productId = parseInt(formData.get("productId") as string);
    const documentNo = formData.get("documentNo") as string;
    const pdfFile = formData.get("pdf") as File | null;

    if (!productId || !documentNo || !pdfFile) {
      return NextResponse.json(
        { error: "Producto, numero de documento y PDF son requeridos" },
        { status: 400 }
      );
    }

    if (pdfFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "El archivo debe ser un PDF" },
        { status: 400 }
      );
    }

    insertAuditLogMock({
      userId: session.user.id,
      action: "UPLOAD",
      tableName: "Z_FICHASSEGURIDAD",
      recordId: productId,
      description: `Subio ficha de seguridad ${documentNo} (demo)`,
    });

    return NextResponse.json({
      success: true,
      message: "Ficha de seguridad subida exitosamente (demo)",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error al subir la ficha de seguridad" },
      { status: 500 }
    );
  }
}
