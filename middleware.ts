// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // 1. Solo protegemos la ruta /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    
    // Leemos la cabecera de autorización básica
    const basicAuth = req.headers.get('authorization');
    const url = req.nextUrl;

    if (basicAuth) {
      // Decodificamos el usuario y contraseña que envió el navegador
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // Validamos con nuestras variables de entorno
      if (user === process.env.ADMIN_USER && pwd === process.env.ADMIN_PASSWORD) {
        return NextResponse.next(); // ¡Pase usted!
      }
    }

    // Si no hay auth o es incorrecta, rechazamos y pedimos login
    url.pathname = '/api/auth';
    return new NextResponse('Auth Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  return NextResponse.next();
}

// Configuración: Esto dice "Ejecuta este archivo solo en rutas que empiecen con /admin"
export const config = {
  matcher: '/admin/:path*',
};