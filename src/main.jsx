import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import NotFound from './NotFound.jsx';
import { NotificationProvider } from './notifications/NotificationProvider';
import { DialogProvider } from './dialogs/DialogProvider';

const path = window.location.pathname;
import Manage from './Manage.jsx';
import Login from './Login.jsx';

// Simple pre-render routing and session checks:
(async () => {
  // handle logout route: call server and redirect to login
  if (path === '/logout') {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    window.location.pathname = '/login';
    return;
  }

  // If we're on the login page, just render login (no session check)
  if (path === '/login') {
    createRoot(document.getElementById('root')).render(
      <NotificationProvider>
        <DialogProvider>
          <StrictMode>
            <Login />
          </StrictMode>
        </DialogProvider>
      </NotificationProvider>,
    );
    return;
  }

  // For all other pages, require an authenticated session. If not authenticated, redirect to /login.
  try {
    const resp = await fetch('/api/auth/session', { cache: 'no-store' });
    const js = await resp.json();
    if (!js || !js.authenticated) {
      window.location.pathname = '/login';
      return;
    }
  } catch (e) {
    window.location.pathname = '/login';
    return;
  }

  // At this point we are authenticated — render the app. Default route will be /dash.
  createRoot(document.getElementById('root')).render(
    <NotificationProvider>
      <DialogProvider>
        <StrictMode>
          {path === '/dash' ? <Manage /> : <Manage />}
        </StrictMode>
      </DialogProvider>
    </NotificationProvider>,
  );
})();
