import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/openapi/route';
import { openApiSpec } from '@/lib/openapi/spec';

describe('GET /api/openapi (integration)', () => {
  it('returns OpenAPI JSON payload', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(body.openapi).toBe(openApiSpec.openapi);
    expect(body.info?.title).toBe(openApiSpec.info.title);
    expect(Object.keys(body.paths ?? {})).not.toHaveLength(0);
  });
});
