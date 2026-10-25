(function () {
  'use strict';
  const SO = window.SO = window.SO || {};

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function icon(k) { try { return SO.icon(k); } catch (e) { return ''; } }
  function snd(n) { try { SO.audio && SO.audio.play(n); } catch (e) { } }
  function injectCss() {
    if (document.getElementById('ex-css')) return;
    const s = el('style'); s.id = 'ex-css';
    s.textContent =
      '.ex-main{flex:1;display:flex;min-height:0}' +
      '.ex-side{width:170px;flex:none;background:linear-gradient(#7ba2e7,#6375d6);padding:8px;overflow:auto;color:#000}' +
      '.ex-box{margin-bottom:10px;background:#d6dff7;border:1px solid #fff}' +
      '.ex-bh{background:linear-gradient(90deg,#fff,#c6d3f7);color:#215dc6;padding:2px 6px;font-weight:bold}' +
      '.ex-bb{padding:4px 8px;display:flex;flex-direction:column;gap:2px}' +
      '.ex-lnk{color:#215dc6;cursor:pointer}.ex-lnk:hover{text-decoration:underline;color:#428eff}.ex-lnk.dis{color:#808080;pointer-events:none}' +
      '.ex-grid{flex:1;overflow:auto;display:flex;flex-wrap:wrap;align-content:flex-start;gap:4px;padding:6px;outline:0}' +
      '.ex-it{width:86px;display:flex;flex-direction:column;align-items:center;padding:2px;cursor:default;text-align:center;word-break:break-word;line-height:1;border:1px solid transparent}' +
      '.ex-it img{width:32px;height:32px;image-rendering:pixelated;margin-bottom:2px}' +
      '.ex-it span{padding:0 2px}.ex-it.sel span{background:#0054e3;color:#fff}.ex-it.sel{border:1px dotted #0054e3}' +
      '.ex-it input{width:80px;font-family:inherit;font-size:inherit}' +
      '.ex-addr{flex:1;min-width:0}.ex-row{display:flex;gap:4px;align-items:center;padding:2px 4px}';
    document.head.appendChild(s);
  }
  function fsReady() { try { SO.fs.init(); return true; } catch (e) { return false; } }
  function box(title, links) {
    const b = el('div', 'ex-box');
    b.appendChild(el('div', 'ex-bh', title));
    const body = el('div', 'ex-bb');
    links.forEach(function (l) {
      const a = el('span', 'ex-lnk', l.label);
      a.addEventListener('click', function () { if (!a.classList.contains('dis')) l.fn(); });
      l._el = a; body.appendChild(a);
    });
    b.appendChild(body);
    return b;
  }
  function uniqueName(dir, base) {
    let nm = base, i = 2;
    while (SO.fs.exists(SO.fs.join(dir, nm))) nm = base + ' (' + (i++) + ')';
    return nm;
  }

  /* ---------------- My Computer / folders ---------------- */
  function openComputer(args) {
    args = args || {};
    try {
      injectCss();
      if (!fsReady()) return;
      const w = SO.wm.open({ id: 'computer', title: 'My Computer', icon: 'computer', w: 640, h: 440, onClose: function () { if (unsub) unsub(); } });
      if (!w) return;
      if (!w.fresh) { if (args.path && w.body._nav) w.body._nav(args.path); return w; }
      let unsub = null;
      const fs = SO.fs;
      let path = '', hist = [], hi = -1, sel = null, renaming = false;

      const tb = el('div', 'toolbar');
      const bBack = el('button', 'xp-btn', '< Back'), bFwd = el('button', 'xp-btn', 'Forward >'), bUp = el('button', 'xp-btn', 'Up');
      [bBack, bFwd, bUp].forEach(function (b) { tb.appendChild(b); });
      const ar = el('div', 'ex-row');
      const addr = el('input', 'xp-input ex-addr'), go = el('button', 'xp-btn', 'Go');
      ar.appendChild(el('span', null, 'Address')); ar.appendChild(addr); ar.appendChild(go);
      const main = el('div', 'ex-main');
      const side = el('div', 'ex-side');
      const grid = el('div', 'ex-grid panel'); grid.tabIndex = 0;
      const sb = el('div', 'statusbar');
      main.appendChild(side); main.appendChild(grid);
      [tb, ar, main, sb].forEach(function (x) { w.body.appendChild(x); });

      const tasks = box('File and Folder Tasks', [
        { label: 'Make a new folder', fn: newFolder },
        { label: 'Delete this item', fn: delSel },
        { label: 'Rename this item', fn: function () { startRename(sel); } }
      ]);
      const other = box('Other Places', [
        { label: 'My Computer', fn: function () { nav(''); } },
        { label: 'My Documents', fn: function () { nav(fs.DOCS); } },
        { label: 'Local Disk (C:)', fn: function () { nav('C:\\'); } }
      ]);
      side.appendChild(tasks); side.appendChild(other);
      const tl = tasks.querySelectorAll('.ex-lnk');

      function entries() {
        if (path === '') return [{ name: 'Local Disk (C:)', type: 'dir', path: 'C:\\' }, { name: 'My Documents', type: 'dir', path: fs.DOCS }];
        return fs.list(path);
      }
      function nav(p, push) {
        p = String(p || '').trim();
        if (/^my computer$/i.test(p)) p = '';
        if (p !== '') { p = fs.norm(p); if (!fs.isDir(p)) { SO.msgbox({ title: 'Explorer', text: p + '\nThe system cannot find the path specified.', icon: 'error', buttons: ['OK'] }); snd('error'); return; } }
        if (push !== false) { hist = hist.slice(0, hi + 1); hist.push(p); hi++; }
        path = p; sel = null; render();
      }
      w.body._nav = nav;
      function go_(d) { const j = hi + d; if (j < 0 || j >= hist.length) return; hi = j; nav(hist[hi], false); }
      function up() { if (path === '') return; const p = fs.parent(path); nav(p === path ? '' : p); }
      function openItem(it) {
        snd('click');
        if (it.type === 'dir') nav(it.path);
        else SO.openApp('notepad', { path: it.path });
      }
      function delSel() {
        if (sel == null || path === '') return;
        const p = fs.join(path, sel), nm = sel;
        SO.msgbox({ title: 'Confirm Delete', text: 'Are you sure you want to send \'' + nm + '\' to the Recycle Bin?', icon: 'warn', buttons: ['Yes', 'No'] })
          .then(function (b) { if (b === 'Yes') { fs.remove(p); snd('click'); } });
      }
      function newFolder() {
        if (path === '') return;
        const nm = uniqueName(path, 'New Folder');
        if (fs.mkdir(fs.join(path, nm))) { sel = nm; render(); startRename(nm); }
      }
      function newText() {
        if (path === '') return;
        const nm = uniqueName(path, 'New Text Document') ;
        const full = nm + '.txt';
        if (fs.write(fs.join(path, full), '')) { sel = full; render(); startRename(full); }
      }
      function startRename(name) {
        if (name == null || path === '') return;
        const it = Array.prototype.find.call(grid.children, function (c) { return c._name === name; });
        if (!it) return;
        const lab = it.querySelector('span'), inp = el('input', 'xp-input');
        inp.value = name; renaming = true;
        it.replaceChild(inp, lab);
        let done = false;
        function fin(commit) {
          if (done) return; done = true; renaming = false;
          if (commit && inp.value.trim() && inp.value !== name) {
            if (!fs.rename(fs.join(path, name), inp.value.trim())) { SO.msgbox({ title: 'Rename', text: 'Cannot rename. A file with that name already exists or the name is invalid.', icon: 'error', buttons: ['OK'] }); snd('error'); }
            else sel = inp.value.trim();
          }
          render();
        }
        inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') fin(true); else if (e.key === 'Escape') fin(false); });
        inp.addEventListener('blur', function () { fin(true); });
        inp.addEventListener('dblclick', function (e) { e.stopPropagation(); });
        inp.addEventListener('mousedown', function (e) { e.stopPropagation(); });
        inp.focus(); inp.select();
      }
      function render() {
        if (renaming) return;
        grid.innerHTML = '';
        const list = entries();
        list.forEach(function (it) {
          const d = el('div', 'ex-it' + (it.name === sel ? ' sel' : ''));
          d._name = it.name;
          const im = el('img'); im.src = icon(it.type === 'dir' ? 'folder' : 'file');
          d.appendChild(im); d.appendChild(el('span', null, it.name));
          d.addEventListener('click', function (e) { e.stopPropagation(); sel = it.name; Array.prototype.forEach.call(grid.children, function (c) { c.classList.toggle('sel', c === d); }); updTasks(); });
          d.addEventListener('dblclick', function (e) { e.stopPropagation(); openItem(it); });
          d.addEventListener('contextmenu', function (e) {
            e.preventDefault(); e.stopPropagation();
            sel = it.name; Array.prototype.forEach.call(grid.children, function (c) { c.classList.toggle('sel', c === d); }); updTasks();
            const ro = path === '';
            SO.xpmenu.pop([
              { label: 'Open', fn: function () { openItem(it); } }, { sep: true },
              { label: 'Delete', disabled: ro, fn: delSel }, { label: 'Rename', disabled: ro, fn: function () { startRename(it.name); } }
            ], e.clientX, e.clientY);
          });
          grid.appendChild(d);
        });
        addr.value = path === '' ? 'My Computer' : path;
        w.setTitle(path === '' ? 'My Computer' : (fs.basename(path) || path));
        sb.textContent = list.length + ' object(s)';
        bBack.disabled = hi <= 0; bFwd.disabled = hi >= hist.length - 1; bUp.disabled = path === '';
        updTasks();
      }
      function updTasks() {
        tl[0].classList.toggle('dis', path === '');
        tl[1].classList.toggle('dis', path === '' || sel == null);
        tl[2].classList.toggle('dis', path === '' || sel == null);
      }
      grid.addEventListener('click', function () { sel = null; Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove('sel'); }); updTasks(); });
      grid.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        const ro = path === '';
        SO.xpmenu.pop([
          { label: 'New Folder', disabled: ro, fn: newFolder }, { label: 'New Text Document', disabled: ro, fn: newText },
          { sep: true }, { label: 'Refresh', fn: render }
        ], e.clientX, e.clientY);
      });
      grid.addEventListener('keydown', function (e) {
        if (e.key === 'Delete') delSel(); else if (e.key === 'F2') startRename(sel); else if (e.key === 'F5') render();
        else if (e.key === 'Backspace') up();
      });
      bBack.addEventListener('click', function () { go_(-1); });
      bFwd.addEventListener('click', function () { go_(1); });
      bUp.addEventListener('click', up);
      go.addEventListener('click', function () { nav(addr.value); });
      addr.addEventListener('keydown', function (e) { if (e.key === 'Enter') nav(addr.value); });
      unsub = fs.subscribe(function () {
        if (!w.el.isConnected) { unsub(); return; }
        if (path !== '' && !fs.isDir(path)) { nav(''); return; }
        render();
      });
      nav(args.path || '');
      return w;
    } catch (err) { console.error('explorer', err); }
  }

  /* ---------------- Recycle Bin ---------------- */
  function openBin() {
    try {
      injectCss();
      if (!fsReady()) return;
      const w = SO.wm.open({ id: 'bin', title: 'Recycle Bin', icon: 'bin', w: 560, h: 400, onClose: function () { if (unsub) unsub(); } });
      if (!w || !w.fresh) return w;
      let unsub = null, sel = -1;
      const fs = SO.fs;
      const tb = el('div', 'toolbar');
      const bRes = el('button', 'xp-btn', 'Restore'), bEmpty = el('button', 'xp-btn', 'Empty Recycle Bin');
      tb.appendChild(bRes); tb.appendChild(bEmpty);
      const main = el('div', 'ex-main'), side = el('div', 'ex-side'), grid = el('div', 'ex-grid panel'), sb = el('div', 'statusbar');
      main.appendChild(side); main.appendChild(grid);
      [tb, main, sb].forEach(function (x) { w.body.appendChild(x); });
      side.appendChild(box('Recycle Bin Tasks', [
        { label: 'Empty the Recycle Bin', fn: empty },
        { label: 'Restore this item', fn: restore }
      ]));

      function restore() { if (sel < 0) return; const r = fs.restore(sel); sel = -1; if (r) snd('click'); else snd('error'); render(); }
      function empty() {
        if (!fs.binList().length) return;
        SO.msgbox({ title: 'Confirm Multiple File Delete', text: 'Are you sure you want to delete these items permanently?', icon: 'warn', buttons: ['Yes', 'No'] })
          .then(function (b) { if (b === 'Yes') { fs.emptyBin(); sel = -1; snd('click'); render(); } });
      }
      function render() {
        grid.innerHTML = '';
        const list = fs.binList();
        list.forEach(function (it) {
          const d = el('div', 'ex-it' + (it.index === sel ? ' sel' : ''));
          const im = el('img'); im.src = icon(it.type === 'dir' ? 'folder' : 'file');
          d.title = it.path;
          d.appendChild(im); d.appendChild(el('span', null, it.name));
          const pick = function (e) { e.stopPropagation(); sel = it.index; Array.prototype.forEach.call(grid.children, function (c) { c.classList.toggle('sel', c === d); }); };
          d.addEventListener('click', pick);
          d.addEventListener('contextmenu', function (e) {
            e.preventDefault(); pick(e);
            SO.xpmenu.pop([{ label: 'Restore', fn: restore }], e.clientX, e.clientY);
          });
          grid.appendChild(d);
        });
        if (!list.length) { const m = el('div', null, 'Recycle Bin is empty.'); m.style.cssText = 'color:#808080;padding:8px'; grid.appendChild(m); }
        bRes.disabled = sel < 0; bEmpty.disabled = !list.length;
        sb.textContent = list.length + ' object(s)';
      }
      grid.addEventListener('click', function () { sel = -1; render(); });
      bRes.addEventListener('click', restore);
      bEmpty.addEventListener('click', empty);
      unsub = fs.subscribe(function () { if (!w.el.isConnected) { unsub(); return; } render(); });
      render();
      return w;
    } catch (err) { console.error('recycle bin', err); }
  }

  SO.registerApp({ id: 'computer', name: 'My Computer', icon: 'computer', desktop: true, start: true, order: 5, open: openComputer });
  SO.registerApp({ id: 'bin', name: 'Recycle Bin', icon: 'bin', desktop: true, start: false, order: 90, open: openBin });
})();
