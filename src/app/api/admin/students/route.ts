import { NextResponse } from 'next/server';
import { listAllStudents, createStudentInSheets } from '@/lib/google-api';
import { Student, Certificate } from '@/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || ''; 

  try {
    const rawData = await listAllStudents();
    
    // Agrupación por Cédula
    const groupedMap = new Map<string, Student>();

    for (const record of rawData) {
      const cedKey = String(record.cedula);
      if (!groupedMap.has(cedKey)) {
        groupedMap.set(cedKey, {
          ...record,
          cedula: cedKey,
          certificates: []
        });
      }

      const student = groupedMap.get(cedKey)!;
      
      student.certificates?.push({
        id: record.id,
        courseName: record.courseName || 'Sin Nombre',
        graduationYear: record.graduationYear || 0,
        certificatePath: record.certificatePath || '#',
        createdAt: record.createdAt
      });
    }

    let data = Array.from(groupedMap.values());

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(st => {
        const cedula = String(st.cedula).toLowerCase();
        const firstName = String(st.firstName || '').toLowerCase();
        const lastName = String(st.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`;
        return (
          cedula.includes(s) ||
          firstName.includes(s) ||
          lastName.includes(s) ||
          fullName.includes(s) ||
          st.certificates?.some(c => String(c.courseName).toLowerCase().includes(s))
        );
      });
    }

    if (status === 'pending') {
      data = data.filter(st => st.certificates?.some(c => c.certificatePath === '#'));
    } else if (status === 'completed') {
      data = data.filter(st => st.certificates?.every(c => c.certificatePath !== '#'));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Admin Students GET:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.cedula || !body.firstName || !body.courseName) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    await createStudentInSheets({
      documentType: body.documentType || 'CC',
      cedula: body.cedula,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      courseName: body.courseName,
      graduationYear: body.graduationYear
    });

    return NextResponse.json({ success: true, message: 'Registro creado correctamente' });
  } catch (error: any) {
    console.error('Error in Admin Students POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const cedula = searchParams.get('cedula');

  if (!cedula) {
    return NextResponse.json({ error: 'Cédula requerida' }, { status: 400 });
  }

  try {
    const { deleteStudentByCedula } = await import('@/lib/google-api');
    await deleteStudentByCedula(cedula);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
