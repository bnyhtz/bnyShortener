import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, customPath }),
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
      <h1>Link Shortener</h1>
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
          {result.editable ? (
            <EditForm result={result} setResult={setResult} setError={setError} />
          ) : (
            <div>
              <p>Your shortened link is ready!</p>
              <a href={result.shortUrl} target="_blank" rel="noopener noreferrer">
                {result.shortUrl}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditForm({ result, setResult, setError }) {
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

      setResult({ ...result, originalUrl: newUrl, editable: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Make the link permanent without changes
    setResult({ ...result, editable: false });
  };

  return (
    <div>
      <p>One last chance to edit your link before it becomes permanent.</p>
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label htmlFor="newUrl">Original URL</label>
          <input
            type="url"
            id="newUrl"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save and Make Permanent'}
        </button>
        <button type="button" onClick={handleCancel} disabled={loading} className="secondary">
          Looks Good, Keep It
        </button>
      </form>
    </div>
  );
}

export default App;
