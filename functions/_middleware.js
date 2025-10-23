// functions/_middleware.js

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname.slice(1); // Remove leading '/'

  // 1. Check for KV binding first
  if (!env.LINKS) {
    // This won't be visible to the user but is good for server-side logs.
    console.error('KV Namespace "LINKS" is not bound.');
    // Allow the request to proceed to the frontend, which can show a proper error.
    return await next();
  }

  // 2. Ignore paths for the API and static assets
  if (path.startsWith('api/') || path.startsWith('assets/')) {
    return await next();
  }

  // 2. Ignore the root path (let the React app handle it)
  if (path === '') {
    return await next();
  }

  try {
    // 3. Look up the path in the KV store
    const storedValue = await env.LINKS.get(path);

    if (storedValue) {
      const linkData = JSON.parse(storedValue);
      if (!linkData || !linkData.url) {
        // Invalid data in KV, proceed to 404
        return await next();
      }

      // 4. Check for link cloaking first
      if (linkData.cloaking) {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${linkData.metadata?.title || 'Link'}</title>
              <meta name="description" content="${linkData.metadata?.description || ''}">
              ${linkData.metadata?.image ? `<link rel="icon" href="${linkData.metadata.image}">` : ''}
              <style>
                body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                iframe { width: 100%; height: 100%; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${linkData.url}"></iframe>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }

      // 5. Check if the visitor is a bot for metadata embeds
      const userAgent = request.headers.get('User-Agent') || '';
      const isBot = /bot|facebook|embed|got|firefox\/92|firefox\/38|curl|wget|go-http-client|yahoo|bing|google|spider|slack|whatsapp|twitter|discord/i.test(userAgent);

      if (isBot) {
        const embedsDisabled = linkData.embeds === false;
        console.log(`Bot detected for path: /${path}. User-Agent: ${userAgent}. Embeds disabled: ${embedsDisabled}`);

        if (embedsDisabled) {
          return new Response('<!DOCTYPE html><title></title>', { headers: { 'Content-Type': 'text/html' } });
        }

        // Serve custom metadata if it exists
        if (linkData.metadata) {
          return new Response(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${linkData.metadata.title || ''}</title>
                <meta name="description" content="${linkData.metadata.description || ''}">
                <meta property="og:title" content="${linkData.metadata.title || ''}">
                <meta property="og:description" content="${linkData.metadata.description || ''}">
                ${linkData.metadata.image ? `<meta property="og:image" content="${linkData.metadata.image}">` : ''}
                <meta name="twitter:card" content="summary_large_image">
              </head>
              <body></body>
            </html>
          `, { headers: { 'Content-Type': 'text/html' } });
        }
      }

      // 6. For all regular users, perform the redirect
      return Response.redirect(linkData.url, 302);
    }
  } catch (error) {
    console.error(`KV lookup or redirect failed: ${error}`);
    // If KV lookup fails, proceed to the app to avoid breaking the site
  }

  // 5. If not found, proceed to the React application (which will handle 404s)
  return await next();
}