import { openApiSpec } from '@/lib/openapi/spec';

export async function GET() {
  return new Response(JSON.stringify(openApiSpec), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
