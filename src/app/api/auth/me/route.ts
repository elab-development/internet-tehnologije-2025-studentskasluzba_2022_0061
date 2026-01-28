// app/api/auth/me/route.ts
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(header.split(';').map(p => p.trim().split('=', 2)));
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookie(cookieHeader);
    const token = cookies['token'];
    if (!token) return new Response(JSON.stringify({ user: null }), { status: 401, headers: { 'Content-Type': 'application/json' }});

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return new Response(JSON.stringify({ user: null }), { status: 401, headers: { 'Content-Type': 'application/json' }});
    }

    const user = await prisma.korisnik.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, ime: true, prezime: true, tip: true },
    });

    if (!user) return new Response(JSON.stringify({ user: null }), { status: 401, headers: { 'Content-Type': 'application/json' }});

    return new Response(JSON.stringify({ user }), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch {
    return new Response(JSON.stringify({ user: null }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}
