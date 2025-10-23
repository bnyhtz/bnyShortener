// API endpoint for /api/auth/status

export async function onRequestGet(context) {
  const { env } = context;

  // PASSWORD will be an environment variable set in the Cloudflare dashboard.
  const passwordProtected = !!env.PASSWORD;

  return new Response(JSON.stringify({ passwordProtected }), {
    headers: { 'Content-Type': 'application/json' },
  });
}