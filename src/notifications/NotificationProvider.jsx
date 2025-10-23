import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import Snackbar from '../components/Snackbar';
import { setGlobalNotify } from './notify';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  // stacking support: maintain an array of active notifications
  const [stack, setStack] = useState([]);

  const notify = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const item = { id, message, duration: options.duration || 3000, actionLabel: options.actionLabel || null, onAction: options.onAction || null };
    setStack((s) => [...s, item]);
    return id;
  }, []);

  const remove = useCallback((id) => setStack((s) => s.filter(x => x.id !== id)), []);

  // register a global notify function for non-React modules
  useEffect(() => {
    setGlobalNotify(notify);
    return () => setGlobalNotify(null);
  }, [notify]);

  const handleAction = (item) => {
    if (item && item.onAction) {
      try { item.onAction(); } catch (e) { /* ignore */ }
    }
    remove(item.id);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="snackbar-container">
        {stack.map((item) => (
          <Snackbar
            key={item.id}
            open={true}
            message={item.message}
            duration={item.duration}
            actionLabel={item.actionLabel}
            onAction={() => handleAction(item)}
            onClose={() => remove(item.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx.notify;
}
