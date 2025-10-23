/**
 * Lists links stored in the LINKS KV namespace.
 * Optional query param: ?domain=example.com to filter by stored domain (or by request host for entries without a stored domain).
 */
export async function onRequestGet(context) {
  try {
    const { request, env } = context;

    if (!env.LINKS) {
      return new Response(JSON.stringify({ error: 'KV Namespace "LINKS" is not bound.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const filterDomain = url.searchParams.get('domain');

    // List keys (limit to 1000 for now)
    const list = await env.LINKS.list({ limit: 1000 });
    const results = [];

    for (const key of list.keys) {
      const raw = await env.LINKS.get(key.name);
      if (!raw) continue;
      let data;
      try { data = JSON.parse(raw); } catch (e) { continue; }

      // Determine effective domain for this entry
      const effectiveDomain = data.domain || url.host;

      if (filterDomain) {
        if (effectiveDomain !== filterDomain) continue;
      }

      const shortUrl = `https://${effectiveDomain}/${key.name}`;

      results.push({
        path: key.name,
        shortUrl,
        originalUrl: data.url,
        createdAt: data.createdAt || null,
        embeds: !!data.embeds,
        cloaking: !!data.cloaking,
        metadata: data.metadata || null,
        domain: data.domain || null,
      });
    }

    return new Response(JSON.stringify({ links: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
