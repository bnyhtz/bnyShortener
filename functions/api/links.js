// API endpoint for /api/links

/**
 * Generates a random alphanumeric string of a given length.
 * @param {number} length The length of the string to generate.
 * @returns {string} The random string.
 */
function generateRandomPath(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Handles POST requests to create a new shortened link.
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // Check for password protection
    if (env.PASSWORD) {
      const providedPassword = request.headers.get('X-Link-Shortener-Password');
      if (providedPassword !== env.PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (!env.LINKS) {
      return new Response(JSON.stringify({ error: 'KV Namespace "LINKS" is not bound. Please check your Cloudflare Pages project settings.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  let { url, customPath, embeds, metadata, cloaking, domain } = await request.json();

    // 1. Validate and normalize URL
    if (!url) {
      return new Response(JSON.stringify({ error: 'A valid URL is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!/^(https?:\/\/)/.test(url)) {
      url = `https://${url}`;
    }

    // 2. Validate and determine the path
    if (customPath && !/^[a-zA-Z0-9/-]+$/.test(customPath)) {
      return new Response(JSON.stringify({ error: 'Custom path can only contain letters, numbers, slashes, and dashes.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    let path = customPath || generateRandomPath();

    // 3. Check if the path already exists
    const existingLink = await env.LINKS.get(path);
    if (existingLink) {
      return new Response(JSON.stringify({ error: `The path "${path}" is already in use. Please choose another.` }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Validate domain (if provided) and determine stored domain/base host
    let storedDomain = null;
    if (domain) {
      if (env && env.DOMAINS) {
        const allowed = env.DOMAINS.split(',').map(s => s.trim()).filter(Boolean);
        if (!allowed.includes(domain)) {
          return new Response(JSON.stringify({ error: 'The specified domain is not allowed.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      storedDomain = domain;
    }

    const linkData = {
      url: url,
      createdAt: Date.now(),
      embeds: embeds === true, // Ensure it's a boolean
      metadata: metadata || null,
      cloaking: cloaking === true,
      domain: storedDomain,
    };
    await env.LINKS.put(path, JSON.stringify(linkData));

    // 5. Build shortUrl using storedDomain or request host
    const urlObj = new URL(request.url);
    const baseHost = storedDomain || urlObj.host;
    const shortUrl = `https://${baseHost}/${path}`;
    
    return new Response(JSON.stringify({
      originalUrl: url,
      path: path,
  shortUrl: shortUrl,
      editable: true, // Let the frontend know it can be edited
  domain: storedDomain,
    }), {
      status: 201, // Created
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handles PUT requests to update a shortened link (one-time edit).
 */
export async function onRequestPut(context) {
  try {
    const { request, env } = context;

    // Determine if an admin password was provided (when PASSWORD is set)
    let isAdmin = false;
    if (env.PASSWORD) {
      const providedPassword = request.headers.get('X-Link-Shortener-Password');
      if (!providedPassword || providedPassword !== env.PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      isAdmin = true;
    }

    if (!env.LINKS) {
      return new Response(JSON.stringify({ error: 'KV Namespace "LINKS" is not bound. Please check your Cloudflare Pages project settings.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let { url, path } = await request.json();

    // 1. Validate and normalize input
    if (!path || !url) {
      return new Response(JSON.stringify({ error: 'A valid path and URL are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!/^(https?:\/\/)/.test(url)) {
      url = `https://${url}`;
    }

    // 2. Check if the link exists
    const existingData = await env.LINKS.get(path);
    if (!existingData) {
      return new Response(JSON.stringify({ error: 'The specified path does not exist.' }), {
        status: 404, // Not Found
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const linkData = JSON.parse(existingData);

    // 3. Check if the link is still editable (within a 5-minute window), unless admin
    if (!isAdmin) {
      const fiveMinutes = 5 * 60 * 1000;
      if (!linkData.createdAt || (Date.now() - linkData.createdAt > fiveMinutes)) {
        return new Response(JSON.stringify({ error: 'This link is no longer editable.' }), {
          status: 403, // Forbidden
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. Update the link and make it permanent by removing the timestamp
    const permanentLinkData = { url: url, embeds: linkData.embeds }; // Preserve embed setting
    await env.LINKS.put(path, JSON.stringify(permanentLinkData));

    // 5. Return the successful response
    return new Response(JSON.stringify({
      message: 'Link updated successfully.',
      path: path,
      newUrl: url,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handles DELETE requests to remove a shortened link.
 * Accepts JSON body: { path: 'short-path' }
 */
export async function onRequestDelete(context) {
  try {
    const { request, env } = context;

    // Require password if configured
    if (env.PASSWORD) {
      const providedPassword = request.headers.get('X-Link-Shortener-Password');
      if (!providedPassword || providedPassword !== env.PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (!env.LINKS) {
      return new Response(JSON.stringify({ error: 'KV Namespace "LINKS" is not bound.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { path } = await request.json();
    if (!path) {
      return new Response(JSON.stringify({ error: 'A valid path is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await env.LINKS.delete(path);

    return new Response(JSON.stringify({ message: 'Deleted' }), {
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