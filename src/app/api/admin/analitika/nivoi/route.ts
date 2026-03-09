import jwt, { type JwtPayload } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET!;

function parseCookie(header: string | null) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => part.trim().split('=', 2))
  );
}

function normalizeLevel(level: string) {
  if (level === 'SPECIJALISTIČKE' || level === 'SPECIJALISTIÄŒKE') {
    return 'SPECIJALISTICKE';
  }

  return level;
}

function levelLabel(level: string) {
  const labels: Record<string, string> = {
    OSNOVNE: 'Osnovne studije',
    MASTER: 'Master studije',
    DOKTORSKE: 'Doktorske studije',
    SPECIJALISTICKE: 'Specijalisticke studije',
  };

  return labels[level] ?? level;
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookie(cookieHeader);
    const token = cookies.token;

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

    const allEnrollments = await prisma.upisStudenta.findMany({
      select: {
        studentId: true,
        nivoStudija: true,
        akademskaGodina: true,
        id: true,
      },
      orderBy: [
        { studentId: 'asc' },
        { akademskaGodina: 'desc' },
        { id: 'desc' },
      ],
    });

    const latestLevelByStudent = new Map<number, string>();
    for (const enrollment of allEnrollments) {
      if (latestLevelByStudent.has(enrollment.studentId)) continue;
      latestLevelByStudent.set(
        enrollment.studentId,
        normalizeLevel(enrollment.nivoStudija)
      );
    }

    const orderedLevels = ['OSNOVNE', 'MASTER', 'DOKTORSKE', 'SPECIJALISTICKE'];
    const countByLevel = new Map<string, number>(
      orderedLevels.map(level => [level, 0])
    );

    for (const level of latestLevelByStudent.values()) {
      countByLevel.set(level, (countByLevel.get(level) ?? 0) + 1);
    }

    const items = orderedLevels.map(level => ({
      level,
      label: levelLabel(level),
      count: countByLevel.get(level) ?? 0,
    }));

    return new Response(
      JSON.stringify({
        totalStudents: latestLevelByStudent.size,
        items,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
