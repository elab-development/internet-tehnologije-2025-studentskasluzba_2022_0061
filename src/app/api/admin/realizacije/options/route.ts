import jwt, { type JwtPayload } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => part.trim().split('=', 2))
  );
}

//vraca dostupne bazne entiete za dostupne fakultete ispitne rokove i klk nedelje
export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookie(cookieHeader);
    const token = cookies['token'];

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
    if (typeof payload === 'string' || payload.tip !== 'ADMINISTRATOR') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [fakulteti, klaseIspitnihRokova, klaseKolokvijumskihNedelja] = await Promise.all([
      prisma.fakultet.findMany({
        select: { id: true, naziv: true },
        orderBy: { naziv: 'asc' },
      }),
      prisma.klasaIspitnogRoka.findMany({
        select: { id: true, naziv: true, sifra: true, fakultetId: true },
        orderBy: [{ fakultetId: 'asc' }, { naziv: 'asc' }],
      }),
      prisma.klasaKolokvijumskeNedelje.findMany({
        select: { id: true, naziv: true, sifra: true, fakultetId: true },
        orderBy: [{ fakultetId: 'asc' }, { naziv: 'asc' }],
      }),
    ]);

    return new Response(JSON.stringify({
      fakulteti,
      klaseIspitnihRokova,
      klaseKolokvijumskihNedelja,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
