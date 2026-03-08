import jwt, { type JwtPayload } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => part.trim().split('=', 2))
  );
}

async function getCurrentStudentContext(req: Request) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookie(cookieHeader);
  const token = cookies['token'];

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Niste prijavljeni.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
  if (
    typeof payload === 'string' ||
    payload.tip !== 'STUDENT' ||
    typeof payload.id !== 'number'
  ) {
    throw new Response(JSON.stringify({ error: 'Pristup je dozvoljen samo studentima.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const student = await prisma.student.findUnique({
    where: { korisnikId: payload.id },
    select: { id: true },
  });

  if (!student) {
    throw new Response(JSON.stringify({ error: 'Student nije pronadjen.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const latestUpis = await prisma.upisStudenta.findFirst({
    where: { studentId: student.id },
    orderBy: [
      { akademskaGodina: 'desc' },
      { id: 'desc' },
    ],
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
    throw new Response(JSON.stringify({ error: 'Student nema aktivan upis.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return { studentId: student.id, latestUpis };
}

export async function GET(req: Request) {
  try {
    const { studentId, latestUpis } = await getCurrentStudentContext(req);
    const now = new Date();
    const fakultetId = latestUpis.modul.program.smer.fakultetId;
    const akademskaGodina = latestUpis.akademskaGodina;

    const [openExamPeriods, openKolokvijumWeeks, selectedCourses, passedExams] = await Promise.all([
      prisma.realizacijaIspitnogRoka.findMany({
        where: {
          akademskaGodina,
          pocetakPrijavljivanja: { lte: now },
          krajPrijavljivanja: { gte: now },
          klasaIspitnogRoka: {
            fakultetId,
          },
        },
        include: {
          klasaIspitnogRoka: true,
        },
        orderBy: { krajPrijavljivanja: 'asc' },
      }),
      prisma.realizacijaKolokvijumskeNedelje.findMany({
        where: {
          akademskaGodina,
          pocetakPrijavljivanja: { lte: now },
          krajPrijavljivanja: { gte: now },
          klasaKolokvijumskeNedelje: {
            fakultetId,
          },
        },
        include: {
          klasaKolokvijumskeNedelje: true,
        },
        orderBy: { krajPrijavljivanja: 'asc' },
      }),
      prisma.biranjePredmeta.findMany({
        where: {
          studentId,
          kursUModulu: {
            izvodjenjeKursa: {
              akademskaGodina,
            },
          },
        },
        include: {
          kursUModulu: {
            include: {
              izvodjenjeKursa: {
                include: {
                  kurs: true,
                },
              },
            },
          },
        },
        orderBy: [
          { kursUModulu: { godinaStudija: 'asc' } },
          { kursUModulu: { semestar: 'asc' } },
          { datumBiranja: 'asc' },
        ],
      }),
      prisma.prijavaIspita.findMany({
        where: {
          studentId,
          polozio: true,
        },
        select: {
          izvodjenjeKursaId: true,
        },
      }),
    ]);

    const passedSet = new Set(passedExams.map(item => item.izvodjenjeKursaId));
    const eligibleCourses = selectedCourses
      .filter(selection => !passedSet.has(selection.kursUModulu.izvodjenjeKursaId))
      .map(selection => ({
        kursUModuluId: selection.kursUModuluId,
        izvodjenjeKursaId: selection.kursUModulu.izvodjenjeKursaId,
        naziv: selection.kursUModulu.izvodjenjeKursa.kurs.naziv,
        espb: selection.kursUModulu.izvodjenjeKursa.espb,
        godinaStudija: selection.kursUModulu.godinaStudija,
        semestar: selection.kursUModulu.semestar,
        datumBiranja: selection.datumBiranja.toISOString(),
      }));

    const openRealizations = [
      ...openExamPeriods.map(item => ({
        id: item.id,
        tip: 'ISPITNI_ROK' as const,
        naziv: item.klasaIspitnogRoka.naziv,
        akademskaGodina: item.akademskaGodina,
        pocetakPrijavljivanja: item.pocetakPrijavljivanja.toISOString(),
        krajPrijavljivanja: item.krajPrijavljivanja.toISOString(),
      })),
      ...openKolokvijumWeeks.map(item => ({
        id: item.id,
        tip: 'KOLOKVIJUMSKA_NEDELJA' as const,
        naziv: item.klasaKolokvijumskeNedelje.naziv,
        akademskaGodina: item.akademskaGodina,
        pocetakPrijavljivanja: item.pocetakPrijavljivanja.toISOString(),
        krajPrijavljivanja: item.krajPrijavljivanja.toISOString(),
      })),
    ];

    const openExamPeriodIds = openExamPeriods.map(item => item.id);
    const openKolokvijumWeekIds = openKolokvijumWeeks.map(item => item.id);

    const [registeredExams, registeredKolokvijumi] = await Promise.all([
      openExamPeriodIds.length === 0
        ? []
        : prisma.prijavaIspita.findMany({
            where: {
              studentId,
              realizacijaIspitnogRokaId: { in: openExamPeriodIds },
            },
            include: {
              izvodjenjeKursa: {
                include: {
                  kurs: true,
                },
              },
              realizacijaIspitnogRoka: {
                include: {
                  klasaIspitnogRoka: true,
                },
              },
            },
            orderBy: [
              { realizacijaIspitnogRokaId: 'asc' },
              { datumPrijave: 'desc' },
            ],
          }),
      openKolokvijumWeekIds.length === 0
        ? []
        : prisma.prijavaKolokvijuma.findMany({
            where: {
              studentId,
              realizacijaKolokvijumskeNedeljeId: { in: openKolokvijumWeekIds },
            },
            include: {
              izvodjenjeKursa: {
                include: {
                  kurs: true,
                },
              },
              realizacijaKolokvijumskeNedelje: {
                include: {
                  klasaKolokvijumskeNedelje: true,
                },
              },
            },
            orderBy: [
              { realizacijaKolokvijumskeNedeljeId: 'asc' },
              { datumPrijave: 'desc' },
            ],
          }),
    ]);

    const registeredCourses = [
      ...registeredExams.map(item => ({
        id: `ispit-${item.id}`,
        tip: 'ISPITNI_ROK' as const,
        realizacijaNaziv: item.realizacijaIspitnogRoka.klasaIspitnogRoka.naziv,
        predmet: item.izvodjenjeKursa.kurs.naziv,
        espb: item.izvodjenjeKursa.espb,
        datumPrijave: item.datumPrijave.toISOString(),
      })),
      ...registeredKolokvijumi.map(item => ({
        id: `kol-${item.id}`,
        tip: 'KOLOKVIJUMSKA_NEDELJA' as const,
        realizacijaNaziv: item.realizacijaKolokvijumskeNedelje.klasaKolokvijumskeNedelje.naziv,
        predmet: item.izvodjenjeKursa.kurs.naziv,
        espb: item.izvodjenjeKursa.espb,
        datumPrijave: item.datumPrijave.toISOString(),
      })),
    ];

    return new Response(JSON.stringify({
      akademskaGodina,
      openRealizations,
      eligibleCourses,
      registeredCourses,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return new Response(JSON.stringify({ error: 'Greska na serveru.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
