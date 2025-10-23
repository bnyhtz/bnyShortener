import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import NotFound from './NotFound.jsx';

const path = window.location.pathname;

import Manage from './Manage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {path === '/' ? <App /> : (path === '/dash' ? <Manage /> : <NotFound />)}
  </StrictMode>,
);
