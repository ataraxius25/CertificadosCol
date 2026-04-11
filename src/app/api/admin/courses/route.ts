import { NextResponse } from 'next/server';
import { listAllStudents } from '@/lib/google-api';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('query') || '').toLowerCase();

  try {
    const allStudents = await listAllStudents();
    
    // Extraer nombres de cursos únicos que coincidan con la búsqueda
    const courseSet = new Set<string>();
    
    allStudents.forEach(st => {
      (st.certificates || []).forEach((cert: { courseName: string }) => {
        if (cert.courseName.toLowerCase().includes(query)) {
          courseSet.add(cert.courseName);
        }
      });
    });

    return NextResponse.json(Array.from(courseSet).slice(0, 10));
  } catch (error) {
    console.error('Error fetching courses from Sheets:', error);
    return NextResponse.json([]);
  }
}
