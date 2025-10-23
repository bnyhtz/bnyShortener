import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import NotFound from './NotFound.jsx';
import { NotificationProvider } from './notifications/NotificationProvider';
import { DialogProvider } from './dialogs/DialogProvider';

const path = window.location.pathname;

import Manage from './Manage.jsx';

// Before rendering, if we're trying to open the dashboard, ask the server if the
// client has a valid session cookie. If not, redirect to home.
(async () => {
  if (path === '/dash') {
    try {
      const resp = await fetch('/api/auth/session', { cache: 'no-store' });
      const js = await resp.json();
      const fromMain = (() => { try { return !!window.sessionStorage.getItem('loggedInFromMain'); } catch (e) { return false; } })();
      if (!js || !js.authenticated || !fromMain) {
        window.location.pathname = '/';
        return;
      }
    } catch (e) {
      // if session check fails, redirect to home
      window.location.pathname = '/';
      return;
    }
  }

  createRoot(document.getElementById('root')).render(
    <NotificationProvider>
      <DialogProvider>
        <StrictMode>
          {path === '/' ? <App /> : (path === '/dash' ? <Manage /> : <NotFound />)}
        </StrictMode>
      </DialogProvider>
    </NotificationProvider>,
  );
})();
