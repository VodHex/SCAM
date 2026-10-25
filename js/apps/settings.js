/* SCAM OS - Settings: Groq AI, audio, gameplay, wallpaper, data. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);

  function open(args) {
    const w = SO.wm.open({ id: 'settings', title: 'Control Panel - Settings', icon: 'settings', w: 620, h: 560, minW: 460, minH: 360 });
    if (!w.fresh) return w;
    const s = SO.save.d.settings; let tab = (args && args.tab) || 'AI';
    w.body.innerHTML = '<div class="tabs" id="st-tabs"></div><div class="scroll grow pad" id="st-b"></div>';
    const q = x => w.body.querySelector(x);
    const row = (label, html) => '<div class="row" style="gap:10px"><div style="width:170px;flex:none">' + label + '</div><div class="grow row" style="gap:6px">' + html + '</div></div>';
    /* Every tab is a full-height column: rows spread with even gaps and action
       buttons anchor to the bottom, so no tab is left with dead space. */
    const COL = h => '<div style="display:flex;flex-direction:column;gap:18px;height:100%">' + h + '</div>';
    const BOTTOM = h => '<div style="margin-top:auto">' + h + '</div>';
    function render() {
      const tabs = q('#st-tabs'); tabs.innerHTML = '';
      ['AI', 'Audio', 'Gameplay', 'Display', 'Data'].forEach(t => { const e = document.createElement('div'); e.className = 'tab' + (t === tab ? ' on' : ''); e.textContent = t; e.onclick = () => { tab = t; render(); }; tabs.appendChild(e); });
      const b = q('#st-b'); b.innerHTML = '';
      if (tab === 'AI') {
        b.innerHTML = COL(
          row('Groq API key', '<input class="xp-input grow" id="st-key" type="password" placeholder="gsk_..." value="' + esc(s.groqKey) + '"><button class="xp-btn small" id="st-show">Show</button>') +
          row('Chat model', '<select class="xp-input grow" id="st-chat">' + SO.groq.MODELS.map(m => '<option value="' + m + '"' + (m === s.chatModel ? ' selected' : '') + '>' + m + '</option>').join('') + '</select>') +
          BOTTOM('<div class="row" style="gap:10px"><button class="xp-btn green" id="st-test">Save &amp; test connection</button><span id="st-res" class="muted"></span></div>')
        );
        const save = () => { s.groqKey = q('#st-key').value.trim(); s.chatModel = q('#st-chat').value.trim() || 'openai/gpt-oss-20b'; SO.save.save(); };
        q('#st-show').onclick = () => { const k = q('#st-key'); k.type = k.type === 'password' ? 'text' : 'password'; };
        q('#st-test').onclick = async () => {
          save(); const r = q('#st-res'); r.className = 'muted'; r.textContent = 'Testing...';
          try { const t = await SO.groq.test(); r.className = 'good'; r.textContent = 'Connected! ' + t.model + ' answered in ' + t.ms + ' ms.'; q('#st-chat').value = t.model; SO.game.emit(); }
          catch (e) { r.className = 'bad'; r.textContent = e.message; }
        };
      } else if (tab === 'Audio') {
        b.innerHTML = COL(
          '<h3 class="sec" style="margin:0">Audio</h3>' + row('System volume', '<input type="range" min="0" max="1" step="0.05" id="st-vol" class="grow" value="' + s.volume + '">') +
          row('Mute', '<label><input type="checkbox" id="st-mute"' + (s.muted ? ' checked' : '') + '> Mute everything</label>') +
          row('Microphone', '<label><input type="checkbox" id="st-am"' + (s.autoMic !== false ? ' checked' : '') + '> Auto mic on call connect</label>') +
          row('Echo protection', '<label><input type="checkbox" id="st-hp"' + (s.headphones ? ' checked' : '') + '> I use headphones</label>') +
          BOTTOM(row('Test sound', '<button class="xp-btn small" id="st-snd">Play</button>'))
        );
        q('#st-vol').oninput = e => { s.volume = +e.target.value; SO.save.save(); };
        q('#st-vol').onchange = () => SO.audio.play('ding');
        q('#st-mute').onchange = e => { s.muted = e.target.checked; SO.save.save(); SO.refreshTray(); };
        q('#st-hp').onchange = e => { s.headphones = e.target.checked; SO.save.save(); };
        q('#st-am').onchange = e => { s.autoMic = e.target.checked; SO.save.save(); };
        q('#st-snd').onclick = () => SO.audio.play('notify');
      } else if (tab === 'Gameplay') {
        b.innerHTML = COL(
          '<h3 class="sec" style="margin:0">Gameplay</h3>' +
          row('Difficulty', '<select class="xp-input" id="st-diff"><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select>') +
          row('Victim voices (TTS)', '<label><input type="checkbox" id="st-ttson"' + (s.ttsOn ? ' checked' : '') + '> Speak victim replies aloud</label>') +
          row('Victim voice speed', '<input type="range" min="0.9" max="1.5" step="0.02" id="st-vs" class="grow" value="' + (s.voiceSpeed || 1.12) + '"><span id="st-vsv" style="width:48px">' + (s.voiceSpeed || 1.12).toFixed(2) + 'x</span>') +
          row('Inbound calls', '<label><input type="checkbox" id="st-inb"' + (s.inbound !== false ? ' checked' : '') + '> Let victims phone you</label>') +
          row('Auto shift', '<label><input type="checkbox" id="st-as"' + (s.autoShift !== false ? ' checked' : '') + '> End the day after 8 calls</label>')
        );
        q('#st-diff').value = s.difficulty; q('#st-diff').onchange = e => { s.difficulty = e.target.value; s.difficultySet = true; SO.save.save(); };
        q('#st-ttson').onchange = e => { s.ttsOn = e.target.checked; SO.save.save(); };
        q('#st-vs').oninput = e => { s.voiceSpeed = +e.target.value; q('#st-vsv').textContent = s.voiceSpeed.toFixed(2) + 'x'; SO.save.save(); };
        q('#st-inb').onchange = e => { s.inbound = e.target.checked; SO.save.save(); };
        q('#st-as').onchange = e => { s.autoShift = e.target.checked; SO.save.save(); };
      } else if (tab === 'Display') {
        b.innerHTML = COL(
          '<h3 class="sec" style="margin:0">Display</h3>' + row('Wallpaper', '<select class="xp-input" id="st-wp"></select>') +
          row('Effects', '<label><input type="checkbox" id="st-fl"' + (s.flash ? ' checked' : '') + '> Flashing / shaking effects</label>') +
          row('', '<label><input type="checkbox" id="st-crt"' + (s.crt ? ' checked' : '') + '> CRT scanlines</label>'));
        const sel = q('#st-wp'); SO.wallpaperNames.forEach((n, i) => { const o = document.createElement('option'); o.value = i; o.textContent = n; sel.appendChild(o); }); sel.value = s.wallpaper || 0;
        sel.onchange = () => SO.setWallpaper(+sel.value);
        q('#st-fl').onchange = e => { s.flash = e.target.checked; document.body.classList.toggle('noflash', !s.flash); SO.save.save(); };
        q('#st-crt').onchange = e => { s.crt = e.target.checked; document.getElementById('screen').classList.toggle('crt', s.crt); SO.save.save(); };
      } else {
        b.innerHTML = '<h3 class="sec">Data</h3><div class="row" style="flex-wrap:wrap"><button class="xp-btn" id="st-ex">Export save</button><button class="xp-btn" id="st-im">Import save</button><button class="xp-btn red" id="st-rs">Reset all data</button></div><textarea class="xp-input selectable" id="st-ta" style="width:100%;height:160px;margin-top:8px" placeholder="Paste a save here to import."></textarea>';
        q('#st-ex').onclick = () => { const d = JSON.parse(SO.save.exportJSON()); d.settings.groqKey = ''; q('#st-ta').value = JSON.stringify(d, null, 1); };
        q('#st-im').onclick = () => { try { const k = s.groqKey; SO.save.importJSON(q('#st-ta').value); SO.save.d.settings.groqKey = SO.save.d.settings.groqKey || k; SO.save.save(); SO.game.emit(); SO.msgbox({ title: 'Import', text: 'Save imported.', icon: 'info' }); } catch (e) { SO.msgbox({ title: 'Import failed', text: e.message, icon: 'error' }); } };
        q('#st-rs').onclick = async () => { const r = await SO.msgbox({ title: 'Reset', icon: 'warn', text: 'Delete ALL progress, settings and your API key?', buttons: ['Cancel', 'Reset'] }); if (r === 'Reset') { SO.save.reset(); location.reload(); } };
      }
    }
    render();
    return w;
  }
  SO.registerApp({ id: 'settings', name: 'Settings', icon: 'settings', desktop: true, start: true, order: 9, open });
})();
