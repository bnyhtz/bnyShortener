import { verifyJWT } from './utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  // If no password is configured, everyone is effectively authenticated
  if (!env.PASSWORD) {
    return new Response(JSON.stringify({ authenticated: true }), { headers });
  }

  // If SESSION_SECRET is not configured, we can't validate a cookie-based session
  if (!env.SESSION_SECRET) {
    return new Response(JSON.stringify({ authenticated: false }), { headers });
  }

  try {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('link_session='));
    if (!match) return new Response(JSON.stringify({ authenticated: false }), { headers });
    const token = match.split('=')[1];
    const payload = await verifyJWT(token, env.SESSION_SECRET);
    if (!payload) return new Response(JSON.stringify({ authenticated: false }), { headers });
    return new Response(JSON.stringify({ authenticated: true, payload }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ authenticated: false }), { headers });
  }
}
