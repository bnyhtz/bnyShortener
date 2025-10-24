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
      // Check for password protection. Accept either the legacy header or a valid session cookie.
      if (env.PASSWORD) {
        const providedPassword = request.headers.get('X-Link-Shortener-Password');
        let ok = false;
        if (providedPassword && providedPassword === env.PASSWORD) ok = true;
        // Try cookie-based session if configured
        if (!ok && env.SESSION_SECRET) {
          try {
            const cookie = request.headers.get('Cookie') || '';
            const m = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('link_session='));
            if (m) {
              const token = m.split('=')[1];
              const { verifyJWT } = await import('./auth/utils.js');
              const payload = await verifyJWT(token, env.SESSION_SECRET);
              if (payload) ok = true;
            }
          } catch (e) {
            // ignore verification errors
          }
        }
        if (!ok) {
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

    // Determine if an admin password/session was provided (when PASSWORD is set)
    let isAdmin = false;
    if (env.PASSWORD) {
      const providedPassword = request.headers.get('X-Link-Shortener-Password');
      if (providedPassword && providedPassword === env.PASSWORD) isAdmin = true;
      // try cookie-based session
      if (!isAdmin && env.SESSION_SECRET) {
        try {
          const cookie = request.headers.get('Cookie') || '';
          const m = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('link_session='));
          if (m) {
            const token = m.split('=')[1];
            const { verifyJWT } = await import('./auth/utils.js');
            const payload = await verifyJWT(token, env.SESSION_SECRET);
            if (payload) isAdmin = true;
          }
        } catch (e) {
          // ignore
        }
      }
      if (!isAdmin) {
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

  let { url, path, newPath, domain } = await request.json();

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

    // 2. Check if the link exists (path is the existing key)
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

    // 4. Validate newPath (if provided) and domain (if provided)
    let targetPath = path;
    if (newPath && String(newPath) !== String(path)) {
      if (!/^[a-zA-Z0-9/-]+$/.test(newPath)) {
        return new Response(JSON.stringify({ error: 'New path can only contain letters, numbers, slashes, and dashes.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // ensure newPath doesn't already exist
      const exists = await env.LINKS.get(newPath);
      if (exists) {
        return new Response(JSON.stringify({ error: `The new path "${newPath}" is already in use.` }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      targetPath = newPath;
    }

    // validate domain if provided
    let storedDomain = linkData.domain || null;
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

    // 5. Update the link and make it permanent by removing the timestamp
    const permanentLinkData = {
      url: url,
      embeds: linkData.embeds,
      metadata: linkData.metadata || null,
      cloaking: linkData.cloaking || false,
      domain: storedDomain,
      createdAt: linkData.createdAt || Date.now(),
    };

    // Put new key then delete old key if renaming
    await env.LINKS.put(targetPath, JSON.stringify(permanentLinkData));
    if (targetPath !== path) {
      await env.LINKS.delete(path);
    }

    // 6. Return the successful response
    return new Response(JSON.stringify({
      message: 'Link updated successfully.',
      path: targetPath,
      newUrl: url,
      domain: storedDomain,
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

    // Require password if configured (accept header or cookie session)
    if (env.PASSWORD) {
      const providedPassword = request.headers.get('X-Link-Shortener-Password');
      let ok = false;
      if (providedPassword && providedPassword === env.PASSWORD) ok = true;
      if (!ok && env.SESSION_SECRET) {
        try {
          const cookie = request.headers.get('Cookie') || '';
          const m = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('link_session='));
          if (m) {
            const token = m.split('=')[1];
            const { verifyJWT } = await import('./auth/utils.js');
            const payload = await verifyJWT(token, env.SESSION_SECRET);
            if (payload) ok = true;
          }
        } catch (e) {}
      }
      if (!ok) {
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