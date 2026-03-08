import jwt, { type JwtPayload } from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { findHolidayConflicts } from '@/lib/publicHolidays';

const JWT_SECRET = process.env.JWT_SECRET!;

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => part.trim().split('=', 2))
  );
}

type CreateBody = {
  tip?: 'ISPITNI_ROK' | 'KOLOKVIJUMSKA_NEDELJA';
  fakultetId?: number;
  klasaId?: number;
  akademskaGodina?: string;
  pocetak?: string;
  kraj?: string;
  pocetakPrijavljivanja?: string;
  krajPrijavljivanja?: string;
};

export async function POST(req: Request) {
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

    const body = await req.json() as CreateBody;
    const {
      tip,
      fakultetId,
      klasaId,
      akademskaGodina,
      pocetak,
      kraj,
      pocetakPrijavljivanja,
      krajPrijavljivanja,
    } = body;

    if (
      !tip ||
      !fakultetId ||
      !klasaId ||
      !akademskaGodina ||
      !pocetak ||
      !kraj ||
      !pocetakPrijavljivanja ||
      !krajPrijavljivanja
    ) {
      return new Response(JSON.stringify({ error: 'Sva polja su obavezna.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const startDate = new Date(pocetak);
    const endDate = new Date(kraj);
    const registrationStartDate = new Date(pocetakPrijavljivanja);
    const registrationEndDate = new Date(krajPrijavljivanja);

    if (startDate >= endDate) {
      return new Response(JSON.stringify({ error: 'Kraj mora biti nakon pocetka realizacije.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (registrationStartDate >= registrationEndDate) {
      return new Response(JSON.stringify({ error: 'Kraj prijavljivanja mora biti nakon pocetka prijavljivanja.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (registrationEndDate > endDate) {
      return new Response(JSON.stringify({ error: 'Prijavljivanje mora biti zavrseno pre kraja realizacije.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const holidayConflicts = await findHolidayConflicts([
      { label: 'Pocetak realizacije', date: startDate },
      { label: 'Kraj realizacije', date: endDate },
      { label: 'Pocetak prijavljivanja', date: registrationStartDate },
      { label: 'Kraj prijavljivanja', date: registrationEndDate },
    ]);

    if (holidayConflicts.length > 0) {
      const details = holidayConflicts
        .map(conflict => `${conflict.label}: ${conflict.isoDate} (${conflict.holidayName})`)
        .join('; ');

      return new Response(JSON.stringify({
        error: `Izabrani datumi padaju na drzavni praznik. ${details}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (tip === 'ISPITNI_ROK') {
      const klasa = await prisma.klasaIspitnogRoka.findFirst({
        where: { id: klasaId, fakultetId },
      });

      if (!klasa) {
        return new Response(JSON.stringify({ error: 'Izabrana klasa ispitnog roka ne postoji.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const existing = await prisma.realizacijaIspitnogRoka.findFirst({
        where: { klasaIspitnogRokaId: klasaId, akademskaGodina },
      });

      if (existing) {
        return new Response(JSON.stringify({ error: 'Za izabranu klasu i akademsku godinu realizacija vec postoji.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const realization = await prisma.realizacijaIspitnogRoka.create({
        data: {
          klasaIspitnogRokaId: klasaId,
          akademskaGodina,
          pocetakRoka: startDate,
          krajRoka: endDate,
          pocetakPrijavljivanja: registrationStartDate,
          krajPrijavljivanja: registrationEndDate,
        },
      });

      return new Response(JSON.stringify({ realization }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const klasa = await prisma.klasaKolokvijumskeNedelje.findFirst({
      where: { id: klasaId, fakultetId },
    });

    if (!klasa) {
      return new Response(JSON.stringify({ error: 'Izabrana klasa kolokvijumske nedelje ne postoji.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await prisma.realizacijaKolokvijumskeNedelje.findFirst({
      where: { klasaKolokvijumskeNedeljeId: klasaId, akademskaGodina },
    });

    if (existing) {
      return new Response(JSON.stringify({ error: 'Za izabranu klasu i akademsku godinu realizacija vec postoji.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const realization = await prisma.realizacijaKolokvijumskeNedelje.create({
      data: {
        klasaKolokvijumskeNedeljeId: klasaId,
        akademskaGodina,
        pocetakNedelje: startDate,
        krajNedelje: endDate,
        pocetakPrijavljivanja: registrationStartDate,
        krajPrijavljivanja: registrationEndDate,
      },
    });

    return new Response(JSON.stringify({ realization }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
