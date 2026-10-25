/* SCAM OS - window manager: drag, resize, min/max/close, z-order, taskbar buttons. */
(function () {
  const SO = window.SO;
  const wins = {};
  let z = 10;
  let cascade = 0;
  let active = null;

  function layer() { return document.getElementById('wins'); }
  function tasks() { return document.getElementById('tasks'); }
  function area() { return document.getElementById('desktop').getBoundingClientRect(); }

  function renderTasks() {
    const t = tasks();
    if (!t) return;
    t.innerHTML = '';
    Object.values(wins).forEach(w => {
      const b = document.createElement('button');
      b.className = 'task' + (w === active && !w.minimized ? ' active' : '');
      b.innerHTML = SO.iconImg(w.icon || 'file', 16) + '<span>' + esc(w.title) + '</span>';
      b.onclick = () => {
        if (w.minimized) { w.restore(); }
        else if (w === active) { w.minimize(); }
        else w.focus();
      };
      b.oncontextmenu = e => {
        e.preventDefault();
        if (SO.xpmenu) SO.xpmenu.pop([
          { label: 'Restore', fn: () => w.restore() },
          { label: 'Minimize', fn: () => w.minimize() },
          { label: 'Close', fn: () => w.close() }
        ], e.clientX, e.clientY - 60);
      };
      t.appendChild(b);
    });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function open(o) {
    const id = o.id || ('win' + Math.random().toString(36).slice(2));
    if (wins[id]) { wins[id].fresh = false; wins[id].restore(); wins[id].focus(); return wins[id]; }
    const a = area();
    const W = Math.min(o.w || 520, a.width - 10), H = Math.min(o.h || 380, a.height - 10);
    const off = (cascade++ % 8) * 26;
    const x = o.x != null ? o.x : Math.max(4, Math.min(a.width - W - 4, 60 + off + Math.random() * 30));
    const y = o.y != null ? o.y : Math.max(4, Math.min(a.height - H - 4, 30 + off));

    const el = document.createElement('div');
    el.className = 'win';
    el.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + W + 'px;height:' + H + 'px;z-index:' + (++z);
    el.innerHTML =
      '<div class="tb"><img class="ico tbi" width="16" height="16" alt=""><span class="tb-title"></span>' +
      '<div class="tb-btns"><button class="tbb min" title="Minimize"><i></i></button>' +
      (o.noMax ? '' : '<button class="tbb max" title="Maximize"><i></i></button>') +
      '<button class="tbb cls" title="Close"><i></i></button></div></div>' +
      '<div class="wbody"></div>' +
      (o.noResize || o.noMax ? '' : '<div class="rz rz-n" data-d="n"></div><div class="rz rz-s" data-d="s"></div><div class="rz rz-e" data-d="e"></div><div class="rz rz-w" data-d="w"></div><div class="rz rz-ne" data-d="ne"></div><div class="rz rz-nw" data-d="nw"></div><div class="rz rz-se" data-d="se"></div><div class="rz rz-sw" data-d="sw"></div>');
    layer().appendChild(el);

    const w = {
      id, el, body: el.querySelector('.wbody'), title: o.title || 'Window', icon: o.icon || 'file',
      fresh: true, minimized: false, maximized: false, restoreRect: null, onClose: o.onClose, opts: o,
      setTitle(t) { w.title = t; el.querySelector('.tb-title').textContent = t; renderTasks(); },
      setIcon(i) { w.icon = i; el.querySelector('.tbi').src = SO.icon(i); renderTasks(); },
      focus() {
        if (w.minimized) w.restore();
        el.style.zIndex = ++z;
        active = w;
        Object.values(wins).forEach(o2 => o2.el.classList.toggle('active', o2 === w));
        renderTasks();
      },
      minimize() {
        w.minimized = true; el.style.display = 'none';
        if (active === w) active = null;
        const next = Object.values(wins).filter(o2 => !o2.minimized).sort((p, q) => (+q.el.style.zIndex) - (+p.el.style.zIndex))[0];
        if (next) next.focus(); else renderTasks();
        SO.audio.play('click');
      },
      restore() {
        if (!w.minimized) return;
        w.minimized = false; el.style.display = '';
        w.focus();
      },
      toggleMax() {
        if (o.noMax) return;
        if (!w.maximized) {
          w.restoreRect = { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
          el.classList.add('maxed'); w.maximized = true;
        } else {
          el.classList.remove('maxed'); w.maximized = false;
          const r = w.restoreRect;
          el.style.left = r.l + 'px'; el.style.top = r.t + 'px'; el.style.width = r.w + 'px'; el.style.height = r.h + 'px';
        }
        w.body.dispatchEvent(new Event('wresize'));
        w.focus();
      },
      close() {
        if (!wins[id]) return;
        delete wins[id];
        el.remove();
        if (active === w) active = null;
        try { if (typeof w.onClose === 'function') w.onClose(w); } catch (e) { console.error(e); }
        const next = Object.values(wins).filter(o2 => !o2.minimized).sort((p, q) => (+q.el.style.zIndex) - (+p.el.style.zIndex))[0];
        if (next) next.focus(); else renderTasks();
      }
    };
    wins[id] = w;
    w.setTitle(w.title);
    el.querySelector('.tbi').src = SO.icon(w.icon);

    el.addEventListener('pointerdown', () => { if (active !== w) w.focus(); }, true);
    el.querySelector('.tbb.min').onclick = e => { e.stopPropagation(); w.minimize(); };
    const mx = el.querySelector('.tbb.max'); if (mx) mx.onclick = e => { e.stopPropagation(); w.toggleMax(); SO.audio.play('click'); };
    el.querySelector('.tbb.cls').onclick = e => { e.stopPropagation(); w.close(); SO.audio.play('click'); };

    const tb = el.querySelector('.tb');
    tb.addEventListener('dblclick', e => { if (!e.target.closest('.tb-btns')) w.toggleMax(); });
    tb.addEventListener('pointerdown', e => {
      if (e.target.closest('.tb-btns') || w.maximized) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, ol = el.offsetLeft, ot = el.offsetTop;
      const ar = area();
      const mv = ev => {
        let nl = ol + ev.clientX - sx, nt = ot + ev.clientY - sy;
        nl = Math.max(-el.offsetWidth + 80, Math.min(ar.width - 60, nl));
        nt = Math.max(0, Math.min(ar.height - 24, nt));
        el.style.left = nl + 'px'; el.style.top = nt + 'px';
      };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); el.classList.remove('dragging'); };
      el.classList.add('dragging');
      document.addEventListener('pointermove', mv);
      document.addEventListener('pointerup', up);
    });

    el.querySelectorAll('.rz').forEach(h => {
      h.addEventListener('pointerdown', e => {
        if (w.maximized) return;
        e.preventDefault(); e.stopPropagation();
        const d = h.dataset.d;
        const sx = e.clientX, sy = e.clientY;
        const r0 = { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
        const minW = o.minW || 240, minH = o.minH || 140;
        const mv = ev => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          let { l, t, w: ww, h: hh } = r0;
          if (d.includes('e')) ww = Math.max(minW, r0.w + dx);
          if (d.includes('s')) hh = Math.max(minH, r0.h + dy);
          if (d.includes('w')) { ww = Math.max(minW, r0.w - dx); l = r0.l + (r0.w - ww); }
          if (d.includes('n')) { hh = Math.max(minH, r0.h - dy); t = r0.t + (r0.h - hh); }
          el.style.left = l + 'px'; el.style.top = Math.max(0, t) + 'px'; el.style.width = ww + 'px'; el.style.height = hh + 'px';
          w.body.dispatchEvent(new Event('wresize'));
        };
        const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); };
        document.addEventListener('pointermove', mv);
        document.addEventListener('pointerup', up);
      });
    });

    w.focus();
    return w;
  }

  // keep every window inside the desktop when the browser is resized
  function refit() {
    const a = area();
    Object.values(wins).forEach(w => {
      if (w.maximized) return;
      const el = w.el;
      const nw = Math.min(el.offsetWidth, a.width - 4), nh = Math.min(el.offsetHeight, a.height - 4);
      el.style.width = nw + 'px'; el.style.height = nh + 'px';
      el.style.left = Math.max(0, Math.min(a.width - nw, el.offsetLeft)) + 'px';
      el.style.top = Math.max(0, Math.min(a.height - nh, el.offsetTop)) + 'px';
      w.body.dispatchEvent(new Event('wresize'));
    });
  }
  window.addEventListener('resize', refit);

  SO.wm = {
    open,
    get(id) { return wins[id]; },
    list() { return Object.values(wins); },
    closeAll() { Object.values(wins).forEach(w => w.close()); },
    activeWin() { return active; },
    refreshTasks: renderTasks
  };
})();
