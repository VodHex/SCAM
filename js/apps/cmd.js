(function () {
  'use strict';
  const SO = window.SO = window.SO || {};

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function injectCss() {
    if (document.getElementById('cmd-css')) return;
    const s = el('style'); s.id = 'cmd-css';
    s.textContent =
      '.cmd-root{flex:1;background:#000;color:#c0c0c0;overflow-y:auto;padding:4px 6px;outline:0;position:relative;font-size:18px;line-height:1.1;min-height:0}' +
      '.cmd-out{white-space:pre-wrap;word-break:break-all}.cmd-line{white-space:pre-wrap;word-break:break-all}' +
      '.cmd-cur{background:#c0c0c0;color:#000;animation:cmdblink 1s steps(1) infinite}' +
      '@keyframes cmdblink{50%{background:transparent;color:inherit}}' +
      '.cmd-mx{position:absolute;left:0;top:0;width:100%;height:100%;background:#000}';
    document.head.appendChild(s);
  }
  const sleep = function (f, ms) { return setTimeout(f, ms); };
  function pad(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }

  function open() {
    try {
      injectCss();
      if (SO.fs) SO.fs.init();
      const w = SO.wm.open({ id: 'cmd', title: 'Command Prompt', icon: 'cmd', w: 640, h: 420, onClose: function () { dead = true; stopAll(); } });
      if (!w || !w.fresh) return w;
      const fs = SO.fs;
      let dead = false, cwd = 'C:\\Documents and Settings\\Scammer', buf = '', pos = 0, hist = [], hi = 0, busy = null, timers = [], mx = null, mxTimer = null;

      const root = el('div', 'cmd-root'); root.tabIndex = 0;
      const out = el('div', 'cmd-out'), line = el('div', 'cmd-line');
      root.appendChild(out); root.appendChild(line);
      w.body.appendChild(root);

      function print(t) { out.appendChild(document.createTextNode((t == null ? '' : t) + '\n')); scroll(); }
      function scroll() { root.scrollTop = root.scrollHeight; }
      function prompt() { return cwd + '>'; }
      function draw() {
        line.textContent = '';
        if (busy) { scroll(); return; }
        line.appendChild(document.createTextNode(prompt() + buf.slice(0, pos)));
        line.appendChild(el('span', 'cmd-cur', pos < buf.length ? buf[pos] : '\u00a0'));
        line.appendChild(document.createTextNode(buf.slice(pos + 1)));
        scroll();
      }
      function later(f, ms) { const t = sleep(function () { if (!dead) f(); }, ms); timers.push(t); return t; }
      function stopAll() {
        timers.forEach(clearTimeout); timers = [];
        if (mxTimer) { clearInterval(mxTimer); mxTimer = null; }
        if (mx) { mx.remove(); mx = null; }
      }
      function endBusy() { stopAll(); busy = null; draw(); }

      function resolve(p) {
        p = String(p || '').replace(/\//g, '\\').replace(/^"|"$/g, '').trim();
        if (!p) return cwd;
        let base;
        if (/^[a-z]:/i.test(p)) { base = p.slice(0, 2).toUpperCase() + '\\'; p = p.slice(2); }
        else if (p[0] === '\\') base = 'C:\\';
        else base = cwd;
        const parts = base.split('\\').filter(Boolean);
        p.split('\\').forEach(function (s) {
          if (!s || s === '.') return;
          if (s === '..') { if (parts.length > 1) parts.pop(); } else parts.push(s);
        });
        return parts.length === 1 ? parts[0] + '\\' : parts.join('\\');
      }
      function tree(p, prefix, depth, st) {
        if (depth > 3) return;
        const items = fs.list(p).filter(function (i) { return i.type === 'dir'; });
        items.forEach(function (it, k) {
          if (st.n++ > 40) return;
          const last = k === items.length - 1;
          print(prefix + (last ? '\\---' : '+---') + it.name);
          tree(it.path, prefix + (last ? '    ' : '|   '), depth + 1, st);
        });
      }
      function hack(name) {
        if (!name) { print('Usage: hack <name>'); return; }
        busy = 'hack'; draw();
        const steps = ['Initializing HaxxorEngine 9000...', 'Locating "' + name + '" on the internet (it is big)...', 'Bypassing firewall (asking nicely)...',
          'Guessing password: password123... FAILED', 'Guessing password: hunter2... FAILED', 'Guessing password: "name of their dog"... SUCCESS?',
          'Downloading 0.00 MB of secret files...', 'Sorting through their memes...'];
        let i = 0;
        (function step() {
          if (i < steps.length) { print(steps[i++]); later(step, 350); return; }
          let p = 0;
          (function bar() {
            p += 10 + Math.floor(Math.random() * 15); if (p > 100) p = 100;
            const f = Math.round(p / 5);
            print('[' + '#'.repeat(f) + '-'.repeat(20 - f) + '] ' + p + '%');
            if (p < 100) later(bar, 250);
            else {
              print('');
              print('ACCESS GRANTED... just kidding.');
              print('Nothing was hacked. This is a parody game. Be nice to ' + name + '.');
              print('');
              endBusy();
            }
          })();
        })();
      }
      function matrix() {
        busy = 'matrix'; draw();
        mx = el('canvas', 'cmd-mx');
        mx.width = root.clientWidth; mx.height = root.clientHeight;
        mx.style.top = root.scrollTop + 'px';
        root.appendChild(mx);
        const g = mx.getContext('2d'), fz = 16, cols = Math.max(1, Math.floor(mx.width / fz)), drops = [];
        for (let i = 0; i < cols; i++) drops.push(Math.floor(Math.random() * -20));
        const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ$#%&*+<>';
        g.font = fz + 'px monospace';
        mxTimer = setInterval(function () {
          g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, mx.width, mx.height);
          g.fillStyle = '#0f0';
          for (let i = 0; i < cols; i++) {
            g.fillText(chars[Math.floor(Math.random() * chars.length)], i * fz, drops[i] * fz);
            if (drops[i] * fz > mx.height && Math.random() > 0.96) drops[i] = 0;
            drops[i]++;
          }
        }, 60);
        later(function () { if (busy === 'matrix') { print('Wake up, Scammer...'); endBusy(); } }, 8000);
      }

      const cmds = {
        help: function () {
          ['Commands:', '  HELP     This list          CLS      Clear screen', '  DIR      List directory     CD       Change directory',
            '  TYPE     Show a text file   MKDIR    Make directory', '  ECHO     Print text         DATE / TIME', '  VER      Version            WHOAMI   Who are you',
            '  TREE     Folder tree        COLOR    (does nothing)', '  EXIT     Close window', '', 'Game commands:',
            '  CASH  HEAT  LEVEL  STATS  LEADS  BANK  DOSSIER <name>  AGENCIES', '  HACK <name>  MATRIX  RICKROLL  SUDO  CREDITS'].forEach(print);
        },
        cls: function () { out.textContent = ''; },
        dir: function (a) {
          const p = resolve(a);
          if (!fs.isDir(p)) { print('File Not Found'); return; }
          print(' Volume in drive C has no label.'); print(' Volume Serial Number is 0666-DEAD'); print('');
          print(' Directory of ' + p); print('');
          const L = fs.list(p); let files = 0, dirs = 0, bytes = 0;
          if (p.length > 3) { print('03/14/2007  09:26 AM    <DIR>          .'); print('03/14/2007  09:26 AM    <DIR>          ..'); dirs += 2; }
          L.forEach(function (it) {
            if (it.type === 'dir') { dirs++; print('03/14/2007  09:26 AM    <DIR>          ' + it.name); }
            else { const n = (fs.read(it.path) || '').length; files++; bytes += n; print('03/14/2007  09:26 AM    ' + pad(n, 14) + ' ' + it.name); }
          });
          print(pad(files, 16) + ' File(s) ' + pad(bytes, 14) + ' bytes');
          print(pad(dirs, 16) + ' Dir(s)  ' + pad('13,370,000,000', 14) + ' bytes free');
        },
        cd: function (a) {
          if (!a) { print(cwd); return; }
          const p = resolve(a);
          if (!fs.isDir(p)) { print('The system cannot find the path specified.'); return; }
          cwd = fs.norm(p);
        },
        type: function (a) {
          if (!a) { print('The syntax of the command is incorrect.'); return; }
          const t = fs.read(resolve(a));
          if (t == null) print('The system cannot find the file specified.'); else print(t.replace(/\r/g, ''));
        },
        mkdir: function (a) {
          if (!a) { print('The syntax of the command is incorrect.'); return; }
          const p = resolve(a);
          if (fs.exists(p)) print('A subdirectory or file ' + a + ' already exists.');
          else if (!fs.mkdir(p)) print('The system cannot find the path specified.');
        },
        echo: function (a) { print(a || 'ECHO is on.'); },
        date: function () { print('The current date is: ' + new Date().toDateString()); },
        time: function () { print('The current time is: ' + new Date().toLocaleTimeString()); },
        ver: function () { print(''); print('SCAM OS [Version 6.6.6]'); },
        whoami: function () { print('scammer'); },
        tree: function () { print('Folder PATH listing'); print(cwd); tree(cwd, '', 0, { n: 0 }); },
        color: function () { },
        exit: function () { w.close(); },
        cash: function () { const d = SO.save && SO.save.d || {}; print('Cash: $' + (d.cash || 0)); },
        heat: function () { const d = SO.save && SO.save.d || {}; print('Heat: ' + (d.heat || 0) + (d.heat > 70 ? '  (they are coming)' : '')); },
        level: function () { let l = '?'; try { if (SO.game && SO.game.level) l = SO.game.level(); } catch (e) { } print('Level: ' + l); },
        stats: function () {
          const d = SO.save && SO.save.d || {}; let l = '?';
          try { if (SO.game && SO.game.level) l = SO.game.level(); } catch (e) { }
          print('--- STATS ---'); print('Level: ' + l); print('Cash:  $' + (d.cash || 0)); print('XP:    ' + (d.xp || 0)); print('Heat:  ' + (d.heat || 0));
          if (d.stats && typeof d.stats === 'object') Object.keys(d.stats).forEach(function (k) { if (typeof d.stats[k] !== 'object') print(k + ': ' + d.stats[k]); });
        },
        leads: function () {
          const L = SO.save && SO.save.d && SO.save.d.leads;
          if (!Array.isArray(L) || !L.length) { print('No leads. Go find some victims... er, customers. (Parody!)'); return; }
          L.forEach(function (l, i) { print((i + 1) + '. ' + (l.name || '???') + (l.age != null ? ', ' + l.age : '') + (l.job ? ' - ' + l.job : '')); });
        },
        agencies: function () {
          const d = SO.save && SO.save.d; const I = d && d.ids;
          if (!Array.isArray(I) || !I.length) { print('No forged IDs in the album. Use the ID Forge app to make some (not real ones, obviously).'); return; }
          I.forEach(function (i, n) { print((n + 1) + '. ' + (i.name || '?') + ' - ' + (i.title || '?') + ', ' + (i.org || '?') + ' [badge ' + (i.badge || '-') + ']'); });
        },
        bank: function () {
          const d = SO.save && SO.save.d; const B = d && d.banks;
          const ids = B ? Object.keys(B) : [];
          if (!ids.length) { print('No bank accounts on file. Capture an online-banking login payload on a call, then the portal appears.'); return; }
          print('Bank profiles on file (all fictional):');
          ids.forEach(function (id) {
            const b = B[id]; const lead = (d.leads || []).find(l => l.id === id) || (d.pastLeads || {})[id];
            print(' - www.' + b.slug + '.com  ' + (lead ? lead.name : id) + '  checking ' + (b.checking || 0) + ' / savings ' + (b.savings || 0) + '  flags ' + (b.flags || 0) + (b.locked ? ' [LOCKED]' : ''));
          });
        },
        dossier: function (a) {
          const d = SO.save && SO.save.d; const seen = {};
          (d.loot || []).forEach(function (l) { if (l.type === 'info' && l.details) seen[l.details.leadId] = l.details; });
          const ks = Object.keys(seen);
          if (!ks.length) { print('No stolen dossiers yet. Ask victims for personal info, or pay $80 for a records pull.'); return; }
          if (a) {
            const s = seen.find ? null : ks.map(k => seen[k]).find(x => (x.name || '').toLowerCase() === String(a).toLowerCase());
            if (!s) { print('No dossier for a person named "' + a + '".'); return; }
            ['name', 'dob', 'address', 'phone', 'email', 'employer', 'ssn4', 'maiden', 'firstPet', 'firstCar', 'firstStreet', 'bankUser', 'bankPass'].forEach(function (f) { if (s[f] != null) print('  ' + f + ': ' + s[f]); });
            return;
          }
          print('Dossiers on file: ' + ks.length + '. Use DOSSIER <full name> to print one.');
          ks.forEach(function (k) { print(' - ' + (seen[k].name || k)); });
        },
        hack: hack,
        matrix: matrix,
        rickroll: function () { print('Never gonna give you up,'); print('Never gonna let you down,'); print('Never gonna run around and... wait, you are in the wrong tab.'); print('(This is a text-only rickroll. You have been gently rolled.)'); },
        sudo: function () { print('scammer is not in the sudoers file. This incident will be reported to... nobody. There is no Linux here.'); },
        credits: function () { print('SCAM OS - a parody. Any resemblance to real operating systems is purely satirical.'); print('Made with questionable ethics (fictional) and pixels.'); print('Remember: real scams hurt real people. Hang up, report, protect others.'); }
      };

      function run(raw) {
        const t = raw.trim();
        if (!t) return;
        const m = t.match(/^(\S+?)(?:\s+(.*))?$/);
        let c = m[1].toLowerCase(), a = (m[2] || '').trim();
        const mm = c.match(/^(cd|dir)(\.\.|\\)$/);
        if (mm) { c = mm[1]; a = mm[2] + a; }
        if (c === 'md') c = 'mkdir';
        if (c === 'cls') c = 'cls';
        if (c.length === 2 && c[1] === ':' ) { if (fs.isDir(c + '\\')) cwd = c.toUpperCase() + '\\'; else print('The system cannot find the drive specified.'); return; }
        if (Object.prototype.hasOwnProperty.call(cmds, c)) { try { cmds[c](a); } catch (e) { print('Error: ' + e.message); } }
        else print("'" + m[1] + "' is not recognized as an internal or external command,\noperable program or batch file.");
      }

      root.addEventListener('keydown', function (e) {
        if (busy) {
          e.preventDefault();
          if (busy === 'matrix' || (e.ctrlKey && (e.key === 'c' || e.key === 'C'))) { if (busy === 'hack') print('^C'); endBusy(); }
          return;
        }
        if (e.ctrlKey && !e.altKey) {
          if (e.key === 'c' || e.key === 'C') { e.preventDefault(); print(prompt() + buf + '^C'); buf = ''; pos = 0; draw(); }
          if (e.key !== 'v' && e.key !== 'V') return;
          return;
        }
        let h = true;
        switch (e.key) {
          case 'Enter': print(prompt() + buf); if (buf.trim()) { hist.push(buf); } hi = hist.length; { const r = buf; buf = ''; pos = 0; run(r); } break;
          case 'Backspace': if (pos > 0) { buf = buf.slice(0, pos - 1) + buf.slice(pos); pos--; } break;
          case 'Delete': buf = buf.slice(0, pos) + buf.slice(pos + 1); break;
          case 'ArrowLeft': if (pos > 0) pos--; break;
          case 'ArrowRight': if (pos < buf.length) pos++; break;
          case 'Home': pos = 0; break;
          case 'End': pos = buf.length; break;
          case 'ArrowUp': if (hi > 0) { hi--; buf = hist[hi]; pos = buf.length; } break;
          case 'ArrowDown': if (hi < hist.length - 1) { hi++; buf = hist[hi]; } else { hi = hist.length; buf = ''; } pos = buf.length; break;
          case 'Escape': buf = ''; pos = 0; break;
          default:
            if (e.key.length === 1 && !e.altKey && !e.metaKey) { buf = buf.slice(0, pos) + e.key + buf.slice(pos); pos++; }
            else h = false;
        }
        if (h) e.preventDefault();
        draw();
      });
      root.addEventListener('paste', function (e) {
        if (busy) return;
        e.preventDefault();
        const t = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/[\r\n]+/g, ' ');
        buf = buf.slice(0, pos) + t + buf.slice(pos); pos += t.length; draw();
      });
      root.addEventListener('mousedown', function () { setTimeout(function () { root.focus(); }, 0); });

      print('SCAM OS [Version 6.6.6]');
      print('(C) Copyright 1985-2001 Totally Fictional Corp. Parody - nothing here is real.');
      print('');
      draw();
      setTimeout(function () { try { root.focus(); } catch (e) { } }, 30);
      return w;
    } catch (err) { console.error('cmd', err); }
  }

  SO.registerApp({ id: 'cmd', name: 'Command Prompt', icon: 'cmd', desktop: true, start: true, order: 50, open: open });
})();
