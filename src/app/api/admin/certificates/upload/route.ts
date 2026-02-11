
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { certificates, students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const studentId = formData.get('studentId');
    const courseName = formData.get('courseName');
    const graduationYear = formData.get('graduationYear');
    const file = formData.get('file') as File;

    if (!studentId || !courseName || !graduationYear || !file) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verify student exists
    const student = await db.query.students.findFirst({
        where: eq(students.id, parseInt(studentId.toString()))
    });

    if (!student) {
        return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    // --- Validation: Filename must contain student's Cedula ---
    const uploadedFileName = file.name || '';
    
    // Normalize string: removing spaces, dashes, dots to check strict inclusion
    const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');
    const safeFileName = normalize(uploadedFileName);
    const safeCedula = normalize(student.cedula);

    // Also check raw inclusion just in case file is 'CC 12345.pdf' and cedula is '12345'
    const containsCedula = uploadedFileName.includes(student.cedula) || safeFileName.includes(safeCedula);

    if (!containsCedula) {
         return NextResponse.json({ 
             error: `El nombre del archivo "${uploadedFileName}" no coincide con la cédula del estudiante (${student.cedula}). Por favor verifique.` 
         }, { status: 400 });
    }
    // ---------------------------------------------------------

    const uploadDir = join(process.cwd(), 'public', 'certificates');
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Ignore if exists
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename using timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = `cert_${student.cedula}_${uniqueSuffix}.pdf`;
    const path = join(uploadDir, safeName);
    
    await writeFile(path, buffer);

    const certificateId = formData.get('certificateId');

    if (certificateId && certificateId !== 'null') {
        const idToUpdate = parseInt(certificateId.toString());
        // Update existing certificate
        const updatedCert = await db.update(certificates)
            .set({
                certificatePath: `/certificates/${safeName}`, // Update path
                // Also update metadata if changed
                courseName: courseName.toString(),
                graduationYear: parseInt(graduationYear.toString()),
            })
            .where(eq(certificates.id, idToUpdate))
            .returning();
            
        return NextResponse.json(updatedCert[0]);
    } else {
        // Create certificate record
        const newCert = await db.insert(certificates).values({
          studentId: parseInt(studentId.toString()),
          courseName: courseName.toString(),
          graduationYear: parseInt(graduationYear.toString()),
          certificatePath: `/certificates/${safeName}`,
        }).returning();
    
        return NextResponse.json(newCert[0]);
    }

  } catch (error) {
    console.error('Error uploading certificate:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
