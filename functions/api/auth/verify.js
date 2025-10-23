// API endpoint for /api/auth/verify

export async function onRequestPost(context) {
  const { request, env } = context;

  // This endpoint should only be used if a password is set
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  };

  if (!env.PASSWORD) {
    return new Response(JSON.stringify({ verified: true }), { headers });
  }

  try {
    const { password } = await request.json();
    const verified = password === env.PASSWORD;

    if (verified) {
      return new Response(JSON.stringify({ verified: true }), { headers });
    } else {
      return new Response(JSON.stringify({ verified: false, error: 'Incorrect password.' }), {
        status: 401,
        headers: headers,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}