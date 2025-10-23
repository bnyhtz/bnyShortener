export async function onRequestPost(context) {
  const { env } = context;
  const headers = { 'Content-Type': 'application/json' };
  // Clear the cookie by setting Max-Age=0
  const cookie = `link_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;` + (env.NODE_ENV === 'production' ? ' Secure;' : '');
  const respHeaders = Object.assign({}, headers, { 'Set-Cookie': cookie });
  return new Response(JSON.stringify({ loggedOut: true }), { headers: respHeaders });
}
