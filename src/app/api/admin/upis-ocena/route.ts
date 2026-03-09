import jwt, { type JwtPayload } from 'jsonwebtoken';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

type ParsedRow = {
  rowNumber: number;
  brojIndeksa: string;
  poeni: number;
  ocena: number;
};

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => part.trim().split('=', 2))
  );
}

function toInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return null;
    return parsed;
  }

  return null;
}

function toIndex(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  return null;
}

async function requireAdmin(req: Request) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookie(cookieHeader);
  const token = cookies.token;

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof payload === 'string' || payload.tip !== 'ADMINISTRATOR') {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function parseSpreadsheet(fileName: string, fileBytes: ArrayBuffer) {
  const workbook = XLSX.read(fileBytes, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('Datoteka nema nijedan list.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  });

  const parsedRows: ParsedRow[] = [];
  const invalidRows: { rowNumber: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    const firstCell = row[0];
    const secondCell = row[1];
    const thirdCell = row[2];

    const rowIsEmpty = [firstCell, secondCell, thirdCell].every(value => {
      if (typeof value === 'string') return value.trim() === '';
      return value == null;
    });

    if (rowIsEmpty) {
      continue;
    }

    // Optional header row: broj indeksa, poeni, ocena
    if (
      i === 0 &&
      typeof firstCell === 'string' &&
      firstCell.toLowerCase().includes('broj') &&
      typeof secondCell === 'string' &&
      secondCell.toLowerCase().includes('poen') &&
      typeof thirdCell === 'string' &&
      thirdCell.toLowerCase().includes('ocen')
    ) {
      continue;
    }

    const brojIndeksa = toIndex(firstCell);
    const poeni = toInteger(secondCell);
    const ocena = toInteger(thirdCell);

    if (!brojIndeksa) {
      invalidRows.push({ rowNumber, reason: 'Nedostaje broj indeksa.' });
      continue;
    }

    if (poeni == null || poeni < 0 || poeni > 100) {
      invalidRows.push({ rowNumber, reason: 'Poeni moraju biti ceo broj od 0 do 100.' });
      continue;
    }

    if (ocena == null || ocena < 5 || ocena > 10) {
      invalidRows.push({ rowNumber, reason: 'Ocena mora biti ceo broj od 5 do 10.' });
      continue;
    }

    parsedRows.push({
      rowNumber,
      brojIndeksa,
      poeni,
      ocena,
    });
  }

  if (parsedRows.length === 0 && invalidRows.length === 0) {
    throw new Error(`Datoteka "${fileName}" je prazna.`);
  }

  return { parsedRows, invalidRows };
}

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const now = new Date();

    const realizations = await prisma.realizacijaIspitnogRoka.findMany({
      where: {
        pocetakRoka: { lte: now },
        krajRoka: { gte: now },
      },
      include: {
        klasaIspitnogRoka: {
          select: {
            naziv: true,
          },
        },
      },
      orderBy: [
        { krajRoka: 'asc' },
        { id: 'asc' },
      ],
    });

    const allSubjects = await prisma.izvodjenjeKursa.findMany({
      include: {
        kurs: {
          select: {
            naziv: true,
          },
        },
        katedra: {
          select: {
            fakultet: {
              select: {
                naziv: true,
              },
            },
          },
        },
      },
      orderBy: [
        { akademskaGodina: 'desc' },
        { id: 'asc' },
      ],
    });

    const mappedRealizations = realizations.map(realization => ({
      id: realization.id,
      naziv: realization.klasaIspitnogRoka.naziv,
      akademskaGodina: realization.akademskaGodina,
      pocetakRoka: realization.pocetakRoka.toISOString(),
      krajRoka: realization.krajRoka.toISOString(),
    }));

    const mappedSubjects = allSubjects.map(subject => ({
      izvodjenjeKursaId: subject.id,
      naziv: subject.kurs.naziv,
      espb: subject.espb,
      akademskaGodina: subject.akademskaGodina,
      fakultet: subject.katedra.fakultet.naziv,
    }));

    return new Response(JSON.stringify({
      realizations: mappedRealizations,
      subjects: mappedSubjects,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const formData = await req.formData();
    const realizationId = Number(formData.get('realizationId'));
    const izvodjenjeKursaId = Number(formData.get('izvodjenjeKursaId'));
    const file = formData.get('file');

    if (!Number.isInteger(realizationId) || !Number.isInteger(izvodjenjeKursaId) || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Nedostaju podaci: realizacija, predmet ili datoteka.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const extension = file.name.toLowerCase().split('.').pop() ?? '';
    if (!['csv', 'xls', 'xlsx'].includes(extension)) {
      return new Response(JSON.stringify({ error: 'Dozvoljene su samo CSV/XLS/XLSX datoteke.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const realization = await prisma.realizacijaIspitnogRoka.findFirst({
      where: {
        id: realizationId,
        pocetakRoka: { lte: now },
        krajRoka: { gte: now },
      },
      select: {
        id: true,
      },
    });

    if (!realization) {
      return new Response(JSON.stringify({ error: 'Izabrana realizacija nije trenutno aktivna.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subject = await prisma.izvodjenjeKursa.findUnique({
      where: {
        id: izvodjenjeKursaId,
      },
      select: {
        id: true,
      },
    });

    if (!subject) {
      return new Response(JSON.stringify({ error: 'Izabrano izvodjenje predmeta ne postoji.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bytes = await file.arrayBuffer();
    const { parsedRows, invalidRows } = parseSpreadsheet(file.name, bytes);

    const indexList = [...new Set(parsedRows.map(row => row.brojIndeksa))];
    const students = await prisma.student.findMany({
      where: {
        brojIndeksa: { in: indexList },
      },
      select: {
        id: true,
        brojIndeksa: true,
      },
    });

    const studentByIndex = new Map<string, number>(
      students.map(student => [student.brojIndeksa, student.id])
    );

    const studentIds = students.map(student => student.id);
    const prijave = studentIds.length === 0
      ? []
      : await prisma.prijavaIspita.findMany({
          where: {
            studentId: { in: studentIds },
            realizacijaIspitnogRokaId: realizationId,
            izvodjenjeKursaId,
          },
          select: {
            id: true,
            studentId: true,
          },
        });

    const prijavaByStudentId = new Map<number, number>(
      prijave.map(prijava => [prijava.studentId, prijava.id])
    );

    const missingStudents = new Set<string>();
    const missingPrijava = new Set<string>();
    const finalUpdates = new Map<number, { poeni: number; ocena: number; polozio: boolean }>();

    for (const row of parsedRows) {
      const studentId = studentByIndex.get(row.brojIndeksa);
      if (!studentId) {
        missingStudents.add(row.brojIndeksa);
        continue;
      }

      const prijavaId = prijavaByStudentId.get(studentId);
      if (!prijavaId) {
        missingPrijava.add(row.brojIndeksa);
        continue;
      }

      finalUpdates.set(prijavaId, {
        poeni: row.poeni,
        ocena: row.ocena,
        polozio: row.ocena >= 6,
      });
    }

    await prisma.$transaction(
      [...finalUpdates.entries()].map(([prijavaId, payload]) =>
        prisma.prijavaIspita.update({
          where: { id: prijavaId },
          data: {
            poeni: payload.poeni,
            ocena: payload.ocena,
            polozio: payload.polozio,
          },
        })
      )
    );

    return new Response(JSON.stringify({
      processedRows: parsedRows.length,
      updatedRows: finalUpdates.size,
      invalidRows,
      missingStudents: [...missingStudents],
      missingPrijava: [...missingPrijava],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Response) return error;

    const message = error instanceof Error ? error.message : 'Server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
