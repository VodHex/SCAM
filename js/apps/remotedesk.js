/* SCAM OS - RemoteDesk: Interactive Remote PC Access & Support Tool.
   Simulated parody app: every captured victim connection grants ONE exploit -
   a capped bank-transfer window, a crypto-miner install, or a lock-screen scare.
   Sessions burn after use (G.remoteAction). Requires the Fake Remote-Access App.
   The session console starts EMPTY and fills only with what the operator does;
   each connected session renders that victim's own machine (files, bank, latency). */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);
  const G = () => SO.game;
  const D = () => SO.save.d;

  /* File pool for the fake remote desktop - a "seed" picks 3-4 per session. */
  const FILE_POOL = [
    ['notepad', 'Passwords.txt'], ['notepad', 'budget_2025.xlsx'], ['notepad', 'resume.docx'],
    ['folder', 'My Documents'], ['folder', 'Photos'], ['folder', 'Downloads'],
    ['file', 'invoice_scan.pdf'], ['file', 'tax_2024.pdf'], ['file', 'InsuranceForms.zip'],
    ['file', 'unpaid_bills.txt'], ['ie', 'internet.lnk'], ['user', 'user-manual.pdf']
  ];
  const seed = s => { let h = 9; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

  function open(args) {
    args = args || {};
    let unsub = null;
    const w = SO.wm.open({
      id: 'remotedesk', title: 'RemoteDesk 4.1 - Client Control', icon: 'remotedesk',
      w: 640, h: 580, minW: 480, minH: 440, onClose: () => { if (unsub) { unsub(); unsub = null; } }
    });
    if (!w.fresh) return w;

    const body = w.body;
    let targetId = null, shownTarget = null, connected = false, busy = false, meta = null;

    function sessions() {
      const own = G().owns('t_remote');
      if (!own) return [];
      return (D().loot || []).filter(l => l.type === 'remote' && !l.used).map(l => ({
        loot: l,
        live: !!(SO.activeCall && SO.activeCall.isActive() && (SO.activeCall.call.loots || []).some(x => x.id === l.id))
      }));
    }

    /* Switching to a different session starts a FRESH connection: no leftovers. */
    function ensureTarget() {
      const list = sessions();
      const it = list.find(s => s.loot.id === targetId) || null;   // nothing auto-picked: the operator chooses a session
      targetId = it ? it.loot.id : null;
      if (targetId !== shownTarget) {   // new session -> clean slate
        shownTarget = targetId;
        connected = false;
        meta = it ? makeMeta(it.loot) : null;
      }
      return it;
    }

    /* Per-session dynamic descriptors (bank, latency, files, clock) - the "PC" the operator lands on. */
    function makeMeta(l) {
      /* unsigned LCG keyed by session id: keeps picks deterministic and always in 0..11
         (a signed >> on a >=2^31 seed wrapped negative and served FILE_POOL[-x] = undefined) */
      let h = seed(l.id + ((l.details || {}).ip || '')) >>> 0 || 1;
      const n = 3 + (h % 2);
      const files = [];
      for (let i = 0; i < n; i++) { h = (h * 1103515245 + 12345) >>> 0; files.push(FILE_POOL[h % FILE_POOL.length]); }
      return {
        latency: 23 + (h % 70),
        files: files,
        clock: (() => { const d = new Date(); let hh = d.getHours() % 12 || 12; return hh + ':' + String(d.getMinutes()).padStart(2, '0') + (d.getHours() >= 12 ? ' PM' : ' AM'); })()
      };
    }

    function render() {
      const own = G().owns('t_remote');
      if (!own) {
        const app = SO.data.SHOP.find(i => i.id === 't_remote') || { name: 'Fake Remote-Access App', price: 400, level: 1 };
        const lvl = G().level();
        const lockedNow = lvl < (app.level || 1);
        const canBuy = !lockedNow && SO.save.d.cash >= (app.price || 0);
        body.innerHTML =
          '<div class="col grow pad" style="align-items:center;justify-content:center;text-align:center;gap:12px">' +
          SO.iconImg('remotedesk', 56) +
          '<h2 style="margin:0;font-size:26px;color:#990000">RemoteDesk Enterprise - Unlicensed</h2>' +
          '<div class="card" style="max-width:430px;padding:10px 14px;font-size:19px;text-align:left">' +
          'License: <b>' + esc(app.name) + '</b> - $' + (app.price || 0) + ' (ScamMart)' +
          (lockedNow ? '<div class="bad" style="margin-top:8px"><b>Requires Level ' + app.level + '</b></div>' : '') +
          '</div>' +
          '<button class="xp-btn green" id="rd-shop" style="font-size:20px;padding:6px 20px">Open ScamMart</button>' +
          '</div>';
        body.querySelector('#rd-shop').onclick = () => SO.openApp('shop', canBuy ? { itemId: 't_remote' } : {});
        if (!unsub) unsub = G().sub(render);   // hop to the session list the moment the license installs
        return;
      }
      if (unsub) { unsub(); unsub = null; }

      const it = ensureTarget();
      const list = sessions();

      if (!connected || !it) {
        body.innerHTML =
          '<div class="col grow pad" style="background:#e8e4d8;gap:8px;font-family:var(--px)">' +
          '<div style="background:linear-gradient(#1c3f94,#0b2a73);color:#fff;padding:5px 10px;display:flex;justify-content:space-between;align-items:center">' +
          '<span style="font-size:18px;font-weight:bold">' + SO.iconImg('remotedesk', 18) + ' RemoteDesk Session Controller</span>' +
          '<span style="font-size:15px;background:#2fa84f;color:#fff;padding:1px 6px">READY</span>' +
          '</div>' +
          '<div class="card col" style="padding:10px;gap:8px">' +
          '<b style="font-size:19px">Available sessions (' + list.length + ')</b>' +
          (list.length
            ? '<select class="xp-input" id="rd-target">' +
              (list.some(s => s.loot.id === targetId) ? '' : '<option value="">- select a session -</option>') +
              list.map(s =>
                '<option value="' + s.loot.id + '"' + (s.loot.id === targetId ? ' selected' : '') + '>' +
                esc(s.loot.from) + (s.live ? ' [LIVE CALL]' : '') + ' - ' + esc((s.loot.details && s.loot.details.bank) || 'unknown bank') + '</option>').join('') + '</select>'
            : '<div class="muted">No sessions available.</div>') +
          (list.length ? '<button class="xp-btn green grow" id="rd-connect" style="font-size:22px;padding:6px"' + (targetId ? '' : ' disabled') + '>' + (busy ? 'Connecting...' : 'Connect to desktop') + '</button>' : '') +
          '</div>' +
          '<div id="rd-log" style="background:#000;color:#00ff44;border:1px solid #7f9db9;padding:8px;flex:1;min-height:90px;font-family:monospace;font-size:16px;overflow-y:auto"></div>' +
          '</div>';

        const q = s => body.querySelector(s);
        const sel = q('#rd-target');
        if (sel) sel.onchange = e => { targetId = e.target.value; ensureTarget(); render(); };
        if (q('#rd-connect')) {
          q('#rd-connect').onclick = async () => {
            if (busy || !it) return;
            busy = true;
            q('#rd-connect').disabled = true;
            const log = q('#rd-log');
            const line = t => { log.innerHTML += '<div>&gt; ' + esc(t) + '</div>'; log.scrollTop = log.scrollHeight; };
            line('Resolving target host ' + ((it.loot.details || {}).ip || 'host') + '...');
            SO.audio.play('click');
            await new Promise(r => setTimeout(r, 550));
            line('Sending RemoteDesk authorization handshake...');
            SO.audio.play('blip');
            await new Promise(r => setTimeout(r, 650));
            line('Handshake acknowledged! Stream decrypted.');
            SO.audio.play('win');
            await new Promise(r => setTimeout(r, 550));
            busy = false;
            connected = true;
            render();
          };
        }
        return;
      }

      // CONNECTED VIEW: that victim's actual (simulated) desktop with ONE pending action
      const c = it.loot, det = c.details || {};
      const limit = det.limit || 800;
      const m = meta || makeMeta(c);
      body.innerHTML =
        '<div class="col grow" style="background:#004e98;position:relative;overflow:hidden;font-family:var(--px)">' +
        '<div style="background:#0a246a;color:#fff;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000">' +
        '<span style="font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + SO.iconImg('computer', 16) + ' Remote Screen: ' + esc(c.from) + '\'s PC [Connected]</span>' +
        '<button class="xp-btn small red" id="rd-disc" style="padding:2px 8px">Disconnect</button>' +
        '</div>' +

        '<div class="grow" style="background:linear-gradient(135deg,#1f5fbf 0%,#3a8ae0 50%,#4a9ff5 100%);padding:10px;position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center">' +
        '<div style="position:absolute;top:10px;left:10px;display:flex;flex-direction:column;gap:12px;color:#fff;text-align:center;font-size:14px;text-shadow:1px 1px 2px #000">' +
        m.files.map(f => '<div>' + SO.iconImg(f[0], 32) + '<div>' + esc(f[1]) + '</div></div>').join('') +
        '</div>' +

        '<div class="card col" style="background:#fff;width:92%;max-width:440px;box-shadow:4px 4px 12px rgba(0,0,0,0.5);border:1px solid #0a246a;padding:0;overflow:hidden">' +
        '<div style="background:#2a6bff;color:#fff;padding:4px 8px;font-size:16px;display:flex;justify-content:space-between">' +
        '<span>' + esc(det.bank || 'Bank') + ' - Online Portal</span><span>Authenticated</span>' +
        '</div>' +
        '<div class="col" style="padding:10px;gap:8px">' +
        '<div class="row" style="justify-content:space-between;border-bottom:1px solid #ccc;padding-bottom:4px">' +
        '<div><b>Account:</b> ' + esc(c.from) + '<br><span style="font-size:15px;color:#666">Checking (...' + esc(String(det.ip || '').slice(-4) || '8921') + ')</span></div>' +
        '<div style="text-align:right"><span style="font-size:14px;color:#666">Transfer window:</span><br><b style="font-size:22px;color:#2fa84f">$' + limit.toLocaleString() + '</b></div>' +
        '</div>' +
        '<div style="font-size:16px;font-weight:bold;color:#003399">Technician Actions</div>' +
        '<div class="row" style="gap:6px">' +
        '<input class="xp-input" id="rd-amt" inputmode="numeric" placeholder="$0" style="width:96px">' +
        '<button class="xp-btn green grow" id="rd-drain" style="font-size:17px;padding:6px">BANK TRANSFER (to Vault)</button>' +
        '</div>' +
        '<div class="row" style="gap:6px">' +
        '<button class="xp-btn grow" id="rd-miner" style="font-size:16px;padding:4px">Install Miner (bots)</button>' +
        '<button class="xp-btn red grow" id="rd-lock" style="font-size:16px;padding:4px">Lock Screen ($' + Math.round(Math.max(150, Math.min(500, limit * 0.3))).toLocaleString() + ')</button>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<div style="position:absolute;bottom:32px;background:rgba(0,0,0,0.68);color:#fff;padding:3px 10px;font-size:14px">' +
        'Controlling: ' + esc(c.from) + ' &bull; ' + m.latency + 'ms</div>' +

        '<div style="position:absolute;bottom:0;left:0;right:0;height:28px;background:#245edb;border-top:2px solid #4a8ff5;display:flex;align-items:center;padding:0 4px;justify-content:space-between">' +
        '<div class="row" style="gap:4px"><button class="xp-btn small" style="background:#388e3c;color:#fff;font-weight:bold;border-color:#2e7d32">start</button>' +
        '<span style="background:#1b44a4;color:#fff;padding:2px 8px;font-size:14px;border:1px solid #102e7a">' + esc(det.bank || 'Bank portal') + '</span></div>' +
        '<span style="color:#fff;font-size:14px;padding-right:6px">' + esc(m.clock) + '</span>' +
        '</div>' +
        '</div>' +
        '</div>';

      const q = s => body.querySelector(s);
      q('#rd-disc').onclick = () => { connected = false; render(); };

      const act = async (kind, amount) => {
        if (busy) return;
        busy = true;
        const btns = ['#rd-drain', '#rd-miner', '#rd-lock'].map(s => q(s));
        btns.forEach(b => { if (b) b.disabled = true; });
        SO.audio.play('click');
        await new Promise(r => setTimeout(r, 600));
        connected = false;   // every action consumes the live screen; reconnect view shows fresh state
        const r = G().remoteAction(c.id, kind, amount);
        if (r.ok) {
          SO.audio.play('cash');
          SO.notify('Remote action done', r.msg, 'cash', { sound: 'cash' });
        } else {
          SO.audio.play('error');
          SO.notify('Remote action failed', r.msg, 'error', { sound: 'error' });
        }
        busy = false;
        targetId = null; shownTarget = null;   // back to the list, clean next choice
        render();
      };
      q('#rd-drain').onclick = () => act('transfer', Math.round(Number(q('#rd-amt').value) || 0));
      q('#rd-miner').onclick = () => act('bot');
      q('#rd-lock').onclick = () => act('ransom');
    }

    render();
    return w;
  }

  SO.registerApp({
    id: 'remotedesk', name: 'RemoteDesk', icon: 'remotedesk',
    desktop: true, start: true, order: 3, open
  });
})();
