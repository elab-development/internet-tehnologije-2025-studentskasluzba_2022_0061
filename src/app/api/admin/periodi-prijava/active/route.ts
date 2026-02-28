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
    if (!token) return new Response('Unauthorized', { status: 401 });

    const payload: any = jwt.verify(token, JWT_SECRET);
    if (payload.tip !== 'ADMINISTRATOR')
      return new Response('Forbidden', { status: 403 });

    const now = new Date();

    const periods = await prisma.periodZaBiranje.findMany({
      where: {
        pocetakPerioda: { lte: now },
        krajPerioda: { gte: now },
      },
      orderBy: { krajPerioda: 'asc' },
    });

    return new Response(JSON.stringify({ periods }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response('Server error', { status: 500 });
  }
}