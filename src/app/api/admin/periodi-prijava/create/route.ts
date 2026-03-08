import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { findHolidayConflicts } from '@/lib/publicHolidays';

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
    if (!token) return new Response('Unauthorized', { status: 401 });

    const payload: any = jwt.verify(token, JWT_SECRET);
    if (payload.tip !== 'ADMINISTRATOR')
      return new Response('Forbidden', { status: 403 });

    const body = await req.json();
    const {
      fakultetId,
      akademskaGodina,
      nivoStudija,
      pocetakPerioda,
      krajPerioda,
    } = body;

    if (new Date(pocetakPerioda) >= new Date(krajPerioda)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date range' }),
        { status: 400 }
      );
    }

    const holidayConflicts = await findHolidayConflicts([
      { label: 'Pocetak perioda', date: new Date(pocetakPerioda) },
      { label: 'Kraj perioda', date: new Date(krajPerioda) },
    ]);

    if (holidayConflicts.length > 0) {
      const details = holidayConflicts
        .map(conflict => `${conflict.label}: ${conflict.isoDate} (${conflict.holidayName})`)
        .join('; ');

      return new Response(
        JSON.stringify({ error: `Izabrani datumi padaju na drzavni praznik. ${details}` }),
        { status: 400 }
      );
    }

    const overlapping = await prisma.periodZaBiranje.findFirst({
      where: {
        fakultetId,
        nivoStudija,
        pocetakPerioda: { lte: new Date(krajPerioda) },
        krajPerioda: { gte: new Date(pocetakPerioda) },
      },
    });

    if (overlapping) {
      return new Response(
        JSON.stringify({ error: 'Overlapping period exists for this level' }),
        { status: 400 }
      );
    }

    const created = await prisma.periodZaBiranje.create({
      data: {
        fakultetId,
        akademskaGodina,
        nivoStudija,
        pocetakPerioda: new Date(pocetakPerioda),
        krajPerioda: new Date(krajPerioda),
      },
    });

    return new Response(JSON.stringify({ period: created }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response('Server error', { status: 500 });
  }
}
