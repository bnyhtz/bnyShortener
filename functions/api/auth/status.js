// API endpoint for /api/auth/status

export async function onRequestGet(context) {
  const { env } = context;

  // PASSWORD will be an environment variable set in the Cloudflare dashboard.
  const passwordProtected = env.PASSWORD && env.PASSWORD.length > 0;

  return new Response(JSON.stringify({ passwordProtected }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}