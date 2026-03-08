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
    select: {
      id: true,
      korisnik: {
        select: {
          email: true,
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

  return {
    studentId: student.id,
    latestUpis,
    studentEmail: student.korisnik.email,
    studentName: `${student.korisnik.ime} ${student.korisnik.prezime}`.trim(),
  };
}

type CreateBody = {
  tip?: 'ISPITNI_ROK' | 'KOLOKVIJUMSKA_NEDELJA';
  realizationId?: number;
  selectedCourseIds?: unknown;
  sendEmailConfirmation?: unknown;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendRegistrationEmail(input: {
  to: string;
  studentName: string;
  tip: 'ISPITNI_ROK' | 'KOLOKVIJUMSKA_NEDELJA';
  realizationNaziv: string;
  akademskaGodina: string;
  courses: { naziv: string; espb: number }[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const subjectPrefix = input.tip === 'ISPITNI_ROK' ? 'Prijava ispita' : 'Prijava kolokvijuma';
  const subject = `${subjectPrefix} - potvrda prijave`;

  const courseRows = input.courses
    .map(course => `<li>${escapeHtml(course.naziv)} (${course.espb} ESPB)</li>`)
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin-bottom: 12px;">Potvrda prijave</h2>
      <p>Zdravo ${escapeHtml(input.studentName)},</p>
      <p>Uspešno ste podneli prijavu za ${input.tip === 'ISPITNI_ROK' ? 'ispitni rok' : 'kolokvijumsku nedelju'} <strong>${escapeHtml(input.realizationNaziv)}</strong> (${escapeHtml(input.akademskaGodina)}).</p>
      <p>Prijavljeni predmeti:</p>
      <ul>${courseRows}</ul>
      <p>Pozdrav,<br/>Studentska služba</p>
    </div>
  `;

  //eksterni api poziv
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject,
        html,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { studentId, latestUpis, studentEmail, studentName } = await getCurrentStudentContext(req);
    const body = await req.json() as CreateBody;
    const rawIds = Array.isArray(body.selectedCourseIds) ? body.selectedCourseIds : null;
    const sendEmailConfirmation = body.sendEmailConfirmation === true;

    if (!body.tip || !body.realizationId || !rawIds || rawIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Potrebno je izabrati predmete i realizaciju.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const selectedCourseIds = [...new Set(
      rawIds
        .map((value: unknown) => Number(value))
        .filter((value: number) => Number.isInteger(value))
    )];

    if (selectedCourseIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Potrebno je izabrati barem jedan predmet.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const akademskaGodina = latestUpis.akademskaGodina;
    const fakultetId = latestUpis.modul.program.smer.fakultetId;
    const now = new Date();

    const selectedCourses = await prisma.biranjePredmeta.findMany({
      where: {
        studentId,
        kursUModuluId: { in: selectedCourseIds },
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
    });

    if (selectedCourses.length !== selectedCourseIds.length) {
      return new Response(JSON.stringify({ error: 'Neki od izabranih predmeta nisu dostupni za prijavu.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const izvodjenjeKursaIds = selectedCourses.map(item => item.kursUModulu.izvodjenjeKursaId);
    const passedExams = await prisma.prijavaIspita.findMany({
      where: {
        studentId,
        izvodjenjeKursaId: { in: izvodjenjeKursaIds },
        polozio: true,
      },
      select: {
        izvodjenjeKursaId: true,
      },
    });

    if (passedExams.length > 0) {
      return new Response(JSON.stringify({ error: 'Nije moguce prijaviti predmet koji je vec polozen.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.tip === 'ISPITNI_ROK') {
      const realization = await prisma.realizacijaIspitnogRoka.findFirst({
        where: {
          id: body.realizationId,
          akademskaGodina,
          pocetakPrijavljivanja: { lte: now },
          krajPrijavljivanja: { gte: now },
          klasaIspitnogRoka: {
            fakultetId,
          },
        },
        include: {
          klasaIspitnogRoka: {
            select: {
              naziv: true,
            },
          },
        },
      });

      if (!realization) {
        return new Response(JSON.stringify({ error: 'Izabrani ispitni rok nije dostupan za prijavu.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const existing = await prisma.prijavaIspita.findMany({
        where: {
          studentId,
          realizacijaIspitnogRokaId: body.realizationId,
          izvodjenjeKursaId: { in: izvodjenjeKursaIds },
        },
        select: {
          izvodjenjeKursaId: true,
        },
      });

      if (existing.length > 0) {
        return new Response(JSON.stringify({ error: 'Neki od izabranih predmeta su vec prijavljeni za ovaj ispitni rok.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await prisma.prijavaIspita.createMany({
        data: izvodjenjeKursaIds.map(izvodjenjeKursaId => ({
          studentId,
          izvodjenjeKursaId,
          realizacijaIspitnogRokaId: body.realizationId!,
        })),
      });

      const emailSent = sendEmailConfirmation
        ? await sendRegistrationEmail({
            to: studentEmail,
            studentName,
            tip: 'ISPITNI_ROK',
            realizationNaziv: realization.klasaIspitnogRoka.naziv,
            akademskaGodina,
            courses: selectedCourses.map(item => ({
              naziv: item.kursUModulu.izvodjenjeKursa.kurs.naziv,
              espb: item.kursUModulu.izvodjenjeKursa.espb,
            })),
          })
        : false;

      return new Response(JSON.stringify({ ok: true, emailSent }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const realization = await prisma.realizacijaKolokvijumskeNedelje.findFirst({
      where: {
        id: body.realizationId,
        akademskaGodina,
        pocetakPrijavljivanja: { lte: now },
        krajPrijavljivanja: { gte: now },
        klasaKolokvijumskeNedelje: {
          fakultetId,
        },
      },
      include: {
        klasaKolokvijumskeNedelje: {
          select: {
            naziv: true,
          },
        },
      },
    });

    if (!realization) {
      return new Response(JSON.stringify({ error: 'Izabrana kolokvijumska nedelja nije dostupna za prijavu.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await prisma.prijavaKolokvijuma.findMany({
      where: {
        studentId,
        realizacijaKolokvijumskeNedeljeId: body.realizationId,
        izvodjenjeKursaId: { in: izvodjenjeKursaIds },
      },
      select: {
        izvodjenjeKursaId: true,
      },
    });

    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: 'Neki od izabranih predmeta su vec prijavljeni za ovu kolokvijumsku nedelju.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.prijavaKolokvijuma.createMany({
      data: izvodjenjeKursaIds.map(izvodjenjeKursaId => ({
        studentId,
        izvodjenjeKursaId,
        realizacijaKolokvijumskeNedeljeId: body.realizationId!,
        obaveznaAktivnost: false,
      })),
    });

    const emailSent = sendEmailConfirmation
      ? await sendRegistrationEmail({
          to: studentEmail,
          studentName,
          tip: 'KOLOKVIJUMSKA_NEDELJA',
          realizationNaziv: realization.klasaKolokvijumskeNedelje.naziv,
          akademskaGodina,
          courses: selectedCourses.map(item => ({
            naziv: item.kursUModulu.izvodjenjeKursa.kurs.naziv,
            espb: item.kursUModulu.izvodjenjeKursa.espb,
          })),
        })
      : false;

    return new Response(JSON.stringify({ ok: true, emailSent }), {
      status: 201,
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
