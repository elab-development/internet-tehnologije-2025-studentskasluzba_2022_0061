// app/api/molbe/create/route.ts
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(header.split(';').map(p => p.trim().split('=', 2)));
}

export async function POST(req: Request) {
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

    const korisnik = await prisma.korisnik.findUnique({
      where: { id: payload.id },
      include: { student: true },
    });

    if (!korisnik?.student) {
      return new Response(JSON.stringify({ error: 'Not a student' }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { sadrzaj } = body;

    if (!sadrzaj) {
      return new Response(JSON.stringify({ error: 'Missing sadrzaj' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const molba = await prisma.molba.create({
      data: {
        studentId: korisnik.student.id,
        sadrzaj,
      },
    });

    return new Response(JSON.stringify({ molba }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' }
    });
  }
}