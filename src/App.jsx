import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // App State
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'required', 'not_required'
  const [password, setPassword] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');

  // Form State
  const [url, setUrl] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [isPathValid, setIsPathValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableEmbeds, setEnableEmbeds] = useState(true);
  const [enableMetadata, setEnableMetadata] = useState(false);
  const [metadataTitle, setMetadataTitle] = useState('');
  const [metadataDescription, setMetadataDescription] = useState('');
  const [metadataImage, setMetadataImage] = useState('');
  const [enableCloaking, setEnableCloaking] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status', { cache: 'no-store' });
        const data = await response.json();
        if (data.passwordProtected) {
          setAuthStatus('required');
        } else {
          setAuthStatus('not_required');
        }
      } catch (err) {
        setError('Could not connect to the server.');
        setAuthStatus('not_required'); // Fail open
      }
    };
    checkAuthStatus();
  }, []);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.verified) {
        throw new Error(data.error || 'Incorrect password.');
      }

      setSessionPassword(password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      if (authStatus === 'required') {
        headers['X-Link-Shortener-Password'] = sessionPassword;
      }

      const response = await fetch('/api/links', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          url,
          customPath,
          embeds: enableEmbeds,
          metadata,
          cloaking: enableCloaking,
        }),
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
    setIsPathValid(true);
    setError(null);
    setResult(null);
    setEnableMetadata(false);
    setMetadataTitle('');
    setMetadataDescription('');
    setMetadataImage('');
    setEnableCloaking(false);
  };

  if (authStatus === 'loading') {
    return <div className="container"><p>Loading...</p></div>;
  }

  if (authStatus === 'required' && !sessionPassword) {
    return (
      <div className="container">
        <div className="login-card">
          <h1>Password Required</h1>
          <p>Please enter the password to use this service.</p>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Continue'}
            </button>
            {error && <p className="error" style={{ marginTop: '1rem' }}>{error}</p>}
          </form>
        </div>
      </div>
    );
  }

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
                onChange={(e) => {
                  const newPath = e.target.value;
                  if (!/^[a-zA-Z0-9/-]*$/.test(newPath)) {
                    setIsPathValid(false);
                  } else {
                    setIsPathValid(true);
                  }
                  setCustomPath(newPath.replace(/[^a-zA-Z0-9/-]/g, ''));
                }}
                placeholder="my-custom-link"
                disabled={loading}
              />
            </div>
            {!isPathValid && (
              <p className="validation-error">
                Only letters, numbers, slashes, and dashes are allowed.
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header collapsible" onClick={() => setShowAdvanced(!showAdvanced)}>
            <h2>Advanced settings</h2>
            <svg className={`chevron ${showAdvanced ? 'expanded' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          {showAdvanced && (
            <>
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
              <div className="setting-item">
                <label htmlFor="metadata-toggle">Enable custom metadata</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="metadata-toggle"
                    checked={enableMetadata}
                    onChange={() => setEnableMetadata(!enableMetadata)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              {enableMetadata && (
                <>
                  <div className="form-group">
                    <label htmlFor="metadataTitle">Title</label>
                    <input
                      type="text"
                      id="metadataTitle"
                      value={metadataTitle}
                      onChange={(e) => setMetadataTitle(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="metadataDescription">Description</label>
                    <input
                      type="text"
                      id="metadataDescription"
                      value={metadataDescription}
                      onChange={(e) => setMetadataDescription(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="metadataImage">Favicon/Image URL</label>
                    <input
                      type="url"
                      id="metadataImage"
                      value={metadataImage}
                      onChange={(e) => setMetadataImage(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="setting-item">
                    <div className="setting-label-group">
                      <label htmlFor="cloaking-toggle">Enable link cloaking</label>
                      <p className="cloaking-note">
                        Note: Link cloaking may not work for websites that have strict security policies (like Google or Facebook).
                      </p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        id="cloaking-toggle"
                        checked={enableCloaking}
                        onChange={() => setEnableCloaking(!enableCloaking)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </>
              )}
            </>
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
