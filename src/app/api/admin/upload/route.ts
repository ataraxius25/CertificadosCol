import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { batchCreateStudentsInSheets } from '@/lib/google-api';

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
    const recordsToSync: any[] = [];

    // Normalización de columnas y validación
    for (const [index, row] of rows.entries()) {
      let documentType = String(row['Tipo Documento'] || row['tipo_documento'] || row['TipoDocumento'] || row['TIPO_DOCUMENTO'] || 'CC').trim().toUpperCase();
      
      // Normalización de tipo de documento
      if (documentType.includes('CIUDADAN') || documentType === 'CC') {
        documentType = 'CC';
      } else if (documentType.includes('EXTRANJER') || documentType === 'CE') {
        documentType = 'CE';
      } else if (documentType.includes('PROTECCI') || documentType.includes('TEMPORAL') || documentType === 'PPT') {
        documentType = 'PPT';
      } else if (documentType.includes('PASAPORTE') || documentType === 'PPN') {
        documentType = 'PPN';
      } else {
        documentType = 'CC'; // Por defecto
      }
      
      const cedula = String(row['Documento'] || row['documento'] || row['CEDULA'] || row['cedula'] || '').trim();
      const firstName = (row['Nombres'] || row['nombres'] || row['NOMBRES'] || '').trim();
      const lastName = (row['Apellidos'] || row['apellidos'] || row['APELLIDOS'] || '').trim();
      const email = (row['Correo'] || row['correo'] || row['Email'] || row['email'] || '').trim();
      const courseName = (row['Curso'] || row['curso'] || row['CURSO'] || row['Programa'] || row['programa'] || '').trim();
      const year = row['Año'] || row['año'] || row['AÑO'] || row['Grado'] || row['grado'] || row['GRADO'] || row['Anio'] || row['año_graduacion'] || row['ano_graduacion'] || row['year'];

      // Validación de campos obligatorios
      if (!cedula || !firstName || !courseName || !year) {
        errors.push({ 
          row: index + 2, 
          error: `Faltan campos obligatorios (Documento, Nombres, Curso o Año)`, 
          data: { documentType, cedula, firstName, lastName, email, courseName, year } 
        });
        continue;
      }

      recordsToSync.push({
        documentType,
        cedula,
        firstName,
        lastName,
        email: email || null,
        courseName,
        graduationYear: year
      });
      synced++;
    }

    // Inserción masiva en Google Sheets
    if (recordsToSync.length > 0) {
      await batchCreateStudentsInSheets(recordsToSync);
    }

    return NextResponse.json({
      total: rows.length,
      synced,
      errors
    });

  } catch (error: any) {
    console.error('Error in Bulk Excel Sync:', error);
    return NextResponse.json({ error: error.message || 'Error procesando el archivo' }, { status: 500 });
  }
}
