// app/api/auth/login/route.ts
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const MAX_AGE = Number(process.env.JWT_MAX_AGE ?? 60 * 60 * 24 * 7); // seconds

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    const user = await prisma.korisnik.findUnique({ where: { email } });
    if (!user) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' }});

    const ok = await bcrypt.compare(password, user.lozinka);
    if (!ok) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' }});

    const token = jwt.sign({ id: user.id, tip: user.tip }, JWT_SECRET, { expiresIn: `${MAX_AGE}s` });

    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Strict${secureFlag}`;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}
