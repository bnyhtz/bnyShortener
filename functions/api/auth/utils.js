// Minimal JWT HS256 helpers using Web Crypto API (available in Cloudflare Workers)
const encoder = new TextEncoder();

function base64UrlEncode(uint8) {
  let str = '';
  for (let i = 0; i < uint8.length; i++) str += String.fromCharCode(uint8[i]);
  // btoa works on binary strings
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeString(str) {
  return base64UrlEncode(encoder.encode(str));
}

async function hmacSha256(key, msg) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(msg));
  return new Uint8Array(sig);
}

export async function signJWT(payloadObj, secret, expiresInSeconds = 60 * 60 * 24) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = Object.assign({}, payloadObj, { iat: now, exp: now + expiresInSeconds });

  const header64 = base64UrlEncodeString(JSON.stringify(header));
  const payload64 = base64UrlEncodeString(JSON.stringify(payload));
  const data = `${header64}.${payload64}`;
  const sig = await hmacSha256(secret, data);
  const sig64 = base64UrlEncode(sig);
  return `${data}.${sig64}`;
}

export async function verifyJWT(token, secret) {
  try {
    if (!token || !secret) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header64, payload64, sig64] = parts;
    const data = `${header64}.${payload64}`;
    const expectedSig = await hmacSha256(secret, data);
    const expected64 = base64UrlEncode(expectedSig);
    if (!(expected64 === sig64)) return null;
    // decode payload
    const payloadJson = atob(payload64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
