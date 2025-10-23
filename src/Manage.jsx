import { useState, useEffect } from 'react';
import './App.css';

export default function Manage() {
  const [domains, setDomains] = useState([]);
  const [filterDomain, setFilterDomain] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [linksLoading, setLinksLoading] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/domains');
        const data = await resp.json();
        if (data && Array.isArray(data.domains)) setDomains(data.domains);
      } catch (e) {}

      try {
        const s = await fetch('/api/auth/status');
        const js = await s.json();
        setPasswordProtected(!!js.passwordProtected);
      } catch (e) {}
    })();
    // restore session password from localStorage
    try {
      const saved = window.localStorage.getItem('adminPassword');
      if (saved) setSessionPassword(saved);
    } catch (e) {}
  }, []);

  const fetchLinks = async (domain) => {
    setLinksLoading(true);
    try {
      const qs = domain ? `?domain=${encodeURIComponent(domain)}` : '';
      const resp = await fetch(`/api/list-links${qs}`);
      const data = await resp.json();
      setLinks(Array.isArray(data.links) ? data.links : []);
    } catch (e) {
      alert('Failed to load links');
    } finally {
      setLinksLoading(false);
    }
  };

  useEffect(() => { fetchLinks(filterDomain || null); }, [filterDomain]);

  const filtered = links.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.path && l.path.toLowerCase().includes(s)) || (l.originalUrl && l.originalUrl.toLowerCase().includes(s));
  });

  const doDelete = async (path) => {
    if (!confirm(`Delete ${path}? This cannot be undone.`)) return;
    let headers = { 'Content-Type': 'application/json' };
    if (passwordProtected) {
      const pwd = sessionPassword || prompt('Enter admin password to delete:');
      if (!pwd) return;
      headers['X-Link-Shortener-Password'] = pwd;
    }
    const resp = await fetch('/api/links', { method: 'DELETE', headers, body: JSON.stringify({ path }) });
    if (resp.ok) {
      setLinks(links.filter(l => l.path !== path));
      alert('Deleted');
    } else {
      const js = await resp.json().catch(() => ({}));
      alert(js.error || 'Delete failed');
    }
  };

  const doEdit = async (path, currentUrl) => {
    const newUrl = prompt('Enter new destination URL', currentUrl);
    if (!newUrl) return;
    let headers = { 'Content-Type': 'application/json' };
    if (passwordProtected) {
      const pwd = sessionPassword || prompt('Enter admin password to edit:');
      if (!pwd) return;
      headers['X-Link-Shortener-Password'] = pwd;
    }

    const resp = await fetch('/api/links', { method: 'PUT', headers, body: JSON.stringify({ path, url: newUrl }) });
    if (resp.ok) {
      alert('Updated');
      fetchLinks(filterDomain || null);
    } else {
      const js = await resp.json().catch(() => ({}));
      alert(js.error || 'Update failed');
    }
  };

  const handleLogin = async (password) => {
    setLoginLoading(true);
    try {
      const resp = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const js = await resp.json();
      if (resp.ok && js.verified) {
        setSessionPassword(password);
        try { window.localStorage.setItem('adminPassword', password); } catch (e) {}
        alert('Logged in');
      } else {
        alert(js.error || 'Incorrect password');
      }
    } catch (e) { alert('Login failed'); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    setSessionPassword(null);
    try { window.localStorage.removeItem('adminPassword'); } catch (e) {}
    alert('Logged out');
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Manage links</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)}>
            <option value="">All domains</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input placeholder="Search path or URL" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginLeft: '0.5rem' }} />
          <button className="primary" onClick={() => fetchLinks(filterDomain || null)} style={{ marginLeft: '0.5rem' }} disabled={linksLoading}>{linksLoading ? 'Loading...' : 'Refresh'}</button>
          {passwordProtected && !sessionPassword && (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', alignItems: 'center' }}>
              <input type="password" placeholder="Admin password" id="adminPwd" style={{ padding: '0.5rem' }} />
              <button className="primary" onClick={() => {
                const v = document.getElementById('adminPwd').value;
                if (v) handleLogin(v);
              }} disabled={loginLoading}>{loginLoading ? 'Logging in...' : 'Login'}</button>
            </div>
          )}
          {sessionPassword && (
            <div style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="small-muted">Admin</span>
              <button className="secondary" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th>Short</th>
                <th>Original</th>
                <th>Domain</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '1rem' }}>{linksLoading ? 'Loading...' : 'No links found'}</td></tr>
              )}
              {filtered.map(l => (
                <tr key={l.path} style={{ borderTop: '1px solid #E9EDF1' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <a href={l.shortUrl} target="_blank" rel="noreferrer">{l.shortUrl}</a>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <a href={l.originalUrl} target="_blank" rel="noreferrer">{l.originalUrl}</a>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{l.domain || window.location.host}</td>
                  <td style={{ padding: '0.75rem' }}>{l.createdAt ? new Date(l.createdAt).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <button className="copy-btn" onClick={async () => { try { await navigator.clipboard.writeText(l.shortUrl); alert('Copied'); } catch { alert('Copy failed'); } }}>Copy</button>
                    <button className="open-btn" style={{ marginLeft: '0.5rem' }} onClick={() => window.open(l.shortUrl, '_blank')}>Open</button>
                    <button className="secondary" style={{ marginLeft: '0.5rem' }} onClick={() => doEdit(l.path, l.originalUrl)}>Edit</button>
                    <button className="secondary" style={{ marginLeft: '0.5rem' }} onClick={() => doDelete(l.path)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
