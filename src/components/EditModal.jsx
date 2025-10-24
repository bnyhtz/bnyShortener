import React, { useState, useEffect } from 'react';
import Modal from './Modal';

export default function EditModal({ open, onClose, initial = {}, onSave, saving, domains = [] }) {
  const [path, setPath] = useState(initial.path || '');
  const [domain, setDomain] = useState(initial.domain || '');
  const [url, setUrl] = useState(initial.url || '');
  const [error, setError] = useState(null);

  useEffect(() => {
    setPath(initial.path || '');
    setDomain(initial.domain || '');
    setUrl(initial.url || '');
    setError(null);
  }, [initial, open]);

  const handleSave = () => {
    setError(null);
    if (!path) return setError('Path is required');
    if (!url) return setError('Destination URL is required');
    let finalUrl = url;
    if (!/^https?:\/\//.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
      setUrl(finalUrl);
    }
    onSave({ path: initial.path, newPath: path, domain: domain || null, url: finalUrl });
  };

  return (
    <Modal open={!!open} title={`Edit ${initial.path || ''}`} onClose={onClose} actions={[
      { label: 'Cancel', onClick: onClose, className: 'secondary' },
      { label: saving ? 'Saving...' : 'Save', onClick: handleSave, className: 'primary' }
    ]}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label style={{ fontWeight: 700 }}>Path</label>
        <input value={path} onChange={(e) => setPath(e.target.value)} />
        <label style={{ fontWeight: 700 }}>Domain (optional)</label>
        <div className="domain-select">
          <select value={domain || ''} onChange={(e) => setDomain(e.target.value)}>
            <option value="">(default)</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <label style={{ fontWeight: 700 }}>Destination URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} />
        {error && <div className="error">{error}</div>}
      </div>
    </Modal>
  );
}
