import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  korisnik: {
    findUnique: vi.fn(),
  },
}));

const jwtMock = vi.hoisted(() => ({
  verify: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('jsonwebtoken', () => ({
  default: jwtMock,
}));

import { GET } from '@/app/api/auth/me/route';

describe('GET /api/auth/me (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 with null user when token is missing', async () => {
    const req = new Request('http://localhost/api/auth/me');

    const res = await GET(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ user: null });
  });

  it('returns 401 with null user when token is invalid', async () => {
    jwtMock.verify.mockImplementation(() => {
      throw new Error('bad token');
    });

    const req = new Request('http://localhost/api/auth/me', {
      headers: { cookie: 'token=abc' },
    });

    const res = await GET(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ user: null });
  });

  it('returns 401 when token is valid but user does not exist', async () => {
    jwtMock.verify.mockReturnValue({ id: 7 });
    prismaMock.korisnik.findUnique.mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/me', {
      headers: { cookie: 'token=valid' },
    });

    const res = await GET(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ user: null });
  });

  it('returns user payload when authenticated', async () => {
    jwtMock.verify.mockReturnValue({ id: 3 });
    prismaMock.korisnik.findUnique.mockResolvedValue({
      id: 3,
      email: 'student@test.rs',
      ime: 'Petar',
      prezime: 'Petrovic',
      tip: 'STUDENT',
    });

    const req = new Request('http://localhost/api/auth/me', {
      headers: { cookie: 'token=valid' },
    });

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user?.id).toBe(3);
    expect(data.user?.email).toBe('student@test.rs');
    expect(data.user?.tip).toBe('STUDENT');
  });

  it('returns 500 when user lookup throws', async () => {
    jwtMock.verify.mockReturnValue({ id: 9 });
    prismaMock.korisnik.findUnique.mockRejectedValue(new Error('db down'));

    const req = new Request('http://localhost/api/auth/me', {
      headers: { cookie: 'token=valid' },
    });

    const res = await GET(req);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ user: null });
  });
});
