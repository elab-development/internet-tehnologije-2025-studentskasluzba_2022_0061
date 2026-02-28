import jwt, { type JwtPayload } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => part.trim().split('=', 2))
  );
}

async function getStudentId(req: Request) {
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
    select: {
      id: true,
      brojIndeksa: true,
      korisnik: {
        select: {
          ime: true,
          prezime: true,
        },
      },
    },
  });

  if (!student) {
    throw new Response(JSON.stringify({ error: 'Student nije pronadjen.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return student;
}

export async function GET(req: Request) {
  try {
    const student = await getStudentId(req);

    const selections = await prisma.biranjePredmeta.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        kursUModulu: {
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
            izvodjenjeKursa: {
              include: {
                kurs: true,
              },
            },
          },
        },
      },
      orderBy: [
        { kursUModulu: { izvodjenjeKursa: { akademskaGodina: 'desc' } } },
        { kursUModulu: { godinaStudija: 'asc' } },
        { kursUModulu: { semestar: 'asc' } },
      ],
    });

    const izvodjenjeIds = [...new Set(
      selections.map(selection => selection.kursUModulu.izvodjenjeKursaId)
    )];

    const passedExams = izvodjenjeIds.length === 0
      ? []
      : await prisma.prijavaIspita.findMany({
          where: {
            studentId: student.id,
            izvodjenjeKursaId: { in: izvodjenjeIds },
            polozio: true,
            ocena: {
              gte: 6,
              lte: 10,
            },
          },
          select: {
            izvodjenjeKursaId: true,
            ocena: true,
            datumPrijave: true,
          },
          orderBy: [
            { datumPrijave: 'desc' },
            { id: 'desc' },
          ],
        });

    const gradeByIzvodjenjeId = new Map<number, number>();
    for (const exam of passedExams) {
      if (exam.ocena == null || gradeByIzvodjenjeId.has(exam.izvodjenjeKursaId)) {
        continue;
      }
      gradeByIzvodjenjeId.set(exam.izvodjenjeKursaId, exam.ocena);
    }

    const items = selections.map(selection => {
      const execution = selection.kursUModulu.izvodjenjeKursa;
      const selectedModule = selection.kursUModulu.modul;

      return {
        id: selection.id,
        datumBiranja: selection.datumBiranja.toISOString(),
        akademskaGodina: execution.akademskaGodina,
        godinaStudija: selection.kursUModulu.godinaStudija,
        semestar: selection.kursUModulu.semestar,
        smer: selectedModule.program.smer.naziv,
        program: selectedModule.program.naziv,
        modul: selectedModule.naziv,
        predmet: execution.kurs.naziv,
        opis: execution.kurs.opis,
        espb: execution.espb,
        izborni: selection.kursUModulu.izborni,
        ocena: gradeByIzvodjenjeId.get(selection.kursUModulu.izvodjenjeKursaId) ?? null,
      };
    });

    const passedGrades = items
      .map(item => item.ocena)
      .filter((grade): grade is number => grade !== null);

    const averageGrade = passedGrades.length === 0
      ? null
      : Number(
          (passedGrades.reduce((sum, grade) => sum + grade, 0) / passedGrades.length).toFixed(2)
        );

    return new Response(JSON.stringify({
      student: {
        ime: student.korisnik.ime,
        prezime: student.korisnik.prezime,
        brojIndeksa: student.brojIndeksa,
      },
      items,
      passedCount: passedGrades.length,
      averageGrade,
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
