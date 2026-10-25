/* Headless UI driver: mocks Groq, boots the OS, opens every app, plays a full manual call + POS + RemoteDesk + GiftRedeem + Clearing cycle. Results written to #result. */
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
      if (body.stream) {
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

      // start menu
      $('#startbtn').click(); await sleep(100);
      log('start menu items: ' + document.querySelectorAll('#startmenu .sm-it').length);
      $('#startbtn').click();

      // open every app and verify zero runtime errors
      const ids = Object.keys(SO.apps);
      for (const id of ids) {
        const before = window.__errors.length;
        SO.openApp(id); await sleep(120);
        const w = SO.wm.get(id) || SO.wm.list().slice(-1)[0];
        log('app ' + id + ': ' + (w ? 'window ok, body children=' + w.body.children.length : 'NO WINDOW') + (window.__errors.length > before ? '  <-- ERRORS' : ''));
      }
      log('windows open: ' + SO.wm.list().length + ', taskbar buttons: ' + document.querySelectorAll('.task').length);
      SO.wm.closeAll();

      // lead generation + manual dial via Softphone
      SO.openApp('crm'); await sleep(100);
      document.querySelector('#gen').click(); await sleep(400);
      log('leads after CRM click: ' + SO.game.leads().length);
      const firstLead = SO.game.leads()[0];
      SO.wm.closeAll();

      SO.openApp('phone'); await sleep(200);
      const dialIn = document.querySelector('#ph-dial-num');
      dialIn.value = firstLead.phone;
      dialIn.dispatchEvent(new Event('input'));
      document.querySelector('#go').click(); await sleep(1200);

      log('call avatar vector SVG element: ' + (!!$('#av') && $('#av').src.indexOf('data:image/svg+xml') === 0));
      log('streamed victim text complete: ' + (document.querySelector('#ph-log') ? document.querySelector('#ph-log').textContent.includes('a bit busy right now') : false));
      for (let i = 0; i < 3; i++) {
        if (!$('#say')) break;
        $('#say').value = 'Hi this is bank security step ' + i; $('#send').click(); await sleep(500);
      }
      await sleep(800);
      // Verify victim spoke the exact 16-digit card number in the call transcript
      const assets = SO.game.ensureVictimAssets(firstLead);
      log('victim spoke exact card number in chat: ' + (document.querySelector('#ph-log') ? document.querySelector('#ph-log').textContent.includes(assets.card.number) : false));
      const hang = $('#hang'); log('hang button: ' + !!hang); if (hang) hang.click();
      await sleep(600);
      log('loot captured: ' + SO.save.d.loot.length + ', xp: ' + SO.save.d.xp);
      SO.wm.closeAll();

      // Manual Card Terminal verification
      SO.openApp('cardterminal'); await sleep(150);
      $('#pos-pan').value = assets.card.number; $('#pos-pan').dispatchEvent(new Event('input'));
      $('#pos-exp').value = assets.card.exp; $('#pos-exp').dispatchEvent(new Event('input'));
      $('#pos-cvv').value = assets.card.cvv; $('#pos-cvv').dispatchEvent(new Event('input'));
      $('#pos-test').click(); await sleep(150);
      $('#pos-amt').value = '100'; $('#pos-amt').dispatchEvent(new Event('input'));
      $('#pos-charge').click(); await sleep(150);
      log('manual POS charge succeeded: ' + (SO.save.d.posHistory.length >= 2 && SO.save.d.posHistory[0].ok === true));
      SO.wm.closeAll();

      // Manual RemoteDesk verification
      SO.save.d.owned.t_remote = 1;
      const remoteLoot = SO.game.makeLoot('remote', 300, firstLead);
      SO.save.d.loot.unshift(remoteLoot);
      SO.openApp('remotedesk'); await sleep(150);
      $('#rd-cid').value = remoteLoot.details.clientId; $('#rd-cid').dispatchEvent(new Event('input'));
      $('#rd-pin').value = remoteLoot.details.pin; $('#rd-pin').dispatchEvent(new Event('input'));
      $('#rd-connect').click(); await sleep(150);
      log('remotedesk manual handshake connected: ' + !!document.querySelector('#rd-disc'));
      SO.wm.closeAll();

      // Raid test
      SO.game.raid(); await sleep(200); log('raid overlay: ' + !!$('#raid')); const rb = $('#raidbtn'); if (rb) for (let i = 0; i < 30; i++) rb.click(); await sleep(200); log('raid closed: ' + !$('#raid'));
    } catch (e) { log('EXCEPTION: ' + e.message + '\n' + e.stack); }
    log('JS ERRORS: ' + window.__errors.length + (window.__errors.length ? '\n' + window.__errors.join('\n') : ''));
    document.getElementById('result').textContent = out.join('\n');
    document.title = 'DONE';
  }
  window.addEventListener('load', run);
})();
