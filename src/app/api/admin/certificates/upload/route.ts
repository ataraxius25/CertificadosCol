import { NextResponse } from 'next/server';
import { uploadToDriveAndSheet } from '@/lib/google-api';

// No necesitas llamarlo callSheetsAPI directo si exportas algo,
// pero agregaremos una para el batch direct si quieres, o podemos importar custom.
// Por simplicidad, importaremos lo necesario para hacer el request directo.
const URL = process.env.GOOGLE_APPS_SCRIPT_URL;
const TOKEN = process.env.GOOGLE_APPS_SCRIPT_TOKEN?.replace(/['"]/g, '').trim();

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // CASO 1: Carga Masiva (JSON)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      
      if (body.action === 'BATCH_UPLOAD') {
        // Enviar el request directo a google apps script
        const options: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'BATCH_UPLOAD', files: body.files, token: TOKEN }),
          cache: 'no-store',
          redirect: 'follow'
        };
        const res = await fetch(URL!, options);
        const data = await res.json();
        return NextResponse.json({ success: true, ...data });
      }
      return NextResponse.json({ error: 'Acción no permitida' }, { status: 400 });
    }

    // CASO 2: Carga Individual (FormData)
    const formData = await req.formData();
    const id = formData.get('id');
    const file = formData.get('file') as File;

    if (!id || !file) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    const result = await uploadToDriveAndSheet(file.name, base64, {
      id: Number(id)
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error('Error uploading to Google:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

