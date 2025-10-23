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

    if (!env.LINKS) {
      return new Response(JSON.stringify({ error: 'KV Namespace "LINKS" is not bound. Please check your Cloudflare Pages project settings.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { url, customPath } = await request.json();

    // 1. Validate URL
    if (!url || !/^(https?:\/\/)/.test(url)) {
      return new Response(JSON.stringify({ error: 'A valid URL starting with http:// or https:// is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Determine the path
    let path = customPath || generateRandomPath();

    // 3. Check if the path already exists
    const existingLink = await env.LINKS.get(path);
    if (existingLink) {
      return new Response(JSON.stringify({ error: `The path "${path}" is already in use. Please choose another.` }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Save the new link with an editable flag
    const linkData = { url: url, editable: true };
    await env.LINKS.put(path, JSON.stringify(linkData));

    // 5. Return the successful response
    const shortUrl = new URL(path, request.url).toString().replace('/api/links', '');
    
    return new Response(JSON.stringify({
      originalUrl: url,
      path: path,
      shortUrl: shortUrl,
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

    if (!env.LINKS) {
      return new Response(JSON.stringify({ error: 'KV Namespace "LINKS" is not bound. Please check your Cloudflare Pages project settings.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { url, path } = await request.json();

    // 1. Validate input
    if (!path || !url || !/^(https?:\/\/)/.test(url)) {
      return new Response(JSON.stringify({ error: 'A valid path and URL are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    // 3. Check if the link is still editable
    if (!linkData.editable) {
      return new Response(JSON.stringify({ error: 'This link is no longer editable.' }), {
        status: 403, // Forbidden
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Update the link and make it permanent
    linkData.url = url;
    linkData.editable = false;
    await env.LINKS.put(path, JSON.stringify(linkData));

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