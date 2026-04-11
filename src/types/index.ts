export type DocumentType = 'CC' | 'CE' | 'PPT' | 'PPN';

export interface Student {
  id: number; // Ahora representa el número de fila en el Excel
  cedula: string;
  documentType: DocumentType;
  firstName: string;
  lastName: string;
  email: string | null;
  courseName?: string;
  graduationYear?: number;
  certificatePath?: string;
  createdAt: Date;
  certificates?: Certificate[]; // Mantenemos esto para compatibilidad con la búsqueda pública
}

export interface Certificate {
  id: number;
  courseName: string;
  certificatePath: string;
  graduationYear: number;
  createdAt?: Date;
}

export interface SummaryStats {
  totalStudents: number;
  totalCertificates: number;
  pendingCertificates: number;
  completedCertificates: number;
}

export interface ReportData {
  summary: SummaryStats;
  certsByYear: { year: number; count: number }[];
  topCourses: { courseName: string; count: number }[];
  studentsByDocType: { documentType: DocumentType; count: number }[];
}
