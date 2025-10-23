import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [enableEmbeds, setEnableEmbeds] = useState(true);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setIsEditing(false);

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

  return (
    <div className="container">
      <div className="header">
        <h1>Link Shortener</h1>
        <button className="settings-button" onClick={() => setShowSettings(!showSettings)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {showSettings && (
        <SettingsPanel
          enableEmbeds={enableEmbeds}
          setEnableEmbeds={setEnableEmbeds}
          onClose={() => setShowSettings(false)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">Original URL</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="customPath">Custom Path (Optional)</label>
          <input
            type="text"
            id="customPath"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="my-custom-link"
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Shortening...' : 'Shorten Link'}
        </button>
      </form>

      {error && <p className="error">Error: {error}</p>}

      {result && !error && (
        <div className="result">
          <p>Your shortened link is ready!</p>
          <a href={result.shortUrl} target="_blank" rel="noopener noreferrer">
            {result.shortUrl}
          </a>

          {result.editable && !isEditing && (
            <div className="edit-prompt">
              <button onClick={() => setIsEditing(true)} className="edit-button">
                Made a mistake? Edit
              </button>
            </div>
          )}

          {isEditing && (
            <InlineEditForm
              result={result}
              onUpdateSuccess={(newUrl) => {
                setResult({ ...result, originalUrl: newUrl, editable: false });
                setIsEditing(false);
              }}
              setError={setError}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SettingsPanel({ enableEmbeds, setEnableEmbeds, onClose }) {
  return (
    <div className="settings-panel">
      <h2>Settings</h2>
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
      <button onClick={onClose} className="secondary">Close</button>
    </div>
  );
}

function InlineEditForm({ result, onUpdateSuccess, setError, onCancel }) {
  const [newUrl, setNewUrl] = useState(result.originalUrl);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: result.path, url: newUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update the link.');
      }
      onUpdateSuccess(newUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="inline-edit-form">
      <div className="form-group">
        <label htmlFor="newUrl">Edit Original URL</label>
        <input
          type="url"
          id="newUrl"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className="secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default App;
