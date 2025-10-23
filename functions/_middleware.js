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
      // 4. If found, parse the data and redirect to the URL
      const linkData = JSON.parse(storedValue);
      if (linkData && linkData.url) {
        return Response.redirect(linkData.url, 302); // 302 Found redirect
      }
    }
  } catch (error) {
    console.error(`KV lookup or redirect failed: ${error}`);
    // If KV lookup fails, proceed to the app to avoid breaking the site
  }

  // 5. If not found, proceed to the React application (which will handle 404s)
  return await next();
}