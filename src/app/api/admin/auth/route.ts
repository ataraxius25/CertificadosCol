import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  try {
    const users = JSON.parse(process.env.ADMIN_USERS_JSON || '[]');
    const userFound = users.find((u: any) => u.user === username && u.pass === password);

    if (userFound) {
      const cookieStore = await cookies();
      cookieStore.set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error parsing ADMIN_USERS_JSON:', error);
  }

  return NextResponse.json({ success: false }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return NextResponse.json({ success: true });
}
