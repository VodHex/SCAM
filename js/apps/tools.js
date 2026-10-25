/* Scam Tools - Manual SMS/Email Phishing Gateway & Line Hardware Rack */
(function () {
  const SO = window.SO, G = SO.game, esc = SO.esc;

  const MODULES = [
    { id: 't_popup', name: 'Security Alert Popup Link', desc: 'Dispatches an SMS/email link that triggers a full-screen red antivirus siren warning on the target\'s computer.' },
    { id: 't_bsod', name: 'Kernel Diagnostic Stop Link', desc: 'Dispatches a diagnostic link that triggers a simulated blue-screen kernel stop on the target\'s PC.' },
    { id: 't_form', name: 'SecurePay Verification Form', desc: 'Dispatches an official-looking billing/refund verification link to the target\'s phone or email.' },
    { id: 't_remote', name: 'RemoteDesk Support Installer', desc: 'Dispatches a download link for the RemoteDesk client so the target can read out their 9-digit Client ID & PIN.' }
  ];

  SO.registerApp('tools', {
    title: 'Scam Tools — Phishing Gateway & Hardware Rack', icon: 'tools', w: 720, h: 520, minW: 580, minH: 420, singleton: true,
    open() {
      let targetAddr = '', selMod = 't_popup', senderId = 'SECURITY-ALERT', statusMsg = null, unsub = null;
      const win = SO.wm.open({
        id: 'tools', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div class="main"></div>',
        onClose: () => unsub && unsub()
      });
      const root = win.body.firstChild;

      function render() {
        const d = SO.save.d;
        const ts = d.toolState = d.toolState || { spoof: true, spoofNumber: '', spoofName: '', voice: true, voiceProfile: 'corporate' };
        const ac = SO.activeCall && SO.activeCall.isActive && SO.activeCall.isActive() ? SO.activeCall.call : null;

        root.innerHTML =
          '<div class="row" style="justify-content:space-between">' +
            '<div><b style="font-size:14px">SMS / Email Phishing Gateway &amp; Line Hardware Rack</b>' +
              '<div class="muted">' + (ac ? 'Active Call Line: <b>' + esc(ac.lead.name) + ' (' + esc(ac.lead.phone || '555-0100') + ')</b>' : 'No active call — configure hardware or stage outbound gateway payloads') + '</div>' +
            '</div>' +
            '<button class="xp-btn" id="shop">Open ScamMart</button>' +
          '</div>' +

          /* Manual SMS / Email Phishing Dispatch Console */
          '<div class="group" style="margin:6px 0 0 0">' +
            '<div class="group-title">Manual SMS / Email Payload Dispatch Gateway</div>' +
            '<div style="display:grid;grid-template-columns:1.2fr 1fr 1.3fr;gap:8px">' +
              '<div><label class="muted" style="font-size:11px;font-weight:600">Target Phone (555-XXXX) or Email</label>' +
                '<input class="xp-in mono" id="tg-addr" placeholder="e.g. 555-3819" value="' + esc(targetAddr) + '">' +
              '</div>' +
              '<div><label class="muted" style="font-size:11px;font-weight:600">Spoofed Sender Header</label>' +
                '<input class="xp-in mono" id="tg-sender" placeholder="SECURITY-DESK" value="' + esc(senderId) + '">' +
              '</div>' +
              '<div><label class="muted" style="font-size:11px;font-weight:600">Payload Module</label>' +
                '<select class="xp-sel" id="tg-mod">' +
                  MODULES.map(m => '<option value="' + m.id + '" ' + (selMod === m.id ? 'selected' : '') + '>' + m.name + (G.owns(m.id) ? ' [READY]' : ' [LOCKED]') + '</option>').join('') +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="row" style="justify-content:space-between;margin-top:8px">' +
              '<span class="muted" style="font-size:11px">' + esc((MODULES.find(m => m.id === selMod) || MODULES[0]).desc) + '</span>' +
              '<button class="xp-btn primary" id="tg-send">📡 Transmit Payload</button>' +
            '</div>' +
            (statusMsg ? '<div style="margin-top:6px;font-size:11.5px;font-weight:700;color:' + (statusMsg.ok ? '#16a34a' : '#dc2626') + '">' + esc(statusMsg.text) + '</div>' : '') +
          '</div>' +

          /* Installed Payload Modules Status */
          '<div class="group" style="margin:6px 0 0 0">' +
            '<div class="group-title">Installed Gateway Modules</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
              MODULES.map(m => {
                const owned = G.owns(m.id);
                return '<div class="sunken" style="padding:7px 9px;display:flex;justify-content:space-between;align-items:center">' +
                  '<div><b style="font-size:11.5px">' + esc(m.name) + '</b><div class="muted" style="font-size:10.5px">' + (owned ? 'Module licensed &amp; active' : 'Purchase in ScamMart') + '</div></div>' +
                  '<span class="tag ' + (owned ? 'g' : '') + '">' + (owned ? 'INSTALLED' : 'LOCKED') + '</span>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +

          /* Hardware Rack: Caller-ID Spoofer & Voice Modulator */
          '<div class="group" style="margin:6px 0 0 0;flex:1">' +
            '<div class="group-title">Telecom Hardware Rack Configuration</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
              '<div class="sunken" style="padding:10px">' +
                '<div class="row" style="justify-content:space-between">' +
                  '<b>Caller-ID Spoofer</b>' +
                  '<input type="checkbox" id="hw-spoof" ' + (!G.owns('t_spoof') ? 'disabled' : (ts.spoof !== false ? 'checked' : '')) + '>' +
                '</div>' +
                (G.owns('t_spoof') ? (
                  '<div style="display:flex;flex-direction:column;gap:5px;margin-top:6px">' +
                    '<input class="xp-in" id="hw-spname" placeholder="Spoofed Display Name" value="' + esc(ts.spoofName || '') + '" style="font-size:11px">' +
                    '<input class="xp-in mono" id="hw-spnum" placeholder="Spoofed Number (800-555-0199)" value="' + esc(ts.spoofNumber || '') + '" style="font-size:11px">' +
                  '</div>'
                ) : '<div class="muted" style="margin-top:6px;font-size:11px">Not owned. Purchase in ScamMart ($120).</div>') +
              '</div>' +

              '<div class="sunken" style="padding:10px">' +
                '<div class="row" style="justify-content:space-between">' +
                  '<b>Voice Modulator</b>' +
                  '<input type="checkbox" id="hw-voice" ' + (!G.owns('t_voice') ? 'disabled' : (ts.voice !== false ? 'checked' : '')) + '>' +
                '</div>' +
                (G.owns('t_voice') ? (
                  '<div style="margin-top:6px">' +
                    '<select class="xp-sel" id="hw-vprof" style="width:100%;font-size:11px">' +
                      ['corporate:Corporate Authority','warm:Warm & Empathetic','compliance:Federal Compliance','support:Calm Tech Support'].map(x => {
                        const [v, l] = x.split(':');
                        return '<option value="' + v + '" ' + (ts.voiceProfile === v ? 'selected' : '') + '>' + l + '</option>';
                      }).join('') +
                    '</select>' +
                  '</div>'
                ) : '<div class="muted" style="margin-top:6px;font-size:11px">Not owned. Purchase in ScamMart ($260).</div>') +
              '</div>' +
            '</div>' +
          '</div>';

        root.querySelector('#shop').onclick = () => SO.openApp('shop');
        const addrIn = root.querySelector('#tg-addr');
        if (addrIn) addrIn.oninput = e => { targetAddr = e.target.value; };
        const sndIn = root.querySelector('#tg-sender');
        if (sndIn) sndIn.oninput = e => { senderId = e.target.value; };
        const modIn = root.querySelector('#tg-mod');
        if (modIn) modIn.onchange = e => { selMod = e.target.value; render(); };

        const sendBtn = root.querySelector('#tg-send');
        if (sendBtn) sendBtn.onclick = () => {
          const r = G.sendPhishGateway({ target: targetAddr, toolId: selMod, sender: senderId });
          statusMsg = { ok: r.ok, text: r.msg };
          SO.audio.play(r.ok ? 'blip' : 'error');
          render();
        };

        const spChk = root.querySelector('#hw-spoof');
        if (spChk) spChk.onchange = e => { ts.spoof = e.target.checked; SO.save.save(); };
        const spName = root.querySelector('#hw-spname');
        if (spName) spName.oninput = e => { ts.spoofName = e.target.value; SO.save.save(); };
        const spNum = root.querySelector('#hw-spnum');
        if (spNum) spNum.oninput = e => { ts.spoofNumber = e.target.value; SO.save.save(); };
        const vcChk = root.querySelector('#hw-voice');
        if (vcChk) vcChk.onchange = e => { ts.voice = e.target.checked; SO.save.save(); };
        const vpSel = root.querySelector('#hw-vprof');
        if (vpSel) vpSel.onchange = e => { ts.voiceProfile = e.target.value; SO.save.save(); };
      }

      unsub = G.sub(render);
      render();
    }
  });
})();
