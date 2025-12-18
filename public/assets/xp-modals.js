(function () {
  const modalHost = document.createElement('div');
  modalHost.id = 'xp-modal-host';
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(modalHost);
  });

  function buildModal({ title, message, icon, confirmText = 'OK', cancelText = 'Cancel', cancellable = true }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'xp-modal-backdrop';
    wrapper.innerHTML = `
      <div class="xp-modal" role="dialog" aria-modal="true" aria-label="${title || 'Dialog'}">
        <div class="xp-modal-titlebar">
          <div class="xp-modal-title">
            ${icon ? `<img src="/assets/icons/${icon}.svg" alt="" />` : ''}
            <span>${title || ''}</span>
          </div>
          ${cancellable ? '<button class="xp-modal-close" aria-label="Close">X</button>' : ''}
        </div>
        <div class="xp-modal-body">
          <p>${message || ''}</p>
        </div>
        <div class="xp-modal-actions">
          <button class="btn primary xp-modal-confirm">${confirmText}</button>
          ${cancellable ? `<button class="btn xp-modal-cancel">${cancelText}</button>` : ''}
        </div>
      </div>
    `;
    return wrapper;
  }

  function trapFocus(modal) {
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    let first = focusable[0];
    let last = focusable[focusable.length - 1];
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      if (e.key === 'Escape') {
        const cancel = modal.querySelector('.xp-modal-cancel');
        cancel?.click();
      }
    });
    setTimeout(() => first.focus(), 0);
  }

  function showModal(opts) {
    return new Promise((resolve) => {
      const node = buildModal(opts);
      modalHost.appendChild(node);
      const modal = node.querySelector('.xp-modal');
      trapFocus(modal);
      const cleanup = (val) => {
        modalHost.removeChild(node);
        resolve(val);
      };
      modal.querySelector('.xp-modal-confirm').addEventListener('click', () => cleanup(true));
      const cancelBtn = modal.querySelector('.xp-modal-cancel');
      if (cancelBtn) cancelBtn.addEventListener('click', () => cleanup(false));
      const closeBtn = modal.querySelector('.xp-modal-close');
      if (closeBtn) closeBtn.addEventListener('click', () => cleanup(false));
    });
  }

  window.XPModal = {
    confirm: ({ title, message, icon = 'question', confirmText = 'OK', cancelText = 'Cancel' }) =>
      showModal({ title, message, icon, confirmText, cancelText, cancellable: true }),
    alert: ({ title, message, icon = 'info', confirmText = 'OK' }) =>
      showModal({ title, message, icon, confirmText, cancellable: false }),
  };
})();
