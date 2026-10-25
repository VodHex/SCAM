/* SCAM OS - shell: boot, login, desktop, start menu, tray, notifications, dialogs, wallpapers, draggable icons. */
(function () {
  const SO = window.SO;
  const apps = {};
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  SO.esc = esc;

  SO.registerApp = function (a) { apps[a.id] = a; if (SO.os && SO.os.ready) SO.os.renderIcons(); };
  SO.apps = apps;
  SO.openApp = function (id, args) {
    const a = apps[id];
    if (!a) { console.warn('No such app', id); return null; }
    SO.audio.play('click');
    closeStart();
    try { return a.open(args || {}); } catch (e) { console.error('App failed:', id, e); SO.notify('Application Error', a.name + ' crashed: ' + e.message, 'error'); }
  };

  /* ---------- dialogs ---------- */
  SO.msgbox = function (o) {
    return new Promise(res => {
      const buttons = o.buttons || ['OK'];
      const dim = document.createElement('div');
      dim.className = 'dim';
      dim.innerHTML = '<div class="dlg"><div class="tb"><span class="tb-title">' + esc(o.title || 'SCAM OS') + '</span></div>' +
        '<div class="dbody"><img src="' + SO.icon(o.icon === 'error' ? 'error' : o.icon === 'warn' ? 'warn' : 'info') + '"><div class="selectable">' + (o.html || esc(o.text || '')).replace(/\n/g, '<br>') + '</div></div>' +
        '<div class="dfoot"></div></div>';
      const foot = dim.querySelector('.dfoot');
      const done = v => { document.removeEventListener('keydown', kd, true); dim.remove(); res(v); };
      buttons.forEach((b, i) => {
        const bt = document.createElement('button');
        bt.className = 'xp-btn' + (i === 0 ? ' def' : ''); bt.textContent = b; bt.onclick = () => { SO.audio.play('click'); done(b); };
        foot.appendChild(bt);
      });
      const kd = e => { if (e.key === 'Enter') { e.preventDefault(); done(buttons[0]); } else if (e.key === 'Escape') { e.preventDefault(); done(buttons[buttons.length - 1]); } };
      document.addEventListener('keydown', kd, true);
      $('overlay').appendChild(dim);
      if (o.icon === 'error' || o.icon === 'warn') SO.audio.play('error');
      foot.querySelector('button').focus();
    });
  };

  SO.notify = function (title, text, icon, opts) {
    opts = opts || {};
    const b = document.createElement('div');
    b.className = 'balloon';
    b.innerHTML = '<span class="x">x</span><b>' + SO.iconImg(icon || 'info', 16) + esc(title) + '</b><div class="selectable">' + esc(text || '') + '</div>';
    if (opts.actions) {
      const ac = document.createElement('div'); ac.className = 'actions';
      opts.actions.forEach(a => {
        const bt = document.createElement('button'); bt.className = 'xp-btn small'; bt.textContent = a.label;
        bt.onclick = e => { e.stopPropagation(); b.remove(); try { a.fn(); } catch (er) { console.error(er); } };
        ac.appendChild(bt);
      });
      b.appendChild(ac);
    }
    b.onclick = () => { b.remove(); if (opts.onClick) opts.onClick(); };
    $('balloons').appendChild(b);
    while ($('balloons').children.length > 4) $('balloons').firstChild.remove();
    SO.audio.play(opts.sound || 'notify');
    if (opts.timeout !== 0) setTimeout(() => b.remove(), opts.timeout || 6500);
    return b;
  };

  SO.bsod = function (text, ms) {
    const d = document.createElement('div');
    d.className = 'bsod';
    d.textContent = 'A problem has been detected and SCAM OS has been shut down to prevent damage to your computer.\n\n' +
      (text || 'VICTIM_HAS_NOT_PAID_EXCEPTION') + '\n\nIf this is the first time you have seen this stop error screen, restart your computer. If this screen appears again, call 1-800-TOTALLY-LEGIT immediately and have your gift cards ready.\n\n(This is a parody. Nothing here is real. Click anywhere to continue.)\n\n*** STOP: 0x000000SC (0x0000DEAD, 0xBADC0DE5, 0x00000000, 0x00000000)';
    const kill = () => d.remove();
    d.onclick = kill;
    $('screen').appendChild(d);
    SO.audio.play('error');
    if (ms) setTimeout(kill, ms);
  };

  /* ---------- solid-color wallpapers ---------- */
  const WP = [['Luna Blue', '#3a6ea5'], ['Deep Navy', '#0b1a3a'], ['Teal', '#0f5f66'], ['Charcoal', '#23252b'], ['Scam Green', '#1c5a2e'], ['Blood Red', '#6a1620'], ['Purple Haze', '#3b2466']];
  SO.wallpaperNames = WP.map(w => w[0]);
  function drawWallpaper() {
    const i = Math.min(WP.length - 1, Math.max(0, SO.save.d.settings.wallpaper || 0));
    const c = $('wallpaper'); c.width = 1; c.height = 1;
    const x = c.getContext('2d'); x.fillStyle = WP[i][1]; x.fillRect(0, 0, 1, 1);
  }
  SO.setWallpaper = function (i) { SO.save.d.settings.wallpaper = i; SO.save.save(); drawWallpaper(); };

  /* ---------- desktop icons: grid layout, drag & drop with snap ---------- */
  const CW = 104, CH = 92, PAD = 10;
  let selIcon = null, justDragged = false;

  function gridDims() {
    const r = $('desktop').getBoundingClientRect();
    return { cols: Math.max(1, Math.floor((r.width - PAD) / CW)), rows: Math.max(1, Math.floor((r.height - PAD) / CH)) };
  }
  function layoutPositions(list) {
    const d = SO.save.d; d.iconPos = d.iconPos || {};
    const { cols, rows } = gridDims();
    const occ = {};
    list.forEach(a => {
      const p = d.iconPos[a.id];
      if (p && p.c < cols && p.r < rows && !occ[p.c + ',' + p.r]) occ[p.c + ',' + p.r] = a.id; else delete d.iconPos[a.id];
    });
    list.forEach(a => {
      if (d.iconPos[a.id]) return;
      outer: for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (!occ[c + ',' + r]) { occ[c + ',' + r] = a.id; d.iconPos[a.id] = { c, r }; break outer; }
    });
    return { cols, rows, occ };
  }
  function renderIcons() {
    const box = $('icons'); box.innerHTML = '';
    const list = Object.values(apps).filter(a => a.desktop).sort((p, q) => (p.order || 99) - (q.order || 99));
    const d = SO.save.d;
    layoutPositions(list);
    list.forEach(a => {
      const el = document.createElement('div');
      el.className = 'dicon'; el.dataset.id = a.id;
      el.innerHTML = '<img class="ico" src="' + SO.icon(a.icon) + '" alt="" draggable="false"><span>' + esc(a.name) + '</span>';
      const n = a.badge ? a.badge() : 0;
      if (n > 0) el.insertAdjacentHTML('beforeend', '<div class="badge">' + n + '</div>');
      const p = d.iconPos[a.id];
      el.style.left = (PAD + p.c * CW) + 'px'; el.style.top = (PAD + p.r * CH) + 'px';
      el.onclick = e => { e.stopPropagation(); if (justDragged) return; selIcon = a.id; markSel(); };
      el.ondblclick = e => { e.stopPropagation(); SO.openApp(a.id); };
      el.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); selIcon = a.id; markSel(); SO.xpmenu && SO.xpmenu.pop([{ label: 'Open', fn: () => SO.openApp(a.id) }, { sep: true }, { label: 'Properties', fn: () => SO.msgbox({ title: a.name + ' Properties', text: a.name + '\nA totally legitimate program.\n(Parody game: nothing here is real.)', icon: 'info' }) }], e.clientX, e.clientY); };
      el.addEventListener('pointerdown', e => startIconDrag(e, el, a.id));
      box.appendChild(el);
    });
    markSel();
  }
  function startIconDrag(e, el, id) {
    if (e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY, ol = el.offsetLeft, ot = el.offsetTop;
    let dragging = false;
    const mv = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!dragging && Math.hypot(dx, dy) < 6) return;
      if (!dragging) { dragging = true; el.classList.add('drag'); selIcon = id; markSel(); }
      el.style.left = (ol + dx) + 'px'; el.style.top = (ot + dy) + 'px';
    };
    const up = () => {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      if (!dragging) return;
      justDragged = true; setTimeout(() => { justDragged = false; }, 60);
      const d = SO.save.d; d.iconPos = d.iconPos || {};
      const { cols, rows } = gridDims();
      const c = Math.max(0, Math.min(cols - 1, Math.round((el.offsetLeft - PAD) / CW)));
      const r = Math.max(0, Math.min(rows - 1, Math.round((el.offsetTop - PAD) / CH)));
      const old = d.iconPos[id];
      const other = Object.keys(d.iconPos).find(k => k !== id && d.iconPos[k].c === c && d.iconPos[k].r === r);
      if (other && old) d.iconPos[other] = { c: old.c, r: old.r };
      d.iconPos[id] = { c, r };
      SO.save.save(); SO.audio.play('click');
      el.classList.remove('drag');
      renderIcons();
    };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  }
  function markSel() { document.querySelectorAll('.dicon').forEach(d => d.classList.toggle('sel', d.dataset.id === selIcon)); }

  /* ---------- start menu ---------- */
  const PLACES = ['computer', 'mail', 'wallet', 'idforge', 'shop', 'awareness', 'taskmgr', 'cmd', 'settings'];
  function buildStart() {
    const m = $('startmenu');
    const left = Object.values(apps).filter(a => a.start).sort((p, q) => (p.order || 99) - (q.order || 99));
    m.innerHTML = '<div class="sm-head">' + SO.avatar('player', 40) + '<span>Scammer</span></div><div class="sm-body"><div class="sm-l scroll"></div><div class="sm-r"></div></div>' +
      '<div class="sm-foot"><button data-a="logoff">' + SO.iconImg('user', 20) + 'Log Off</button><button data-a="off">' + SO.iconImg('skull', 20) + 'Shut Down</button></div>';
    const L = m.querySelector('.sm-l'), R = m.querySelector('.sm-r');
    const item = a => { const d = document.createElement('div'); d.className = 'sm-it'; d.innerHTML = '<img src="' + SO.icon(a.icon) + '"><span>' + esc(a.name) + '</span>'; d.onclick = () => SO.openApp(a.id); return d; };
    left.forEach(a => L.appendChild(item(a)));
    PLACES.forEach(id => { if (apps[id]) R.appendChild(item(apps[id])); });
    m.querySelector('[data-a=off]').onclick = () => { closeStart(); shutdownDlg(); };
    m.querySelector('[data-a=logoff]').onclick = () => { closeStart(); SO.os.restart(true); };
  }
  function openStart() { buildStart(); $('startmenu').classList.remove('hidden'); $('startbtn').classList.add('on'); SO.audio.play('click'); }
  function closeStart() { $('startmenu').classList.add('hidden'); $('startbtn').classList.remove('on'); }

  function shutdownDlg() {
    const dim = document.createElement('div');
    dim.className = 'dim shutdown';
    dim.innerHTML = '<div class="dlg" style="min-width:min(380px,92vw)"><div class="tb"><span class="tb-title">Turn off computer</span></div><div class="dbody" style="justify-content:space-around;padding:20px;flex-wrap:wrap"></div><div class="dfoot"><button class="xp-btn">Cancel</button></div></div>';
    const body = dim.querySelector('.dbody');
    [['Stand By', 'info', () => { dim.remove(); standby(); }],
     ['Turn Off', 'skull', () => { dim.remove(); powerOff(); }],
     ['Restart', 'warn', () => { dim.remove(); SO.os.restart(false); }]].forEach(([l, ic, fn]) => {
      const b = document.createElement('div'); b.style.cssText = 'text-align:center;cursor:pointer;width:90px';
      b.innerHTML = '<img src="' + SO.icon(ic) + '" style="width:48px;height:48px"><div>' + l + '</div>'; b.onclick = fn; body.appendChild(b);
    });
    dim.querySelector('.xp-btn').onclick = () => dim.remove();
    $('overlay').appendChild(dim);
  }
  function standby() {
    SO.save.save(); SO.game && SO.game.stop();
    const s = document.createElement('div');
    s.style.cssText = 'position:absolute;inset:0;background:#000;z-index:99970;cursor:pointer;';
    s.innerHTML = '<div style="position:absolute;bottom:28px;left:0;right:0;text-align:center;color:#4a4a4a;font-size:16px">SCAM OS is standing by &mdash; click anywhere or press a key to resume</div>';
    $('screen').appendChild(s);
    const wake = () => { s.remove(); document.removeEventListener('keydown', wake, true); SO.audio.play('ding'); if (SO.game) SO.game.start(); };
    s.addEventListener('pointerdown', wake, true);
    document.addEventListener('keydown', wake, true);
  }
  function powerOff() {
    SO.save.save(); SO.game && SO.game.stop();
    SO.wm.closeAll();
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;inset:0;background:#000;z-index:99990;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;color:#ff9a2e;font-size:30px;text-align:center';
    d.innerHTML = 'It is now safe to turn off your computer.<br><span style="font-size:18px;color:#888">(Parody game. Nothing here is real.)</span><button class="xp-btn">Power On</button>';
    d.querySelector('button').onclick = () => { d.remove(); SO.os.restart(false); };
    $('screen').appendChild(d);
  }

  /* ---------- tray ---------- */
  function clock() { const d = new Date(); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap; }
  function renderTray() {
    const t = $('tray'); if (!t) return;
    const d = SO.save.d, q = SO.game.quota();
    const shift = 'Shift: ' + d.callsToday + ' call(s), ' + SO.game.fmt(d.earnedToday) + ' banked / quota ' + SO.game.fmt(q);
    t.innerHTML = '<div class="t" title="Heat: police attention. 100 = raid!">HEAT<div class="heat"><i style="width:' + Math.min(100, d.heat) + '%"></i></div></div>' +
      '<div class="t" title="Cash">' + SO.iconImg('cash', 16) + '$' + Math.floor(d.cash).toLocaleString() + '</div>' +
      '<div class="t" id="trayshift" title="' + shift + ' - click to END THE SHIFT (day closes, codes die, quota is checked)" style="cursor:pointer">End Shift</div>' +
      '<div class="t" id="trayvol" title="' + (d.settings.muted ? 'Sound is muted. Click to unmute' : 'Click to mute all sound') + '" style="cursor:pointer">' + SO.iconImg(d.settings.muted ? 'speakeroff' : 'speaker', 18) + '</div>' +
      '<div class="t">Day ' + d.day + '</div><div class="t">' + clock() + '</div>';
    t.querySelector('#trayvol').onclick = () => { SO.audio.toggleMute(); renderTray(); };
    const sh = t.querySelector('#trayshift');
    if (sh) sh.onclick = async () => {
      const d2 = SO.save.d;
      const met = d2.earnedToday >= q;
      const r = await SO.msgbox({
        title: 'End shift?', icon: 'info',
        text: 'Banked so far: ' + SO.game.fmt(d2.earnedToday) + ' (quota ' + SO.game.fmt(q) + ')\n\n' +
          (met ? 'Quota met! The boss pays a bonus and heat goes down.' : 'Quota MISSED: heat goes up.') +
          '\n\nUnused one-time codes DIE overnight, like real bank codes do.',
        buttons: ['Cancel', 'End shift']
      });
      if (r === 'End shift') SO.game.endDay();
    };
  }
  SO.refreshTray = renderTray;

  /* ---------- boot / login / lifecycle ---------- */
  function boot() {
    const b = $('boot'); b.classList.remove('hidden');
    $('login').classList.add('hidden'); $('desktop').classList.add('hidden'); $('taskbar').classList.add('hidden');
    b.innerHTML = '<div class="logo">SCAM OS<small>PROFESSIONAL EDITION</small></div><div class="bar"><i></i><i></i><i></i></div><div class="msg"></div><div class="skip">click to skip <b class="arr">&rarr;</b></div>';
    const msgs = ['Loading fake drivers...', 'Initializing victim database...', 'Spoofing caller ID...', 'Bribing the firewall...', 'Counting imaginary money...', 'Starting TotallyLegit services...'];
    let i = 0; const m = b.querySelector('.msg');
    const iv = setInterval(() => { m.textContent = msgs[i++ % msgs.length]; }, 420);
    let done = false;
    const go = () => { if (done) return; done = true; clearInterval(iv); clearTimeout(to); b.classList.add('hidden'); SO.audio.play('boot'); login(); };
    const to = setTimeout(go, 2800);
    b.onclick = go;
  }
  function login() {
    const l = $('login'); l.classList.remove('hidden');
    l.innerHTML = '<div class="top"></div><div class="mid"><div class="brand">SCAM OS<small>Call Center Edition</small><div class="note">To begin, click your user name. Parody game: every victim, card and virus is fictional.</div></div><div class="users"><div class="user">' + SO.avatar('player', 64) + '<div><b>Scammer</b><span>Click to log on</span></div></div></div></div><div class="bot"><span>After you log on, you can scam people. (Not really!)</span><span>SCAM OS v6.6.6</span></div>';
    l.querySelector('.user').onclick = () => { l.classList.add('hidden'); desktop(); };
  }
  function desktop() {
    $('desktop').classList.remove('hidden'); $('taskbar').classList.remove('hidden');

    SO.os.ready = true;
    document.body.classList.toggle('noflash', !SO.save.d.settings.flash);
    $('screen').classList.toggle('crt', !!SO.save.d.settings.crt);
    drawWallpaper(); renderIcons(); renderTray();
    SO.audio.play('ding');
    if (SO.game) SO.game.start();
    if (!clockIv) clockIv = setInterval(renderTray, 5000);
  }
  let clockIv = null;

  SO.os = {
    ready: false,
    boot, renderIcons, renderTray,
    refreshIcons() { renderIcons(); },
    resetIcons() { SO.save.d.iconPos = {}; SO.save.save(); renderIcons(); },
    restart(fast) {
      SO.game && SO.game.stop();
      SO.wm.closeAll(); closeStart();
      $('overlay').innerHTML = '';
      if (fast) { login(); $('desktop').classList.add('hidden'); $('taskbar').classList.add('hidden'); } else boot();
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    $('startbtn').onclick = e => { e.stopPropagation(); $('startmenu').classList.contains('hidden') ? openStart() : closeStart(); };
    document.addEventListener('pointerdown', e => {
      if (!e.target.closest('#startmenu') && !e.target.closest('#startbtn')) closeStart();
      if (!e.target.closest('.dicon')) { selIcon = null; markSel(); }
    });
    window.addEventListener('resize', () => { if (SO.os.ready) renderIcons(); });
    $('desktop').addEventListener('contextmenu', e => {
      if (e.target.closest('.win') || e.target.closest('.dicon')) return;
      e.preventDefault();
      SO.xpmenu && SO.xpmenu.pop([
        { label: 'Refresh', fn: () => renderIcons() },
        { label: 'Next Wallpaper Color', fn: () => SO.setWallpaper(((SO.save.d.settings.wallpaper || 0) + 1) % WP.length) },
        { label: 'Reset Icon Positions', fn: () => SO.os.resetIcons() },
        { sep: true },
        { label: 'Open Phone', fn: () => SO.openApp('phone') },
        { label: 'Properties', fn: () => SO.openApp('settings') }
      ], e.clientX, e.clientY);
    });
    window.addEventListener('beforeunload', () => SO.save.save());
  });
})();
