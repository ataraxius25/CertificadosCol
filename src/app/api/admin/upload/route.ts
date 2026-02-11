import { db } from '@/lib/db';
import { students, certificates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se ha subido ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 });
    }

    let synced = 0;
    let errors: { row: number, error: string, data: any }[] = [];

    // Expected columns: Tipo Documento, Documento, Nombres, Apellidos, Curso, Año
    for (const [index, row] of rows.entries()) {
      let documentType = String(row['Tipo Documento'] || row['tipo_documento'] || row['TipoDocumento'] || row['TIPO_DOCUMENTO'] || 'CC').trim().toUpperCase();
      
      // Normalize document type: accept both full text and abbreviations
      if (documentType.includes('CIUDADAN') || documentType === 'CC') {
        documentType = 'CC';
      } else if (documentType.includes('EXTRANJER') || documentType === 'CE') {
        documentType = 'CE';
      } else if (documentType.includes('PROTECCI') || documentType.includes('TEMPORAL') || documentType === 'PPT') {
        documentType = 'PPT';
      } else if (documentType.includes('PASAPORTE') || documentType === 'PPN') {
        documentType = 'PPN';
      } else if (!documentType || documentType === '') {
        documentType = 'CC'; // Default
      }
      // If none match, keep original value (will be validated later if needed)
      
      const cedula = String(row['Documento'] || row['documento'] || row['CEDULA'] || row['cedula'] || '').trim();
      const firstName = (row['Nombres'] || row['nombres'] || row['NOMBRES'] || '').trim();
      const lastName = (row['Apellidos'] || row['apellidos'] || row['APELLIDOS'] || '').trim();
      const email = (row['Correo'] || row['correo'] || row['Email'] || row['email'] || '').trim();
      const courseName = (row['Curso'] || row['curso'] || row['CURSO'] || row['Programa'] || row['programa'] || '').trim();
      const year = row['Año'] || row['año'] || row['AÑO'] || row['Grado'] || row['grado'] || row['GRADO'] || row['Anio'] || row['año_graduacion'] || row['ano_graduacion'] || row['year'];

      // Validate required fields (email is optional)
      if (!documentType || !cedula || !firstName || !lastName || !courseName || !year) {
        const missingFields = [];
        if (!documentType) missingFields.push('Tipo Documento');
        if (!cedula) missingFields.push('Documento');
        if (!firstName) missingFields.push('Nombres');
        if (!lastName) missingFields.push('Apellidos');
        if (!courseName) missingFields.push('Curso');
        if (!year) missingFields.push('Año');
        
        errors.push({ 
          row: index + 2, // +2 because Excel starts at 1 and has header
          error: `Faltan campos obligatorios: ${missingFields.join(', ')}`, 
          data: { documentType, cedula, firstName, lastName, email, courseName, year } 
        });
        continue;
      }

      try {
        // Step 1: Find or create student
        let student = await db.query.students.findFirst({
          where: eq(students.cedula, cedula)
        });

        if (!student) {
          // Create new student
          const newStudent = await db.insert(students).values({
            cedula,
            documentType,
            firstName,
            lastName,
            email: email || null,
          }).returning();
          student = newStudent[0];
        } else {
          // Update student info (in case names changed)
          await db.update(students)
            .set({ 
              documentType,
              firstName, 
              lastName, 
              email: email || student.email 
            })
            .where(eq(students.id, student.id));
        }

        // Step 2: Create certificate record
        await db.insert(certificates).values({
          studentId: student.id,
          courseName,
          certificatePath: '#', // Placeholder until PDF is uploaded
          graduationYear: Number(year),
        });

        synced++;
      } catch (err) {
        console.error(err);
        errors.push({ 
          row: index + 2, 
          error: 'Error de base de datos', 
          data: { cedula, courseName } 
        });
      }
    }

    return NextResponse.json({
      total: rows.length,
      synced,
      errors
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error procesando el archivo' }, { status: 500 });
  }
}
