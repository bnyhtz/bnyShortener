import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableEmbeds, setEnableEmbeds] = useState(true);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, customPath, embeds: enableEmbeds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUrl('');
    setCustomPath('');
    setError(null);
    setResult(null);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Create a new link</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <h2>Link details</h2>
          </div>
          <div className="form-group">
            <label htmlFor="url">Destination URL</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/my-long-url"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Short link</label>
            <div className="short-link-group">
              <div className="domain-select">{window.location.host}</div>
              <span>/</span>
              <input
                type="text"
                id="customPath"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="my-custom-link"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header collapsible" onClick={() => setShowAdvanced(!showAdvanced)}>
            <h2>Advanced settings</h2>
            <svg className={`chevron ${showAdvanced ? 'expanded' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          {showAdvanced && (
            <div className="setting-item">
              <label htmlFor="embed-toggle">Enable link previews (embeds)</label>
              <label className="switch">
                <input
                  type="checkbox"
                  id="embed-toggle"
                  checked={enableEmbeds}
                  onChange={() => setEnableEmbeds(!enableEmbeds)}
                />
                <span className="slider"></span>
              </label>
            </div>
          )}
        </div>

        <div className="footer">
          <button type="button" onClick={handleCancel} className="secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create your link'}
          </button>
        </div>
      </form>

      {error && <p className="error">Error: {error}</p>}

      {result && !error && (
        <div className="result">
          <p>Your shortened link is ready!</p>
          <a href={result.shortUrl} target="_blank" rel="noopener noreferrer">
            {result.shortUrl}
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
