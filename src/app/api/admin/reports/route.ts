import { NextResponse } from 'next/server';
import { listAllStudents } from '@/lib/google-api';
import { ReportData, SummaryStats, DocumentType } from '@/types';

export async function GET() {
  try {
    const data = await listAllStudents();

    const summary: SummaryStats = {
      totalStudents: new Set(data.map(s => s.cedula)).size,
      totalCertificates: data.length,
      pendingCertificates: data.filter(c => c.certificatePath === '#').length,
      completedCertificates: data.filter(c => c.certificatePath !== '#').length,
    };

    // Certs by Year
    const yearCounts: Record<number, number> = {};
    data.forEach(c => {
      const yr = Number(c.graduationYear);
      if (yr) yearCounts[yr] = (yearCounts[yr] || 0) + 1;
    });
    const certsByYear = Object.entries(yearCounts).map(([year, count]) => ({
      year: parseInt(year),
      count
    })).sort((a, b) => b.year - a.year);

    // Top Courses
    const courseCounts: Record<string, number> = {};
    data.forEach(c => {
      if (c.courseName) courseCounts[c.courseName] = (courseCounts[c.courseName] || 0) + 1;
    });
    const topCourses = Object.entries(courseCounts)
      .map(([courseName, count]) => ({ courseName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Doc Types
    const docCounts: Record<string, number> = {};
    data.forEach(s => {
      docCounts[s.documentType] = (docCounts[s.documentType] || 0) + 1;
    });
    const studentsByDocType = Object.entries(docCounts).map(([documentType, count]) => ({
      documentType: documentType as DocumentType,
      count
    }));

    const report: ReportData = {
      summary,
      certsByYear,
      topCourses,
      studentsByDocType
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error in reports:', error);
    return NextResponse.json({ error: 'Error al generar reportes' }, { status: 500 });
  }
}
