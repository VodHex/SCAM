/* SCAM OS - Phone app: the core gameplay. Victims are Groq-generated characters; speech is fully built into the browser (speechSynthesis + SpeechRecognition). */
(function () {
  const SO = window.SO, G = () => SO.game, esc = s => SO.esc(s);
  const D = () => SO.save.d;

  /* In-call tool actions (same payloads as the Scam Tools app). */
  const ACTIONS = [
    { id: 't_popup', label: 'Fake virus popup', fx: 'A loud fake antivirus alert just popped up on your computer screen with big red warnings saying YOUR PC IS INFECTED and a phone number to call.', tag: 'fear' },
    { id: 't_bsod', label: 'Fake BSOD', fx: 'Your computer screen suddenly turned solid blue with a scary error message and the machine froze.', tag: 'fear' },
    { id: 't_form', label: 'Send payment link', fx: 'You just received a link to a very professional, official-looking payment web page from the caller.', tag: 'proof' },
    { id: 't_remote', label: 'Send remote app', fx: 'You received a download link for a "support tool"; the caller wants you to run it. A window opens saying "Connecting to technician...".', tag: 'remote' }
  ];
  const ACT = {}; ACTIONS.forEach(a => { ACT[a.id] = a; });

  function open(args) {
    const w = SO.wm.open({ id: 'phone', title: 'Phone - SCAM OS Dialer', icon: 'phone', w: 440, h: 680, minW: 330, minH: 500,
      onClose: () => { if (w2 && w2.cleanup) w2.cleanup(); } });
    let w2 = w;
    if (!w.fresh) {
      if (args && args.incoming && !G().busy()) w.api && w.api.showIncomingRing(args.incoming, args.issue);
      else if (args && args.select) w.api && w.api.select(args.select);
      return w;
    }
    w.api = build(w);
    w.cleanup = w.api.cleanup;
    if (args && args.select) w.api.select(args.select);
    return w;
  }

  function build(w) {
    const body = w.body;
    let view = 'setup', call = null, selLead = null, busy = false, ended = false, toolsOpen = false, lastAct = Date.now(), timerIv = null, silIv = null, pending = [], transcribing = false, shownNow = '';
    let unsub = G().sub(() => { if (view === 'setup') renderSetup(); else if (view === 'call' && toolsOpen) paintTools(); });
    const q = s => body.querySelector(s);

    /* ---------------- setup view ---------------- */
    function renderSetup() {
      view = 'setup';
      const leads = G().leads();
      if (!selLead || !leads.find(l => l.id === selLead)) selLead = leads[0] ? leads[0].id : null;
      const L = leads.find(l => l.id === selLead);

      body.innerHTML =
        '<div class="col grow" style="padding:6px;gap:6px">' +
        '<h3 class="sec" style="margin:0">Victim Leads (' + leads.length + ')</h3>' +
        '<div class="panel grow" id="ph-leads" style="padding:2px;overflow:auto;min-height:0"></div>' +
        '<div class="col" style="gap:4px;flex:none">' +
        '<button class="xp-btn" id="ph-more">' + (G().isGenerating() ? 'Creating victims...' : 'Get 5 new leads') + '</button>' +
        '<button class="xp-btn green" id="ph-dial" style="font-size:22px;padding:6px">' + (L ? 'DIAL: ' + esc(L.name.toUpperCase()) : 'DIAL OUT') + '</button>' +
        '</div>' +
        '</div>';

      const list = q('#ph-leads');
      if (!leads.length) list.innerHTML = '<div class="pad muted">' + (SO.groq.hasKey() ? 'No leads yet.' : 'No Groq key (Settings).') + '</div>';
      leads.forEach(l => {
        const r = document.createElement('div');
        r.className = 'row'; r.style.cssText = 'padding:3px 4px;cursor:pointer;gap:6px;border-bottom:1px solid #f0eee6;' + (l.id === selLead ? 'background:#316ac5;color:#fff' : '');
        r.innerHTML = SO.avatar(l.id, 36, { gender: l.gender, age: l.age }) + '<div style="min-width:0"><b>' + esc(l.name) + '</b><div style="font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + l.age + ', ' + esc(l.job) + (l.called ? ' - called ' + l.called + 'x' : '') + '</div></div>';
        r.onclick = () => { selLead = l.id; renderSetup(); };
        list.appendChild(r);
      });

      q('#ph-more').disabled = G().isGenerating();
      q('#ph-more').onclick = () => G().refill(5);

      q('#ph-dial').disabled = !L;
      q('#ph-dial').onclick = () => {
        if (!L) return;
        startCall(L, false);
      };
    }

    /* ---------------- call view ---------------- */
    function drawRing(score) {
      const cv = q('#ph-ring'); if (!cv) return;
      const ctx = cv.getContext('2d');
      const w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, rad = w / 2 - 5;

      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.strokeStyle = '#c6d2e8';
      ctx.lineWidth = 4;
      ctx.stroke();

      const pct = Math.max(0, Math.min(100, score || 0));
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (pct / 100) * (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, startAngle, endAngle);
      ctx.strokeStyle = pct > 65 ? '#2fa84f' : pct > 35 ? '#e8a500' : '#e63232';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.fillStyle = '#0b2a73';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(pct) + '%', cx, cy + 1);
    }

    function renderCall() {
      view = 'call';
      toolsOpen = false;
      const L = call.lead;
      const ib = (id, icon, title, cls) => '<button class="xp-btn ib ' + (cls || '') + '" id="' + id + '" title="' + title + '">' + SO.iconImg(icon, 22) + '</button>';

      body.innerHTML =
        '<div class="row" style="padding:6px 10px;gap:10px;align-items:center;background:linear-gradient(#e6efff,#cfdcf7);border-bottom:2px solid #aca899">' +
        '<span id="ph-av">' + SO.avatar(L.id, 46, { gender: L.gender, age: L.age }) + '</span>' +
        '<div style="min-width:110px;flex:1"><b style="font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">' + esc(L.name) + '</b>' +
        '<div class="muted" style="font-size:16px">' + esc(L.phone || '555-0000') + (call.fx && call.fx.spoof ? ' &bull; <span class="tag b" title="Your spoofer makes the caller ID look trusted">CALLER ID: SPOOFED</span>' : '') + '</div>' +
        '<div class="muted" style="font-size:16px"><span id="ph-st">Ringing...</span> &bull; <span id="ph-time">00:00</span></div></div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;margin:0 4px"><canvas id="ph-ring" width="48" height="48" title="Victim cooperation / conviction meter" style="display:block"></canvas></div>' +
        ib('ph-hang', 'hangup', 'Hang up', 'hang') +
        '</div>' +
        // the four real meters the AI reacts to (Trust / Suspicion / Fear / Patience)
        '<div class="phone-meters" id="ph-meters">' +
          meter('trust', 'TRUST', '#2fa84f') + meter('susp', 'SUSPICION', '#e63232') +
          meter('fear', 'FEAR', '#e88a00') + meter('pat', 'PATIENCE', '#2a6bff') +
        '</div>' +
        '<div class="panel grow selectable" id="ph-log" style="margin:6px 6px 0;padding:6px;background:#fff"></div>' +
        '<div class="row" style="padding:6px 6px 4px"><input class="xp-input grow" id="ph-in" placeholder="Type a message..." autocomplete="off">' + ib('ph-send', 'send', 'Send') + '</div>' +
        '<div class="row" style="padding:2px 6px 6px;gap:6px;flex-wrap:wrap;justify-content:center">' +
        ib('ph-mic', 'mic', 'Microphone on / off (stays on until you click it)') +
        ib('ph-micmute', 'micoff', 'Mute yourself (the victim cannot hear you)') +
        ib('ph-mute', 'speaker', 'Mute the victim\'s voice') +
        ib('ph-hp', 'headset', 'Headphones mode: talk over victim') +
        ib('ph-int', 'stop', 'Interrupt: cut the victim off') +
        '</div>';

      killTools(); ensureTab();
      q('#ph-hang').onclick = () => endCall('hungup', null, true);
      q('#ph-send').onclick = sendBox; q('#ph-in').onkeydown = e => { if (e.key === 'Enter') sendBox(); };
      q('#ph-tt').onclick = () => { toolsOpen = !toolsOpen; paintTools(); };
      q('#ph-mic').onclick = toggleMic;
      q('#ph-micmute').onclick = toggleMicMute;
      q('#ph-int').onclick = () => SO.voice.stop();
      q('#ph-hp').onclick = () => { D().settings.headphones = !D().settings.headphones; SO.save.save(); paintMic(); };
      q('#ph-mute').onclick = () => { call.muted = !call.muted; if (call.muted) SO.voice.stop(); paintMic(); };
      meters(); q('#ph-in').focus(); paintMic(); paintTools();
    }
    function meter(v, label, color) {
      return '<div class="pm"><span class="pm-l">' + label + '</span><div class="meter"><div class="bar"><i id="pm-' + v + '" style="--c:' + color + '"></i></div></div><span class="pm-v" id="pm-' + v + '-v">0</span></div>';
    }

    /* --- side tab + drawer: the noVNC-style expander on the outside of the window ---
       Both the little arrow tab AND the Scam Tools card are children of the window
       frame (.win), hanging on its outer left edge - nothing sits inside the chat. */
    function killTools() { ['ph-drawer', 'ph-tt'].forEach(id => { const e = w.el.querySelector('#' + id); if (e) e.remove(); }); }
    function ensureTab() {
      let tab = w.el.querySelector('#ph-tt');
      if (!tab) {
        tab = document.createElement('button');
        tab.id = 'ph-tt'; tab.className = 'xp-btn'; tab.title = 'Scam tools: open / close';
        tab.onclick = () => { toolsOpen = !toolsOpen; paintTools(); };
        w.el.appendChild(tab);
      }
      tab.textContent = toolsOpen ? '\u2039' : '\u203A';
      /* glued to the window's outer left edge (-3px tucks it over the blue border).
         Narrow + TALL (noVNC handle look): the .xp-btn min-width is overridden on purpose. */
      tab.style.cssText = 'position:absolute;right:100%;margin-right:-3px;left:auto;top:' + Math.max(28, Math.round(w.el.clientHeight * 0.4)) + 'px;' +
        'display:flex;align-items:center;justify-content:center;min-width:0;width:26px;height:66px;padding:0;box-sizing:border-box;' +
        'font-size:19px;font-weight:bold;border-radius:8px 0 0 8px;border-right:none;background:#d7e4f8;z-index:50';
      return tab;
    }
    function paintTools() {
      const tab = q('#ph-tt') || ensureTab();
      const old = w.el.querySelector('#ph-drawer'); if (old) old.remove();
      tab.textContent = toolsOpen ? '\u2039' : '\u203A';
      if (!toolsOpen) return;
      const dr = document.createElement('div');
      dr.id = 'ph-drawer';
      /* right:100% touches the window's outer edge; -3px overlaps the border so the
         card and the tab form one connected panel hanging off the call window. */
      dr.style.cssText = 'position:absolute;right:100%;margin-right:-3px;left:auto;top:' + (tab.offsetTop + tab.offsetHeight + 3) + 'px;' +
        'width:236px;max-height:58%;overflow:auto;background:#fff;border:2px solid #aca899;border-radius:4px;box-shadow:4px 4px 0 rgba(0,0,0,.45);z-index:50;padding:6px 8px';
      const own = id => G().owns(id);
      const rows = Object.keys(ACT).map(id => {
        const t = (SO.data.SHOP || []).find(s => s.id === id) || { name: ACT[id].label, icon: 'tools' };
        const used = call && call.usedActions[id];
        const right = !own(id)
          ? '<span class="tag r" style="flex:none"><span title="Locked - buy it in ScamMart">' + SO.iconImg('lock', 14) + '</span> LOCKED</span>'
          : used ? '<span class="tag" style="flex:none;background:#eee;color:#777">USED</span>'
          : '<button class="xp-btn small green" data-act="' + id + '" style="flex:none">Deploy</button>';
        return '<div class="row" style="gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid #f0eee6">' +
          SO.iconImg(own(id) ? t.icon : 'lock', 22) +
          '<div class="grow" style="min-width:0"><b style="font-size:16px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(t.name) + '</b>' +
          (own(id) ? '<span class="muted" style="font-size:14px">in-call action</span>' : '<span class="muted" style="font-size:14px">ScamMart: $' + esc(t.price || '?') + (t.level ? ' - level ' + t.level : '') + '</span>') + '</div>' + right + '</div>';
      }).join('');
      dr.innerHTML =
        '<div class="row" style="align-items:center;margin-bottom:3px"><b class="grow" style="font-size:17px">SCAM TOOLS</b><span class="muted" style="font-size:14px">1 use / call</span></div>' + rows;
      dr.querySelectorAll('button[data-act]').forEach(b => b.onclick = () => {
        const a = ACT[b.dataset.act];
        if (doAction(a)) { SO.audio.play('click'); paintTools(); }
        else SO.notify('Tool failed', call && call.usedActions[a.id] ? a.label + ' already fired this call.' : 'The victim is mid-thought - wait for their reply.', 'warn', { sound: 'error', timeout: 2600 });
      });
      w.el.appendChild(dr);
    }

    function meters() {
      if (!call || view !== 'call') return;
      drawRing(G().conviction(call));
      const m = call.m;
      [['trust', m.trust], ['susp', m.suspicion], ['fear', m.fear], ['pat', m.patience]].forEach(([v, x]) => {
        const bar = q('#pm-' + v), txt = q('#pm-' + v + '-v');
        if (bar) bar.style.width = Math.max(0, Math.min(100, x)) + '%';
        if (txt) txt.textContent = Math.round(x);
      });
    }

    function bubble(who, text, nolog) {
      if (!nolog) call && call.log.push({ who: who === 'coach' ? 'event' : who, text });
      const log = q('#ph-log'); if (!log) return null;
      const d = document.createElement('div');
      d.style.cssText = 'margin:4px 0;display:flex;' + (who === 'me' ? 'justify-content:flex-end' : who === 'event' || who === 'coach' ? 'justify-content:center' : '');
      const bg = who === 'me' ? '#cfe0ff' : who === 'coach' ? '#f3e8ff' : who === 'event' ? '#fff3b8' : '#e6f4d9';
      let inner = '';
      if (who === 'victim') inner = '<b>' + esc(call.lead.name.split(' ')[0]) + ':</b> ' + esc(text);
      else if (who === 'coach') inner = '<span style="color:#7b2fbf;font-weight:bold">' + SO.iconImg('tip', 16) + ' Coach:</span> ' + esc(text);
      else inner = esc(text);
      d.innerHTML = '<div style="max-width:78%;background:' + bg + ';border:2px solid ' + (who === 'coach' ? '#b98af0' : '#404040') + ';padding:3px 8px;' + (who === 'event' || who === 'coach' ? 'font-size:16px;' : '') + '">' + inner + '</div>';
      log.appendChild(d); log.scrollTop = log.scrollHeight;
      return d;
    }
    function status(t) { const e = q('#ph-st'); if (e) e.textContent = t; }

    /* Lip flap: the call avatar swaps between two frames while the victim speaks.
       With TTS on, the flap follows the real audio (SO.voice.audioActive); with TTS
       off or muted, it runs while the sentence text is streaming in. */
    let talkIv = null, talkOn = false, talkAudio = true, talkOpen = false;
    function setFrame(open) {
      const el = q('#ph-av img'); if (!el || !call) return;
      el.src = SO.avatarUrl(call.lead.id, { gender: call.lead.gender, age: call.lead.age }, open);
    }
    function startTalk(tts) {
      talkOn = true; talkAudio = !!tts;
      if (talkIv) return;
      talkIv = setInterval(() => {
        if (!call || ended || !talkOn) { stopTalk(); return; }
        if (!talkAudio || SO.voice.audioActive()) { talkOpen = !talkOpen; setFrame(talkOpen); }
        else if (talkOpen) { talkOpen = false; setFrame(false); }
      }, 130);
    }
    function stopTalk() {
      talkOn = false;
      if (talkIv) { clearInterval(talkIv); talkIv = null; }
      talkOpen = false; setFrame(false);
    }

    async function startCall(lead, incoming, issue) {
      if (!SO.groq.hasKey()) {
        SO.msgbox({ title: 'Groq key needed', icon: 'warn', text: 'Open Settings > AI and paste your Groq API key first.', buttons: ['Open Settings', 'Cancel'] }).then(b => { if (b === 'Open Settings') SO.openApp('settings'); });
        return;
      }
      G().setCallActive(true);
      call = G().newCall(lead, { incoming, incomingIssue: issue });
      ended = false; busy = true; call.muted = false;
      SO.activeCall = {
        call,
        lead: () => (call && call.lead) || null,
        isActive: () => !!(call && !ended),
        doAction: a => doAction(a),
        /* RemoteDesk / tools push in-call events (screen popups, transfers...) here. */
        event: text => {
          if (!call || ended) return false;
          bubble('event', text);
          if (busy || !call) return true;
          victimTurn(text, true);
          return true;
        }
      };
      renderCall();
      SO.audio.play('ring'); status('Ringing...');
      const t0 = Date.now(); clearInterval(timerIv);
      timerIv = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        const e = q('#ph-time');
        if (e) e.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      }, 1000);

      await new Promise(r => setTimeout(r, 1300));
      if (ended) return;
      status('Connected');
      if (D().settings.autoMic !== false && SO.voice.micSupported()) startMic();

      const openerPrompt = incoming && issue
        ? issue.prompt
        : incoming
          ? 'You dialed this number because your computer showed a virus warning or suspicious charge. Someone answers. State why you are calling in distress.'
          : 'Your personal phone is ringing from an unknown caller and you pick it up. Answer naturally as a private citizen (e.g. "Hello?", "Yes?", "Dorothy speaking"). You do not know who is calling.';
      await victimTurn(openerPrompt, true);
      clearInterval(silIv); silIv = setInterval(silenceCheck, 1000);
    }

    /* The victim's answer streams in sentence by sentence. */
    async function victimTurn(text, isEvent) {
      busy = true; status('Victim is thinking...');
      const typing = bubble('victim', '...', true);
      const ttsOn = !!D().settings.ttsOn && !call.muted;
      let bub = null, shown = ''; shownNow = '';
      const setText = () => { const inner = bub && bub.firstChild; if (inner) inner.innerHTML = '<b>' + esc(call.lead.name.split(' ')[0]) + ':</b> ' + esc(shown); const log = q('#ph-log'); if (log) log.scrollTop = log.scrollHeight; };
      const sess = SO.voice.session({
        tts: ttsOn, voice: call.lead.voice, gender: call.lead.gender, rate: call.lead.voiceRate,
        direction: '',
        onStart: s => { if (typing && typing.parentNode) typing.remove(); if (!bub) bub = bubble('victim', '', true); shown = (shown + ' ' + s).trim(); shownNow = shown; setText(); status(ttsOn ? 'Victim speaking...' : 'Your turn'); startTalk(ttsOn); }
      });
      let out;
      try { out = await SO.groq.turn(call, text, isEvent, { onSentence: s => sess.push(s) }); }
      catch (e) {
        SO.voice.stop(); stopTalk(); if (typing && typing.parentNode) typing.remove();
        busy = false; status('Connection problem');
        SO.notify('AI error', e.message, 'error', { timeout: 9000 });
        bubble('event', 'Line problem: ' + e.message.slice(0, 100) + ' (say something to retry)');
        if (e.code === 'auth' || e.code === 'nokey') endCall('hungup', null, true);
        return;
      }
      sess.end();
      if (ended) return;
      call.log.push({ who: 'victim', text: out.reply });
      const res = G().applyTurn(call, out); meters();
      if (out.coach && G().owns('t_coach')) bubble('coach', out.coach);
      if (res.loot) {
        const loot = res.loot;
        if (loot.failed) {
          const bEl = bubble('event', loot.data);
          if (bEl && bEl.firstChild) {
            bEl.firstChild.style.background = '#ffebee';
            bEl.firstChild.style.borderColor = '#c62828';
          }
        } else {
          const appToOpen = loot.type === 'card' ? 'cardterminal' : loot.type === 'giftcard' ? 'giftredeem' : loot.type === 'remote' ? 'remotedesk' : 'wallet';
          const appLabel = loot.type === 'card' ? 'Open Card Terminal' : loot.type === 'giftcard' ? 'Open CardRedeem' : loot.type === 'remote' ? 'Open RemoteDesk' : 'Open Wallet';
          const bEl = bubble('event', 'VICTIM COMPLIED: ' + loot.data);
          if (bEl && bEl.firstChild) {
            bEl.firstChild.style.background = '#d4edda';
            bEl.firstChild.style.borderColor = '#28a745';
            bEl.firstChild.insertAdjacentHTML('beforeend', '<div style="margin-top:4px"><button class="xp-btn small green" id="open-loot-' + loot.id + '">' + appLabel + '</button></div>');
            const btn = bEl.firstChild.querySelector('#open-loot-' + loot.id);
            if (btn) btn.onclick = () => SO.openApp(appToOpen, { lootId: loot.id });
          }
        }
      }
      if (res.end) { busy = true; await Promise.race([sess.done, new Promise(r => setTimeout(r, 14000))]); endCall(res.end, out.compliedWith, false); return; }
      busy = false; lastAct = Date.now();
      sess.done.then(() => { stopTalk(); if (!ended) { status('Your turn'); lastAct = Date.now(); } });
      if (pending.length) { const t = pending.join(' '); pending = []; send(t); }
    }

    function sendBox() { const i = q('#ph-in'); const t = i.value.trim(); if (!t) return; i.value = ''; say(t); }
    function say(text) {
      if (!call || ended) return;
      bubble('me', text);
      if (busy) { pending.push(text); return; }
      send(text);
    }
    function send(text) { SO.voice.stop(); busy = true; lastAct = Date.now(); victimTurn(text, false); }
    function doAction(a) {
      if (!call || ended || busy || call.usedActions[a.id]) return false;
      call.usedActions[a.id] = 1; SO.voice.stop();
      call.tactics[a.tag] = (call.tactics[a.tag] || 0) + 1;
      const t = 'Used tool: ' + a.label + '.'; bubble('event', t);
      victimTurn(a.fx, true);
      return true;
    }
    function silenceCheck() {
      if (!call || ended || busy || transcribing || SO.voice.userSpeaking() || SO.voice.isSpeaking()) { return; }
      if (Date.now() - lastAct > 30000) { lastAct = Date.now(); victimTurn('The caller has been silent for about 30 seconds. React in character.', true); }
    }

    /* ---------- microphone ---------- */
    function paintMic() {
      const mic = q('#ph-mic'), mu = q('#ph-micmute'); if (!mic) return;
      const on = SO.voice.isListening(), muted = SO.voice.isMicMuted();
      mic.classList.toggle('on', on); mu.classList.toggle('alert', muted);
      const sp = q('#ph-mute'); if (sp && call) { sp.classList.toggle('alert', !!call.muted); sp.querySelector('img').src = SO.icon(call.muted ? 'speakeroff' : 'speaker'); }
      const hp = q('#ph-hp'); if (hp) hp.classList.toggle('on', !!D().settings.headphones);
    }
    function toggleMic() { if (SO.voice.isListening()) { SO.voice.stopListening(); paintMic(); } else startMic(); }
    function toggleMicMute() { SO.voice.setMicMuted(!SO.voice.isMicMuted()); paintMic(); if (SO.voice.isMicMuted()) SO.notify('Microphone muted', 'The victim cannot hear you.', 'info', { timeout: 2500, sound: 'click' }); }

    async function startMic() {
      if (!call || ended || SO.voice.isListening()) return;
      if (!SO.voice.micSupported()) { SO.notify('No mic support', 'Use Chrome/Edge, or type.', 'warn'); return; }
      await SO.voice.startListening({
        thresholdBoost: () => (busy || SO.voice.audioActive() || SO.voice.isSpeaking()) ? 999 : 1,
        isDeaf: () => busy || ended || SO.voice.audioActive() || SO.voice.isSpeaking(),
        onSpeechStart: () => { SO.voice.stop(); lastAct = Date.now(); },
        onTranscribing: t => { transcribing = t; },
        onResult: t => {
          if (ended || busy) return;
          const refs = call.log.filter(l => l.who === 'victim').slice(-2).map(l => l.text);
          if (shownNow) refs.push(shownNow);
          if (SO.voice.isEcho(t, refs)) return;
          say(t);
        },
        onState: () => paintMic(),
        onError: m => { SO.notify('Microphone', m, 'warn'); paintMic(); }
      });
      paintMic();
    }

    /* ---------------- end of call ---------------- */
    /* A call just... ends: cleanup, collect the result, toast it, straight back to the leads.
       No debrief screen - the loot itself lives in the Wallet and the outcome is in the toast. */
    function endCall(outcome, compliedWith, userHang) {
      if (ended) return; ended = true; busy = true; stopTalk();
      if (SO.activeCall) SO.activeCall = null;
      clearInterval(timerIv); clearInterval(silIv); SO.voice.stopListening(); SO.voice.stop();
      if (userHang && call && (call.loots || []).some(l => !l.failed && l.value > 0)) outcome = 'win';
      SO.audio.play(outcome === 'win' ? 'win' : outcome === 'hungup' && userHang ? 'hang' : 'lose');
      const c = call;
      const res = G().finishCall(c, outcome, compliedWith);
      const head = { win: ['Call won', 'cash'], hungup: ['Call ended', userHang ? 'info' : 'warn'], reported: ['Reported!', 'police'], busted: ['Busted!', 'police'] }[res.outcome] || ['Call ended', 'info'];
      const lootTxt = (c.loots || []).length ? '\nCollected: ' + c.loots.map(l => l.failed ? l.type + ' (failed)' : l.type).join(', ') : '';
      SO.notify(head[0], c.lead.name + ' (' + (c.turn || 0) + ' turns)' + lootTxt + '\n+' + res.xp + ' XP - +' + res.heat + ' heat', head[1]);
      call = null;
      killTools();
      renderSetup();
    }

    function showIncomingRing(lead, issue, onHandled) {
      if (call && !ended) return;
      view = 'incoming';
      body.innerHTML =
        '<div class="col grow pad" style="background:#fff4f4;border:3px solid #e63232;align-items:center;justify-content:center;text-align:center;gap:10px">' +
        SO.avatar(lead.id, 56, { gender: lead.gender, age: lead.age }) +
        '<div><b style="font-size:22px">' + esc(lead.name) + '</b><div class="muted">' + lead.age + ' y/o &bull; ' + esc(lead.job) + '</div></div>' +
        '<div class="muted" style="font-size:16px">Incoming call...</div>' +
        '<div class="row" style="gap:10px;margin-top:8px">' +
        '<button class="xp-btn green" id="ph-inc-ans" style="font-size:20px;padding:6px 20px">ANSWER</button>' +
        '<button class="xp-btn red" id="ph-inc-dec" style="font-size:20px;padding:6px 16px">DECLINE</button>' +
        '</div>' +
        '</div>';
      q('#ph-inc-ans').onclick = () => {
        SO.audio.stopRing();
        if (onHandled) onHandled();
        startCall(lead, true, issue);
      };
      q('#ph-inc-dec').onclick = () => {
        SO.audio.stopRing();
        if (onHandled) onHandled();
        renderSetup();
      };
    }

    function cleanup() {
      unsub(); clearInterval(timerIv); clearInterval(silIv); SO.voice.stopListening(); SO.voice.stop();
      if (call && !ended) {
        ended = true;
        const outcome = (call.loots || []).some(l => !l.failed && l.value > 0) ? 'win' : 'hungup';
        G().finishCall(call, outcome, null);
      }
    }

    function select(id) { selLead = id; if (view === 'setup') renderSetup(); }
    renderSetup();
    return { showIncomingRing, cleanup, select, event: text => SO.activeCall && SO.activeCall.event && SO.activeCall.event(text) };
  }

  SO.registerApp({ id: 'phone', name: 'Phone', icon: 'phone', desktop: true, start: true, order: 1, open });
})();
