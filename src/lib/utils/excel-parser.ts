import { read, utils } from 'xlsx';

export interface StudentExcelRow {
  cedula: string;
  nombre: string;
  apellidos: string;
  correo?: string;
  anio_graduacion: number;
}

export async function parseExcelFile(file: File): Promise<StudentExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = utils.sheet_to_json<any>(worksheet);

        const formattedData: StudentExcelRow[] = jsonData.map((row) => ({
          cedula: String(row.cedula || row.CEDULA || row.Cedula || ''),
          nombre: String(row.nombre || row.NOMBRE || row.Nombre || ''),
          apellidos: String(row.apellidos || row.APELLIDOS || row.Apellidos || ''),
          correo: row.correo || row.CORREO || row.Correo || '',
          anio_graduacion: Number(row.anio_graduacion || row.ANIO || row.Anio || 0),
        }));

        resolve(formattedData.filter(student => student.cedula && student.nombre));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}
