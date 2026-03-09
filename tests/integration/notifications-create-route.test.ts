import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  notifikacija: {
    create: vi.fn(),
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

import { POST } from '@/app/api/notifications/create/route';

describe('POST /api/notifications/create (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when token is missing', async () => {
    const req = new Request('http://localhost/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when token is invalid', async () => {
    jwtMock.verify.mockImplementation(() => {
      throw new Error('bad token');
    });

    const req = new Request('http://localhost/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { cookie: 'token=bad', 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid token' });
  });

  it('returns 403 for non-admin users', async () => {
    jwtMock.verify.mockReturnValue({ id: 5, tip: 'STUDENT' });

    const req = new Request('http://localhost/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { cookie: 'token=ok', 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('returns 400 when required fields are missing', async () => {
    jwtMock.verify.mockReturnValue({ id: 1, tip: 'ADMINISTRATOR' });

    const req = new Request('http://localhost/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify({ naslov: 'Only title' }),
      headers: { cookie: 'token=ok', 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing fields' });
  });

  it('creates notification for admin with valid payload', async () => {
    jwtMock.verify.mockReturnValue({ id: 1, tip: 'ADMINISTRATOR' });
    prismaMock.notifikacija.create.mockResolvedValue({
      id: 101,
      grupaNotifikacijaId: 7,
      naslov: 'Obavestenje',
      sadrzaj: 'Sadrzaj poruke',
    });

    const req = new Request('http://localhost/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify({
        grupaNotifikacijaId: 7,
        naslov: 'Obavestenje',
        sadrzaj: 'Sadrzaj poruke',
      }),
      headers: { cookie: 'token=ok', 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(prismaMock.notifikacija.create).toHaveBeenCalledWith({
      data: {
        grupaNotifikacijaId: 7,
        naslov: 'Obavestenje',
        sadrzaj: 'Sadrzaj poruke',
      },
    });
    expect(data.notification?.id).toBe(101);
  });

  it('returns 500 when create throws', async () => {
    jwtMock.verify.mockReturnValue({ id: 1, tip: 'ADMINISTRATOR' });
    prismaMock.notifikacija.create.mockRejectedValue(new Error('db error'));

    const req = new Request('http://localhost/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify({
        grupaNotifikacijaId: 7,
        naslov: 'Obavestenje',
        sadrzaj: 'Sadrzaj poruke',
      }),
      headers: { cookie: 'token=ok', 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server error' });
  });
});
