import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(header.split(';').map(p => p.trim().split('=', 2)));
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookie(cookieHeader);
    const token = cookies['token'];
    if (!token) return new Response('Unauthorized', { status: 401 });

    const payload: any = jwt.verify(token, JWT_SECRET);
    if (payload.tip !== 'ADMINISTRATOR')
      return new Response('Forbidden', { status: 403 });

    const id = Number(params.id);
    const { krajPerioda } = await req.json();

    const existing = await prisma.periodZaBiranje.findUnique({
      where: { id },
    });

    if (!existing) return new Response('Not found', { status: 404 });

    if (new Date(krajPerioda) <= existing.pocetakPerioda)
      return new Response('Invalid end date', { status: 400 });

    const updated = await prisma.periodZaBiranje.update({
      where: { id },
      data: {
        krajPerioda: new Date(krajPerioda),
      },
    });

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response('Server error', { status: 500 });
  }
}