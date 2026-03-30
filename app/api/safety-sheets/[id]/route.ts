import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { insertAuditLogMock, getSafetySheetsMock } from "@/lib/mock-data";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const sheetId = parseInt(id);

    const allSheets = getSafetySheetsMock();
    const sheet = allSheets.find(
      (s) => s.Z_FICHASSEGURIDAD_ID === sheetId
    );

    if (!sheet) {
      return NextResponse.json(
        { error: "Ficha no encontrada" },
        { status: 404 }
      );
    }

    insertAuditLogMock({
      userId: session.user.id,
      action: "VIEW",
      tableName: "Z_FICHASSEGURIDAD",
      recordId: sheetId,
      description: `Visualizo ficha ${sheet.VALUE} - ${sheet.PRODUCT_NAME}`,
    });

    // In demo mode, serve the sample PDF from /public
    // In production, this would fetch the BLOB from Oracle DB
    try {
      const pdfPath = path.join(process.cwd(), "public", "sample-safety-sheet.pdf");
      const pdfBuffer = await readFile(pdfPath);
      
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${sheet.VALUE}.pdf"`,
        },
      });
    } catch {
      // If sample PDF doesn't exist, return a message
      return NextResponse.json({
        message: "Modo demo: PDF de ejemplo no encontrado. En produccion se devolveria el BLOB desde Oracle.",
        sheet: {
          value: sheet.VALUE,
          name: sheet.NAME,
          productName: sheet.PRODUCT_NAME,
        },
      });
    }
  } catch (error) {
    console.error("Sheet detail error:", error);
    return NextResponse.json(
      { error: "Error al obtener la ficha" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Solo administradores pueden eliminar fichas" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const sheetId = parseInt(id);

    insertAuditLogMock({
      userId: session.user.id,
      action: "DELETE",
      tableName: "Z_FICHASSEGURIDAD",
      recordId: sheetId,
      description: `Elimino ficha ID ${sheetId} (demo)`,
    });

    return NextResponse.json({
      success: true,
      message: "Ficha eliminada exitosamente (demo)",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Error al eliminar la ficha" },
      { status: 500 }
    );
  }
}
