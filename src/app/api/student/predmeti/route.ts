import jwt, { type JwtPayload } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

type AuthenticatedStudent = {
  studentId: number;
};

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => part.trim().split('=', 2))
  );
}
//helper da nadjemo studenta  
async function getAuthenticatedStudent(req: Request): Promise<AuthenticatedStudent> {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookie(cookieHeader);
  const token = cookies['token'];

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Niste prijavljeni.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Response(JSON.stringify({ error: 'Neispravan token.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

  return { studentId: student.id };
}


async function loadSelectionContext(studentId: number) {

  //trazimo najskorij i upis
  const latestUpis = await prisma.upisStudenta.findFirst({
    where: { studentId },
    orderBy: [
      { akademskaGodina: 'desc' },
      { id: 'desc' },
    ],
    include: {
      modul: {
        include: {
          program: {
            include: {
              smer: {
                include: {
                  fakultet: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!latestUpis) {
    throw new Response(JSON.stringify({ error: 'Student nema evidentiran upis.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date();

  //sanity check za kasnije da li je upis u toku iako frontend tkaodje proverava 
  const activePeriod = await prisma.periodZaBiranje.findFirst({
    where: {
      fakultetId: latestUpis.modul.program.smer.fakultetId,
      nivoStudija: latestUpis.nivoStudija,
      pocetakPerioda: { lte: now },
      krajPerioda: { gte: now },
    },
    orderBy: { krajPerioda: 'asc' },
  });

  //samo oni predmeti koji su u okviru modula i goidine najskorijeg upisa
  const courses = await prisma.kursUModulu.findMany({
    where: {
      modulId: latestUpis.modulId,
      godinaStudija: latestUpis.godinaStudija,
      izvodjenjeKursa: {
        is: {
          akademskaGodina: latestUpis.akademskaGodina,
        },
      },
    },
    include: {
      izborniBlok: true,
      izvodjenjeKursa: {
        include: {
          kurs: true,
        },
      },
    },
    orderBy: [
      { semestar: 'asc' },
      { izborni: 'asc' },
      { id: 'asc' },
    ],
  });

  const courseIds = courses.map(course => course.id);
  const selectedRows = courseIds.length === 0
    ? []
    : await prisma.biranjePredmeta.findMany({
        where: {
          studentId,
          kursUModuluId: { in: courseIds },
        },
        select: {
          kursUModuluId: true,
        },
      });

  const baseCourseIds = [...new Set(
    courses.map(course => course.izvodjenjeKursa.kursId)
  )];

  const ratingRows = baseCourseIds.length === 0
    ? []
    : await prisma.ocenaKursa.groupBy({
        by: ['kursId'],
        where: {
          kursId: { in: baseCourseIds },
        },
        _avg: {
          ocena: true,
        },
        _count: {
          ocena: true,
        },
      });

  const ratingsByCourseId = new Map<number, { average: number | null; count: number }>(
    ratingRows.map(row => [
      row.kursId,
      {
        average: row._avg.ocena ?? null,
        count: row._count.ocena,
      },
    ])
  );


  //vracamo kontekst: da li je period aktivan, najskoriji upis, kursevi za modul iz trenutne godine, i vec izabrane predmete ako postoje
  return {
    activePeriod,
    latestUpis,
    courses,
    ratingsByCourseId,
    selectedCourseIds: selectedRows.map(row => row.kursUModuluId),
  };
}

//helper za return value
function buildResponse(context: Awaited<ReturnType<typeof loadSelectionContext>>) {
  const { activePeriod, latestUpis, courses, ratingsByCourseId, selectedCourseIds } = context;

  return {
    activePeriod: !!activePeriod,
    activePeriodEnd: activePeriod?.krajPerioda.toISOString() ?? null,
    enrollment: {
      akademskaGodina: latestUpis.akademskaGodina,
      godinaStudija: latestUpis.godinaStudija,
      nivoStudija: latestUpis.nivoStudija,
      smer: latestUpis.modul.program.smer.naziv,
      program: latestUpis.modul.program.naziv,
      modul: latestUpis.modul.naziv,
      fakultet: latestUpis.modul.program.smer.fakultet.naziv,
    },
    courses: courses.map(course => ({
      id: course.id,
      semestar: course.semestar,
      izborni: course.izborni,
      godinaStudija: course.godinaStudija,
      izborniBlok: course.izborniBlok
        ? {
            id: course.izborniBlok.id,
            semestar: course.izborniBlok.semestar,
            ukupnoIzbornih: course.izborniBlok.ukupnoIzbornih,
            potrebnoBirati: course.izborniBlok.potrebnoBirati,
          }
        : null,
      course: {
        id: course.izvodjenjeKursa.kurs.id,
        naziv: course.izvodjenjeKursa.kurs.naziv,
        opis: course.izvodjenjeKursa.kurs.opis,
        espb: course.izvodjenjeKursa.espb,
        averageRating: ratingsByCourseId.get(course.izvodjenjeKursa.kursId)?.average ?? null,
        ratingCount: ratingsByCourseId.get(course.izvodjenjeKursa.kursId)?.count ?? 0,
      },
    })),
    selectedCourseIds,
  };
}

export async function GET(req: Request) {
  try {
    const student = await getAuthenticatedStudent(req);
    const context = await loadSelectionContext(student.studentId);

    return new Response(JSON.stringify(buildResponse(context)), {
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

export async function PUT(req: Request) {
  try {
    const student = await getAuthenticatedStudent(req);
    const context = await loadSelectionContext(student.studentId);

    if (!context.activePeriod) {
      return new Response(JSON.stringify({ error: 'Period za biranje predmeta nije aktivan.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as { selectedCourseIds?: unknown };
    const rawIds: unknown[] | null = Array.isArray(body.selectedCourseIds)
      ? body.selectedCourseIds
      : null;

    if (!rawIds) {
      return new Response(JSON.stringify({ error: 'Nedostaju izabrani predmeti.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const submittedIds = [...new Set(
      rawIds
        .map((value: unknown) => Number(value))
        .filter((value: number) => Number.isInteger(value))
    )];

    const availableCourses = context.courses;
    const availableIds = new Set(availableCourses.map(course => course.id));

    if (submittedIds.some(id => !availableIds.has(id))) {
      return new Response(JSON.stringify({ error: 'Izabrani su nepostojeci predmeti.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const finalIds = submittedIds;
    const selectedSet = new Set(finalIds);

    const blockMap = new Map<number, { potrebnoBirati: number; selectedCount: number }>();

    for (const course of availableCourses) {
      if (!course.izborni || !course.izborniBlok) continue;

      const selected = selectedSet.has(course.id) ? 1 : 0;
      const existing = blockMap.get(course.izborniBlok.id);

      if (existing) {
        existing.selectedCount += selected;
        continue;
      }

      blockMap.set(course.izborniBlok.id, {
        potrebnoBirati: course.izborniBlok.potrebnoBirati,
        selectedCount: selected,
      });
    }

    //proveravamo sve na serveru kao sto proveravamo i na klijentu

    const invalidBlock = [...blockMap.values()].find(
      block => block.selectedCount > block.potrebnoBirati
    );

    if (invalidBlock) {
      return new Response(JSON.stringify({
        error: `U jednom izbornom bloku mozete izabrati najvise ${invalidBlock.potrebnoBirati} predmeta.`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const totalEspb = availableCourses
      .filter(course => selectedSet.has(course.id))
      .reduce((sum, course) => sum + course.izvodjenjeKursa.espb, 0);

    
    if (totalEspb < 30 || totalEspb > 60) {
      return new Response(JSON.stringify({
        error: 'Ukupan broj ESPB mora biti izmedju 30 i 60.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }


    //update u transakciji gde updejtujemo selekciju (najjednostavnija opcija - obrisemo sve i ubacimo nove)
    await prisma.$transaction([
      prisma.biranjePredmeta.deleteMany({
        where: {
          studentId: student.studentId,
          kursUModuluId: { in: availableCourses.map(course => course.id) },
        },
      }),
      prisma.biranjePredmeta.createMany({
        data: finalIds.map(kursUModuluId => ({
          studentId: student.studentId,
          kursUModuluId,
        })),
      }),
    ]);

    return new Response(JSON.stringify({
      savedCourseIds: finalIds,
      totalEspb,
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
