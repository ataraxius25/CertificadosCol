import { db } from '@/lib/db';
import { students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cedula = searchParams.get('cedula');
  const documentType = searchParams.get('documentType');

  if (!cedula) {
    return NextResponse.json({ error: 'Cédula requerida' }, { status: 400 });
  }

  try {
    const student = await db.query.students.findFirst({
      where: (students, { eq, and }) => and(
        eq(students.cedula, cedula),
        documentType ? eq(students.documentType, documentType) : undefined
      ),
      with: { certificates: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
