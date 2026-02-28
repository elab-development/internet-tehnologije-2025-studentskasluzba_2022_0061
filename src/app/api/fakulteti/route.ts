import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(p => p.trim().split('=', 2))
  );
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookie(cookieHeader);
    const token = cookies['token'];

    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    const fakulteti = await prisma.fakultet.findMany({
      select: {
        id: true,
        naziv: true,
      },
      orderBy: {
        naziv: 'asc',
      },
    });

    return new Response(
      JSON.stringify({ fakulteti }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }
}