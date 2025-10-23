import { useEffect } from 'react';

export default function Snackbar({ open, message, duration = 3000, actionLabel, onAction, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div role="status" aria-live="polite" className="snackbar">
      <div className="snackbar-message">{message}</div>
      {actionLabel && onAction && (
        <button className="snackbar-action" onClick={onAction}>{actionLabel}</button>
      )}
      <button className="snackbar-close" onClick={() => onClose && onClose()} aria-label="Close">✕</button>
    </div>
  );
}
