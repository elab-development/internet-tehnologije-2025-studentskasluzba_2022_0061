import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  korisnik: {
    findUnique: vi.fn(),
  },
}));

const bcryptMock = vi.hoisted(() => ({
  compare: vi.fn(),
}));

const jwtMock = vi.hoisted(() => ({
  sign: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

vi.mock('bcryptjs', () => ({
  default: bcryptMock,
}));

vi.mock('jsonwebtoken', () => ({
  default: jwtMock,
}));

import { POST } from '@/app/api/auth/login/route';

describe('POST /api/auth/login (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jwtMock.sign.mockReturnValue('signed-token');
  });

  it('returns 400 when credentials are missing', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing credentials' });
  });

  it('returns 401 when user does not exist', async () => {
    prismaMock.korisnik.findUnique.mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'x@example.com', password: 'pass123' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid credentials' });
  });

  it('returns 401 when password check fails', async () => {
    prismaMock.korisnik.findUnique.mockResolvedValue({
      id: 15,
      tip: 'STUDENT',
      lozinka: 'hashed',
    });
    bcryptMock.compare.mockResolvedValue(false);

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'x@example.com', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid credentials' });
  });

  it('returns 200 with auth cookie on success', async () => {
    prismaMock.korisnik.findUnique.mockResolvedValue({
      id: 22,
      tip: 'STUDENT',
      lozinka: 'hashed',
    });
    bcryptMock.compare.mockResolvedValue(true);
    jwtMock.sign.mockReturnValue('jwt-token-123');

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ok@example.com', password: 'correct' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const setCookie = res.headers.get('Set-Cookie') ?? '';

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(setCookie).toContain('token=jwt-token-123');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Max-Age=');
  });

  it('returns 500 when request body cannot be parsed', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: '{',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
  });
});
