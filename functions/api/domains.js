/**
 * Returns a JSON list of allowed domains for creating short links.
 * If the Pages environment provides an env variable `DOMAINS` (comma-separated),
 * those will be returned. Otherwise, the current request host will be returned
 * as a single-item array.
 */
export async function onRequestGet(context) {
  try {
    const { request, env } = context;

    let domains = [];

    if (env && env.DOMAINS) {
      // Split comma-separated list and trim
      domains = env.DOMAINS.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (domains.length === 0) {
      // Fallback to the request host
      try {
        const url = new URL(request.url);
        domains = [url.host];
      } catch (e) {
        domains = ['localhost'];
      }
    }

    return new Response(JSON.stringify({ domains }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ domains: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
