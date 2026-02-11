import { db } from '@/lib/db';
import { students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params as per Next.js 15+ requirements
    const { id } = await params;
    const body = await req.json();
    
    // Validar ID
    const studentId = Number(id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const updatedStudent = await db.update(students)
      .set({
        cedula: body.cedula,
        documentType: body.documentType, 
        firstName: body.firstName,
        lastName: body.lastName,
        // email can be updated if provided
        ...(body.email && { email: body.email }),
      })
      .where(eq(students.id, studentId))
      .returning();

    if (updatedStudent.length === 0) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updatedStudent[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const studentId = Number(id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await db.delete(students).where(eq(students.id, studentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
