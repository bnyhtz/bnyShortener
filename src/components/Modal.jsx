import React, { useEffect, useRef } from 'react';

export default function Modal({ open, title, children, actions = [], onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const el = modalRef.current;
    if (!el) return;
    // focus the first focusable element
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable && focusable.length) focusable[0].focus();

    // key handlers: Esc to close, Enter to trigger primary action
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
      }
      if (e.key === 'Enter') {
        // find primary action button
        const primary = el.querySelector('button.primary');
        if (primary) {
          e.preventDefault();
          primary.click();
        }
      }
      // basic focus trap
      if (e.key === 'Tab') {
        const nodes = Array.from(focusable);
        if (nodes.length === 0) return;
        const idx = nodes.indexOf(document.activeElement);
        if (e.shiftKey) {
          if (idx === 0) {
            nodes[nodes.length - 1].focus();
            e.preventDefault();
          }
        } else {
          if (idx === nodes.length - 1) {
            nodes[0].focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" ref={modalRef} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
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
