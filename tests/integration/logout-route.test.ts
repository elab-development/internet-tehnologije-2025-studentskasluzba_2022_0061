import { describe, expect, it } from 'vitest';

import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout (integration)', () => {
  it('clears auth cookie and returns ok response', async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(response.headers.get('set-cookie')).toContain('token=');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
