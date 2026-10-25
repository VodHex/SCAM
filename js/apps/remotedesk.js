/* RemoteDesk - Manual Remote Desktop Handshake & Interactive Victim Workstation */
(function () {
  const SO = window.SO, G = SO.game, esc = SO.esc;

  SO.registerApp('remotedesk', {
    title: 'RemoteDesk — Remote Desktop Client', icon: 'remote', w: 820, h: 550, minW: 660, minH: 440, singleton: true,
    open() {
      let activeLootId = null, subApp = 'files', openFile = null, cmdHistory = [], banner = null, unsub = null;
      const connForm = { clientId: '', pin: '', xferAmt: '400', payee: 'GLOBAL CLEARING LLC' };

      const win = SO.wm.open({
        id: 'remotedesk', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div class="split"></div>',
        onClose: () => unsub && unsub()
      });
      const root = win.body.firstChild;

      function getVictimFiles(det) {
        const lead = (det.leadId && G.leadById(det.leadId)) || G.leads().find(l => l.name === det.name) || { id: det.leadId || 'v1', name: det.name || 'Target', bank: det.bank || 'First Bank', wealth: det.wealth || 1500 };
        const assets = G.ensureVictimAssets(lead);
        const doss = assets ? assets.dossier : G.dossierFor(lead);
        const bank = assets ? assets.bank : G.bankFor(lead, true);
        return {
          lead,
          doss,
          bank,
          files: {
            'Passwords.txt':
              '=== MY SAVED LOGINS (DO NOT SHARE) ===\n' +
              'Bank Portal:  www.' + (bank ? bank.slug : G.slugify(lead.bank)) + '.com\n' +
              'Username:     ' + doss.bankUser + '\n' +
              'Password:     ' + doss.bankPass + '\n' +
              'Email:        ' + doss.email + '\n',
            'Bank_Statement.txt':
              '=== ' + (lead.bank || 'BANK').toUpperCase() + ' MONTHLY STATEMENT ===\n' +
              'Account Holder:     ' + lead.name + '\n' +
              'Checking Balance:   $' + (bank ? bank.checking.toLocaleString() : '1,200') + '\n' +
              'Savings Balance:    $' + (bank ? bank.savings.toLocaleString() : '800') + '\n' +
              'Pre-Auth Wire Cap:  $' + (det.limit || 600) + '\n',
            'Personal_Notes.txt':
              '=== PERSONAL REMINDERS & SECURITY ANSWERS ===\n' +
              'Date of Birth:      ' + doss.dob + '\n' +
              'Address:            ' + doss.address + '\n' +
              'SSN Last 4:         ' + doss.ssn4 + '\n' +
              'Mother Maiden Name: ' + doss.maiden + '\n' +
              'First Pet Name:     ' + doss.firstPet + '\n' +
              'First Car Make:     ' + doss.firstCar + '\n' +
              'Childhood Street:   ' + doss.firstStreet + '\n'
          }
        };
      }

      function render() {
        const d = SO.save.d;
        const sessions = (d.loot || []).filter(l => l.type === 'remote' && !l.used);
        const activeSession = activeLootId ? sessions.find(s => s.id === activeLootId) : null;
        if (activeLootId && !activeSession) activeLootId = null;

        if (!G.owns('t_remote')) {
          root.innerHTML =
            '<div class="main" style="align-items:center;justify-content:center;text-align:center;padding:32px">' +
              '<img src="' + SO.icon('remote') + '" style="width:56px;height:56px">' +
              '<div style="font-size:16px;font-weight:800;margin-top:8px">RemoteDesk Client License Required</div>' +
              '<div class="muted" style="max-width:420px;margin:6px 0 14px">Purchase the <b>Fake Remote-Access App</b> in ScamMart ($350) to establish remote desktop sessions with target workstations.</div>' +
              '<button class="xp-btn primary" id="rd-shop">Open ScamMart</button>' +
            '</div>';
          root.querySelector('#rd-shop').onclick = () => SO.openApp('shop');
          return;
        }

        if (!activeSession) {
          /* ---------- Manual Connection Handshake Screen ---------- */
          root.innerHTML =
            '<div class="main" style="flex:1.2;border-right:1px solid #e2e8f0">' +
              '<div class="row" style="justify-content:space-between;margin-bottom:10px">' +
                '<div><b style="font-size:14px">RemoteDesk — Manual Session Handshake</b><div class="muted">Enter the 9-digit Client ID and 4-digit PIN read aloud by the target</div></div>' +
                '<span class="tag b">TLS 1.3 READY</span>' +
              '</div>' +

              (banner ? '<div class="banner ' + (banner.ok ? '' : 'err') + '" style="margin-bottom:10px"><span>' + esc(banner.msg) + '</span></div>' : '') +

              '<div class="group" style="margin:0 0 12px 0;padding:16px">' +
                '<div class="group-title">Target Workstation Credentials</div>' +
                '<div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;margin-top:4px">' +
                  '<div>' +
                    '<label class="muted" style="font-size:11px;font-weight:600">9-Digit RemoteDesk Client ID</label>' +
                    '<input class="xp-in mono" id="rd-cid" placeholder="XXX-XXX-XXX" maxlength="11" value="' + esc(connForm.clientId) + '" style="font-size:16px;font-weight:700;letter-spacing:1px">' +
                  '</div>' +
                  '<div>' +
                    '<label class="muted" style="font-size:11px;font-weight:600">4-Digit Session PIN</label>' +
                    '<input class="xp-in mono" id="rd-pin" placeholder="XXXX" maxlength="4" value="' + esc(connForm.pin) + '" style="font-size:16px;font-weight:700;letter-spacing:2px">' +
                  '</div>' +
                '</div>' +
                '<div class="row" style="margin-top:12px;justify-content:flex-end">' +
                  '<button class="xp-btn green" id="rd-connect" style="padding:8px 18px">🖥 Establish Remote Session</button>' +
                '</div>' +
              '</div>' +

              '<div class="group" style="margin:0">' +
                '<div class="group-title">Operational Protocol</div>' +
                '<div class="muted" style="font-size:11.5px;line-height:1.5">' +
                  '1. During a call, convince the target to open RemoteDesk (or send them a RemoteDesk link via Scam Tools) and read out their <b>Client ID</b> and <b>PIN</b>.<br>' +
                  '2. Key the 9-digit Client ID and 4-digit PIN above to open their live desktop.<br>' +
                  '3. Once inside their desktop, inspect <code>My Documents\\Passwords.txt</code>, run commands in <code>cmd.exe</code>, or execute a transfer from their pre-authenticated banking session.' +
                '</div>' +
              '</div>' +
            '</div>' +

            /* Right Sidebar: Recorded Remote Credentials Reference */
            '<div class="side" style="width:270px;display:flex;flex-direction:column">' +
              '<div class="group" style="margin:0;flex:1;display:flex;flex-direction:column;overflow:hidden">' +
                '<div class="group-title">Recorded Client IDs (Reference)</div>' +
                '<div class="muted" style="font-size:11px;margin-bottom:6px">Type the Client ID and PIN into the handshake form on the left to connect.</div>' +
                '<div style="overflow:auto;flex:1;display:flex;flex-direction:column;gap:6px;font-size:11px">' +
                  (sessions.length === 0 ? '<div class="muted" style="padding:8px">No active remote handshakes waiting. Convince a target on a call to give you remote access.</div>' :
                    sessions.map(s => {
                      const det = s.details || {};
                      return '<div class="sunken" style="padding:8px">' +
                        '<div class="row" style="justify-content:space-between"><b>' + esc(s.from) + '</b><span class="tag g">WAITING</span></div>' +
                        '<div class="mono" style="margin-top:4px;font-size:12px">ID: <b>' + esc(det.clientId || '000-000-000') + '</b></div>' +
                        '<div class="mono" style="font-size:12px">PIN: <b>' + esc(det.pin || '0000') + '</b> · IP: ' + esc(det.ip || '192.168.1.10') + '</div>' +
                      '</div>';
                    }).join('')
                  ) +
                '</div>' +
              '</div>' +
            '</div>';

          const cidIn = root.querySelector('#rd-cid');
          const pinIn = root.querySelector('#rd-pin');
          if (cidIn) cidIn.oninput = e => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
            connForm.clientId = digits.replace(/(\d{3})(?=\d)/g, '$1-');
            e.target.value = connForm.clientId;
          };
          if (pinIn) pinIn.oninput = e => {
            connForm.pin = e.target.value.replace(/\D/g, '').slice(0, 4);
            e.target.value = connForm.pin;
          };
          const doConnect = () => {
            const r = G.connectRemoteManual(connForm.clientId, connForm.pin);
            if (r.ok && r.loot) {
              activeLootId = r.loot.id;
              subApp = 'files';
              openFile = 'Passwords.txt';
              cmdHistory = [
                'Microsoft Windows [Version 10.0.19045.4894]',
                'C:\\Users\\' + String(r.loot.from || 'User').split(' ')[0] + '> Type "help" for available remote commands.'
              ];
              banner = null;
              SO.audio.play('win');
            } else {
              banner = { ok: false, msg: r.msg };
              SO.audio.play('error');
            }
            render();
          };
          const btn = root.querySelector('#rd-connect');
          if (btn) btn.onclick = doConnect;
          if (pinIn) pinIn.onkeydown = e => { if (e.key === 'Enter') doConnect(); };
          return;
        }

        /* ---------- Connected Victim Workstation Simulation ---------- */
        const det = activeSession.details || {};
        const vf = getVictimFiles(det);

        root.innerHTML =
          '<div class="main" style="padding:0;display:flex;flex-direction:column;background:#0f172a;color:#e2e8f0">' +
            /* Top Remote Session Control Bar */
            '<div style="background:#1e293b;padding:7px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155">' +
              '<div class="row" style="gap:10px">' +
                '<span class="tag g">● LIVE SESSION</span>' +
                '<span class="mono" style="font-size:12px;font-weight:700">' + esc(activeSession.from) + ' (' + esc(det.ip || '192.168.1.42') + ') — ID ' + esc(det.clientId || '') + '</span>' +
              '</div>' +
              '<div class="row" style="gap:6px">' +
                '<button class="xp-btn ' + (subApp === 'files' ? 'primary' : '') + '" id="tab-files" style="padding:4px 10px;font-size:11px">📁 My Documents</button>' +
                '<button class="xp-btn ' + (subApp === 'bank' ? 'primary' : '') + '" id="tab-bank" style="padding:4px 10px;font-size:11px">🏦 Active Bank Session</button>' +
                '<button class="xp-btn ' + (subApp === 'cmd' ? 'primary' : '') + '" id="tab-cmd" style="padding:4px 10px;font-size:11px">⌨ Victim cmd.exe</button>' +
                '<button class="xp-btn red" id="rd-disc" style="padding:4px 10px;font-size:11px">Disconnect</button>' +
              '</div>' +
            '</div>' +

            (banner ? '<div class="banner ' + (banner.ok ? '' : 'err') + '" style="margin:8px 12px 0">' + esc(banner.msg) + '</div>' : '') +

            /* Victim Simulated Desktop Canvas */
            '<div style="flex:1;padding:12px;display:flex;gap:12px;min-height:0">' +
              (subApp === 'files' ? (
                '<div style="width:210px;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px">' +
                  '<div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase">C:\\Users\\' + esc(String(activeSession.from).split(' ')[0]) + '\\Documents</div>' +
                  Object.keys(vf.files).map(fn =>
                    '<button class="xp-btn ' + (openFile === fn ? 'primary' : '') + ' vf-btn" data-fn="' + esc(fn) + '" style="text-align:left;font-size:11.5px;padding:6px 8px">📄 ' + esc(fn) + '</button>'
                  ).join('') +
                  '<hr style="border:none;border-top:1px solid #334155;margin:4px 0">' +
                  '<button class="xp-btn" id="rd-scan" style="text-align:left;font-size:11px;padding:6px 8px">🛡 Run Fake AV Scan on Screen</button>' +
                '</div>' +
                '<div style="flex:1;background:#090d16;border:1px solid #334155;border-radius:8px;padding:12px;display:flex;flex-direction:column">' +
                  '<div class="row" style="justify-content:space-between;margin-bottom:8px;border-bottom:1px solid #1e293b;padding-bottom:6px">' +
                    '<b class="mono" style="color:#38bdf8">' + esc(openFile || 'Select a file') + '</b>' +
                    '<span class="muted" style="font-size:11px">Read-Only Remote File Viewer</span>' +
                  '</div>' +
                  '<pre class="mono" style="flex:1;margin:0;white-space:pre-wrap;font-size:12px;line-height:1.55;color:#e2e8f0">' + esc((openFile && vf.files[openFile]) || '') + '</pre>' +
                '</div>'
              ) : subApp === 'bank' ? (
                '<div style="flex:1;background:#f8fafc;color:#0f172a;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px">' +
                  '<div class="row" style="justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:8px">' +
                    '<div><b style="font-size:15px;color:#1e3a8a">' + esc(det.bank || 'Online Banking') + ' — Pre-Authenticated Desktop Session</b>' +
                      '<div class="muted">Account Holder: ' + esc(activeSession.from) + ' · Pre-Authorized Wire Window: <b>$' + (det.limit || 600) + '</b></div>' +
                    '</div>' +
                    '<span class="tag g">SESSION COOKIE ACTIVE</span>' +
                  '</div>' +
                  '<div class="group" style="margin:0">' +
                    '<div class="group-title">Execute Outbound Wire Transfer from Victim Browser</div>' +
                    '<div style="display:grid;grid-template-columns:2fr 1fr auto;gap:8px;align-items:flex-end">' +
                      '<div><label class="muted" style="font-size:11px">Beneficiary / Mule Payee</label>' +
                        '<input class="xp-in" id="rd-payee" value="' + esc(connForm.payee) + '">' +
                      '</div>' +
                      '<div><label class="muted" style="font-size:11px">Transfer Amount ($ USD)</label>' +
                        '<input class="xp-in mono" id="rd-amt" type="number" min="5" max="' + (det.limit || 600) + '" value="' + esc(connForm.xferAmt) + '">' +
                      '</div>' +
                      '<button class="xp-btn green" id="rd-xfer" style="padding:7px 16px">Submit Wire Transfer</button>' +
                    '</div>' +
                    '<div class="muted" style="margin-top:6px;font-size:11px">Note: Submitting a transfer from the victim\'s screen consumes this remote session. Staying under ~60% of the pre-authorized window ($' + Math.round((det.limit || 600) * 0.6) + ') lowers fraud-block risk.</div>' +
                  '</div>' +
                '</div>'
              ) : (
                /* Victim cmd.exe */
                '<div style="flex:1;background:#090d16;border:1px solid #334155;border-radius:8px;padding:12px;display:flex;flex-direction:column">' +
                  '<div class="mono" id="rd-cmd-out" style="flex:1;overflow:auto;white-space:pre-wrap;font-size:12px;line-height:1.5;color:#4ade80">' + esc(cmdHistory.join('\n')) + '</div>' +
                  '<div class="row" style="margin-top:8px;border-top:1px solid #1e293b;padding-top:8px">' +
                    '<span class="mono" style="color:#4ade80;font-size:12px">C:\\Users\\' + esc(String(activeSession.from).split(' ')[0]) + '&gt;</span>' +
                    '<input class="mono" id="rd-cmd-in" placeholder="Type command: help, dir, netstat, miner.exe --install, syskey.exe --lock" style="flex:1;background:transparent;border:none;color:#f8fafc;outline:none;font-size:12px">' +
                    '<button class="xp-btn" id="rd-cmd-run" style="padding:3px 10px;font-size:11px">Run</button>' +
                  '</div>' +
                '</div>'
              )) +
            '</div>' +
          '</div>';

        const bind = (sel, fn) => { const el = root.querySelector(sel); if (el) el.onclick = fn; };
        bind('#tab-files', () => { subApp = 'files'; render(); });
        bind('#tab-bank', () => { subApp = 'bank'; render(); });
        bind('#tab-cmd', () => { subApp = 'cmd'; render(); });
        bind('#rd-disc', () => { activeLootId = null; render(); });

        root.querySelectorAll('.vf-btn').forEach(b => b.onclick = () => {
          openFile = b.dataset.fn;
          // If operator opens Passwords.txt, ensure the banklogin is also recorded in d.loot for reference
          if (openFile === 'Passwords.txt' && vf.lead) {
            const exists = (d.loot || []).some(l => l.type === 'banklogin' && l.from === vf.lead.name);
            if (!exists) {
              const bl = G.makeLoot('banklogin', 200, vf.lead);
              d.loot.unshift(bl);
              SO.save.save();
            }
          }
          render();
        });

        bind('#rd-scan', () => {
          G.callEvent('A terrifying fake security scanner window just ran on my computer screen and says "14 CRITICAL TROJANS FOUND - IMMEDIATE REMEDIATION REQUIRED"!');
          banner = { ok: true, msg: 'Displayed fake critical threat scan on ' + activeSession.from + '\'s monitor.' };
          render();
        });

        const payeeIn = root.querySelector('#rd-payee');
        if (payeeIn) payeeIn.oninput = e => { connForm.payee = e.target.value; };
        const amtIn = root.querySelector('#rd-amt');
        if (amtIn) amtIn.oninput = e => { connForm.xferAmt = e.target.value; };
        bind('#rd-xfer', () => {
          const r = G.remoteAction(activeSession.id, 'transfer', Number(connForm.xferAmt || 0));
          banner = { ok: r.ok, msg: r.msg };
          SO.audio.play(r.ok ? 'cash' : 'error');
          render();
        });

        const cmdIn = root.querySelector('#rd-cmd-in');
        const execCmd = () => {
          if (!cmdIn) return;
          const raw = cmdIn.value.trim();
          if (!raw) return;
          cmdHistory.push('C:\\Users\\' + String(activeSession.from).split(' ')[0] + '> ' + raw);
          const low = raw.toLowerCase();
          if (low === 'help') {
            cmdHistory.push(
              'Available Remote Workstation Commands:\n' +
              '  dir                  List files in user Documents directory\n' +
              '  netstat              Show active TCP connections (frequently used in tech support pretexts)\n' +
              '  tree                 Print directory tree on target screen\n' +
              '  miner.exe --install  Install persistent silent crypto-miner daemon (+Bot nodes)\n' +
              '  syskey.exe --lock    Lock target workstation with ransom demand screen'
            );
          } else if (low === 'dir') {
            cmdHistory.push(' Volume in drive C is OS\n Directory of C:\\Users\\' + String(activeSession.from).split(' ')[0] + '\\Documents\n\n  Passwords.txt          Bank_Statement.txt     Personal_Notes.txt');
          } else if (low.startsWith('netstat')) {
            cmdHistory.push('Active Connections\n  Proto  Local Address          Foreign Address        State\n  TCP    ' + (det.ip || '192.168.1.42') + ':49812   198.51.100.44:443      ESTABLISHED\n  TCP    ' + (det.ip || '192.168.1.42') + ':49819   203.0.113.88:8080      TIME_WAIT');
            G.callEvent('You opened black command prompt windows with numbers scrolling on my screen and told me those foreign IP addresses are hackers.');
          } else if (low.startsWith('tree')) {
            cmdHistory.push('Folder PATH listing for volume OS\nC:\\WINDOWS\\SYSTEM32\n├───config\n├───drivers\n└───wbem\n[SCAN COMPLETE: 0 ERRORS]');
          } else if (low.includes('miner')) {
            const r = G.remoteAction(activeSession.id, 'bot');
            cmdHistory.push(r.msg);
            banner = { ok: r.ok, msg: r.msg };
            SO.audio.play(r.ok ? 'win' : 'error');
          } else if (low.includes('syskey')) {
            const r = G.remoteAction(activeSession.id, 'ransom');
            cmdHistory.push(r.msg);
            banner = { ok: r.ok, msg: r.msg };
            SO.audio.play(r.ok ? 'cash' : 'error');
          } else {
            cmdHistory.push("'" + raw + "' is not recognized. Type 'help' for commands.");
          }
          render();
        };
        if (cmdIn) {
          cmdIn.onkeydown = e => { if (e.key === 'Enter') execCmd(); };
          cmdIn.focus();
        }
        bind('#rd-cmd-run', execCmd);
      }

      unsub = G.sub(render);
      render();
    }
  });
})();
