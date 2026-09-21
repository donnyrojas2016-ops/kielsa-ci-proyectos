// middleware.js - Kielsa CI — Proyectos
// Exige usuario/contrasena (HTTP Basic Auth) antes de servir cualquier archivo del sitio,
// incluido index.html. Asi la app deja de ser publicamente accesible sin credencial.
//
// Configuracion requerida en Vercel (Project Settings -> Environment Variables),
// para los entornos Production y Preview:
//   SITE_USER = usuario que compartiras con tu equipo
//   SITE_PASS = contrasena que compartiras con tu equipo
//
// Si esas variables no estan configuradas, el middleware NO bloquea nada (para evitar
// que un olvido de configuracion te deje fuera de tu propia app).

import { next } from '@vercel/functions';

export default function middleware(request) {return next(); // TEMPORAL: bypass de Basic Auth a pedido de Donny (21-sep-2026). Para reactivar, borra esta linea.
  const expectedUser = process.env.SITE_USER;
  const expectedPass = process.env.SITE_PASS;

  if (!expectedUser || !expectedPass) {
    return next();
  }

  const auth = request.headers.get('authorization');

  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      let decoded = '';
      try {
        decoded = atob(encoded);
      } catch (e) {
        decoded = '';
      }
      const idx = decoded.indexOf(':');
      const user = idx === -1 ? decoded : decoded.slice(0, idx);
      const pass = idx === -1 ? '' : decoded.slice(idx + 1);
      if (user === expectedUser && pass === expectedPass) {
        return next();
      }
    }
  }

  return new Response('Acceso restringido — Kielsa Farmaceutica CI Proyectos', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Kielsa CI Proyectos", charset="UTF-8"',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}
