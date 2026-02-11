import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { certificates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { join } from 'path';

// DELETE /api/admin/certificates/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next 15
) {
  try {
    const resolvedParams = await params;
    const certId = parseInt(resolvedParams.id);

    if (isNaN(certId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // 1. Find certificate
    const cert = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, certId))
      .limit(1);

    if (cert.length === 0) {
      return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 });
    }

    const certificate = cert[0];

    // 2. Delete physical file
    if (certificate.certificatePath && certificate.certificatePath !== '#') {
      try {
        const absolutePath = join(process.cwd(), 'public', certificate.certificatePath);
        await unlink(absolutePath);
      } catch (fileError) {
        console.warn('File not found or already deleted:', fileError);
      }
    }

    // 3. Delete from database
    await db.delete(certificates).where(eq(certificates.id, certId));

    return NextResponse.json({ 
      success: true, 
      message: 'Certificado eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json({ error: 'Error al eliminar certificado' }, { status: 500 });
  }
}

// PATCH /api/admin/certificates/[id] - To reset certificate path (remove only the file association)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const certId = parseInt(resolvedParams.id);

    if (isNaN(certId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // 1. Find certificate
    const cert = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, certId))
      .limit(1);

    if (cert.length === 0) {
      return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 });
    }

    const certificate = cert[0];

    // 2. Delete physical file if exists
    if (certificate.certificatePath && certificate.certificatePath !== '#') {
      try {
        const absolutePath = join(process.cwd(), 'public', certificate.certificatePath);
        await unlink(absolutePath);
      } catch (fileError) {
        console.warn('File not found or already deleted:', fileError);
      }
    }

    // 3. Reset path in database
    await db.update(certificates)
      .set({ certificatePath: '#' })
      .where(eq(certificates.id, certId));

    return NextResponse.json({ 
      success: true, 
      message: 'Archivo eliminado, el registro permanece como pendiente' 
    });
  } catch (error) {
    console.error('Error resetting certificate:', error);
    return NextResponse.json({ error: 'Error al resetear certificado' }, { status: 500 });
  }
}
