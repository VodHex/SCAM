/* SCAM OS - Modern Workstation Shell: boot, login, desktop, launcher, system tray, notifications, dialogs, wallpapers, draggable icons. */
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
    b.innerHTML = '<span class="x">&times;</span><b>' + SO.iconImg(icon || 'info', 18) + esc(title) + '</b><div class="selectable" style="color:#cbd5e1">' + esc(text || '') + '</div>';
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
    d.textContent = 'KERNEL PANIC — SYSTEM HALTED\n\n' +
      (text || 'EXCEPTION_IN_SIMULATION_KERNEL') + '\n\n' +
      '(Simulation diagnostics screen. Click anywhere to dismiss.)\n\n' +
      '*** STATUS: 0x000000SC (0x0000DEAD, 0xBADC0DE5, 0x00000000, 0x00000000)';
    const kill = () => d.remove();
    d.onclick = kill;
    $('screen').appendChild(d);
    SO.audio.play('error');
    if (ms) setTimeout(kill, ms);
  };

  /* ---------- High-Resolution Procedural Wallpapers ---------- */
  const WP = [
    ['Midnight Slate', '#0f172a', '#1e3a8a', '#090d16'],
    ['Cyber Matrix', '#064e3b', '#0f172a', '#022c22'],
    ['Executive Obsidian', '#18181b', '#27272a', '#09090b'],
    ['Nordic Indigo', '#1e1b4b', '#312e81', '#0f172a'],
    ['Emerald Ops', '#0f766e', '#115e59', '#042f2e'],
    ['Crimson Alert', '#450a0a', '#7f1d1d', '#090d16'],
    ['Royal Amethyst', '#3b0764', '#4c1d95', '#0f172a']
  ];
  SO.wallpaperNames = WP.map(w => w[0]);
  function drawWallpaper() {
    const i = Math.min(WP.length - 1, Math.max(0, SO.save.d.settings.wallpaper || 0));
    const c = $('wallpaper');
    if (!c) return;
    const w = Math.max(640, window.innerWidth || 1280);
    const h = Math.max(480, window.innerHeight || 800);
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, WP[i][1]);
    g.addColorStop(0.55, WP[i][2]);
    g.addColorStop(1, WP[i][3]);
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);

    // Subtle geometric grid overlay for modern workstation look
    x.strokeStyle = 'rgba(255,255,255,0.03)';
    x.lineWidth = 1;
    const step = 48;
    for (let px = 0; px < w; px += step) {
      x.beginPath(); x.moveTo(px, 0); x.lineTo(px, h); x.stroke();
    }
    for (let py = 0; py < h; py += step) {
      x.beginPath(); x.moveTo(0, py); x.lineTo(w, py); x.stroke();
    }
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
    const box = $('icons'); if (!box) return;
    box.innerHTML = '';
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
      el.oncontextmenu = e => {
        e.preventDefault(); e.stopPropagation(); selIcon = a.id; markSel();
        SO.xpmenu && SO.xpmenu.pop([
          { label: 'Launch ' + a.name, fn: () => SO.openApp(a.id) },
          { sep: true },
          { label: 'Application Info', fn: () => SO.msgbox({ title: a.name, text: a.name + '\nSCAM OS Enterprise Workstation Module.\n(Educational simulation: all systems are fictional.)', icon: 'info' }) }
        ], e.clientX, e.clientY);
      };
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

  /* ---------- App Launcher (Start Menu) ---------- */
  const PLACES = ['computer', 'mail', 'wallet', 'idforge', 'shop', 'awareness', 'taskmgr', 'cmd', 'settings'];
  function buildStart() {
    const m = $('startmenu');
    const left = Object.values(apps).filter(a => a.start).sort((p, q) => (p.order || 99) - (q.order || 99));
    m.innerHTML = '<div class="sm-head">' + SO.avatar('operator_main', 38) + '<div><div>Operator Workstation</div><div style="font-size:11.5px;color:#94a3b8;font-weight:400">Level ' + (SO.game ? SO.game.level() : 1) + ' &bull; Active Session</div></div></div>' +
      '<div class="sm-body"><div class="sm-l scroll"></div><div class="sm-r"></div></div>' +
      '<div class="sm-foot"><button data-a="logoff">' + SO.iconImg('user', 16) + 'Lock Session</button><button data-a="off">' + SO.iconImg('skull', 16) + 'Power</button></div>';
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
    dim.innerHTML = '<div class="dlg" style="min-width:min(380px,92vw)"><div class="tb"><span class="tb-title">System Power</span></div><div class="dbody" style="justify-content:space-around;padding:24px;flex-wrap:wrap"></div><div class="dfoot"><button class="xp-btn">Cancel</button></div></div>';
    const body = dim.querySelector('.dbody');
    [['Stand By', 'info', () => { dim.remove(); standby(); }],
     ['Power Off', 'skull', () => { dim.remove(); powerOff(); }],
     ['Reboot', 'warn', () => { dim.remove(); SO.os.restart(false); }]].forEach(([l, ic, fn]) => {
      const b = document.createElement('div'); b.style.cssText = 'text-align:center;cursor:pointer;width:96px;padding:10px;border-radius:8px;border:1px solid #e2e8f0';
      b.innerHTML = '<img src="' + SO.icon(ic) + '" style="width:42px;height:42px;margin-bottom:6px"><div style="font-weight:600;font-size:12.5px">' + l + '</div>'; b.onclick = fn; body.appendChild(b);
    });
    dim.querySelector('.xp-btn').onclick = () => dim.remove();
    $('overlay').appendChild(dim);
  }
  function standby() {
    SO.save.save(); SO.game && SO.game.stop();
    const s = document.createElement('div');
    s.style.cssText = 'position:absolute;inset:0;background:#090d16;z-index:99970;cursor:pointer;';
    s.innerHTML = '<div style="position:absolute;bottom:32px;left:0;right:0;text-align:center;color:#64748b;font-size:13px">Workstation in Standby &mdash; click or press any key to wake</div>';
    $('screen').appendChild(s);
    const wake = () => { s.remove(); document.removeEventListener('keydown', wake, true); SO.audio.play('ding'); if (SO.game) SO.game.start(); };
    s.addEventListener('pointerdown', wake, true);
    document.addEventListener('keydown', wake, true);
  }
  function powerOff() {
    SO.save.save(); SO.game && SO.game.stop();
    SO.wm.closeAll();
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;inset:0;background:#090d16;z-index:99990;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;color:#f8fafc;font-size:22px;font-weight:700;text-align:center';
    d.innerHTML = 'Workstation Powered Off<br><span style="font-size:13px;font-weight:400;color:#64748b">(Simulation environment. Nothing here is real.)</span><button class="xp-btn blue">Power On</button>';
    d.querySelector('button').onclick = () => { d.remove(); SO.os.restart(false); };
    $('screen').appendChild(d);
  }

  /* ---------- System Tray ---------- */
  function clock() {
    const d = new Date();
    let h = d.getHours();
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap;
  }
  function renderTray() {
    const t = $('tray'); if (!t) return;
    const d = SO.save.d, q = SO.game ? SO.game.quota() : 200;
    const shift = 'Shift: ' + d.callsToday + ' call(s), ' + (SO.game ? SO.game.fmt(d.earnedToday) : '$0') + ' banked / quota ' + (SO.game ? SO.game.fmt(q) : '$200');
    const inc = SO.game && SO.game.pendingIncoming ? SO.game.pendingIncoming : null;
    const incHtml = inc
      ? '<div class="t tray-ringing" id="trayinc" title="Inbound Line Ringing: ' + esc(inc.lead.name) + ' (' + esc(inc.lead.phone || '555-0000') + ') — Click to open Softphone">' + SO.iconImg('phone', 14) + ' LINE RINGING</div>'
      : '';
    t.innerHTML =
      incHtml +
      '<div class="t" title="Police Heat: ' + Math.round(d.heat) + '%. 100% triggers a raid!"><span style="font-size:11px;font-weight:700;color:#94a3b8">HEAT</span><div class="heat"><i style="width:' + Math.min(100, d.heat) + '%"></i></div><span class="mono" style="font-size:11.5px">' + Math.round(d.heat) + '%</span></div>' +
      '<div class="t mono" title="Available Cash">' + SO.iconImg('cash', 15) + '$' + Math.floor(d.cash).toLocaleString() + '</div>' +
      '<div class="t" id="trayshift" title="' + shift + ' — Click to manually clock out &amp; end shift" style="cursor:pointer;padding:2px 8px;border-radius:5px;background:rgba(255,255,255,0.08)">End Shift</div>' +
      '<div class="t" id="trayvol" title="' + (d.settings.muted ? 'Sound muted. Click to unmute' : 'Click to mute sound') + '" style="cursor:pointer">' + SO.iconImg(d.settings.muted ? 'speakeroff' : 'speaker', 16) + '</div>' +
      '<div class="t" style="color:#94a3b8">Day ' + d.day + '</div>' +
      '<div class="t mono">' + clock() + '</div>';

    const ti = t.querySelector('#trayinc');
    if (ti) ti.onclick = () => SO.openApp('phone');
    t.querySelector('#trayvol').onclick = () => { SO.audio.toggleMute(); renderTray(); };
    const sh = t.querySelector('#trayshift');
    if (sh) sh.onclick = async () => {
      const d2 = SO.save.d;
      const met = d2.earnedToday >= q;
      const r = await SO.msgbox({
        title: 'End Shift & Close Day?', icon: 'info',
        text: 'Banked today: ' + SO.game.fmt(d2.earnedToday) + ' (Daily Quota: ' + SO.game.fmt(q) + ')\n\n' +
          (met ? 'Quota MET: +$100 bonus and -5% Heat.' : 'Quota MISSED: +6% Heat penalty.') +
          '\n\nUnused one-time SMS codes and pending step-up sessions expire overnight.',
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
    b.innerHTML = '<div class="logo">SCAM OS<small>ENTERPRISE WORKSTATION v4.0</small></div><div class="bar"><i></i><i></i><i></i></div><div class="msg"></div><div class="skip">Skip boot <b class="arr">&rarr;</b></div>';
    const msgs = [
      'Mounting encrypted filesystem...',
      'Initializing SIP VoIP softphone trunk...',
      'Loading FastPay ISO-8583 POS gateway...',
      'Connecting OSINT public records index...',
      'Starting RemoteDesk session multiplexer...',
      'Workstation ready.'
    ];
    let i = 0; const m = b.querySelector('.msg');
    const iv = setInterval(() => { m.textContent = msgs[i++ % msgs.length]; }, 380);
    let done = false;
    const go = () => { if (done) return; done = true; clearInterval(iv); clearTimeout(to); b.classList.add('hidden'); SO.audio.play('boot'); login(); };
    const to = setTimeout(go, 2400);
    b.onclick = go;
  }
  function login() {
    const l = $('login'); l.classList.remove('hidden');
    l.innerHTML = '<div class="top"></div><div class="mid"><div class="brand">SCAM OS<small>Operations Workstation</small><div class="note">Select your operator profile to begin your shift. Educational simulation: every character, bank, and credential is fictional.</div></div><div class="users"><div class="user">' + SO.avatar('operator_main', 58) + '<div><b>Operator #01</b><span>Click to unlock workstation</span></div></div></div></div><div class="bot"><span>Manual simulation mode: dial numbers, key in credentials, and verify transfers manually.</span><span>SCAM OS Enterprise v4.0</span></div>';
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
    if (!clockIv) clockIv = setInterval(renderTray, 4000);
  }
  let clockIv = null;

  SO.os = {
    ready: false,
    boot, renderIcons, renderTray,
    refreshIcons() { renderIcons(); renderTray(); },
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
    window.addEventListener('resize', () => { if (SO.os.ready) { drawWallpaper(); renderIcons(); } });
    $('desktop').addEventListener('contextmenu', e => {
      if (e.target.closest('.win') || e.target.closest('.dicon')) return;
      e.preventDefault();
      SO.xpmenu && SO.xpmenu.pop([
        { label: 'Refresh Workspace', fn: () => renderIcons() },
        { label: 'Cycle Wallpaper Theme', fn: () => SO.setWallpaper(((SO.save.d.settings.wallpaper || 0) + 1) % WP.length) },
        { label: 'Reset Icon Grid', fn: () => SO.os.resetIcons() },
        { sep: true },
        { label: 'Open Softphone', fn: () => SO.openApp('phone') },
        { label: 'Open Victim Database (CRM)', fn: () => SO.openApp('crm') },
        { label: 'Workstation Settings', fn: () => SO.openApp('settings') }
      ], e.clientX, e.clientY);
    });
    window.addEventListener('beforeunload', () => SO.save.save());
  });
})();
