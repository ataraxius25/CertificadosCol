import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { students, certificates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'certificates');
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Ignore if exists
    }

    let processed = 0;
    let errors: string[] = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // 1. Extract and clean cedula from filename
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const cedula = originalName.replace(/[^a-zA-Z0-9]/g, '');

        if (!cedula) {
          errors.push(`Nombre inválido (vacío después de limpiar): ${file.name}`);
          continue;
        }

        // 2. Find student by cedula
        const student = await db.query.students.findFirst({
           where: eq(students.cedula, cedula)
        });

        if (!student) {
          errors.push(`Estudiante no encontrado para cédula: ${cedula}`);
          continue;
        }

        // 3. Find pending certificate (certificatePath = '#')
        const pendingCert = await db.query.certificates.findFirst({
          where: and(
            eq(certificates.studentId, student.id),
            eq(certificates.certificatePath, '#')
          )
        });

        if (!pendingCert) {
          errors.push(`No hay certificados pendientes para ${student.firstName} ${student.lastName} (${cedula})`);
          continue;
        }

        // 4. Save file with unique name (cert_id.pdf)
        const safeName = `cert_${pendingCert.id}.pdf`;
        const path = join(uploadDir, safeName);
        await writeFile(path, buffer);

        // 5. Update certificate record
        await db.update(certificates)
          .set({ certificatePath: `/certificates/${safeName}` })
          .where(eq(certificates.id, pendingCert.id));

        processed++;
      } catch (err) {
        console.error(err);
        errors.push(`Error en ${file.name}`);
      }
    }

    return NextResponse.json({ processed, errors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
