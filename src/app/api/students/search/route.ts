import { NextResponse } from 'next/server';
import { searchStudentInGoogleSheets } from '@/lib/google-api';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cedula = searchParams.get('cedula');
  const documentType = searchParams.get('documentType');

  // Seguridad: Requerir ambos parámetros para evitar "fuga" de datos por fuerza bruta parcial
  if (!cedula || !documentType) {
    return NextResponse.json({ error: 'Identificación y tipo de documento son requeridos' }, { status: 400 });
  }

  // Defensa: Retraso artificial para mitigar ataques de fuerza bruta (scraping)
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const student = await searchStudentInGoogleSheets(cedula);

    if (!student) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Validación extra: El tipo de documento debe coincidir estrictamente (normalizado)
    const normalizedDbDocType = student.documentType?.toString().trim().toUpperCase();
    const normalizedParamDocType = documentType.toString().trim().toUpperCase();

    if (normalizedDbDocType !== normalizedParamDocType) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error public search:', error);
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 500 });
  }
}
