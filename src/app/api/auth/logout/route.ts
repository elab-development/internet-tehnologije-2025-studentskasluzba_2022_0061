export async function POST() {
  const cookie = 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict';
  
  return new Response(
    JSON.stringify({ ok: true }), 
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    }
  );
}