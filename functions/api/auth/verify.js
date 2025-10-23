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
    const { password, username, remember } = await request.json();
    const verified = !env.PASSWORD || password === env.PASSWORD;

    if (!verified) {
      return new Response(JSON.stringify({ verified: false, error: 'Incorrect password.' }), {
        status: 401,
        headers: headers,
      });
    }

    // If an ADMIN_USERNAME is configured, require the provided username to match it.
    if (env.ADMIN_USERNAME) {
      if (!username || String(username) !== String(env.ADMIN_USERNAME)) {
        return new Response(JSON.stringify({ verified: false, error: 'Incorrect username.' }), {
          status: 401,
          headers: headers,
        });
      }
    }

    // If a session secret is configured, issue an HTTP-only cookie instead of returning the raw password
    if (env.SESSION_SECRET) {
      try {
        const { signJWT } = await import('./utils.js');
        // Determine session duration. If remember requested and a remember-specific env var is set use it,
        // otherwise fall back to SESSION_MAX_AGE or default 1 day.
        const defaultAge = 60 * 60 * 24;
        const normalAge = env.SESSION_MAX_AGE ? Number(env.SESSION_MAX_AGE) : defaultAge;
        const rememberAge = env.SESSION_MAX_AGE_REMEMBER ? Number(env.SESSION_MAX_AGE_REMEMBER) : (60 * 60 * 24 * 30); // 30 days
        const maxAge = remember ? rememberAge : normalAge;
        const tokenPayload = { role: 'admin' };
        if (username) tokenPayload.username = username;
        const token = await signJWT(tokenPayload, env.SESSION_SECRET, maxAge);
        const cookie = `link_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge};` + (env.NODE_ENV === 'production' ? ' Secure;' : '');
        const respHeaders = Object.assign({}, headers, { 'Set-Cookie': cookie });
        return new Response(JSON.stringify({ verified: true }), { headers: respHeaders });
      } catch (e) {
        // fall back to returning verified=true without cookie if signing fails
        return new Response(JSON.stringify({ verified: true }), { headers });
      }
    }

    // No session secret: return verified=true (legacy behavior)
    return new Response(JSON.stringify({ verified: true }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}