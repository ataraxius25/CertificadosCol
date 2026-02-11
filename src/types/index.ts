export type DocumentType = 'CC' | 'CE' | 'PPT' | 'PPN';

export interface Student {
  id: number;
  cedula: string;
  documentType: DocumentType;
  firstName: string;
  lastName: string;
  email: string | null;
  createdAt: Date;
  certificates?: Certificate[];
}

export interface Certificate {
  id: number;
  studentId: number;
  courseName: string;
  certificatePath: string;
  graduationYear: number;
  createdAt: Date;
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
