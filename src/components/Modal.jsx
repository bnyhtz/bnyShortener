import React from 'react';

export default function Modal({ open, title, children, actions = [], onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        {title && <div className="modal-header"><h3>{title}</h3></div>}
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          {actions.map((a, i) => (
            <button key={i} className={a.className || 'primary'} onClick={() => a.onClick && a.onClick()}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
