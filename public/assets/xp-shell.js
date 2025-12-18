(function () {
  const windows = {};
  const taskbar = document.getElementById('xp-taskbar-items');
  const startButton = document.getElementById('xp-start');
  const desktop = document.getElementById('xp-desktop');
  const windowArea = document.getElementById('xp-window-area');
  const icons = document.querySelectorAll('.xp-icon');
  const isMobile = matchMedia('(max-width: 768px)').matches || matchMedia('(pointer: coarse)').matches;
  const EDGE_PADDING = 12;

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
    clampWindow(ref);
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
    const isMax = ref.classList.toggle('is-maximized');
    if (isMax) {
      const area = workArea();
      ref.style.left = `${EDGE_PADDING}px`;
      ref.style.top = `${EDGE_PADDING}px`;
      ref.style.width = `${area.width - EDGE_PADDING * 2}px`;
      ref.style.height = `${area.height - EDGE_PADDING * 2}px`;
    } else {
      clampWindow(ref);
    }
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

  function workArea() {
    const taskbarEl = document.getElementById('xp-taskbar');
    const taskbarHeight = taskbarEl ? taskbarEl.offsetHeight : 48;
    return {
      width: window.innerWidth,
      height: window.innerHeight - taskbarHeight,
    };
  }

  function clampWindow(win) {
    if (!win || win.classList.contains('is-maximized')) return;
    const area = workArea();
    const rect = win.getBoundingClientRect();
    const maxLeft = Math.max(EDGE_PADDING, area.width - rect.width - EDGE_PADDING);
    const maxTop = Math.max(EDGE_PADDING, area.height - rect.height - EDGE_PADDING);
    const left = Math.min(Math.max(rect.left, EDGE_PADDING), maxLeft);
    const top = Math.min(Math.max(rect.top, EDGE_PADDING), maxTop);
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
  }

  function attachResize(win) {
    const minWidth = 420;
    const minHeight = 280;
    const startResize = (dir, e) => {
      if (win.classList.contains('is-maximized')) return;
      focusWindow(win);
      e.preventDefault();
      const area = workArea();
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = win.getBoundingClientRect();
      const startWidth = rect.width;
      const startHeight = rect.height;
      const startLeft = rect.left;
      const startTop = rect.top;
      document.body.style.userSelect = 'none';

      const onMove = (ev) => {
        ev.preventDefault();
        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;

        if (dir.includes('e')) newWidth = startWidth + deltaX;
        if (dir.includes('s')) newHeight = startHeight + deltaY;

        const maxW = area.width - EDGE_PADDING * 2;
        const maxH = area.height - EDGE_PADDING * 2;
        newWidth = Math.min(Math.max(newWidth, minWidth), maxW);
        newHeight = Math.min(Math.max(newHeight, minHeight), maxH);

        const maxLeft = Math.max(EDGE_PADDING, area.width - newWidth - EDGE_PADDING);
        const maxTop = Math.max(EDGE_PADDING, area.height - newHeight - EDGE_PADDING);
        newLeft = Math.min(Math.max(newLeft, EDGE_PADDING), maxLeft);
        newTop = Math.min(Math.max(newTop, EDGE_PADDING), maxTop);

        win.style.width = `${newWidth}px`;
        win.style.height = `${newHeight}px`;
        win.style.left = `${newLeft}px`;
        win.style.top = `${newTop}px`;
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
        clampWindow(win);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    ['e', 's', 'se'].forEach(dir => {
      const h = win.querySelector(`.xp-resize-${dir}`);
      if (h) {
        h.addEventListener('mousedown', (e) => startResize(dir, e));
      }
    });
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
        clampWindow(win);
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
    if (!isMobile) {
      ['e', 's', 'se'].forEach(dir => {
        if (!win.querySelector(`.xp-resize-${dir}`)) {
          const handleEl = document.createElement('div');
          handleEl.className = `xp-resize-handle xp-resize-${dir}`;
          win.appendChild(handleEl);
        }
      });
      attachResize(win);
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
      window.addEventListener('resize', () => {
        Object.values(windows).forEach(clampWindow);
      });
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
    window.addEventListener('resize', () => {
      Object.values(windows).forEach(clampWindow);
    });
    window.XPShell = {
      open: openWindow,
      close: closeWindow,
      minimize: minimizeWindow,
      toggleMaximize: maximizeWindow,
    };
  });
})();
