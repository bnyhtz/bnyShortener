import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Admin from './Admin.jsx';
import NotFound from './NotFound.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);

const explorerAdmin = document.getElementById('explorer-admin-mount');
if (explorerAdmin && window.location.pathname !== '/admin') {
  createRoot(explorerAdmin).render(
    <StrictMode>
      <Admin />
    </StrictMode>,
  );
}
