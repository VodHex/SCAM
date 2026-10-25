(function () {
  'use strict';
  const SO = window.SO = window.SO || {};
  const mem = { fs: null, fs_bin: [] };
  const subs = [];
  const DOCS = 'C:\\Documents and Settings\\Scammer\\My Documents';

  function D() { return (SO.save && SO.save.d) || mem; }
  function persist() { try { SO.save && SO.save.save && SO.save.save(); } catch (e) { } }
  function notify() { subs.slice().forEach(function (f) { try { f(); } catch (e) { } }); }

  function mk(m, p) {
    const parts = p.split('\\').filter(Boolean);
    if (!parts.length) return;
    let cur = parts[0] + '\\';
    if (!m[cur]) m[cur] = { type: 'dir' };
    for (let i = 1; i < parts.length; i++) {
      cur = (i === 1 ? cur : cur + '\\') + parts[i];
      if (!m[cur]) m[cur] = { type: 'dir' };
    }
  }
  function put(m, p, c) {
    mk(m, p.slice(0, p.lastIndexOf('\\')));
    m[p] = { type: 'file', content: c };
  }

  function seed(m) {
    mk(m, 'C:\\Documents and Settings\\Scammer\\Desktop');
    mk(m, DOCS);
    mk(m, 'C:\\Program Files');
    mk(m, 'C:\\WINDOWS');
    mk(m, 'C:\\Scam Center\\Scripts');
    mk(m, 'C:\\Scam Center\\Leads');
    put(m, 'C:\\README.txt', 'SCAM OS - README\r\n\r\nParody game. Nothing here is real.\r\nAll people, companies and scripts are fictional.\r\nDo not scam real people. It is bad. Please be nice.\r\n');
    put(m, 'C:\\Scam Center\\Scripts\\script1_virus_alert.txt',
      'CALL SCRIPT #1 - "THE VERY SCARY POPUP" (PARODY)\r\n\r\n' +
      'YOU: Hello, this is Chad from the Department of Computers.\r\n' +
      'YOU: Your computer has 4,000,000 viruses. Yes, four million.\r\n' +
      'YOU: To fix it, please install my totally-not-suspicious program.\r\n\r\n' +
      '(In real life this is a SCAM. Hang up. This is just a joke file.)\r\n');
    put(m, 'C:\\Scam Center\\Scripts\\script2_gift_cards.txt',
      'CALL SCRIPT #2 - "THE GIFT CARD ENTHUSIAST" (PARODY)\r\n\r\n' +
      'YOU: The tax office requires payment in... (checks notes) ...gift cards.\r\n' +
      'MARK: That sounds fake.\r\n' +
      'YOU: No, it is the newest government technology.\r\n\r\n' +
      'REAL LIFE: No legit agency EVER demands gift cards. Hang up.\r\n');
    put(m, 'C:\\Scam Center\\Scripts\\script3_prince.txt',
      'EMAIL SCRIPT #3 - "THE VERY BUSY PRINCE" (PARODY)\r\n\r\n' +
      'Dear Friend,\r\nI am Prince Reginald of Nowhereistan. I have 40 million\r\n' +
      'pretend dollars and need a stranger to hold them.\r\nPlease send your bank details and a pic of your cat.\r\n\r\n' +
      'This is fiction. Delete emails like this.\r\n');
    put(m, 'C:\\Scam Center\\Leads\\notes.txt', 'Leads are managed in the CRM app.\r\nThis folder is just decoration.\r\n');
    put(m, 'C:\\Documents and Settings\\Scammer\\My Documents\\todo.txt', 'TODO:\r\n- buy more headsets\r\n- reflect on life choices\r\n- remember: it is only a game\r\n');
  }

  function map() {
    const d = D();
    if (!d.fs || typeof d.fs !== 'object' || !d.fs['C:\\']) {
      d.fs = {}; seed(d.fs); persist();
    }
    if (!Array.isArray(d.fs_bin)) d.fs_bin = [];
    return d.fs;
  }

  function norm(p) {
    p = String(p == null ? '' : p).replace(/\//g, '\\').replace(/\\+/g, '\\').trim();
    if (/^[a-z]:$/i.test(p)) p += '\\';
    if (/^[a-z]:/i.test(p)) p = p[0].toUpperCase() + p.slice(1);
    if (p.length > 3 && p.endsWith('\\')) p = p.slice(0, -1);
    return p;
  }
  function canon(p) {
    p = norm(p);
    const m = map();
    if (m[p]) return p;
    const lp = p.toLowerCase();
    const ks = Object.keys(m);
    for (let i = 0; i < ks.length; i++) if (ks[i].toLowerCase() === lp) return ks[i];
    return p;
  }
  function parent(p) {
    p = norm(p);
    const i = p.lastIndexOf('\\');
    if (i <= 2) return p.slice(0, 3);
    return p.slice(0, i);
  }
  function basename(p) {
    p = norm(p);
    if (p.length <= 3) return p;
    return p.slice(p.lastIndexOf('\\') + 1);
  }
  function join(a, b) { a = norm(a); return a.endsWith('\\') ? a + b : a + '\\' + b; }
  function descendants(m, k) {
    const pre = k.toLowerCase() + '\\';
    return Object.keys(m).filter(function (x) { return x.toLowerCase().indexOf(pre) === 0; });
  }

  const fs = {
    DOCS: DOCS,
    init: function () { map(); },
    norm: canon, parent: parent, basename: basename, join: join,
    subscribe: function (f) {
      subs.push(f);
      return function () { const i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); };
    },
    exists: function (p) { try { return !!map()[canon(p)]; } catch (e) { return false; } },
    isDir: function (p) { try { const n = map()[canon(p)]; return !!n && n.type === 'dir'; } catch (e) { return false; } },
    list: function (path) {
      try {
        const m = map(), k = canon(path);
        if (!m[k] || m[k].type !== 'dir') return [];
        const lk = k.toLowerCase();
        const out = [];
        Object.keys(m).forEach(function (x) {
          if (x !== k && parent(x).toLowerCase() === lk && x.length > 3) out.push({ name: basename(x), type: m[x].type, path: x });
        });
        out.sort(function (a, b) {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
        });
        return out;
      } catch (e) { return []; }
    },
    read: function (path) {
      try { const n = map()[canon(path)]; return n && n.type === 'file' ? String(n.content || '') : null; } catch (e) { return null; }
    },
    write: function (path, content) {
      try {
        const m = map(), k = canon(path);
        if (m[k] && m[k].type === 'dir') return false;
        const par = canon(parent(k));
        if (!m[par] || m[par].type !== 'dir') return false;
        const final = m[k] ? k : join(par, basename(k));
        m[final] = { type: 'file', content: String(content == null ? '' : content) };
        persist(); notify();
        return true;
      } catch (e) { return false; }
    },
    mkdir: function (path) {
      try {
        const m = map(), k = canon(path);
        if (m[k]) return false;
        const par = canon(parent(k));
        if (!m[par] || m[par].type !== 'dir') return false;
        m[join(par, basename(k))] = { type: 'dir' };
        persist(); notify();
        return true;
      } catch (e) { return false; }
    },
    remove: function (path) {
      try {
        const m = map(), k = canon(path);
        if (!m[k] || k.length <= 3) return false;
        const kids = descendants(m, k).map(function (x) { return { path: x, node: m[x] }; });
        D().fs_bin.push({ path: k, node: m[k], kids: kids });
        kids.forEach(function (c) { delete m[c.path]; });
        delete m[k];
        persist(); notify();
        return true;
      } catch (e) { return false; }
    },
    binList: function () {
      try { map(); return D().fs_bin.map(function (e, i) { return { index: i, path: e.path, name: basename(e.path), type: e.node && e.node.type || 'file' }; }); } catch (e) { return []; }
    },
    restore: function (i) {
      try {
        const m = map(), bin = D().fs_bin, e = bin[i];
        if (!e) return false;
        let target = e.path;
        if (m[canon(target)]) target += ' (restored)';
        mk(m, parent(target));
        m[target] = e.node;
        (e.kids || []).forEach(function (c) { m[target + c.path.slice(e.path.length)] = c.node; });
        bin.splice(i, 1);
        persist(); notify();
        return target;
      } catch (er) { return false; }
    },
    emptyBin: function () {
      try { map(); D().fs_bin = []; persist(); notify(); return true; } catch (e) { return false; }
    },
    rename: function (path, newName) {
      try {
        const m = map(), k = canon(path);
        newName = String(newName || '').trim();
        if (!m[k] || !newName || /[\\\/:*?"<>|]/.test(newName) || k.length <= 3) return false;
        const nk = join(parent(k), newName);
        if (nk.toLowerCase() === k.toLowerCase()) { if (nk === k) return true; }
        else if (m[canon(nk)]) return false;
        const kids = descendants(m, k).map(function (x) { return { path: x, node: m[x] }; });
        const node = m[k];
        delete m[k]; kids.forEach(function (c) { delete m[c.path]; });
        m[nk] = node;
        kids.forEach(function (c) { m[nk + c.path.slice(k.length)] = c.node; });
        persist(); notify();
        return nk;
      } catch (e) { return false; }
    }
  };
  SO.fs = fs;

  /* ---------- shared XP-style popup menus (used by my apps) ---------- */
  let cur = null, closedOwner = null, closedAt = 0;
  function css() {
    if (document.getElementById('so-xpmenu-css')) return;
    const s = document.createElement('style');
    s.id = 'so-xpmenu-css';
    s.textContent =
      '.xm-pop{position:fixed;z-index:99999;background:#fff;border:2px solid #404040;border-color:#fff #404040 #404040 #fff;outline:1px solid #808080;padding:2px;min-width:140px;font-size:18px;color:#000;box-shadow:4px 4px 3px rgba(0,0,0,.35)}' +
      '.xm-it{padding:1px 18px 1px 22px;white-space:nowrap;cursor:default;position:relative}' +
      '.xm-it:hover{background:#0054e3;color:#fff}.xm-it.dis{color:#808080}.xm-it.dis:hover{background:none;color:#808080}' +
      '.xm-ck{position:absolute;left:6px}.xm-sep{height:0;border-top:1px solid #808080;border-bottom:1px solid #fff;margin:3px 1px}';
    document.head.appendChild(s);
  }
  function closeMenu() {
    if (cur) {
      closedOwner = cur._owner; closedAt = Date.now();
      cur.remove(); cur = null;
      document.removeEventListener('mousedown', outside, true);
    }
  }
  function outside(e) { if (cur && !cur.contains(e.target)) closeMenu(); }
  function pop(items, x, y, owner) {
    closeMenu(); css();
    const m = document.createElement('div');
    m.className = 'xm-pop'; m._owner = owner || null;
    (items || []).forEach(function (it) {
      if (it.sep) { const s = document.createElement('div'); s.className = 'xm-sep'; m.appendChild(s); return; }
      const r = document.createElement('div');
      r.className = 'xm-it' + (it.disabled ? ' dis' : '');
      if (it.check) { const c = document.createElement('span'); c.className = 'xm-ck'; c.textContent = '\u2022'; r.appendChild(c); }
      r.appendChild(document.createTextNode(it.label));
      r.addEventListener('click', function () {
        if (it.disabled) return;
        closeMenu();
        try { it.fn && it.fn(); } catch (err) { console.error(err); }
      });
      m.appendChild(r);
    });
    document.body.appendChild(m);
    const rc = m.getBoundingClientRect();
    m.style.left = Math.max(0, Math.min(x, window.innerWidth - rc.width - 2)) + 'px';
    m.style.top = Math.max(0, Math.min(y, window.innerHeight - rc.height - 2)) + 'px';
    cur = m;
    document.addEventListener('mousedown', outside, true);
  }
  function bar(barEl, defs) {
    defs.forEach(function (d) {
      const s = document.createElement('span');
      s.className = 'mi'; s.textContent = d.label;
      const open = function () {
        const r = s.getBoundingClientRect();
        pop(typeof d.items === 'function' ? d.items() : d.items, r.left, r.bottom, s);
      };
      s.addEventListener('click', function () {
        if (closedOwner === s && Date.now() - closedAt < 400) { closedOwner = null; return; }
        open();
      });
      s.addEventListener('mouseenter', function () {
        if (cur && cur._owner && cur._owner !== s && barEl.contains(cur._owner)) open();
      });
      barEl.appendChild(s);
    });
  }
  SO.xpmenu = { pop: pop, bar: bar, close: closeMenu };
})();
