import { NextResponse } from 'next/server';
import { batchCreateStudentsInSheets } from '@/lib/google-api';

export async function POST(req: Request) {
  try {
    const { records } = await req.json();
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No se enviaron registros válidos' }, { status: 400 });
    }

    // Opcional: Validar estructura mínima de cada registro aquí

    await batchCreateStudentsInSheets(records);

    return NextResponse.json({ 
      success: true, 
      message: `${records.length} registros cargados exitosamente` 
    });
  } catch (error: any) {
    console.error('Error in Admin Students BATCH:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
