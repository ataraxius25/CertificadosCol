import { db } from '@/lib/db';
import { students, certificates } from '@/lib/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Total students
    const totalStudents = await db.select({ count: count() }).from(students);

    // 2. Total certificates
    const totalCertificates = await db.select({ count: count() }).from(certificates);

    // 3. Pending certificates (certificatePath = '#')
    const pendingCertificates = await db.select({ count: count() })
      .from(certificates)
      .where(eq(certificates.certificatePath, '#'));

    // 4. Completed certificates
    const completedCount = totalCertificates[0].count - pendingCertificates[0].count;

    // 5. Certificates by year
    const certsByYear = await db.select({
      year: certificates.graduationYear,
      count: count()
    })
    .from(certificates)
    .groupBy(certificates.graduationYear)
    .orderBy(certificates.graduationYear);

    // 6. Top courses
    const topCourses = await db.select({
      courseName: certificates.courseName,
      count: count()
    })
    .from(certificates)
    .groupBy(certificates.courseName)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

    // 7. Students by document type
    const studentsByDocType = await db.select({
      documentType: students.documentType,
      count: count()
    })
    .from(students)
    .groupBy(students.documentType);

    // 8. Recent certificates (last 10)
    const recentCertificates = await db.select({
      id: certificates.id,
      courseName: certificates.courseName,
      graduationYear: certificates.graduationYear,
      studentId: certificates.studentId,
      createdAt: certificates.createdAt,
    })
    .from(certificates)
    .orderBy(sql`${certificates.createdAt} DESC`)
    .limit(10);

    return NextResponse.json({
      summary: {
        totalStudents: totalStudents[0].count,
        totalCertificates: totalCertificates[0].count,
        pendingCertificates: pendingCertificates[0].count,
        completedCertificates: completedCount,
      },
      certsByYear,
      topCourses,
      studentsByDocType,
      recentCertificates,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Error al generar reportes' }, { status: 500 });
  }
}
