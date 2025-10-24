import React, { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const resp = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, remember }) });
      // Be defensive: some responses may be empty or not JSON (avoid JSON.parse throwing)
      const text = await resp.text();
      let js = {};
      if (text) {
        try {
          js = JSON.parse(text);
        } catch (parseErr) {
          // If server returned plain text or HTML, surface that as an error
          throw new Error(text || (resp.statusText || 'Unexpected server response'));
        }
      }

      if (!resp.ok || !js.verified) throw new Error(js.error || resp.statusText || 'Incorrect credentials');
      try { window.sessionStorage.setItem('loggedInFromMain', '1'); } catch (e) {}
      // Redirect to dash
      window.location.pathname = '/dash';
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="container">
      <div className="login-card">
        <h1>bnyShortener</h1>
        <p style={{ textAlign: 'center' }}>Please sign in.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label htmlFor="username" style={{ display: 'block', textAlign: 'center' }}>Username</label>
            <input type="text" id="username" value={username} onChange={(e)=>setUsername(e.target.value)} style={{ width: '100%', textAlign: 'center' }} />
          </div>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <label htmlFor="password" style={{ display: 'block', textAlign: 'center' }}>Password</label>
            <input type="password" id="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width: '100%', textAlign: 'center' }} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label htmlFor="remember" style={{ margin: 0 }}>Remember me</label>
            <input id="remember" type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
          </div>
          <button type="submit" className="primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          {error && <p className="error" style={{ marginTop: '1rem' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
