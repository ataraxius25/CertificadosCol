import 'server-only';
import { Student } from '@/types';

const URL = process.env.GOOGLE_APPS_SCRIPT_URL;
const TOKEN = process.env.GOOGLE_APPS_SCRIPT_TOKEN?.replace(/['"]/g, '').trim();

const AUTH_URL = process.env.AUTH_APPS_SCRIPT_URL;
const AUTH_TOKEN = process.env.AUTH_APPS_SCRIPT_TOKEN?.replace(/['"]/g, '').trim();

async function callSheetsAPI(method: 'GET' | 'POST', payload: any, customConfig?: { url?: string, token?: string }) {
  const targetUrl = customConfig?.url || URL;
  const targetToken = customConfig?.token || TOKEN;

  if (!targetUrl || !targetToken) {
    throw new Error(`Falta configuración GOOGLE (${customConfig?.url ? 'AUTH' : 'DATA'}) en .env.local`);
  }

  const options: RequestInit = { 
    method, 
    cache: 'no-store',
    redirect: 'follow'
  };
  
  let finalUrl = targetUrl;

  if (method === 'GET') {
    const queryParams = new URLSearchParams({ ...payload, token: targetToken });
    finalUrl = `${targetUrl}?${queryParams.toString()}`;
  } else {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify({ ...payload, token: targetToken });
  }

  try {
    console.log(`[GoogleAPI] Llamando a ${customConfig?.url ? 'AUTH' : 'DATA'} URL: ${finalUrl.split('?')[0]}`);
    const response = await fetch(finalUrl, options);
    const text = await response.text();
    
    if (text.trim().startsWith('<!DOCTYPE html>')) {
      console.error('[GoogleAPI] Error: Google devolvió HTML en lugar de JSON. ¿Permisos "Anyone" configurados?');
      throw new Error('Google devolvió una página HTML (posible error de permisos o URL)');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[GoogleAPI] Fallo al parsear JSON. Respuesta original:', text.substring(0, 200));
      throw new Error(`Error de respuesta no-JSON: ${text.substring(0, 100)}`);
    }

    if (data.error) throw new Error(data.error);
    return data;
  } catch (err: any) {
    console.error('[GoogleAPI] Error en la llamada:', err.message);
    throw err;
  }
}

export async function searchStudentInGoogleSheets(cedula: string): Promise<Student | null> {
  try {
    const rows = await callSheetsAPI('GET', { action: 'SEARCH', cedula });
    if (!Array.isArray(rows) || rows.length === 0) return null;

    // Tomamos la información base del primer registro
    const first = rows[0];
    
    // SANITIZACIÓN: Construimos el objeto Student agrupado
    return {
      cedula: String(first.documento),
      documentType: (String(first.tipodocumento || 'CC')) as import('@/types').DocumentType,
      firstName: String(first.nombres),
      lastName: String(first.apellidos),
      email: first.correo ? String(first.correo) : null,
      id: 0, 
      createdAt: new Date(),
      certificates: rows.map((row: any) => ({
        id: Number(row.id),
        courseName: String(row.curso),
        // Mapeo flexible: soporta tanto 'driveid' (del excel) como 'certificadopath'
        certificatePath: String(row.driveid || row.certificadopath || '#'),
        graduationYear: Number(row.ano)
      }))
    };
  } catch { return null; }
}

export async function listAllStudents(): Promise<any[]> {
  try {
    const rawRows = await callSheetsAPI('GET', { action: 'LIST' });
    // Mapeo básico para asegurar que el Admin vea "cedula" y no "documento"
    return rawRows.map((row: any) => ({
      ...row,
      cedula: row.documento,
      documentType: row.tipodocumento || 'CC',
      firstName: row.nombres,
      lastName: row.apellidos,
      email: row.correo,
      courseName: row.curso,
      graduationYear: row.ano,
      certificatePath: row.driveid || row.certificadopath || '#'
    }));
  } catch (err) {
    console.error('Error listando estudiantes:', err);
    return [];
  }
}

export async function createStudentInSheets(data: any) {
  return await callSheetsAPI('POST', { action: 'CREATE', ...data });
}

export async function batchCreateStudentsInSheets(records: any[]) {
  return await callSheetsAPI('POST', { action: 'BATCH_CREATE', records });
}

export async function updateStudentInSheets(id: number, data: any) {
  return await callSheetsAPI('POST', { action: 'UPDATE', id, ...data });
}

export async function deleteStudentInSheets(id: number) {
  return await callSheetsAPI('POST', { action: 'DELETE', id });
}

export async function deleteStudentByCedula(cedula: string) {
  return await callSheetsAPI('POST', { action: 'DELETE_STUDENT', cedula });
}

export async function uploadToDriveAndSheet(fileName: string, fileBase64: string, options: { id?: number, cedula?: string, courseName?: string, graduationYear?: string | number }) {
  return await callSheetsAPI('POST', { action: 'UPLOAD', fileName, fileBase64, ...options });
}

export async function getUsersFromSheets(): Promise<any[]> {
  try {
    const data = await callSheetsAPI(
      'GET', 
      { action: 'GET_USERS' }, 
      { url: AUTH_URL, token: AUTH_TOKEN }
    );
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching users from Sheets:', err);
    return [];
  }
}
