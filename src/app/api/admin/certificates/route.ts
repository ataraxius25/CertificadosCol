import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { certificates, students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/certificates?studentId=123
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (studentId) {
      // Get certificates for specific student
      const certs = await db
        .select()
        .from(certificates)
        .where(eq(certificates.studentId, parseInt(studentId)));

      return NextResponse.json(certs);
    }

    // Get all certificates (with student info)
    const allCerts = await db
      .select({
        id: certificates.id,
        studentId: certificates.studentId,
        courseName: certificates.courseName,
        certificatePath: certificates.certificatePath,
        graduationYear: certificates.graduationYear,
        createdAt: certificates.createdAt,
        studentCedula: students.cedula,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
      })
      .from(certificates)
      .leftJoin(students, eq(certificates.studentId, students.id));

    return NextResponse.json(allCerts);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Error al obtener certificados' }, { status: 500 });
  }
}

// POST /api/admin/certificates
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, courseName, certificatePath, graduationYear } = body;

    // Validate required fields
    if (!studentId || !courseName || !certificatePath || !graduationYear) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    // Create certificate
    const newCert = await db.insert(certificates).values({
      studentId,
      courseName,
      certificatePath,
      graduationYear,
    }).returning();

    return NextResponse.json(newCert[0], { status: 201 });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json({ error: 'Error al crear certificado' }, { status: 500 });
  }
}
