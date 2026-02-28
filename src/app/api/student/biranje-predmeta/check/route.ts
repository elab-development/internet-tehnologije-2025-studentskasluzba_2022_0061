import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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
      return new Response(JSON.stringify({ allowed: false }), { status: 401 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return new Response(JSON.stringify({ allowed: false }), { status: 401 });
    }

    if (payload.tip !== 'STUDENT') {
      return new Response(JSON.stringify({ allowed: false }), { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { korisnikId: payload.id },
    });

    if (!student) {
      return new Response(JSON.stringify({ allowed: false }), { status: 200 });
    }

    const latestUpis = await prisma.upisStudenta.findFirst({
      where: { studentId: student.id },
      orderBy: { akademskaGodina: 'desc' },
      include: {
        modul: {
          include: {
            program: {
              include: {
                smer: true,
              },
            },
          },
        },
      },
    });

    if (!latestUpis) {
      return new Response(JSON.stringify({ allowed: false }), { status: 200 });
    }

    const fakultetId = latestUpis.modul.program.smer.fakultetId;
    const nivoStudija = latestUpis.nivoStudija;

    const now = new Date();

    const activePeriod = await prisma.periodZaBiranje.findFirst({
      where: {
        fakultetId,
        nivoStudija,
        pocetakPerioda: { lte: now },
        krajPerioda: { gte: now },
      },
    });

    return new Response(
      JSON.stringify({ allowed: !!activePeriod }),
      { status: 200 }
    );
  } catch {
    return new Response(JSON.stringify({ allowed: false }), { status: 500 });
  }
}