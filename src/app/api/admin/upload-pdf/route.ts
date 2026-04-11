import { NextResponse } from 'next/server';
import { uploadToDriveAndSheet } from '@/lib/google-api';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
    }

    let processed = 0;
    let errors: string[] = [];

    for (const file of files) {
      try {
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        
        // --- PARSER INTELIGENTE DE NOMBRE DE ARCHIVO ---
        // Esperamos: CEDULA_CURSO_AÑO.pdf o simplemente CEDULA.pdf
        // Usamos "_" como separador preferido, pero también "-" o " "
        const parts = originalName.split(/[_\-]/);
        
        const cedula = parts[0]?.trim();
        const courseName = parts[1]?.trim();
        const graduationYear = parts[2]?.trim();

        if (!cedula) {
          errors.push(`Nombre inválido (faltan datos): ${file.name}`);
          continue;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');

        // Enviamos los metadatos para que Google Sheets haga el match inteligente
        await uploadToDriveAndSheet(file.name, base64, {
          cedula,
          courseName,
          graduationYear
        });

        processed++;
      } catch (err: any) {
        console.error(err);
        errors.push(`Error en ${file.name}: ${err.message || 'Error desconocido'}`);
      }
    }

    return NextResponse.json({ processed, errors });
  } catch (error) {
    console.error('Error in Bulk Upload:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
