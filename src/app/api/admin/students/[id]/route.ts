import { NextResponse } from 'next/server';
import { updateStudentInSheets, deleteStudentInSheets } from '@/lib/google-api';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    await updateStudentInSheets(Number(id), {
      documentType: body.documentType, 
      cedula: body.cedula,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      courseName: body.courseName,
      graduationYear: body.graduationYear,
      oldCedula: body.oldCedula,
      oldCourseName: body.oldCourseName
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating in Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteStudentInSheets(Number(id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting in Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
