// API endpoint for /api/auth/verify

export async function onRequestPost(context) {
  const { request, env } = context;

  // This endpoint should only be used if a password is set
  if (!env.PASSWORD) {
    return new Response(JSON.stringify({ verified: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { password } = await request.json();
    const verified = password === env.PASSWORD;

    if (verified) {
      return new Response(JSON.stringify({ verified: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ verified: false, error: 'Incorrect password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}