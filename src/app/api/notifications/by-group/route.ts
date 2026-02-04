// app/api/notifications/by-group/route.ts
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
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (payload.tip !== 'ADMINISTRATOR') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const groupId = url.searchParams.get('groupId');

    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Missing groupId' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const notifications = await prisma.notifikacija.findMany({
      where: { grupaNotifikacijaId: parseInt(groupId) },
      include: {
        grupaNotifikacija: {
          include: {
            fakultet: true,
          },
        },
      },
      orderBy: { datumObjavljivanja: 'desc' },
    });

    return new Response(JSON.stringify({ notifications }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    });
  }
}