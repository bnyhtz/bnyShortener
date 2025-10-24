import React, { useState, useEffect } from 'react';

export default function CreateEmbedded({ onCreated }) {
  const [url, setUrl] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(window.location.host);
  const [isPathValid, setIsPathValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [enableEmbeds, setEnableEmbeds] = useState(true);
  const [enableMetadata, setEnableMetadata] = useState(false);
  const [metadataTitle, setMetadataTitle] = useState('');
  const [metadataDescription, setMetadataDescription] = useState('');
  const [metadataImage, setMetadataImage] = useState('');
  const [enableCloaking, setEnableCloaking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/domains', { cache: 'no-store' });
        const js = await resp.json();
        if (js && Array.isArray(js.domains) && js.domains.length) {
          setDomains(js.domains);
          const host = window.location.host;
          const saved = window.localStorage.getItem('lastSelectedDomain');
          const pick = saved && js.domains.includes(saved) ? saved : (js.domains.includes(host) ? host : js.domains[0]);
          setSelectedDomain(pick);
        }
      } catch (e) {}
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (customPath && !/^[a-zA-Z0-9/-]*$/.test(customPath)) {
      setIsPathValid(false);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const metadata = enableMetadata ? {
      title: metadataTitle,
      description: metadataDescription,
      image: metadataImage,
    } : null;

    try {
      const headers = { 'Content-Type': 'application/json' };
      const response = await fetch('/api/links', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, customPath, embeds: enableEmbeds, metadata, cloaking: enableCloaking, domain: selectedDomain })
      });
      const js = await response.json();
      if (!response.ok) throw new Error(js.error || 'Create failed');
      setResult(js);
      onCreated && onCreated(js);
      setUrl(''); setCustomPath('');
    } catch (err) {
      setError(err.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setUrl(''); setCustomPath(''); setIsPathValid(true);
  };

  return (
    <div className="card create-panel">
      <div className="card-header"><h2>Create a new link</h2></div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">Destination URL</label>
          <input type="url" id="url" value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://example.com/long" required disabled={loading} />
        </div>
        <div className="form-group">
          <label>Short link</label>
          <div className="short-link-group">
            <div className="domain-select">
              {domains.length > 0 ? (
                <select value={selectedDomain} onChange={(e)=>setSelectedDomain(e.target.value)}>
                  {domains.map(d=> <option key={d} value={d}>{d}</option>)}
                </select>
              ) : window.location.host}
            </div>
            <span>/</span>
            <input type="text" id="customPath" value={customPath} onChange={(e)=>{ const newPath = e.target.value; if(!/^[a-zA-Z0-9/-]*$/.test(newPath)){ setIsPathValid(false); } else setIsPathValid(true); setCustomPath(newPath.replace(/[^a-zA-Z0-9/-]/g,'')); }} placeholder="my-custom-link" disabled={loading} />
          </div>
          {!isPathValid && <p className="validation-error">Only letters, numbers, slashes, and dashes are allowed.</p>}
        </div>

        <div className="card-controls" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          {error && <button type="button" className="primary" onClick={handleCancel}>Cancel</button>}
          <button type="submit" className="primary" disabled={loading}>{loading ? 'Creating...' : 'Create your link'}</button>
        </div>
        {error && <p className="error">{error}</p>}
        {result && (
          <div className="result">
            <p>Your shortened link is ready!</p>
            <a href={result.shortUrl} target="_blank" rel="noreferrer">{result.shortUrl}</a>
          </div>
        )}
      </form>
    </div>
  );
}
