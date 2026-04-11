import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getUsersFromSheets } from '@/lib/google-api';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-key-change-it');

  try {
    const users = await getUsersFromSheets();
    
    console.log('Usuarios recuperados de Sheets:', users.length);

    const userFound = users.find((u: any) => {
      const sheetUser = String(u.usuario || '').trim().toLowerCase();
      const inputUser = String(username || '').trim().toLowerCase();
      const sheetPass = String(u.contrasena || '').trim();
      const inputPass = String(password || '').trim();
      
      const match = sheetUser === inputUser && sheetPass === inputPass;
      return match;
    });

    if (userFound) {
      console.log('Login exitoso para:', userFound.usuario);
      // Crear un JWT seguro
      const token = await new SignJWT({ 
        username: userFound.usuario,
        name: userFound.nombre,
        role: 'admin'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

      const cookieStore = await cookies();
      cookieStore.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      
      return NextResponse.json({ success: true });
    } else {
      console.log('Credenciales no coinciden.');
      console.log(`Intento: user="${username}", pass="${password}"`);
      if (users.length > 0) {
        console.log('Muestra de Sheet (Fila 1):', JSON.stringify({
          u: users[0].usuario,
          p: users[0].contrasena,
          raw: users[0]
        }));
      }
    }
  } catch (error: any) {
    console.error('Auth error detallado:', error.message);
    return NextResponse.json({ success: false, message: `Error de conexión: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: false, message: 'Credenciales inválidas' }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return NextResponse.json({ success: true });
}
