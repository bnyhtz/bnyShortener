import { useState, useEffect } from 'react';
import './App.css';
import { useNotify } from './notifications/NotificationProvider';
import { confirm, prompt, alert as dlgAlert } from './dialogs/dialogs';
import EditModal from './components/EditModal';

export default function Manage() {
  const [domains, setDomains] = useState([]);
  const [filterDomain, setFilterDomain] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [linksLoading, setLinksLoading] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [sessionAuthenticated, setSessionAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRemember, setLoginRemember] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

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
    // restore remembered username and check server-side session (cookie)
    try {
      const saved = window.localStorage.getItem('rememberedUsername');
      if (saved) setLoginUsername(saved);
    } catch (e) {}

    (async () => {
      try {
        const s = await fetch('/api/auth/session', { cache: 'no-store' });
        const js = await s.json();
        if (js && js.authenticated) setSessionAuthenticated(true);
      } catch (e) {}
    })();
  }, []);

  const fetchLinks = async (domain) => {
    setLinksLoading(true);
    try {
      const qs = domain ? `?domain=${encodeURIComponent(domain)}` : '';
      const resp = await fetch(`/api/list-links${qs}`);
      const data = await resp.json();
      setLinks(Array.isArray(data.links) ? data.links : []);
    } catch (e) {
      try { notify('Failed to load links', { duration: 3000 }); } catch (er) { dlgAlert('Failed to load links'); }
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

  const notify = useNotify();

  const doDelete = async (path) => {
    if (!(await confirm(`Delete ${path}? This cannot be undone.`))) return;
    let headers = { 'Content-Type': 'application/json' };
    if (passwordProtected) {
      // prefer server-side session; if not authenticated, prompt and use legacy header
      if (!sessionAuthenticated) {
        const pwd = await prompt('Enter admin password to delete:', '', 'Password', { inputType: 'password' });
        if (!pwd) return;
        headers['X-Link-Shortener-Password'] = pwd;
      }
    }
    const resp = await fetch('/api/links', { method: 'DELETE', headers, body: JSON.stringify({ path }) });
    if (resp.ok) {
      setLinks(links.filter(l => l.path !== path));
      try { notify('Deleted', { duration: 2500 }); } catch (e) {}
    } else {
      const js = await resp.json().catch(() => ({}));
      try { notify(js.error || 'Delete failed', { duration: 4000 }); } catch (er) { dlgAlert(js.error || 'Delete failed'); }
    }
  };

  const doEdit = (link) => {
    setEditing(link);
  };

  const saveEdit = async ({ path, newPath, domain, url }) => {
    setSavingEdit(true);
    let headers = { 'Content-Type': 'application/json' };
    if (passwordProtected) {
      if (!sessionAuthenticated) {
        const pwd = await prompt('Enter admin password to edit:', '', 'Password', { inputType: 'password' });
        if (!pwd) { setSavingEdit(false); return; }
        headers['X-Link-Shortener-Password'] = pwd;
      }
    }

    try {
      const resp = await fetch('/api/links', { method: 'PUT', headers, body: JSON.stringify({ path, newPath, url, domain }) });
      if (resp.ok) {
        try { notify('Updated', { duration: 2500 }); } catch (e) {}
        fetchLinks(filterDomain || null);
        setEditing(null);
      } else {
        const js = await resp.json().catch(() => ({}));
        try { notify(js.error || 'Update failed', { duration: 4000 }); } catch (er) { dlgAlert(js.error || 'Update failed'); }
      }
    } catch (e) {
      try { notify('Update failed', { duration: 3000 }); } catch (er) { dlgAlert('Update failed'); }
    } finally {
      setSavingEdit(false);
    }
  };


  const handleLogin = async (username, password, remember) => {
    setLoginLoading(true);
    try {
      const resp = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, remember }) });
      const js = await resp.json();
      if (resp.ok && js.verified) {
        // Server should have issued an HttpOnly cookie; confirm session
        try {
          const s = await fetch('/api/auth/session', { cache: 'no-store' });
          const sj = await s.json();
          if (sj && sj.authenticated) setSessionAuthenticated(true);
        } catch (e) {}
        // persist username when remember checked
        try {
          if (remember) {
            window.localStorage.setItem('rememberedUsername', username || '');
          } else {
            window.localStorage.removeItem('rememberedUsername');
          }
        } catch (e) {}
        try { notify('Logged in', { duration: 2000 }); } catch (e) {}
      } else {
        try { notify(js.error || 'Incorrect password', { duration: 3000 }); } catch (er) { dlgAlert(js.error || 'Incorrect password'); }
      }
  } catch (e) { try { notify('Login failed', { duration: 3000 }); } catch (er) { dlgAlert('Login failed'); } }
    finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    // Clear server-side cookie
    (async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {}
      setSessionAuthenticated(false);
      try { window.sessionStorage.removeItem('loggedInFromMain'); } catch (e) {}
      try { notify('Logged out', { duration: 1500 }); } catch (e) {}
      // redirect to main page after logout
      try { window.location.pathname = '/'; } catch (e) {}
    })();
  };

  return (
    <div className="container">
      <div className="header">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {passwordProtected && !sessionAuthenticated && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="text" placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} style={{ padding: '0.5rem' }} />
              <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ padding: '0.5rem' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input type="checkbox" checked={loginRemember} onChange={(e) => setLoginRemember(e.target.checked)} />
                <span style={{ fontSize: '0.85rem' }}>Remember</span>
              </label>
              <button className="primary" onClick={() => {
                handleLogin(loginUsername, loginPassword, loginRemember);
              }} disabled={loginLoading}>{loginLoading ? 'Logging in...' : 'Login'}</button>
            </div>
          )}
          {sessionAuthenticated && (
            <div style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="secondary" onClick={() => { try { window.location.pathname = '/'; } catch (e) {} }}>Create link</button>
              <button className="secondary" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>

  {/* Notifications are rendered by NotificationProvider */}

      <div className="card">
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)}>
            <option value="">All domains</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input placeholder="Search path or URL" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="primary" onClick={() => fetchLinks(filterDomain || null)} disabled={linksLoading}>{linksLoading ? 'Loading...' : 'Refresh'}</button>
        </div>
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
                    <button className="copy-btn" onClick={async () => { try { await navigator.clipboard.writeText(l.shortUrl); try { notify('Copied', { duration: 1500 }); } catch (er) { dlgAlert('Copied'); } } catch { try { notify('Copy failed', { duration: 3000 }); } catch (er) { dlgAlert('Copy failed'); } } }}>Copy</button>
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
      {editing && (
        <EditModal
          open={!!editing}
          initial={{ path: editing.path, domain: editing.domain, url: editing.originalUrl || editing.originalUrl }}
          saving={savingEdit}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}
