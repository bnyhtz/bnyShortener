import { useState, useEffect } from 'react';
import './Admin.css';
import EditLinkModal from './EditLinkModal';

function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [links, setLinks] = useState([]);
  const [editingLink, setEditingLink] = useState(null); // This will now hold the link object
  const [isPasswordSet, setIsPasswordSet] = useState(null); // null = loading
  const [domains, setDomains] = useState([]);
  const [domainFilter, setDomainFilter] = useState(''); // '' for All Domains

  const handleLogin = (e) => {
    e.preventDefault();
    // For simplicity, we'll verify the password on the first API call.
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        setIsPasswordSet(data.isPasswordSet);
      } catch (err) {
        setError('Could not connect to the server to check password status.');
        setIsPasswordSet(false); // Fallback to show an error
      }
    };

    const fetchDomains = async () => {
      try {
        const response = await fetch('/api/domains');
        const data = await response.json();
        const apiDomains = data.domains || [];
        const currentHost = window.location.host;

        // Ensure the current host is always in the list, and the list is unique.
        const allDomains = [...new Set([currentHost, ...apiDomains])];
        setDomains(allDomains);
      } catch (err) {
        console.error('Failed to fetch domains:', err);
        // Fallback to just using the current host if the API fails.
        setDomains([window.location.host]);
      }
    };

    checkPasswordStatus();
    fetchDomains();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLinks();
    }
  }, [isAuthenticated, domainFilter]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/admin/links', window.location.origin);
      if (domainFilter) {
        url.searchParams.append('domain', domainFilter);
      }
      const response = await fetch(url.toString(), {
        headers: { 'X-Admin-Password': password },
      });
      if (!response.ok) {
        let errorText;
        try {
          const data = await response.json();
          errorText = data.error;
        } catch (e) {
          errorText = await response.text();
        }
        throw new Error(errorText || 'Failed to fetch links.');
      }
      const data = await response.json();
      setLinks(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false); // De-auth on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key) => {
    if (window.XPModal) {
      const ok = await window.XPModal.confirm({
        title: 'Delete link',
        message: `Delete the link "${key}"?`,
        icon: 'warning',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });
      if (!ok) return;
    } else if (!window.confirm(`Are you sure you want to delete the link "${key}"?`)) {
      return;
    }
    try {
      const response = await fetch('/api/admin/links', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password,
        },
        body: JSON.stringify({ key }),
      });
      if (!response.ok) throw new Error('Failed to delete link.');
      setLinks(links.filter((link) => link.key !== key));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (link, updatedProperties) => {
    try {
      const response = await fetch('/api/admin/links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password,
        },
        body: JSON.stringify({ key: link.key, ...updatedProperties }),
      });
      if (!response.ok) throw new Error('Failed to update link.');
      setEditingLink(null);
      fetchLinks(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  if (isPasswordSet === null) {
    return (
      <div className="admin-container">
        <div className="login-card">
          <h1>Admin Access</h1>
          <p>Checking configuration...</p>
        </div>
      </div>
    );
  }

  if (!isPasswordSet) {
    return (
      <div className="admin-container">
        <div className="login-card">
          <h1>Admin Access</h1>
          <p className="error" style={{ marginTop: '1rem' }}>
            A password is not set yet. Please set it in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="login-card">
          <h1>Admin Access</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                type="password"
                id="admin-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="primary">Login</button>
            {error && <p className="error" style={{ marginTop: '1rem' }}>{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>
      <div className="filters">
        <div className="form-group">
          <label htmlFor="domain-filter">Filter by domain</label>
          <div className="select-wrapper">
            <select
              id="domain-filter"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              <option value="">All Domains</option>
              {domains.map(domain => (
                <option key={domain} value={domain}>
                  {domain === '*' ? 'All Domains (Wildcard)' : domain}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {loading && <p>Loading links...</p>}
      {error && <p className="error">{error}</p>}
      <div className="table-responsive">
        <table className="links-table">
          <thead>
            <tr>
              <th>Short Path</th>
              <th>Domain</th>
              <th>Destination URL</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.key}>
                <td data-label="Short Path">{link.path}</td>
                <td data-label="Domain">{link.domain}</td>
                <td data-label="Destination URL">
                  <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                </td>
                <td data-label="Created">
                  {link.createdAt ? new Date(link.createdAt).toLocaleString() : 'N/A'}
                </td>
                <td data-label="Actions">
                  <div className="action-buttons">
                    <button onClick={() => setEditingLink(link)} className="secondary">Edit</button>
                    <button onClick={() => handleDelete(link.key)} className="danger">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onSave={handleUpdate}
          onCancel={() => setEditingLink(null)}
          domains={domains}
        />
      )}
    </div>
  );
}

export default Admin;
