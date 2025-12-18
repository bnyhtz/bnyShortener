(function () {
  const windows = {};
  const taskbar = document.getElementById('xp-taskbar-items');
  const startButton = document.getElementById('xp-start');
  const desktop = document.getElementById('xp-desktop');
  const windowArea = document.getElementById('xp-window-area');
  const icons = document.querySelectorAll('.xp-icon');
  const isMobile = matchMedia('(max-width: 768px)').matches || matchMedia('(pointer: coarse)').matches;

  function initClock() {
    const clock = document.getElementById('xp-clock');
    const update = () => {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    update();
    setInterval(update, 30 * 1000);
  }

  function ensureTaskButton(id, title, icon) {
    let btn = taskbar.querySelector(`[data-task="${id}"]`);
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'xp-task-btn';
      btn.dataset.task = id;
      btn.type = 'button';
      btn.innerHTML = `${icon ? `<img src="${icon}" alt="" />` : ''}<span>${title || 'Window'}</span>`;
      btn.addEventListener('click', () => openWindow(id, true));
      taskbar.appendChild(btn);
    }
    return btn;
  }

  function openWindow(id, fromTaskbar) {
    const ref = windows[id];
    if (!ref) return;
    ref.classList.remove('is-hidden');
    ref.classList.remove('is-minimized');
    if (isMobile) {
      ref.classList.add('is-mobile');
    }
    const taskBtn = taskbar.querySelector(`[data-task="${id}"]`);
    if (taskBtn) {
      taskBtn.classList.add('is-active');
    }
    if (!isMobile) {
      focusWindow(ref);
    }
    if (!fromTaskbar) {
      taskbar.querySelectorAll('.xp-task-btn').forEach(btn => {
        if (btn.dataset.task !== id) btn.classList.remove('is-active');
      });
    }
  }

  function minimizeWindow(id) {
    const ref = windows[id];
    if (!ref) return;
    ref.classList.add('is-hidden');
    const taskBtn = ensureTaskButton(id, ref.dataset.windowTitle || 'Link Shortener');
    taskBtn.classList.remove('is-active');
  }

  function maximizeWindow(id) {
    const ref = windows[id];
    if (!ref) return;
    if (isMobile) {
      ref.classList.add('is-mobile');
      return;
    }
    ref.classList.toggle('is-maximized');
  }

  function closeWindow(id) {
    const ref = windows[id];
    if (!ref) return;
    ref.classList.add('is-hidden');
    const taskBtn = taskbar.querySelector(`[data-task="${id}"]`);
    if (taskBtn) taskBtn.classList.remove('is-active');
  }

  function focusWindow(win) {
    let maxZ = 10;
    document.querySelectorAll('.xp-window').forEach(w => {
      const z = parseInt(w.style.zIndex || '10', 10);
      if (z > maxZ) maxZ = z;
      w.classList.remove('xp-active');
    });
    win.style.zIndex = maxZ + 1;
    win.classList.add('xp-active');
  }

  function setupWindow(win) {
    const id = win.dataset.window;
    if (!id) return;
    windows[id] = win;
    const title = win.querySelector('.xp-title');
    if (title) {
      win.dataset.windowTitle = title.textContent.trim();
    }
    const iconNode = win.querySelector('.xp-title img');
    if (iconNode) {
      win.dataset.windowIcon = iconNode.getAttribute('src');
    }
    win.querySelectorAll('.xp-winbtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        if (action === 'minimize') minimizeWindow(id);
        if (action === 'maximize') maximizeWindow(id);
        if (action === 'close') closeWindow(id);
        e.stopPropagation();
      });
    });
    win.addEventListener('mousedown', () => focusWindow(win));

    const handle = win.querySelector('[data-drag-handle]');
    if (handle && !isMobile) {
      let dragging = false;
      let offsetX = 0;
      let offsetY = 0;
      const boundsTarget = windowArea || document.body;

      const onMove = (e) => {
        if (!dragging) return;
        const bounds = boundsTarget.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - offsetX, bounds.left), bounds.right - win.offsetWidth);
        const y = Math.min(Math.max(e.clientY - offsetY, bounds.top), bounds.bottom - win.offsetHeight);
        win.style.left = `${x - bounds.left}px`;
        win.style.top = `${y - bounds.top}px`;
      };

      const onUp = () => {
        dragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      handle.addEventListener('mousedown', (e) => {
        if (win.classList.contains('is-maximized')) return;
        dragging = true;
        const rect = win.getBoundingClientRect();
        const parentRect = boundsTarget.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        win.style.position = 'absolute';
        win.style.left = `${rect.left - parentRect.left}px`;
        win.style.top = `${rect.top - parentRect.top}px`;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
  }

  function initStartMenu() {
    if (!startButton || !desktop) return;
    const menu = document.createElement('div');
    menu.className = 'xp-start-menu';
    const list = document.createElement('ul');
    const header = document.createElement('div');
    header.className = 'xp-startmenu-header';
    const avatar = document.createElement('img');
    avatar.className = 'xp-startmenu-avatar';
    avatar.src = '/assets/bnyhtz.png';
    avatar.alt = 'bnyhtz profile picture';
    const brand = document.createElement('a');
    brand.className = 'xp-startmenu-brand';
    brand.href = 'https://akari.gg/';
    brand.target = '_blank';
    brand.rel = 'noopener noreferrer';
    brand.textContent = 'bnyhtz';
    header.appendChild(avatar);
    header.appendChild(brand);
    menu.appendChild(header);

    const item = document.createElement('li');
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.textContent = 'Open Link Shortener';
    openBtn.addEventListener('click', () => {
      openWindow('mainWindow');
      menu.classList.remove('is-open');
      startButton.setAttribute('aria-expanded', 'false');
    });
    item.appendChild(openBtn);
    list.appendChild(item);

    const explorerItem = document.createElement('li');
    const explorerBtn = document.createElement('button');
    explorerBtn.type = 'button';
    explorerBtn.textContent = 'Link Explorer';
    explorerBtn.addEventListener('click', () => {
      openWindow('explorerWindow');
      menu.classList.remove('is-open');
      startButton.setAttribute('aria-expanded', 'false');
    });
    explorerItem.appendChild(explorerBtn);
    list.appendChild(explorerItem);

    menu.appendChild(list);
    desktop.appendChild(menu);

    startButton.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      startButton.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== startButton) {
        menu.classList.remove('is-open');
        startButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initDesktopIcons() {
    icons.forEach(icon => {
      icon.addEventListener('click', () => {
        const target = icon.dataset.open;
        if (target) openWindow(target);
      });
    });
  }

  function applyMobileLayout() {
    if (!isMobile) return;
    desktop.classList.add('xp-mobile');
    Object.values(windows).forEach(win => {
      win.classList.add('is-mobile');
      win.classList.remove('is-maximized');
    });
  }

  function runDevGuard() {
    if (!window.__UI_DEV__) return;
    const checks = [
      { label: 'User password field', selector: '#password' },
      { label: 'Destination URL input', selector: '#url' },
      { label: 'Custom path input', selector: '#customPath' },
      { label: 'Embed toggle', selector: '#embed-toggle' },
      { label: 'Metadata toggle', selector: '#metadata-toggle' },
      { label: 'Metadata title', selector: '#metadataTitle' },
      { label: 'Metadata description', selector: '#metadataDescription' },
      { label: 'Metadata image', selector: '#metadataImage' },
      { label: 'Cloaking toggle', selector: '#cloaking-toggle' },
      { label: 'Admin password', selector: '#admin-password' },
      { label: 'Admin domain filter', selector: '#domain-filter' },
      { label: 'Links table', selector: 'table.links-table' },
    ];
    checks.forEach(({ label, selector }) => {
      if (!document.querySelector(selector)) {
        console.warn(`[XP DEV] Missing critical element: ${label} (${selector})`);
      }
    });
  }

  /* Explorer admin integration */
  function enhanceExplorerAdmin() {
    const explorerMount = document.getElementById('explorer-admin-mount');
    const filterSlot = document.getElementById('explorer-filter-slot');
    const statusEl = document.getElementById('explorer-status-count');
    if (!explorerMount) return;

    const tryMoveFilter = () => {
      const filterEl = explorerMount.querySelector('.filters');
      if (filterEl && filterSlot && !filterSlot.contains(filterEl)) {
        filterSlot.innerHTML = '<label aria-hidden="true">Filter:</label>';
        filterSlot.appendChild(filterEl);
      }
    };

    const updateStatus = () => {
      if (!statusEl) return;
      const rows = explorerMount.querySelectorAll('table.links-table tbody tr');
      statusEl.textContent = `${rows.length} object(s)`;
    };

    const observer = new MutationObserver(() => {
      tryMoveFilter();
      updateStatus();
    });
    observer.observe(explorerMount, { childList: true, subtree: true });

    tryMoveFilter();
    updateStatus();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.xp-window').forEach(setupWindow);
    initClock();
    initDesktopIcons();

    if (isMobile) {
      desktop.classList.add('xp-mobile');
      Object.values(windows).forEach(win => {
        win.classList.add('is-mobile');
        win.classList.remove('is-maximized');
      });
      openWindow('mainWindow');
      runDevGuard();
      enhanceExplorerAdmin();
      window.XPShell = {
        open: openWindow,
        close: closeWindow,
        minimize: minimizeWindow,
        toggleMaximize: maximizeWindow,
      };
      return;
    }

    ensureTaskButton('mainWindow', 'Link Shortener', windows.mainWindow?.dataset.windowIcon).classList.add('is-active');
    ensureTaskButton('explorerWindow', 'Link Explorer', windows.explorerWindow?.dataset.windowIcon);
    initStartMenu();
    openWindow('mainWindow');
    runDevGuard();
    enhanceExplorerAdmin();
    window.XPShell = {
      open: openWindow,
      close: closeWindow,
      minimize: minimizeWindow,
      toggleMaximize: maximizeWindow,
    };
  });
})();
