import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Create template data with headers only
const data = [
  ['Tipo Documento', 'Documento', 'Nombres', 'Apellidos', 'Correo', 'Curso', 'Año'],
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');

// Write to file
const outputPath = join(process.cwd(), 'public', 'template.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Plantilla Excel creada en:', outputPath);
