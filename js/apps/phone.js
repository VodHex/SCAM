/* Softphone - Enterprise SIP VoIP Workstation & Live Call Console */
(function () {
  const SO = window.SO, G = SO.game;
  const esc = SO.esc;

  SO.registerApp('phone', {
    title: 'Softphone — SIP VoIP Console', icon: 'phone', w: 880, h: 610, minW: 720, minH: 480, singleton: true,
    open(opts) {
      opts = opts || {};
      const d = SO.save.d;
      let lead = opts.lead || opts.incoming || null;
      let call = null, busy = false, recOn = false, onHold = false, unsub = null, callTimer = null;
      let vSession = null, body = null, win = null;

      function ensureMicHint() {}

      function stopAll() {
        SO.voice.stopListening();
        if (vSession) { vSession.cancel(); vSession = null; }
        SO.voice.stop();
        SO.audio.stopRing();
        if (callTimer) { clearInterval(callTimer); callTimer = null; }
        G.setCallActive(false);
        if (SO.activeCall && SO.activeCall.call === call) SO.activeCall = null;
      }

      function findLeadByPhone(numStr) {
        const clean = String(numStr || '').replace(/\D/g, '');
        if (clean.length < 4) return null;
        const tail = clean.slice(-4);
        const all = G.leads().concat(Object.values(d.pastLeads || {}));
        return all.find(l => String(l.phone || '').replace(/\D/g, '').endsWith(tail)) || null;
      }

      /* ---------- Pre-Call SIP Dialer & Line Configuration ---------- */
      function renderLobby() {
        if (!body) return;
        const leads = G.leads();
        if (lead && !leads.find(x => x.id === lead.id) && !(opts.incoming && opts.incoming.id === lead.id)) lead = null;
        const ts = d.toolState = d.toolState || { spoof: true, spoofNumber: '', spoofName: '', voice: true, voiceProfile: 'corporate' };
        const pendingInc = G.pendingIncoming;
        const dialVal = lead ? (lead.phone || '555-0100') : '';
        const activeCover = (d.ids || []).find(x => x.id === d.activeCoverId) || null;

        body.innerHTML =
          '<div class="split">' +
            /* Left Column: Manual 12-Key SIP Dialpad & Spoofer */
            '<div class="side" style="width:310px;display:flex;flex-direction:column;gap:10px;padding:12px">' +
              (pendingInc ? (
                '<div class="group" style="border-color:#dc2626;background:#fef2f2;margin:0">' +
                  '<div class="row" style="justify-content:space-between">' +
                    '<b style="color:#dc2626;font-size:12px">● INCOMING LINE 1</b>' +
                    '<span class="tag r">RINGING</span>' +
                  '</div>' +
                  '<div style="font-size:13px;font-weight:700;margin-top:4px">' + esc(pendingInc.lead.name) + ' (' + esc(pendingInc.lead.phone || '555-3819') + ')</div>' +
                  '<div class="muted" style="font-size:11px;margin:2px 0 8px">Queue: ' + esc((pendingInc.issue && pendingInc.issue.title) || 'Support Hotline') + '</div>' +
                  '<div class="row">' +
                    '<button class="xp-btn green" id="ans-inc" style="flex:1">Answer Line</button>' +
                    '<button class="xp-btn red" id="rej-inc">Reject</button>' +
                  '</div>' +
                '</div>'
              ) : '') +

              '<div class="group" style="margin:0">' +
                '<div class="group-title">SIP Outbound Dialpad</div>' +
                '<div style="background:#0f172a;color:#38bdf8;border-radius:6px;padding:8px 10px;margin-bottom:8px;border:1px solid #1e293b">' +
                  '<div style="font-size:10px;color:#94a3b8;display:flex;justify-content:space-between">' +
                    '<span>LINE 1: READY</span>' +
                    '<span id="ph-match-lbl">' + (lead ? esc(lead.name) : 'ENTER NUMBER') + '</span>' +
                  '</div>' +
                  '<input class="mono" id="ph-dial-num" value="' + esc(dialVal) + '" placeholder="555-XXXX" style="width:100%;background:transparent;border:none;color:#f8fafc;font-size:20px;font-weight:700;outline:none;letter-spacing:1px;margin-top:2px">' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:8px">' +
                  ['1','2','3','4','5','6','7','8','9','*','0','#'].map(k =>
                    '<button class="xp-btn mono kpad" data-k="' + k + '" style="padding:7px 0;font-size:14px;font-weight:700">' + k + '</button>'
                  ).join('') +
                '</div>' +
                '<div class="row" style="gap:6px">' +
                  '<button class="xp-btn green" id="go" style="flex:1;padding:8px" ' + (!SO.groq.hasKey() ? 'disabled' : '') + '>📞 Dial Number</button>' +
                  '<button class="xp-btn" id="ph-clr" title="Clear digits">Clear</button>' +
                '</div>' +
              '</div>' +

              /* Caller-ID Spoofer & Voice Modulation Manual Config */
              '<div class="group" style="margin:0">' +
                '<div class="group-title">Line Spoofing &amp; Modulation</div>' +
                '<div style="display:flex;flex-direction:column;gap:6px;font-size:11px">' +
                  '<label class="row" style="justify-content:space-between;cursor:pointer">' +
                    '<span><b>Caller-ID Spoofer</b> ' + (G.owns('t_spoof') ? '<span class="tag g">INSTALLED</span>' : '<span class="tag">LOCKED</span>') + '</span>' +
                    '<input type="checkbox" id="t-spoof" ' + (!G.owns('t_spoof') ? 'disabled' : (ts.spoof !== false ? 'checked' : '')) + '>' +
                  '</label>' +
                  (G.owns('t_spoof') ? (
                    '<input class="xp-in" id="sp-name" placeholder="Spoofed Name (e.g. ' + esc((lead && lead.bank) || 'Fraud Dept') + ')" value="' + esc(ts.spoofName || '') + '" style="font-size:11px;padding:4px 7px">' +
                    '<input class="xp-in mono" id="sp-num" placeholder="Spoofed CID (e.g. 800-555-0199)" value="' + esc(ts.spoofNumber || '') + '" style="font-size:11px;padding:4px 7px">'
                  ) : '<div class="muted">Purchase Caller-ID Spoofer in ScamMart to falsify outbound CID name &amp; number.</div>') +
                  '<hr class="sep" style="margin:3px 0">' +
                  '<label class="row" style="justify-content:space-between;cursor:pointer">' +
                    '<span><b>Voice Modulator</b> ' + (G.owns('t_voice') ? '<span class="tag g">INSTALLED</span>' : '<span class="tag">LOCKED</span>') + '</span>' +
                    '<input type="checkbox" id="t-voice" ' + (!G.owns('t_voice') ? 'disabled' : (ts.voice !== false ? 'checked' : '')) + '>' +
                  '</label>' +
                  (G.owns('t_voice') ? (
                    '<select class="xp-sel" id="vp-sel" style="font-size:11px;padding:4px 7px">' +
                      ['corporate:Corporate Authority','warm:Warm & Empathetic','compliance:Federal Compliance','support:Calm Tech Support'].map(x => {
                        const [val, lbl] = x.split(':');
                        return '<option value="' + val + '" ' + (ts.voiceProfile === val ? 'selected' : '') + '>' + lbl + '</option>';
                      }).join('') +
                    '</select>'
                  ) : '') +
                  '<div class="muted" style="margin-top:2px">Active Cover ID: <b>' + (activeCover ? esc(activeCover.name + ' (' + activeCover.org + ')') : 'None selected (set in ID Forge)') + '</b></div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            /* Right Column: Directory Reference, Call Log & Scratchpad */
            '<div class="main">' +
              (!SO.groq.hasKey() ? '<div class="banner err" style="margin-bottom:8px"><span>No Groq API key configured. Open Settings &gt; AI to enable live calls.</span><button class="xp-btn" id="cfg">Settings</button></div>' : '') +

              '<div class="row" style="justify-content:space-between;margin-bottom:6px">' +
                '<div><b>Lead Phone Directory</b> <span class="muted">— Type any number into the keypad to dial</span></div>' +
                '<div class="row">' +
                  '<button class="xp-btn" id="gen">' + (G.isGenerating() ? 'Fetching...' : 'Fetch Leads') + '</button>' +
                  '<button class="xp-btn" id="crm">Open CRM</button>' +
                '</div>' +
              '</div>' +

              '<div class="sunken" style="padding:8px;max-height:215px;overflow:auto;margin-bottom:10px">' +
                (leads.length === 0 ? '<div class="muted" style="padding:14px;text-align:center">No leads in directory. Click "Fetch Leads" or open CRM.</div>' :
                  '<table class="table"><thead><tr><th>Line #</th><th>Name</th><th>Occupation &amp; City</th><th>Bank</th><th>Dialpad</th></tr></thead><tbody>' +
                  leads.map(L =>
                    '<tr class="lead-row" data-phone="' + esc(L.phone || '555-0100') + '" style="cursor:pointer">' +
                      '<td class="mono" style="font-weight:700;color:#2563eb">' + esc(L.phone || '555-0100') + '</td>' +
                      '<td><b>' + esc(L.name) + '</b> (' + L.age + ')</td>' +
                      '<td class="muted">' + esc(L.job) + ' · ' + esc(L.city) + '</td>' +
                      '<td><span class="tag b">' + esc(L.bank) + '</span></td>' +
                      '<td><button class="xp-btn copy-num" data-phone="' + esc(L.phone || '555-0100') + '" style="padding:2px 8px;font-size:11px">Key In</button></td>' +
                    '</tr>'
                  ).join('') +
                  '</tbody></table>'
                ) +
              '</div>' +

              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;flex:1;min-height:150px">' +
                '<div class="group" style="margin:0;display:flex;flex-direction:column">' +
                  '<div class="group-title">Operator Scratchpad (Persisted)</div>' +
                  '<textarea class="xp-ta mono" id="lobby-pad" placeholder="Jot down spoken card numbers, CVVs, RemoteDesk IDs, bank logins, or OTP codes here..." style="flex:1;resize:none;font-size:11px">' + esc(d.callScratchpad || '') + '</textarea>' +
                '</div>' +
                '<div class="group" style="margin:0;display:flex;flex-direction:column;overflow:hidden">' +
                  '<div class="group-title">Recent Call Log</div>' +
                  '<div style="overflow:auto;flex:1;font-size:11px">' +
                    ((d.callHistory || []).length === 0 ? '<div class="muted" style="padding:8px">No calls logged yet this shift.</div>' :
                      (d.callHistory || []).slice(0, 8).map(ch =>
                        '<div style="display:flex;justify-content:space-between;padding:4px 2px;border-bottom:1px solid #f1f5f9">' +
                          '<span><b class="mono">' + esc(ch.phone) + '</b> · ' + esc(ch.name) + '</span>' +
                          '<span class="tag ' + (ch.outcome === 'win' ? 'g' : 'r') + '">' + esc(ch.outcome.toUpperCase()) + '</span>' +
                        '</div>'
                      ).join('')
                    ) +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';

        const numInput = body.querySelector('#ph-dial-num');
        const matchLbl = body.querySelector('#ph-match-lbl');
        const updateMatch = () => {
          const m = findLeadByPhone(numInput.value);
          lead = m || lead;
          if (matchLbl) matchLbl.textContent = m ? (m.name + ' (' + m.city + ')') : 'MANUAL DIAL';
        };
        if (numInput) {
          numInput.oninput = updateMatch;
          numInput.onkeydown = e => { if (e.key === 'Enter') dialOut(); };
        }
        body.querySelectorAll('.kpad').forEach(b => b.onclick = () => {
          SO.audio.play('blip');
          if (!numInput) return;
          let v = numInput.value.replace(/[^\d*#]/g, '') + b.dataset.k;
          if (v.length > 3 && !v.includes('-') && /^\d+$/.test(v)) v = v.slice(0, 3) + '-' + v.slice(3, 7);
          numInput.value = v;
          updateMatch();
        });
        const clr = body.querySelector('#ph-clr');
        if (clr) clr.onclick = () => { if (numInput) { numInput.value = ''; lead = null; updateMatch(); numInput.focus(); } };

        body.querySelectorAll('.copy-num').forEach(b => b.onclick = e => {
          e.stopPropagation();
          if (numInput) { numInput.value = b.dataset.phone; updateMatch(); numInput.focus(); }
        });

        const bind = (sel, fn) => { const el = body.querySelector(sel); if (el) el.onclick = fn; };
        bind('#cfg', () => SO.openApp('settings'));
        bind('#crm', () => SO.openApp('crm'));
        bind('#gen', async () => { await G.refill(5); renderLobby(); });
        bind('#ans-inc', () => {
          const p = G.pendingIncoming;
          if (!p) return;
          G.clearIncoming();
          lead = p.lead;
          startCall(true, p.issue);
        });
        bind('#rej-inc', () => {
          G.clearIncoming();
          renderLobby();
        });

        const spChk = body.querySelector('#t-spoof');
        if (spChk) spChk.onchange = e => { ts.spoof = e.target.checked; SO.save.save(); };
        const spName = body.querySelector('#sp-name');
        if (spName) spName.oninput = e => { ts.spoofName = e.target.value; SO.save.save(); };
        const spNum = body.querySelector('#sp-num');
        if (spNum) spNum.oninput = e => { ts.spoofNumber = e.target.value; SO.save.save(); };
        const vcChk = body.querySelector('#t-voice');
        if (vcChk) vcChk.onchange = e => { ts.voice = e.target.checked; SO.save.save(); };
        const vpSel = body.querySelector('#vp-sel');
        if (vpSel) vpSel.onchange = e => { ts.voiceProfile = e.target.value; SO.save.save(); };
        const lPad = body.querySelector('#lobby-pad');
        if (lPad) lPad.oninput = e => { d.callScratchpad = e.target.value; SO.save.save(); };

        function dialOut() {
          const typed = numInput ? numInput.value.trim() : '';
          const matched = findLeadByPhone(typed) || lead;
          if (!matched) {
            SO.notify('Unassigned Number', 'Dial a valid 7-digit number from the Lead Directory (e.g. 555-XXXX).', 'warn');
            return;
          }
          lead = matched;
          startCall(false, null);
        }
        bind('#go', dialOut);
      }

      /* ---------- Live Call Session ---------- */
      async function startCall(incoming, issue) {
        if (!lead) return;
        SO.audio.stopRing();
        if (G.pendingIncoming && G.pendingIncoming.lead && G.pendingIncoming.lead.id === lead.id) {
          G.clearIncoming();
        }
        call = G.newCall(lead, { incoming, incomingIssue: issue });
        G.setCallActive(true);
        onHold = false;
        SO.activeCall = {
          call,
          isActive: () => !!call && !call.outcome,
          event: text => { if (call && !call.outcome && !busy) send(text, true); }
        };
        if (!incoming) SO.audio.dialTone();
        renderCall();
        addSys(incoming
          ? ('Inbound Line 1 connected — ' + lead.name + ' (' + (lead.phone || '555-0100') + ') · Queue: ' + ((issue && issue.title) || 'Support'))
          : ('Outbound SIP connected to ' + lead.name + ' (' + (lead.phone || '555-0100') + ') · CID Display: ' +
            (call.fx.spoof ? ((call.fx.spoofName || 'Official Line') + ' <' + (call.fx.spoofNumber || '800-555-0100') + '>') : 'Unknown Caller'))
        );
        if (incoming) {
          await send('You are calling the support number on your screen. The agent picks up. State your problem in 1 short anxious sentence.', true);
        } else {
          await send('Your phone rings from an unknown number. You pick up. Say a short natural hello in character.', true);
        }
      }

      function renderCall() {
        const L = call.lead;
        const m = call.m;
        const meter = (id, label, val, col) =>
          '<div class="meter"><span class="lbl">' + label + '</span><div class="bar"><i id="m-' + id + '" style="width:' + Math.round(val) + '%;--c:' + col + '"></i></div><span class="val" id="mv-' + id + '">' + Math.round(val) + '%</span></div>';
        body.innerHTML =
          '<div class="split">' +
            /* Left Telemetry & Operator Scratchpad Sidebar */
            '<div class="side" style="width:270px;display:flex;flex-direction:column;gap:8px;padding:10px">' +
              '<div class="row" style="gap:10px;align-items:center">' +
                '<div style="position:relative">' +
                  '<img id="av" src="' + SO.avatarUrl(L, false, 128) + '" style="width:68px;height:68px;border:1px solid #cbd5e1;border-radius:10px">' +
                  '<span id="vstate" class="tag" style="position:absolute;bottom:-4px;left:4px;font-size:9px">IDLE</span>' +
                '</div>' +
                '<div style="min-width:0;flex:1">' +
                  '<div style="font-weight:700;font-size:13px">' + esc(L.name) + '</div>' +
                  '<div class="muted">' + L.age + ' · ' + esc(L.job) + '</div>' +
                  '<div class="mono" style="font-size:11px;color:#2563eb;font-weight:600">' + esc(L.phone || '555-0100') + ' · <span id="ph-timer">00:00</span></div>' +
                  '<div class="muted" style="font-size:10px">Bank: <b>' + esc(L.bank) + '</b></div>' +
                '</div>' +
              '</div>' +

              '<div class="group" style="margin:0;padding:8px">' +
                '<div class="group-title">Psychological Telemetry</div>' +
                meter('trust', 'Trust', m.trust, '#16a34a') +
                meter('susp', 'Suspicion', m.suspicion, '#dc2626') +
                meter('fear', 'Fear', m.fear, '#d97706') +
                meter('pat', 'Patience', m.patience, '#2563eb') +
                meter('conv', 'Conviction', G.conviction(call), '#7c3aed') +
              '</div>' +

              (G.owns('t_coach') ? '<div class="sunken" id="coach" style="padding:6px 8px;font-size:11px;background:#fefce8;border-color:#fde047"><b>AI Coach:</b> Listen carefully to their tone and address their immediate concern first.</div>' : '') +

              /* Manual Operator Scratchpad right inside the call window */
              '<div class="group" style="margin:0;padding:8px;flex:1;display:flex;flex-direction:column">' +
                '<div class="group-title">Live Call Scratchpad</div>' +
                '<textarea class="xp-ta mono" id="ph-pad" placeholder="Type down card digits, expiry, CVV, RemoteDesk ID/PIN, or OTP codes as the target speaks them..." style="flex:1;resize:none;font-size:11px">' + esc(d.callScratchpad || '') + '</textarea>' +
              '</div>' +

              '<div class="row" style="justify-content:space-between;gap:6px">' +
                '<button class="xp-btn" id="ph-hold" style="flex:1">⏸ Hold Line</button>' +
                '<button class="xp-btn red" id="hang" style="flex:1">⏹ Hang Up</button>' +
              '</div>' +
            '</div>' +

            /* Right Live Conversation & Manual Controls */
            '<div class="main">' +
              '<div class="row" style="justify-content:space-between;margin-bottom:6px;padding:4px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:11px">' +
                '<span><b>Active CID:</b> ' + (call.fx.spoof ? esc((call.fx.spoofName || 'Official') + ' (' + (call.fx.spoofNumber || '800-555-0100') + ')') : 'Unmasked Line') + '</span>' +
                '<span class="muted">Open workstation tools manually from the Desktop or Start menu</span>' +
              '</div>' +

              '<div class="chatlog" id="ph-log" style="flex:1"></div>' +

              ((d.ids || []).length ? (
                '<div class="row" style="margin-top:6px;gap:6px">' +
                  '<span class="muted" style="font-size:11px">Present Credentials:</span>' +
                  '<select class="xp-sel" id="idpick" style="flex:1;font-size:11px;padding:4px 6px">' +
                    d.ids.map(x => '<option value="' + esc(x.id) + '" ' + (d.activeCoverId === x.id ? 'selected' : '') + '>' + esc(x.name) + ' — ' + esc(x.title) + ' (' + esc(x.org) + ') [Badge #' + esc(x.badge) + ']</option>').join('') +
                  '</select>' +
                  '<button class="xp-btn" id="flashid" style="font-size:11px;padding:4px 10px">State Badge on Line</button>' +
                '</div>'
              ) : '') +

              '<div class="row" style="margin-top:6px;gap:6px">' +
                '<input class="xp-in" id="say" placeholder="Type what you say to the target and press Enter or Send..." style="flex:1">' +
                '<button class="xp-btn primary" id="send">Send</button>' +
                (SO.voice.recOk ? '<button class="xp-btn" id="mic" title="Dictate into input field">🎤 Dictate</button>' : '') +
              '</div>' +
            '</div>' +
          '</div>';

        if (callTimer) clearInterval(callTimer);
        callTimer = setInterval(() => {
          const el = body && body.querySelector('#ph-timer');
          if (!el || !call) return;
          const s = Math.floor((Date.now() - call.startedAt) / 1000);
          el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
        }, 1000);

        const padEl = body.querySelector('#ph-pad');
        if (padEl) padEl.oninput = e => { d.callScratchpad = e.target.value; SO.save.save(); };

        const holdBtn = body.querySelector('#ph-hold');
        if (holdBtn) holdBtn.onclick = () => {
          onHold = !onHold;
          holdBtn.textContent = onHold ? '▶ Resume Line' : '⏸ Hold Line';
          setVState(onHold ? 'ON HOLD' : 'IDLE', onHold ? 'y' : '');
          addSys(onHold ? 'Line placed on hold (hold music playing to target).' : 'Line taken off hold.');
        };

        const inp = body.querySelector('#say');
        const doSend = () => {
          if (busy || onHold) return;
          const v = inp.value.trim();
          if (!v) return;
          inp.value = '';
          send(v, false);
        };
        body.querySelector('#send').onclick = doSend;
        inp.onkeydown = e => { if (e.key === 'Enter') doSend(); };
        body.querySelector('#hang').onclick = () => endCall('hungup');

        const flashBtn = body.querySelector('#flashid');
        if (flashBtn) {
          flashBtn.onclick = () => {
            if (busy || !call || call.outcome) return;
            const sel = body.querySelector('#idpick');
            const id = (d.ids || []).find(x => x.id === (sel && sel.value));
            if (!id) return;
            if (call.usedActions['id_' + id.id]) { SO.notify('Already Stated', 'You already presented that badge on this call.', 'info'); return; }
            call.usedActions['id_' + id.id] = 1;
            d.activeCoverId = id.id;
            call.fx.activeCover = id;
            SO.save.save();
            addBubble('me', 'This is ' + id.name + ', ' + id.title + ' with ' + id.org + '. My badge number is ' + id.badge + ', verifiable at ' + id.phone + '.');
            send(G.flashIdEvent(id), true);
          };
        }

        const mic = body.querySelector('#mic');
        if (mic) {
          const toggleMic = () => {
            if (recOn) {
              SO.voice.stopListening();
              recOn = false;
              mic.classList.remove('red');
              mic.textContent = '🎤 Dictate';
              return;
            }
            if (vSession) { vSession.cancel(); vSession = null; }
            SO.voice.stop();
            recOn = true;
            mic.classList.add('red');
            mic.textContent = '⏹ Stop Mic';
            SO.voice.listen(
              txt => { if (inp) inp.value = txt; },
              finalTxt => {
                recOn = false;
                mic.classList.remove('red');
                mic.textContent = '🎤 Dictate';
                if (finalTxt && inp) {
                  inp.value = finalTxt;
                  inp.focus();
                  // Manual simulation: only auto-submit if user explicitly enabled Hands-Free mode in Settings
                  if (SO.save.d.settings.handsFree === true) doSend();
                }
              },
              err => {
                recOn = false;
                mic.classList.remove('red');
                mic.textContent = '🎤 Dictate';
                if (err && err !== 'no-speech' && err !== 'aborted') SO.notify('Mic Error', String(err), 'warn');
              }
            );
          };
          mic.onclick = toggleMic;
        }
        inp.focus();
      }

      function setVState(txt, cls) {
        const el = body && body.querySelector('#vstate'); if (!el) return;
        el.textContent = txt; el.className = 'tag ' + (cls || '');
      }

      function addBubble(who, text, tags) {
        const log = body && body.querySelector('#ph-log'); if (!log) return null;
        const b = document.createElement('div');
        b.className = 'bubble ' + (who === 'me' ? 'me' : 'them');
        const label = who === 'me' ? 'OPERATOR' : esc(call.lead.name);
        const tagHtml = (tags || []).map(t => '<span class="tag b" style="margin-left:3px">' + esc((SO.data.TACTICS[t] && SO.data.TACTICS[t].label) || t) + '</span>').join('');
        b.innerHTML = '<div class="who"><span>' + label + '</span><span>' + tagHtml + '</span></div><div class="btxt">' + esc(text) + '</div>';
        log.appendChild(b); log.scrollTop = log.scrollHeight;
        return b;
      }

      function addSys(text, color) {
        const log = body && body.querySelector('#ph-log'); if (!log) return;
        const b = document.createElement('div'); b.className = 'bubble sys';
        if (color) b.style.color = color;
        b.textContent = text; log.appendChild(b); log.scrollTop = log.scrollHeight;
      }

      function updateMeters() {
        if (!body || !call) return;
        const m = call.m, set = (k, v) => {
          const b = body.querySelector('#m-' + k), t = body.querySelector('#mv-' + k);
          if (b) b.style.width = Math.round(v) + '%'; if (t) t.textContent = Math.round(v) + '%';
        };
        set('trust', m.trust); set('susp', m.suspicion); set('fear', m.fear); set('pat', m.patience); set('conv', G.conviction(call));
      }

      async function send(text, isEvent) {
        if (!call || call.outcome) return;
        busy = true;
        if (recOn) { SO.voice.stopListening(); recOn = false; const m = body && body.querySelector('#mic'); if (m) { m.classList.remove('red'); m.textContent = '🎤 Dictate'; } }
        if (vSession) { vSession.cancel(); vSession = null; }
        SO.voice.stop();
        if (!isEvent) { addBubble('me', text); call.log.push({ who: 'me', text }); }
        else call.log.push({ who: 'ev', text });
        setVState('THINKING...', 'y');

        const av = body && body.querySelector('#av');
        const setMouth = open => { if (av && call) av.src = SO.avatarUrl(call.lead, open, 128); };
        vSession = SO.voice.createSession(call.lead, {
          onStart: () => setVState('SPEAKING', 'g'),
          onMouth: setMouth
        });

        let liveBub = null, liveTxt = '';
        const log = body && body.querySelector('#ph-log');
        try {
          const out = await SO.groq.turn(call, text, isEvent, {
            onSentence: sent => {
              if (!call || call.outcome) return;
              liveTxt = (liveTxt ? liveTxt + ' ' : '') + sent;
              if (!liveBub) liveBub = addBubble('victim', liveTxt, []);
              else { const bt = liveBub.querySelector('.btxt'); if (bt) bt.textContent = liveTxt; if (log) log.scrollTop = log.scrollHeight; }
              if (vSession) vSession.push(sent);
            }
          });
          if (!call || call.outcome) return;
          const r = G.applyTurn(call, out);

          // If victim complied with an ask and their spoken reply didn't already include the exact digits/code,
          // append the natural in-character spoken credential line directly into their speech!
          let finalReply = out.reply;
          if (r.loot && r.loot.spokenLine) {
            const det = r.loot.details || {};
            const keyToken = det.number || det.code || det.clientId || det.pass || det.ref || det.addr || det.ssn4 || '';
            if (!keyToken || !finalReply.includes(String(keyToken).slice(0, 6))) {
              finalReply = finalReply + ' ' + r.loot.spokenLine;
              if (vSession) vSession.push(r.loot.spokenLine);
            }
          }

          call.log.push({ who: 'victim', text: finalReply });
          if (!liveBub) liveBub = addBubble('victim', finalReply, out.tactics);
          else {
            const bt = liveBub.querySelector('.btxt'); if (bt) bt.textContent = finalReply;
            const who = liveBub.querySelector('.who');
            if (who && out.tactics.length) who.lastChild.innerHTML = out.tactics.map(t => '<span class="tag b" style="margin-left:3px">' + esc((SO.data.TACTICS[t] && SO.data.TACTICS[t].label) || t) + '</span>').join('');
          }
          if (out.coach && body.querySelector('#coach')) body.querySelector('#coach').innerHTML = '<b>AI Coach:</b> ' + esc(out.coach);
          updateMeters();
          if (vSession) vSession.finish();
          const spokenDone = vSession ? vSession.done : Promise.resolve();
          if (r.end) {
            spokenDone.then(() => { setVState('ENDED', ''); endCall(r.end, out.compliedWith); });
          } else {
            spokenDone.then(() => {
              if (!call || call.outcome) return;
              setVState('ON LINE', '');
            });
          }
        } catch (e) {
          if (vSession) { vSession.cancel(); vSession = null; }
          setVState('ERROR', 'r');
          addSys('SIP Error: ' + e.message, '#dc2626');
          SO.notify('AI Call Error', e.message, 'error', { timeout: 9000 });
        } finally { busy = false; }
      }

      async function endCall(outcome, compliedWith) {
        if (!call || call.outcome) return;
        stopAll();
        const res = G.finishCall(call, outcome, compliedWith);
        const winOut = res.outcome === 'win';
        SO.audio.play(winOut ? 'win' : 'lose');
        const loots = (res.loots || []).filter(l => !l.failed && l.value > 0);
        const failedLoots = (res.loots || []).filter(l => l.failed);
        body.innerHTML =
          '<div style="padding:18px;overflow:auto;flex:1">' +
            '<div class="group">' +
              '<div class="row" style="justify-content:space-between">' +
                '<div style="font-size:18px;font-weight:800;color:' + (winOut ? '#16a34a' : '#dc2626') + '">' +
                  (winOut ? 'CALL COMPLETED — CREDENTIALS OBTAINED (' + loots.length + ')' : 'CALL TERMINATED (' + esc(res.outcome.toUpperCase()) + ')') +
                '</div>' +
                '<span class="mono" style="font-size:12px">XP +' + res.xp + ' · Heat +' + res.heat + '%</span>' +
              '</div>' +
              '<div style="margin-top:8px;font-size:12px">' +
                (loots.length
                  ? loots.map(l => '<div style="margin:4px 0;padding:6px 10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px"><b>' + esc((SO.data.PAYLOADS[l.type] && SO.data.PAYLOADS[l.type].label) || l.type) + ':</b> <span class="mono">' + esc(l.data) + '</span></div>').join('')
                  : '<div class="muted">No credentials or financial instruments were disclosed during this call.</div>') +
                failedLoots.map(l => '<div style="margin:4px 0;color:#dc2626"><b>FAILED:</b> ' + esc(l.data) + '</div>').join('') +
                (res.note ? '<div class="muted" style="margin-top:8px"><b>Manual Next Step:</b> ' + esc(res.note) + '</div>' : '') +
              '</div>' +
              '<div class="row" style="margin-top:12px">' +
                '<button class="xp-btn primary" id="again">Return to SIP Dialpad</button>' +
              '</div>' +
            '</div>' +
            '<div class="group"><div class="group-title">Post-Call Behavioural Debrief</div><div id="deb" class="muted">Analyzing call transcript...</div></div>' +
          '</div>';
        body.querySelector('#again').onclick = () => { call = null; lead = null; renderLobby(); };
        try {
          const deb = await SO.groq.debrief(call);
          const el = body.querySelector('#deb');
          if (el) el.innerHTML = '<div style="color:#0f172a;margin-bottom:6px">' + esc(deb.summary || '') + '</div>' +
            (Array.isArray(deb.redFlags) && deb.redFlags.length ? '<b>Red flags in this call:</b><ul style="margin:4px 0 6px 18px">' + deb.redFlags.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul>' : '') +
            '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px;color:#1e3a8a"><b>Real-world defense tip:</b> ' + esc(deb.realLifeTip || '') + '</div>';
        } catch (e) {
          const el = body.querySelector('#deb'); if (el) el.textContent = 'Debrief unavailable (' + e.message + ').';
        }
      }

      win = SO.wm.open({
        id: 'phone', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div style="display:flex;flex:1;min-height:0"></div>',
        onClose: () => { stopAll(); if (unsub) unsub(); },
        api: {
          dial(l) { if (call && !call.outcome) { SO.notify('Busy', 'Finish or hang up the current call first.', 'warn'); return; } lead = l; renderLobby(); },
          receiveCall(l, issue) { if (call && !call.outcome) return; lead = l; startCall(true, issue); },
          showIncomingRing() { if (!call || call.outcome) renderLobby(); },
          ensureMicHint
        }
      });
      body = win.body.firstChild;
      unsub = G.sub(() => { if (!call) renderLobby(); });
      if (opts.incoming) { lead = opts.incoming; startCall(true, opts.issue); }
      else renderLobby();
    }
  });
})();
