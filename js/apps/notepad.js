(function () {
  'use strict';
  const SO = window.SO = window.SO || {};
  let n = 0;
  const docs = [];

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function icon(k) { try { return SO.icon(k); } catch (e) { return ''; } }
  function injectCss() {
    if (document.getElementById('np-css')) return;
    const s = el('style'); s.id = 'np-css';
    s.textContent =
      '.np-ta{flex:1;resize:none;border:0;outline:0;margin:0;padding:2px 4px;font-family:inherit;font-size:18px;overflow:auto;background:#fff;color:#000;min-height:0}' +
      '.np-ov{position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;z-index:5}' +
      '.np-dlg{width:340px;background:#ece9d8;border:2px solid #0054e3;color:#000}' +
      '.np-dt{background:#0054e3;color:#fff;padding:1px 6px}' +
      '.np-db{padding:6px;display:flex;flex-direction:column;gap:4px}' +
      '.np-row{display:flex;gap:4px;align-items:center}.np-row>.xp-input{flex:1;min-width:0}' +
      '.np-list{height:170px;overflow:auto;background:#fff;border:2px inset #808080;border-color:#808080 #fff #fff #808080}' +
      '.np-it{display:flex;align-items:center;gap:4px;padding:0 4px;cursor:default;white-space:nowrap}' +
      '.np-it img{width:16px;height:16px;image-rendering:pixelated}.np-it.sel{background:#0054e3;color:#fff}';
    document.head.appendChild(s);
  }

  function dialog(root, mode, startDir, defName, done) {
    const fs = SO.fs;
    let dir = fs.isDir(startDir) ? fs.norm(startDir) : fs.DOCS;
    const ov = el('div', 'np-ov');
    const box = el('div', 'np-dlg');
    box.appendChild(el('div', 'np-dt', mode === 'open' ? 'Open' : 'Save As'));
    const body = el('div', 'np-db');
    const r1 = el('div', 'np-row');
    const pathIn = el('input', 'xp-input'); pathIn.readOnly = true;
    const up = el('button', 'xp-btn', 'Up');
    r1.appendChild(el('span', null, 'Look in:')); r1.appendChild(pathIn); r1.appendChild(up);
    const list = el('div', 'np-list');
    const r2 = el('div', 'np-row');
    const nameIn = el('input', 'xp-input'); nameIn.value = defName || '';
    r2.appendChild(el('span', null, 'File name:')); r2.appendChild(nameIn);
    const r3 = el('div', 'np-row'); r3.style.justifyContent = 'flex-end';
    const ok = el('button', 'xp-btn', mode === 'open' ? 'Open' : 'Save');
    const cancel = el('button', 'xp-btn', 'Cancel');
    r3.appendChild(ok); r3.appendChild(cancel);
    [r1, list, r2, r3].forEach(function (x) { body.appendChild(x); });
    box.appendChild(body); ov.appendChild(box); root.appendChild(ov);
    function close() { ov.remove(); }
    function render() {
      pathIn.value = dir; list.innerHTML = '';
      fs.list(dir).forEach(function (it) {
        const row = el('div', 'np-it');
        const im = el('img'); im.src = icon(it.type === 'dir' ? 'folder' : 'file');
        row.appendChild(im); row.appendChild(document.createTextNode(it.name));
        row.addEventListener('click', function () {
          Array.prototype.forEach.call(list.children, function (c) { c.classList.remove('sel'); });
          row.classList.add('sel');
          if (it.type === 'file') nameIn.value = it.name;
        });
        row.addEventListener('dblclick', function () {
          if (it.type === 'dir') { dir = it.path; render(); } else commit();
        });
        list.appendChild(row);
      });
    }
    function commit() {
      let nm = nameIn.value.trim();
      if (!nm) return;
      let p = /^[a-z]:\\/i.test(nm) ? fs.norm(nm) : fs.join(dir, nm);
      if (mode === 'open') {
        if (!fs.exists(p) || fs.isDir(p)) {
          if (fs.isDir(p)) { dir = p; nameIn.value = ''; render(); return; }
          SO.msgbox({ title: 'Open', text: 'File not found.\nCheck the file name and try again.', icon: 'warn', buttons: ['OK'] });
          return;
        }
        close(); done(p);
      } else {
        if (!/\.[^\\.]+$/.test(nm)) p += '.txt';
        if (fs.exists(p)) {
          SO.msgbox({ title: 'Save As', text: fs.basename(p) + ' already exists.\nDo you want to replace it?', icon: 'warn', buttons: ['Yes', 'No'] })
            .then(function (b) { if (b === 'Yes') { close(); done(p); } });
        } else { close(); done(p); }
      }
    }
    up.addEventListener('click', function () { const p = fs.parent(dir); if (p !== dir) { dir = p; render(); } });
    ok.addEventListener('click', commit);
    cancel.addEventListener('click', function () { close(); done(null); });
    nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { close(); done(null); } });
    render(); nameIn.focus();
  }

  function openDoc(args) {
    args = args || {};
    try {
      injectCss();
      if (SO.fs) SO.fs.init();
      if (args.path && SO.fs) {
        const lp = SO.fs.norm(args.path).toLowerCase();
        const ex = docs.find(function (d) { return d.path && d.path.toLowerCase() === lp; });
        if (ex) { ex.w.focus(); return ex.w; }
      }
      const id = 'notepad-' + (++n);
      const w = SO.wm.open({
        id: id, title: 'Untitled - Notepad', icon: 'notepad', w: 560, h: 420,
        onClose: function () { const i = docs.findIndex(function (d) { return d.w === w; }); if (i >= 0) docs.splice(i, 1); }
      });
      if (!w || !w.fresh) return w;
      const doc = { w: w, path: null, dirty: false };
      docs.push(doc);

      const root = el('div');
      root.style.cssText = 'flex:1;display:flex;flex-direction:column;position:relative;min-height:0';
      const mb = el('div', 'menubar');
      const ta = el('textarea', 'np-ta');
      ta.spellcheck = false; ta.wrap = 'soft';
      const sb = el('div', 'statusbar'); sb.textContent = 'Ln 1, Col 1';
      root.appendChild(mb); root.appendChild(ta); root.appendChild(sb);
      w.body.appendChild(root);

      function title() { w.setTitle((doc.dirty ? '*' : '') + (doc.path ? SO.fs.basename(doc.path) : 'Untitled') + ' - Notepad'); }
      function pos() {
        const t = ta.value.slice(0, ta.selectionStart || 0).split('\n');
        sb.textContent = 'Ln ' + t.length + ', Col ' + (t[t.length - 1].length + 1);
      }
      function setText(txt, path) { ta.value = txt; doc.path = path || null; doc.dirty = false; title(); pos(); }
      function doSave() {
        if (!doc.path) return doSaveAs();
        if (!SO.fs.write(doc.path, ta.value)) { SO.msgbox({ title: 'Notepad', text: 'Cannot save the file.', icon: 'error', buttons: ['OK'] }); return Promise.resolve(false); }
        doc.dirty = false; title(); SO.audio && SO.audio.play('click');
        return Promise.resolve(true);
      }
      function doSaveAs() {
        return new Promise(function (res) {
          dialog(root, 'save', doc.path ? SO.fs.parent(doc.path) : SO.fs.DOCS, doc.path ? SO.fs.basename(doc.path) : 'Untitled.txt', function (p) {
            if (!p) return res(false);
            doc.path = p; res(doSave());
          });
        });
      }
      function confirmDiscard() {
        if (!doc.dirty) return Promise.resolve(true);
        return SO.msgbox({ title: 'Notepad', text: 'The text in ' + (doc.path ? SO.fs.basename(doc.path) : 'Untitled') + ' has changed.\nDo you want to save the changes?', icon: 'warn', buttons: ['Yes', 'No', 'Cancel'] })
          .then(function (b) { if (b === 'Yes') return doSave(); return b === 'No'; });
      }
      function loadPath(p) {
        const t = SO.fs.read(p);
        if (t == null) { SO.msgbox({ title: 'Notepad', text: 'Cannot open ' + p, icon: 'error', buttons: ['OK'] }); return; }
        setText(t, SO.fs.norm(p));
      }
      function wrapOn() { return ta.style.whiteSpace !== 'pre'; }
      function setWrap(on) { ta.style.whiteSpace = on ? 'pre-wrap' : 'pre'; ta.wrap = on ? 'soft' : 'off'; }

      SO.xpmenu.bar(mb, [
        {
          label: 'File', items: function () {
            return [
              { label: 'New', fn: function () { confirmDiscard().then(function (ok) { if (ok) setText('', null); }); } },
              { label: 'Open...', fn: function () { confirmDiscard().then(function (ok) { if (ok) dialog(root, 'open', doc.path ? SO.fs.parent(doc.path) : SO.fs.DOCS, '', function (p) { if (p) loadPath(p); }); }); } },
              { label: 'Save', fn: doSave },
              { label: 'Save As...', fn: doSaveAs },
              { sep: true },
              { label: 'Exit', fn: function () { confirmDiscard().then(function (ok) { if (ok) w.close(); }); } }
            ];
          }
        },
        {
          label: 'Edit', items: [
            { label: 'Select All', fn: function () { ta.focus(); ta.select(); } },
            { label: 'Time/Date', fn: function () {
              const s = new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
              ta.focus(); ta.setRangeText(s, ta.selectionStart, ta.selectionEnd, 'end');
              doc.dirty = true; title(); pos();
            } }
          ]
        },
        { label: 'Format', items: function () { return [{ label: 'Word Wrap', check: wrapOn(), fn: function () { setWrap(!wrapOn()); } }]; } }
      ]);

      setWrap(true);
      ta.addEventListener('input', function () { if (!doc.dirty) { doc.dirty = true; title(); } pos(); });
      ['keyup', 'click', 'mouseup'].forEach(function (ev) { ta.addEventListener(ev, pos); });
      ta.addEventListener('keydown', function (e) {
        if (e.ctrlKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); doSave(); }
      });
      if (args.path) loadPath(args.path);
      setTimeout(function () { try { ta.focus(); } catch (e) { } }, 30);
      return w;
    } catch (err) { console.error('notepad', err); }
  }

  SO.registerApp({ id: 'notepad', name: 'Notepad', icon: 'notepad', desktop: true, start: true, order: 20, open: openDoc });
})();
