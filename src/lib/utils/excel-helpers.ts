import { utils, writeFile } from 'xlsx';

export function downloadExcelTemplate() {
  const headers = [
    'Tipo Documento',
    'Documento',
    'Nombres',
    'Apellidos',
    'Correo',
    'Curso',
    'Año'
  ];

  // Datos de ejemplo para que el usuario entienda el formato
  const sampleData = [
    {
      'Tipo Documento': 'CC',
      'Documento': '12345678',
      'Nombres': 'Juan Pérez',
      'Apellidos': 'García',
      'Correo': 'juan.perez@email.com',
      'Curso': 'Matemáticas Básicas',
      'Año': 2024
    }
  ];

  const worksheet = utils.json_to_sheet(sampleData, { header: headers });
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Plantilla Estudiantes');

  // Ajustar ancho de columnas (opcional para un toque premium)
  const columnWidths = [
    { wch: 15 }, // Tipo Documento
    { wch: 15 }, // Documento
    { wch: 20 }, // Nombres
    { wch: 20 }, // Apellidos
    { wch: 25 }, // Correo
    { wch: 25 }, // Curso
    { wch: 10 }, // Año
  ];
  worksheet['!cols'] = columnWidths;

  writeFile(workbook, 'Plantilla_Carga_Masiva.xlsx');
}
