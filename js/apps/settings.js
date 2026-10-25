/* Settings - Workstation Control Panel (AI Key, Voice, Gameplay, Appearance & Save Data) */
(function () {
  const SO = window.SO, G = SO.game, esc = SO.esc;

  SO.registerApp('settings', {
    title: 'Workstation Settings', icon: 'settings', w: 620, h: 500, minW: 500, minH: 400, singleton: true,
    open(opts) {
      let tab = (opts && opts.tab) || 'ai';
      const win = SO.wm.open({
        id: 'settings', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div class="main"></div>'
      });
      const root = win.body.firstChild;

      function render() {
        const s = SO.save.d.settings;
        const tabs = [['ai', '🤖 AI & Voice'], ['game', '⚙ Simulation'], ['look', '🖥 Display & Audio'], ['save', '💾 Save Data']];
        let body = '';
        if (tab === 'ai') {
          body =
            '<div class="group"><div class="group-title">Groq API Key (Required for AI Personas &amp; Live Calls)</div>' +
              '<div class="muted" style="margin-bottom:6px">Your key is stored only in your browser\'s localStorage and sent directly to <code>api.groq.com</code>.</div>' +
              '<div class="row"><input type="password" class="xp-in mono" id="key" value="' + esc(s.groqKey || '') + '" placeholder="gsk_..."><button class="xp-btn" id="show">Show</button><button class="xp-btn primary" id="savek">Save</button><button class="xp-btn" id="test">Test Connection</button></div>' +
              '<div id="testout" class="muted" style="margin-top:6px"></div>' +
            '</div>' +
            '<div class="group"><div class="group-title">Models</div>' +
              '<div class="row" style="justify-content:space-between"><span>Chat / Dialogue Model:</span><select class="xp-sel" id="cm" style="width:270px">' +
                SO.groq.MODELS.map(m => '<option value="' + m + '" ' + (s.chatModel === m ? 'selected' : '') + '>' + m + '</option>').join('') +
              '</select></div>' +
              '<div class="row" style="justify-content:space-between;margin-top:6px"><span>Speech-to-Text (Whisper):</span><select class="xp-sel" id="sm" style="width:270px">' +
                ['whisper-large-v3-turbo', 'whisper-large-v3'].map(m => '<option value="' + m + '" ' + (s.sttModel === m ? 'selected' : '') + '>' + m + '</option>').join('') +
              '</select></div>' +
            '</div>' +
            '<div class="group"><div class="group-title">Speech &amp; Microphone</div>' +
              '<label class="row"><input type="checkbox" id="voice" ' + (s.voice !== false ? 'checked' : '') + '> Speak target dialogue out loud (Browser Speech Synthesis)</label>' +
              '<div class="row" style="justify-content:space-between;margin-top:6px"><span>Target Speech Speed (<b id="vspd-v">' + Number(s.voiceSpeed || 1.12).toFixed(2) + 'x</b>):</span><input type="range" id="vspd" min="0.85" max="1.45" step="0.05" value="' + (s.voiceSpeed || 1.12) + '" style="width:200px"></div>' +
              '<label class="row" style="margin-top:6px"><input type="checkbox" id="hp" ' + (s.headphones ? 'checked' : '') + '> I am wearing headphones (disable speaker-echo filter)</label>' +
            '</div>';
        } else if (tab === 'game') {
          body =
            '<div class="group"><div class="group-title">Target Skepticism &amp; Difficulty</div>' +
              '<div class="row">' +
                ['easy', 'normal', 'hard'].map(d => '<label class="row" style="margin-right:14px"><input type="radio" name="diff" value="' + d + '" ' + (s.difficulty === d ? 'checked' : '') + '> <b style="text-transform:capitalize">' + d + '</b></label>').join('') +
              '</div>' +
              '<div class="muted" style="margin-top:4px">Controls how skeptical targets are and how quickly patience drains on calls.</div>' +
            '</div>' +
            '<div class="group"><div class="group-title">Call Center Operations</div>' +
              '<label class="row"><input type="checkbox" id="inb" ' + (s.inbound !== false ? 'checked' : '') + '> Enable inbound support calls (line rings in system tray &amp; Softphone)</label>' +
              '<label class="row" style="margin-top:6px"><input type="checkbox" id="ash" ' + (s.autoShift === true ? 'checked' : '') + '> Auto-end shift after 8 calls (default OFF — end shift manually in system tray)</label>' +
            '</div>';
        } else if (tab === 'look') {
          body =
            '<div class="group"><div class="group-title">Workstation Audio</div>' +
              '<label class="row"><input type="checkbox" id="mute" ' + (s.muted ? 'checked' : '') + '> Mute all sound effects</label>' +
              '<div class="row" style="margin-top:6px"><span>Master Volume:</span><input type="range" id="vol" min="0" max="1" step="0.05" value="' + s.volume + '" style="flex:1"><span>' + Math.round(s.volume * 100) + '%</span></div>' +
            '</div>' +
            '<div class="group"><div class="group-title">Desktop Wallpaper Theme</div>' +
              '<div class="row" style="flex-wrap:wrap">' +
                ['Slate Enterprise', 'Executive Indigo', 'Cyber Grid', 'Sunset Horizon', 'Emerald Matrix'].map((n, i) => '<button class="xp-btn ' + (s.wallpaper === i ? 'primary' : '') + '" data-wp="' + i + '">' + n + '</button>').join('') +
              '</div>' +
            '</div>';
        } else {
          body =
            '<div class="group"><div class="group-title">Backup / Restore Simulation State</div>' +
              '<div class="row"><button class="xp-btn" id="exp">Export Save JSON</button><button class="xp-btn" id="imp">Import JSON</button><button class="xp-btn red" id="wipe">Factory Reset</button></div>' +
              '<textarea class="xp-ta mono" id="json" rows="9" style="width:100%;margin-top:8px" placeholder="Save JSON will appear here...">' + esc(SO.save.exportJSON()) + '</textarea>' +
            '</div>';
        }

        root.innerHTML = '<div class="tabs">' + tabs.map(([id, lbl]) => '<div class="tab ' + (tab === id ? 'active' : '') + '" data-t="' + id + '">' + lbl + '</div>').join('') + '</div><div style="flex:1;overflow:auto;display:flex;flex-direction:column;gap:8px">' + body + '</div>';

        root.querySelectorAll('.tab').forEach(el => el.onclick = () => { tab = el.dataset.t; render(); });
        const save = () => SO.save.save();

        if (tab === 'ai') {
          const k = root.querySelector('#key');
          root.querySelector('#show').onclick = () => { k.type = k.type === 'password' ? 'text' : 'password'; };
          root.querySelector('#savek').onclick = () => {
            s.groqKey = k.value.trim(); save();
            SO.notify('Saved', 'Groq API key saved.', 'tip');
            if (s.groqKey && (!SO.save.d.leads || !SO.save.d.leads.length)) G.refill(5);
            G.rearmIncoming && G.rearmIncoming();
          };
          root.querySelector('#test').onclick = async () => {
            s.groqKey = k.value.trim(); save();
            const out = root.querySelector('#testout'); out.textContent = 'Testing connection to Groq...';
            try { const r = await SO.groq.test(); out.style.color = '#16a34a'; out.textContent = 'OK (' + r.ms + ' ms, ' + r.model + '): "' + r.text + '"'; }
            catch (e) { out.style.color = '#dc2626'; out.textContent = e.message; }
          };
          root.querySelector('#cm').onchange = e => { s.chatModel = e.target.value; save(); };
          root.querySelector('#sm').onchange = e => { s.sttModel = e.target.value; save(); };
          root.querySelector('#voice').onchange = e => { s.voice = e.target.checked; save(); };
          root.querySelector('#vspd').oninput = e => { s.voiceSpeed = parseFloat(e.target.value); root.querySelector('#vspd-v').textContent = s.voiceSpeed.toFixed(2) + 'x'; save(); };
          root.querySelector('#hp').onchange = e => { s.headphones = e.target.checked; save(); };
        } else if (tab === 'game') {
          root.querySelectorAll('input[name=diff]').forEach(r => r.onchange = () => { s.difficulty = r.value; s.difficultySet = true; save(); });
          root.querySelector('#inb').onchange = e => { s.inbound = e.target.checked; save(); };
          root.querySelector('#ash').onchange = e => { s.autoShift = e.target.checked; save(); };
        } else if (tab === 'look') {
          root.querySelector('#mute').onchange = e => { s.muted = e.target.checked; save(); };
          root.querySelector('#vol').oninput = e => { s.volume = parseFloat(e.target.value); save(); render(); };
          root.querySelectorAll('[data-wp]').forEach(b => b.onclick = () => { s.wallpaper = +b.dataset.wp; save(); SO.os.drawWallpaper(); render(); });
        } else {
          const ta = root.querySelector('#json');
          root.querySelector('#exp').onclick = () => { ta.value = SO.save.exportJSON(); ta.select(); document.execCommand('copy'); SO.notify('Exported', 'Save JSON copied to clipboard.', 'info'); };
          root.querySelector('#imp').onclick = () => {
            try { SO.save.importJSON(ta.value); SO.notify('Imported', 'Save state restored.', 'tip'); G.emit(); render(); }
            catch (e) { SO.msgbox({ title: 'Invalid JSON', icon: 'error', text: e.message }); }
          };
          root.querySelector('#wipe').onclick = async () => {
            const r = await SO.msgbox({ title: 'Factory Reset', icon: 'warn', text: 'Wipe all progress, leads, and cash? Your Groq API key will be preserved.', buttons: ['Cancel', 'Wipe Everything'] });
            if (r === 1) { const key = s.groqKey; SO.save.reset(); SO.save.d.settings.groqKey = key; SO.save.save(); SO.fs.init(true); G.emit(); render(); }
          };
        }
      }
      render();
    }
  });
})();
