/* Headless UI driver: mocks Groq, boots the OS, opens every app, plays a full call. Results written to #result. */
(function () {
  const out = [], SO = window.SO;
  const log = m => out.push(m);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = s => document.querySelector(s);

  // ---- mock Groq ----
  window.fetch = async function (url, init) {
    const body = init && typeof init.body === 'string' ? JSON.parse(init.body) : {};
    const ok = (o) => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => o, blob: async () => new Blob([new Uint8Array(44)], { type: 'audio/wav' }), text: async () => '' });
    const chat = o => {
      if (body.stream) { // emulate Groq SSE streaming in small chunks
        const txt = JSON.stringify(o); const parts = []; for (let i = 0; i < txt.length; i += 9) parts.push(txt.slice(i, i + 9));
        const sse = parts.map(p => 'data: ' + JSON.stringify({ choices: [{ delta: { content: p } }] }) + '\n\n').join('') + 'data: [DONE]\n\n';
        return new Response(sse, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
      }
      return ok({ choices: [{ message: { content: JSON.stringify(o) } }] });
    };
    if (/audio\/speech/.test(url)) return ok({});
    if (/audio\/transcriptions/.test(url)) return ok({ text: 'hello' });
    const sys = (body.messages && body.messages[0] && body.messages[0].content) || '';
    if (/create FICTIONAL characters/.test(sys)) {
      const n = (sys.match(/x/) || []).length; // unused
      const leads = []; const cnt = (body.messages[1].content.match(/^\d+\./gm) || []).length;
      for (let i = 0; i < cnt; i++) leads.push({ name: 'Mock Person ' + i, age: 40 + i, gender: i % 2 ? 'female' : 'male', job: 'Tester', city: 'Mockville', personality: 'Friendly', speechStyle: 'slow', verbalTics: ['well'], backstory: 'Born in tests.', currentActivity: 'cooking', weakness: 'lonely', redFlags: 'pushy', family: 'a dog', bank: 'Mock Bank', stats: { tech: 0.2, gullibility: 0.8, fearfulness: 0.6, authorityRespect: 0.7, greed: 0.3, loneliness: 0.5, patience: 0.8 }, wealth: 4000, vocalDirection: 'warm' });
      return chat({ leads });
    }
    if (/scam-awareness educator/.test(sys)) return chat({ summary: 'Mock summary.', redFlags: ['pushy'], realLifeTip: 'Hang up.' });
    const turns = body.messages.filter(m => m.role === 'user').length;
    return chat(turns >= 3 ? { reply: 'Alright, getting my card. Hold on a second please.', trust_delta: 30, suspicion_delta: 0, fear_delta: 5, patience_delta: 0, state: 'complied', complied_with: 'card', tactics: ['fear'], coach: '' }
      : { reply: 'Hello? Who is this? I am a bit busy right now.', trust_delta: 5, suspicion_delta: 1, fear_delta: 2, patience_delta: -1, state: 'talking', complied_with: null, tactics: ['authority'], coach: '' });
  };

  async function run() {
    try {
      await sleep(300);
      $('#boot').click(); await sleep(200);
      log('login visible: ' + !$('#login').classList.contains('hidden'));
      $('#login .user').click(); await sleep(300);
      log('desktop visible: ' + !$('#desktop').classList.contains('hidden'));
      log('desktop icons: ' + document.querySelectorAll('.dicon').length);
      log('no default API key shipped (safe by default): ' + (SO.save.d.settings.groqKey === ''));
      SO.save.d.settings.groqKey = 'gsk_mock'; SO.save.d.settings.ttsOn = true;
      { const all = Array.from(document.querySelectorAll('.dicon')); const R = document.getElementById('desktop').getBoundingClientRect(); log('icons rendered: ' + all.length + ', all inside desktop: ' + all.every(e => { const b = e.getBoundingClientRect(); return b.bottom <= R.bottom + 1 && b.right <= R.right + 1; }) + ', first two y gap: ' + (all[1].offsetTop - all[0].offsetTop)); }
      // icon drag & drop with snap
      const ic = document.querySelector('.dicon'); const id0 = ic.dataset.id; const before = JSON.stringify(SO.save.d.iconPos[id0]);
      const rect = ic.getBoundingClientRect();
      const pe = (t, x, y) => new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1 });
      ic.dispatchEvent(pe('pointerdown', rect.left + 10, rect.top + 10));
      document.dispatchEvent(pe('pointermove', rect.left + 10 + 215, rect.top + 10 + 95));
      document.dispatchEvent(pe('pointerup', rect.left + 225, rect.top + 105));
      await sleep(100);
      log('icon moved: ' + before + ' -> ' + JSON.stringify(SO.save.d.iconPos[id0]) + ' (snapped to grid: ' + (document.querySelector('.dicon[data-id=' + id0 + ']').offsetLeft - 10) % 104 + ')');

      // start menu
      $('#startbtn').click(); await sleep(100);
      log('start menu items: ' + document.querySelectorAll('#startmenu .sm-it').length);
      $('#startbtn').click();

      // open every app
      const ids = Object.keys(SO.apps);
      for (const id of ids) {
        const before = window.__errors.length;
        SO.openApp(id); await sleep(120);
        const w = SO.wm.get(id) || SO.wm.list().slice(-1)[0];
        log('app ' + id + ': ' + (w ? 'window ok, body children=' + w.body.children.length : 'NO WINDOW') + (window.__errors.length > before ? '  <-- ERRORS' : ''));
      }
      log('windows open: ' + SO.wm.list().length + ', taskbar buttons: ' + document.querySelectorAll('.task').length);
      SO.wm.closeAll();

      // lead generation + full call via real UI
      SO.openApp('crm'); await sleep(100);
      document.querySelector('#cr-new').click(); await sleep(400);
      log('leads after CRM click: ' + SO.game.leads().length);
      SO.wm.closeAll();
      SO.openApp('phone'); await sleep(200);
      log('phone leads listed: ' + document.querySelectorAll('#ph-leads .row').length);
      document.querySelector('#ph-dial').click(); await sleep(2200);
      log('mic buttons: MIC=' + !!$('#ph-mic') + ' MUTE=' + !!$('#ph-micmute'));
      // lip-flap: the call avatar must have the two-frame lip-sync element and settle on the closed frame between turns
      log('call avatar lip-sync element: ' + !!$('#ph-av img') + ', idle frame (closed mouth): ' + (!!$('#ph-av img') && $('#ph-av img').src.indexOf('data:image') === 0));
      { const b = $('#ph-micmute'); if (b) { b.click(); log('mic muted: ' + SO.voice.isMicMuted()); b.click(); log('mic unmuted: ' + !SO.voice.isMicMuted()); } }
      log('streamed victim text complete: ' + (document.querySelector('#ph-log') ? document.querySelector('#ph-log').textContent.includes('a bit busy right now') : false));
      log('call view: ' + !!$('#ph-log') + ', victim bubble: ' + (document.querySelector('#ph-log') ? document.querySelector('#ph-log').textContent.slice(0, 40) : 'none'));
      for (let i = 0; i < 4; i++) {
        if (!$('#ph-in')) break;
        $('#ph-in').value = 'Hi this is Microsoft support, step ' + i; $('#ph-send').click(); await sleep(700);
      }
      await sleep(1500);
      // calls keep running while the victim stays on the line; the player ends it (hang up -> win with loots)
      const hang = $('#ph-hang'); log('hang button: ' + !!hang); if (hang) hang.click();
      await sleep(1500);
      log('back on the lead list after hang-up (no debrief screen): ' + !!$('#ph-leads'));
      log('loot: ' + SO.save.d.loot.length + ', xp: ' + SO.save.d.xp + ', heat: ' + SO.save.d.heat);
      SO.openApp('wallet'); await sleep(100);
      const ctb = document.querySelector('#wl button[data-open="cardterminal"]');
      log('wallet card->terminal button: ' + !!ctb); if (ctb) { ctb.click(); await sleep(150); log('card terminal opened: ' + !!document.querySelector('#ct-loot')); }
      await sleep(100);
      SO.wm.closeAll();
      // RemoteDesk: fresh session, EMPTY console, no pre-filled amounts
      SO.save.d.owned.t_remote = 1;
      const remoteLoot = { id: 'x_ui' + Date.now(), type: 'remote', value: 300, from: 'UI Test Victim', data: 'Remote PC: UI Test Victim (192.168.1.42)', details: { ip: '192.168.1.42', name: 'UI Test Victim', bank: 'Mock Bank', wealth: 4000, limit: 640 }, t: Date.now(), used: false };
      SO.save.d.loot.unshift(remoteLoot);
      SO.openApp('remotedesk'); await sleep(150);
      log('remotedesk session listed: ' + !!document.querySelector('#rd-target'));
      log('console starts EMPTY: ' + (document.querySelector('#rd-log').children.length === 0));
      log('connect disabled until a session is picked: ' + (document.querySelector('#rd-connect').disabled === true));
      const rsel = document.querySelector('#rd-target');
      rsel.value = remoteLoot.id; rsel.dispatchEvent(new Event('change')); await sleep(150);
      document.querySelector('#rd-connect').click();
      let rdOk = false;
      for (let i = 0; i < 30 && !rdOk; i++) { await sleep(250); rdOk = !!document.querySelector('#rd-drain'); }
      log('connected screen: ' + rdOk + ', amount empty: ' + (rdOk ? document.querySelector('#rd-amt').value === '' : 'n/a'));
      document.querySelector('#rd-disc').click(); await sleep(150);
      log('back to controller, console re-EMPTY: ' + (!!document.querySelector('#rd-target') && document.querySelector('#rd-log').children.length === 0));
      SO.save.d.loot = SO.save.d.loot.filter(l => l.id !== remoteLoot.id);
      SO.wm.closeAll();
      // deep link: the Unlicensed nag opens the shop pre-searched for the license - buy is manual, nothing auto-installs
      const cashBefore = SO.save.d.cash;
      SO.openApp('shop', { itemId: 't_remote' }); await sleep(150);
      const dtx = document.body.textContent;
      log('shop deep-link pre-searched license: ' + dtx.includes('Fake Remote-Access App') + ', nothing auto-bought (cash untouched): ' + (SO.save.d.cash === cashBefore) + ', no detail/reviews page: ' + (!/About this item/.test(dtx) && !document.querySelector('#st-bk')));
      SO.wm.closeAll();
      // shop buy: one click on the tile, installs in place
      SO.save.d.cash = 1000; SO.openApp('shop'); await sleep(100);
      log('store tiles on home: ' + document.querySelectorAll('.st-tile').length + ', hero: ' + !!document.querySelector('.st-hero') + ', nav items: ' + document.querySelectorAll('.st-nav .ni').length);
      const cash0 = SO.save.d.cash;
      const buyBtn = Array.from(document.querySelectorAll('.st-tile .st-get')).find(b => !b.disabled); log('store get button: ' + !!buyBtn); if (buyBtn) buyBtn.click();
      await sleep(2500);
      log('purchase in place, cash ' + cash0 + ' -> ' + SO.save.d.cash + ' (dropped: ' + (SO.save.d.cash < cash0) + '), no detail page: ' + (!/About this item/.test(document.body.textContent) && !document.querySelector('#st-act')));
      document.querySelector('#st-q').value = 'virus'; document.querySelector('#st-q').dispatchEvent(new Event('input')); await sleep(100);
      log('search results tiles for "virus": ' + document.querySelectorAll('.st-tile').length);
      log('mail unread: ' + SO.game.unreadMail());
      SO.game.raid(); await sleep(200); log('raid overlay: ' + !!$('#raid')); const rb = $('#raidbtn'); if (rb) for (let i = 0; i < 30; i++) rb.click(); await sleep(200); log('raid closed: ' + !$('#raid'));
    } catch (e) { log('EXCEPTION: ' + e.message + '\n' + e.stack); }
    if (location.hash === '#menu') {
      SO.wm.closeAll(); SO.openApp('phone'); SO.openApp('shop'); document.getElementById('startbtn').click(); await sleep(150);
      const m = document.getElementById('startmenu').getBoundingClientRect();
      log('viewport ' + innerWidth + 'x' + innerHeight + ' | start menu top=' + Math.round(m.top) + ' bottom=' + Math.round(m.bottom) + ' fits=' + (m.top >= 0 && m.bottom <= innerHeight));
      const sl = document.querySelector('#startmenu .sm-l'); log('left list scrolls: ' + (sl.scrollHeight > sl.clientHeight) + ' (scrollH ' + sl.scrollHeight + ' / clientH ' + sl.clientHeight + ')');
      const ws = SO.wm.list().map(w => { const r = w.el.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.bottom <= innerHeight - 39; }); log('windows inside screen: ' + ws.join(','));
    }
    if (location.hash === '#shot') {
      SO.wm.closeAll(); SO.game.addCash(1234, 'demo'); SO.game.addHeat(30);
      SO.openApp('crm'); SO.openApp('shop'); SO.openApp('phone'); await sleep(200);
      document.querySelector('#ph-dial') && document.querySelector('#ph-dial').click(); await sleep(1800);
      $('#ph-in') && ($('#ph-in').value = 'Hello, this is tech support from Microsoft.', $('#ph-send').click()); await sleep(900);
      document.getElementById('result').style.display = 'none';
    }
    log('--- JS ERRORS (' + window.__errors.length + ') ---'); window.__errors.forEach(e => log(e));
    $('#result').textContent = 'RESULT_START\n' + out.join('\n') + '\nRESULT_END';
  }
  window.addEventListener('load', () => setTimeout(run, 100));
})();
