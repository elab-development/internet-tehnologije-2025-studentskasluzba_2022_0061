import jwt, { type JwtPayload } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;
const RATING_KEYS = [
  'TEZINA',
  'PRAKTIČNOST',
  'KVALITET_NASTAVE',
  'ORGANIZACIJA',
  'KORISNOST',
] as const;

type RatingKey = (typeof RATING_KEYS)[number];

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => part.trim().split('=', 2))
  );
}

async function getStudentId(req: Request) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookie(cookieHeader);
  const token = cookies.token;

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

  if (typeof payload === 'string' || payload.tip !== 'STUDENT' || typeof payload.id !== 'number') {
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

  return student.id;
}

export async function GET(req: Request) {
  try {
    const studentId = await getStudentId(req);

    //nadji polozene ispite
    const passedExams = await prisma.prijavaIspita.findMany({
      where: {
        studentId,
        polozio: true,
        ocena: { gte: 6, lte: 10 },
      },
      include: {
        izvodjenjeKursa: {
          include: {
            kurs: true,
          },
        },
      },
      orderBy: [
        { datumPrijave: 'desc' },
        { id: 'desc' },
      ],
    });

    
    const uniqueByCourse = new Map<number, {
      kursId: number;
      naziv: string;
      examGrade: number;
      akademskaGodina: string;
      datumPolaganja: string;
    }>();

    for (const exam of passedExams) {
      const courseId = exam.izvodjenjeKursa.kursId;
      if (uniqueByCourse.has(courseId)) continue;
      if (exam.ocena == null) continue;

      uniqueByCourse.set(courseId, {
        kursId: courseId,
        naziv: exam.izvodjenjeKursa.kurs.naziv,
        examGrade: exam.ocena,
        akademskaGodina: exam.izvodjenjeKursa.akademskaGodina,
        datumPolaganja: exam.datumPrijave.toISOString(),
      });
    }

    //nadji postojece ocene za kurseve
    const courseIds = [...uniqueByCourse.keys()];
    const existingRatings = courseIds.length === 0
      ? []
      : await prisma.ocenaKursa.findMany({
          where: {
            studentId,
            kursId: { in: courseIds },
          },
          select: {
            kursId: true,
            parametar: true,
            ocena: true,
          },
        });

    const ratingsMap = new Map<number, Partial<Record<RatingKey, number>>>();
    for (const row of existingRatings) {
      const current = ratingsMap.get(row.kursId) ?? {};
      const key = row.parametar as RatingKey;
      current[key] = row.ocena;
      ratingsMap.set(row.kursId, current);
    }

    const items = [...uniqueByCourse.values()].map(course => ({
      ...course,
      ratings: RATING_KEYS.reduce((acc, key) => {
        acc[key] = ratingsMap.get(course.kursId)?.[key] ?? null;
        return acc;
      }, {} as Record<RatingKey, number | null>),
    }));

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: 'Greska na serveru.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

type SaveBody = {
  kursId?: unknown;
  ratings?: unknown;
};

export async function PUT(req: Request) {
  try {
    const studentId = await getStudentId(req);
    const body = await req.json() as SaveBody;
    const kursId = Number(body.kursId);

    if (!Number.isInteger(kursId)) {
      return new Response(JSON.stringify({ error: 'Neispravan kurs.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawRatings = body.ratings;
    if (!rawRatings || typeof rawRatings !== 'object') {
      return new Response(JSON.stringify({ error: 'Nedostaju ocene po parametrima.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ratings = RATING_KEYS.reduce((acc, key) => {
      const value = Number((rawRatings as Record<string, unknown>)[key]);
      acc[key] = value;
      return acc;
    }, {} as Record<RatingKey, number>);

    const invalid = Object.values(ratings).some(value => !Number.isInteger(value) || value < 1 || value > 5);
    if (invalid) {
      return new Response(JSON.stringify({ error: 'Sve ocene moraju biti ceo broj od 1 do 5.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passedCourse = await prisma.prijavaIspita.findFirst({
      where: {
        studentId,
        polozio: true,
        ocena: { gte: 6, lte: 10 },
        izvodjenjeKursa: {
          kursId,
        },
      },
      select: { id: true },
    });

    if (!passedCourse) {
      return new Response(JSON.stringify({ error: 'Dozvoljeno je ocenjivanje samo položenih predmeta.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.$transaction([
      prisma.ocenaKursa.deleteMany({
        where: { studentId, kursId },
      }),
      prisma.ocenaKursa.createMany({
        data: RATING_KEYS.map(parametar => ({
          studentId,
          kursId,
          parametar,
          ocena: ratings[parametar],
        })),
      }),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: 'Greska na serveru.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
