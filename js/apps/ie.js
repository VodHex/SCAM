/* Web Browser - Intranet, Bank Directory & Online Banking Portals */
(function () {
  const SO = window.SO, G = SO.game, esc = SO.esc;

  function themeFor(name) {
    let h = 0; const s = String(name || 'Bank');
    for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    const themes = [
      { bg: '#0f2747', bar: '#193b68', acc: '#e0a024', tag: 'Member FDIC · Equal Housing Lender' },
      { bg: '#153e2e', bar: '#1f5a43', acc: '#7dc95e', tag: 'Personal & Commercial Banking Since 1924' },
      { bg: '#3e1633', bar: '#5b224b', acc: '#f0b651', tag: 'Trusted Community Banking' },
      { bg: '#1e2f44', bar: '#2d4663', acc: '#55b3d9', tag: 'Online Banking Services' },
      { bg: '#3d2412', bar: '#59361c', acc: '#e8a24a', tag: ' Heritage · Stability · Service' }
    ];
    return themes[h % themes.length];
  }

  function findBankBySlug(slug) {
    const d = SO.save.d;
    const s = String(slug || '').toLowerCase();
    for (const k of Object.keys(d.banks || {})) {
      const b = d.banks[k];
      if (b && (b.slug === s || G.slugify(b.bank) === s)) return b;
    }
    const loot = (d.loot || []).find(l => l.type === 'banklogin' && l.details && (l.details.slug === s || G.slugify(l.details.bank) === s));
    if (loot) return { bank: loot.details.bank, slug: loot.details.slug || s };
    for (const l of (d.leads || [])) if (G.slugify(l.bank) === s) return { bank: l.bank, slug: s };
    for (const k of Object.keys(d.pastLeads || {})) { const l = d.pastLeads[k]; if (l && G.slugify(l.bank) === s) return { bank: l.bank, slug: s }; }
    return null;
  }

  function route(url) {
    const u = String(url || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!u || u === 'about:home' || u === 'home' || u === 'www.scamsearch.local') return { kind: 'home', url: 'www.scamsearch.local' };
    if (u === 'www.scammart.local' || u === 'scammart.local') return { kind: 'app', app: 'shop', url: 'www.scammart.local' };
    if (u === 'www.cardredeem.local' || u === 'cardredeem.local') return { kind: 'app', app: 'giftredeem', url: 'www.cardredeem.local' };
    if (u === 'www.ftc.gov' || u === 'ftc.gov' || u === 'www.scamshield.org') return { kind: 'app', app: 'awareness', url: 'www.scamshield.org' };
    if (u === 'www.bankdirectory.org' || u === 'bankdirectory.org') return { kind: 'dir', url: 'www.bankdirectory.org' };
    const m = u.match(/^(?:www\.)?([a-z0-9-]+)\.(?:com|bank|local|co|org)$/);
    if (m) {
      const hit = findBankBySlug(m[1]);
      if (hit) return { kind: 'bank', slug: hit.slug || m[1], bankName: hit.bank, url: 'www.' + (hit.slug || m[1]) + '.com' };
    }
    return { kind: '404', url: u };
  }

  SO.registerApp('ie', {
    title: 'Web Browser', icon: 'ie', w: 800, h: 560, minW: 600, minH: 420, singleton: true,
    open(opts) {
      G.healBankLoots && G.healBankLoots();
      opts = opts || {};
      let cur = route(opts.url || 'www.scamsearch.local');
      let hist = [cur.url], hIdx = 0;
      let session = null, banner = null, view = 'overview';

      const win = SO.wm.open({
        id: 'ie', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div style="display:flex;flex-direction:column;flex:1;min-height:0"></div>',
        api: { go }
      });
      const root = win.body.firstChild;

      function go(url, push) {
        const r = route(url);
        if (r.kind === 'app') { SO.openApp(r.app); return; }
        if (!session || r.kind !== 'bank' || r.slug !== session.slug) { session = null; banner = null; view = 'overview'; }
        cur = r;
        if (push !== false) { hist = hist.slice(0, hIdx + 1); hist.push(r.url); hIdx = hist.length - 1; }
        render();
      }

      function renderHome() {
        const d = SO.save.d;
        const logins = (d.loot || []).filter(l => l.type === 'banklogin' && l.details);
        return '<div style="padding:18px;background:#f8fafc;flex:1;overflow:auto">' +
          '<div style="max-width:660px;margin:0 auto">' +
            '<div style="text-align:center;margin:6px 0 16px">' +
              '<div style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.4px">Workstation Intranet &amp; Web Gateway</div>' +
              '<div class="muted">Type any banking domain into the address bar above (e.g. <span class="mono">www.firstfictionalbank.com</span>) and press Enter</div>' +
            '</div>' +

            '<div class="group">' +
              '<div class="group-title">Recorded Banking Credentials (Reference Notes)</div>' +
              (logins.length === 0
                ? '<div class="muted">No banking credentials recorded yet. Convince a target to share their online banking login on a call, or inspect <code>Passwords.txt</code> via RemoteDesk.</div>'
                : '<div class="muted" style="margin-bottom:6px">Navigate to the institution\'s domain and manually sign in with the username and password:</div>' +
                  '<table class="table"><thead><tr><th>Institution</th><th>Portal Domain</th><th>Username</th><th>Password</th><th>Holder</th></tr></thead><tbody>' +
                  logins.map(l => {
                    const det = l.details;
                    const dom = 'www.' + (det.slug || G.slugify(det.bank)) + '.com';
                    return '<tr>' +
                      '<td><b>' + esc(det.bank || 'Bank') + '</b></td>' +
                      '<td class="mono" style="color:#2563eb;cursor:pointer" data-go="' + esc(dom) + '">' + esc(dom) + '</td>' +
                      '<td class="mono">' + esc(det.user) + '</td>' +
                      '<td class="mono">' + esc(det.pass) + '</td>' +
                      '<td class="muted">' + esc(det.name || l.from) + '</td>' +
                    '</tr>';
                  }).join('') +
                  '</tbody></table>') +
            '</div>' +

            '<div class="group"><div class="group-title">Bookmarks &amp; Directories</div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">' +
                '<a href="#" data-go="www.bankdirectory.org" style="padding:8px 10px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;text-decoration:none;color:#0f172a"><b>🏦 Financial Institution Domain Index</b><div class="muted">Look up portal URLs for all banks</div></a>' +
                '<a href="#" data-go="www.scamshield.org" style="padding:8px 10px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;text-decoration:none;color:#0f172a"><b>🛡 ScamShield Consumer Defense</b><div class="muted">Real-world fraud statistics &amp; protection</div></a>' +
              '</div>' +
            '</div>' +
          '</div></div>';
      }

      function renderDirectory() {
        const d = SO.save.d;
        const allLeads = (d.leads || []).concat(Object.values(d.pastLeads || {}));
        const rows = [];
        const seen = new Set();
        allLeads.forEach(L => {
          const b = G.bankFor(L, true);
          const dom = 'www.' + (b ? b.slug : G.slugify(L.bank)) + '.com';
          if (seen.has(dom)) return;
          seen.add(dom);
          rows.push({ bank: L.bank, dom, holder: L.name, city: L.city });
        });
        return '<div style="padding:18px;background:#f8fafc;flex:1;overflow:auto">' +
          '<div style="max-width:660px;margin:0 auto">' +
            '<div class="group">' +
              '<div class="group-title">Registered Financial Institution Portals (www.bankdirectory.org)</div>' +
              (rows.length === 0 ? '<div class="muted">No active bank portals indexed yet. Generate leads in CRM first.</div>' :
                '<table class="table"><thead><tr><th>Institution Name</th><th>Online Banking Domain</th><th>Branch Region</th></tr></thead><tbody>' +
                rows.map(r =>
                  '<tr><td><b>' + esc(r.bank) + '</b></td>' +
                  '<td class="mono" style="color:#2563eb;cursor:pointer;font-weight:700" data-go="' + esc(r.dom) + '">' + esc(r.dom) + '</td>' +
                  '<td class="muted">' + esc(r.city || 'National') + '</td></tr>'
                ).join('') +
                '</tbody></table>'
              ) +
            '</div>' +
          '</div></div>';
      }

      function renderBankLogin() {
        const th = themeFor(cur.bankName);
        return '<div style="flex:1;overflow:auto;background:#edf1f5;display:flex;flex-direction:column">' +
          '<div style="background:' + th.bg + ';color:#fff;padding:14px 22px;border-bottom:3px solid ' + th.acc + '">' +
            '<div style="font-size:19px;font-weight:800;letter-spacing:.3px">🏦 ' + esc(cur.bankName) + '</div>' +
            '<div style="font-size:11px;opacity:.8">' + th.tag + ' · Online Banking</div>' +
          '</div>' +
          '<div style="padding:22px;max-width:520px;margin:0 auto;width:100%">' +
            (banner ? '<div class="banner ' + (banner.ok ? '' : 'err') + '" style="margin-bottom:10px">' + esc(banner.msg) + '</div>' : '') +
            '<div class="group" style="background:#fff;padding:16px">' +
              '<div class="group-title">Sign on to Online Banking</div>' +
              '<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">' +
                '<label style="font-size:11px;color:#475569;font-weight:600">Username / Online ID<input class="xp-in mono" id="b-user" autocomplete="off" placeholder="Enter customer username" style="margin-top:3px"></label>' +
                '<label style="font-size:11px;color:#475569;font-weight:600">Password<input class="xp-in mono" id="b-pass" type="password" autocomplete="off" placeholder="Enter customer password" style="margin-top:3px"></label>' +
                '<div class="row" style="justify-content:space-between;margin-top:6px">' +
                  '<span class="muted" style="font-size:11px">🔒 256-bit TLS encrypted session</span>' +
                  '<button class="xp-btn primary" id="b-go" style="padding:6px 18px">Sign On</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="sunken" style="padding:10px;font-size:11px;color:#475569;background:#fff">' +
              '<b>Security Notice:</b> Never share your password or one-time security codes over the phone. ' + esc(cur.bankName) + ' representatives will never ask for your verification code.' +
            '</div>' +
          '</div></div>';
      }

      function renderBankQuestion() {
        const th = themeFor(session.bank.bank);
        const d = SO.save.d;
        const doss = (d.dossiers || {})[session.leadId] || {};
        const hasInfo = (d.loot || []).some(l => l.type === 'info' && l.details && (l.details.leadId === session.leadId || l.from === session.lead.name));
        return '<div style="flex:1;overflow:auto;background:#edf1f5;display:flex;flex-direction:column">' +
          '<div style="background:' + th.bg + ';color:#fff;padding:14px 22px;border-bottom:3px solid ' + th.acc + ';display:flex;justify-content:space-between;align-items:center">' +
            '<div><div style="font-size:18px;font-weight:800">🏦 ' + esc(session.bank.bank) + '</div><div style="font-size:11px;opacity:.8">New-Device Identity Verification</div></div>' +
            '<button class="xp-btn" id="b-out">Sign Off</button>' +
          '</div>' +
          '<div style="padding:20px;max-width:540px;margin:0 auto;width:100%">' +
            (banner ? '<div class="banner ' + (banner.ok ? '' : 'err') + '" style="margin-bottom:10px">' + esc(banner.msg) + '</div>' : '') +
            '<div class="group" style="background:#fff;padding:16px">' +
              '<div class="group-title">Confirm Your Identity</div>' +
              '<div style="font-size:12px;margin-bottom:8px">We do not recognize this workstation. Before opening <b>' + esc(session.lead.name) + '\'s</b> accounts, answer the security question on file:</div>' +
              '<div class="sunken" style="padding:10px;background:#fffbeb;border-color:#fde047;font-size:13px;font-weight:700;margin-bottom:8px">❓ ' + esc(session.question.text) + '</div>' +
              '<div class="row" style="gap:8px">' +
                '<input class="xp-in" id="b-ans" placeholder="Type the exact answer on file..." style="flex:1">' +
                '<button class="xp-btn primary" id="b-verify">Continue</button>' +
              '</div>' +
              '<div class="muted" style="margin-top:8px;font-size:11px">Three wrong answers will suspend online access on this profile.</div>' +
            '</div>' +
            (hasInfo
              ? '<div class="group" style="background:#f0fdf4;border-color:#86efac"><div class="group-title">Unlocked Dossier Reference (' + esc(session.lead.name) + ')</div>' +
                '<div style="font-size:11px;display:grid;grid-template-columns:1fr 1fr;gap:4px">' +
                  '<div><b>DOB:</b> ' + esc(doss.dob || '-') + '</div>' +
                  '<div><b>Mother\'s maiden:</b> ' + esc(doss.maiden || '-') + '</div>' +
                  '<div><b>First pet:</b> ' + esc(doss.firstPet || '-') + '</div>' +
                  '<div><b>First car:</b> ' + esc(doss.firstCar || '-') + '</div>' +
                  '<div style="grid-column:span 2"><b>Childhood street:</b> ' + esc(doss.firstStreet || '-') + '</div>' +
                '</div></div>'
              : '<div class="sunken" style="padding:8px 10px;background:#fff;font-size:11px;color:#475569"><b>No dossier on file:</b> Ask ' + esc(session.lead.name) + ' this question on the phone, inspect <code>Personal_Notes.txt</code> via RemoteDesk, or pull their county record in <b>ID Forge &amp; Registry</b> ($80).</div>') +
          '</div></div>';
      }

      function renderBankChallenge() {
        const th = themeFor(session.bank.bank);
        const p = G.bankPending[session.leadId] || {};
        const phoneTail = String(session.phone || '555-0199').slice(-4);
        const live = SO.activeCall && SO.activeCall.isActive && SO.activeCall.isActive() && SO.activeCall.call && SO.activeCall.call.lead && SO.activeCall.call.lead.id === session.leadId;
        return '<div style="flex:1;overflow:auto;background:#edf1f5;display:flex;flex-direction:column">' +
          '<div style="background:' + th.bg + ';color:#fff;padding:14px 22px;border-bottom:3px solid ' + th.acc + ';display:flex;justify-content:space-between;align-items:center">' +
            '<div><div style="font-size:18px;font-weight:800">🏦 ' + esc(session.bank.bank) + '</div><div style="font-size:11px;opacity:.8">Step-Up Verification · Outgoing Transfer</div></div>' +
            '<button class="xp-btn" id="b-cancel">Cancel Transfer</button>' +
          '</div>' +
          '<div style="padding:20px;max-width:560px;margin:0 auto;width:100%">' +
            (banner ? '<div class="banner ' + (banner.ok ? '' : 'err') + '" style="margin-bottom:10px">' + esc(banner.msg) + '</div>' : '') +
            '<div class="group" style="background:#fff;padding:16px">' +
              '<div class="group-title">Enter 6-Digit SMS Security Code</div>' +
              '<div style="font-size:12px;margin-bottom:8px">To approve a transfer of <b>$' + Number(p.amount || 0).toLocaleString() + '</b> to <b>' + esc(p.payee || 'Payee') + '</b>, we sent a 6-digit security code by SMS to <b>(•••) •••-' + esc(phoneTail) + '</b>.</div>' +
              '<div class="row" style="gap:8px;margin:10px 0">' +
                '<input class="xp-in mono" id="b-otp" placeholder="6-digit code" maxlength="8" style="font-size:16px;font-weight:700;letter-spacing:3px;width:180px;text-align:center">' +
                '<button class="xp-btn green" id="b-approve">Approve Transfer</button>' +
                '<button class="xp-btn" id="b-resend">Resend SMS</button>' +
              '</div>' +
              '<div class="muted" style="font-size:11px">' +
                (live
                  ? '📞 <b>Target is on the line:</b> The SMS just buzzed on ' + esc(session.lead.name) + '\'s phone. Convince them to read the 6-digit code out loud to you.'
                  : '⚠️ <b>Target is not on an active call:</b> Dial ' + esc(session.lead.name) + ' (' + esc(session.phone || '') + ') in Softphone and click "Resend SMS" so they receive the text while on the line with you.') +
              '</div>' +
            '</div>' +
          '</div></div>';
      }

      function renderBankAccount() {
        const b = (SO.save.d.banks || {})[session.leadId] || session.bank;
        const lead = session.lead;
        const th = themeFor(b.bank);
        if (b.locked) {
          return '<div style="flex:1;padding:30px;background:#fef2f2;color:#991b1b">' +
            '<div style="font-size:18px;font-weight:800">🔒 ONLINE ACCESS SUSPENDED — ' + esc(b.bank) + '</div>' +
            '<p>Multiple fraud alerts triggered an automatic freeze on ' + esc(lead.name) + '\'s profile. All online transfers are disabled.</p>' +
            '<button class="xp-btn" id="b-out">Sign Off</button></div>';
        }
        if (session.question && !b.verified) return renderBankQuestion();
        if (G.bankPending[session.leadId]) return renderBankChallenge();
        const total = b.checking + b.savings;
        const cap = Math.min(9500, Math.round(Math.max(1200, (lead && lead.wealth ? lead.wealth * 0.55 : 3000))));
        return '<div style="flex:1;overflow:auto;background:#edf1f5;display:flex;flex-direction:column">' +
          '<div style="background:' + th.bg + ';color:#fff;padding:12px 18px;border-bottom:3px solid ' + th.acc + ';display:flex;justify-content:space-between;align-items:center">' +
            '<div><div style="font-size:17px;font-weight:800">🏦 ' + esc(b.bank) + '</div><div style="font-size:11px;opacity:.85">Welcome, ' + esc(lead.name) + ' · Profile flags: ' + (b.flags || 0) + ' / 3</div></div>' +
            '<div class="row">' +
              '<button class="xp-btn ' + (view === 'overview' ? 'primary' : '') + '" id="v-ov">Accounts</button>' +
              '<button class="xp-btn ' + (view === 'xfer' ? 'primary' : '') + '" id="v-xf">Move Money</button>' +
              '<button class="xp-btn" id="b-out">Sign Off</button>' +
            '</div>' +
          '</div>' +
          '<div style="padding:14px 18px;flex:1">' +
            (banner ? '<div class="banner ' + (banner.ok ? '' : 'err') + '" style="margin-bottom:10px">' + esc(banner.msg) + '</div>' : '') +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">' +
              '<div class="sunken" style="padding:10px;background:#fff"><div class="muted">Everyday Checking ···4821</div><div class="mono" style="font-size:18px;font-weight:800;color:#0f2747">' + G.fmt(b.checking) + '</div></div>' +
              '<div class="sunken" style="padding:10px;background:#fff"><div class="muted">Way2Save Savings ···9904</div><div class="mono" style="font-size:18px;font-weight:800;color:#15803d">' + G.fmt(b.savings) + '</div></div>' +
              '<div class="sunken" style="padding:10px;background:#fff"><div class="muted">Per-Transfer Ceiling</div><div class="mono" style="font-size:18px;font-weight:800;color:#b45309">' + G.fmt(cap) + '</div></div>' +
            '</div>' +
            (view === 'xfer'
              ? '<div class="group" style="background:#fff"><div class="group-title">Send Money — External Wire / ACH Transfer</div>' +
                  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
                    '<label style="font-size:11px">From Account<select class="xp-sel" id="b-from"><option value="checking">Checking (' + G.fmt(b.checking) + ')</option><option value="savings">Savings (' + G.fmt(b.savings) + ')</option><option value="all">Checking + Savings (' + G.fmt(total) + ')</option></select></label>' +
                    '<label style="font-size:11px">Recipient / Payee Name<input class="xp-in" id="b-payee" placeholder="e.g. OVERSEAS HOLDINGS LLC"></label>' +
                    '<label style="font-size:11px">Recipient Routing / Account<input class="xp-in mono" id="b-acct" placeholder="e.g. 021000021 / 88412055"></label>' +
                    '<label style="font-size:11px">Amount ($ USD, max ' + G.fmt(Math.min(total, cap)) + ')<input class="xp-in mono" id="b-amt" type="number" min="5" max="' + Math.min(total, cap) + '" step="50" value="' + Math.min(400, Math.round(total * 0.25)) + '"></label>' +
                  '</div>' +
                  '<div class="row" style="justify-content:space-between;margin-top:10px">' +
                    '<span class="muted" style="font-size:11px">Continuing sends a 6-digit SMS verification code to ' + esc(lead.name) + '\'s phone.</span>' +
                    '<button class="xp-btn green" id="b-send">Continue to Verification →</button>' +
                  '</div>' +
                '</div>'
              : '<div class="group" style="background:#fff"><div class="group-title">Posted Activity</div>' +
                  '<table class="table"><thead><tr><th>Date</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>' +
                  (b.txns || []).slice(0, 10).map(t => {
                    const dt = new Date(t.d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return '<tr><td class="muted mono">' + dt + '</td><td>' + esc(t.txt) + '</td><td class="mono" style="text-align:right;color:' + (t.amt >= 0 ? '#16a34a' : '#0f172a') + ';font-weight:600">' + (t.amt >= 0 ? '+' : '-') + '$' + Math.abs(t.amt).toFixed(2) + '</td></tr>';
                  }).join('') +
                  '</tbody></table></div>') +
          '</div></div>';
      }

      function render404() {
        return '<div style="padding:32px;background:#fff;flex:1">' +
          '<h3 style="margin-top:0;color:#dc2626">This site cannot be reached</h3>' +
          '<p class="muted">Server DNS address for <b>' + esc(cur.url) + '</b> could not be found.</p>' +
          '<p class="muted">Click <b>Home</b> or visit <code>www.bankdirectory.org</code> to view registered banking domains.</p>' +
        '</div>';
      }

      function render() {
        const bodyHtml = cur.kind === 'home' ? renderHome() : cur.kind === 'dir' ? renderDirectory() : cur.kind === 'bank' ? (session ? renderBankAccount() : renderBankLogin()) : render404();
        root.innerHTML =
          '<div class="menubar" style="gap:6px;padding:6px 8px">' +
            '<button class="xp-btn" id="ie-back" style="padding:3px 9px" ' + (hIdx <= 0 ? 'disabled' : '') + '>◀</button>' +
            '<button class="xp-btn" id="ie-fwd" style="padding:3px 9px" ' + (hIdx >= hist.length - 1 ? 'disabled' : '') + '>▶</button>' +
            '<button class="xp-btn" id="ie-home" style="padding:3px 9px">🏠 Home</button>' +
            '<button class="xp-btn" id="ie-dir" style="padding:3px 9px">🏦 Bank Index</button>' +
            '<input class="xp-in mono" id="ie-url" value="https://' + esc(cur.url) + '" style="flex:1;padding:4px 8px">' +
            '<button class="xp-btn primary" id="ie-go" style="padding:4px 12px">Go</button>' +
          '</div>' + bodyHtml;

        const u = root.querySelector('#ie-url');
        const nav = () => go(u.value);
        root.querySelector('#ie-go').onclick = nav;
        u.onkeydown = e => { if (e.key === 'Enter') nav(); };
        root.querySelector('#ie-home').onclick = () => go('www.scamsearch.local');
        root.querySelector('#ie-dir').onclick = () => go('www.bankdirectory.org');
        const bk = root.querySelector('#ie-back'); if (bk) bk.onclick = () => { if (hIdx > 0) { hIdx--; go(hist[hIdx], false); } };
        const fw = root.querySelector('#ie-fwd'); if (fw) fw.onclick = () => { if (hIdx < hist.length - 1) { hIdx++; go(hist[hIdx], false); } };

        root.querySelectorAll('[data-go]').forEach(a => a.onclick = e => { e.preventDefault(); go(a.dataset.go); });

        const bgo = root.querySelector('#b-go');
        if (bgo) {
          const submit = () => {
            const usr = root.querySelector('#b-user').value, pas = root.querySelector('#b-pass').value;
            const r = G.bankLogin(usr, pas);
            if (!r.ok) { SO.audio.play('error'); banner = { ok: false, msg: r.msg }; render(); return; }
            if (G.slugify(r.bank.bank) !== G.slugify(cur.bankName) && r.bank.slug !== cur.slug) {
              SO.audio.play('error');
              banner = { ok: false, msg: 'Those credentials belong to ' + r.bank.bank + ' (www.' + r.bank.slug + '.com), not ' + cur.bankName + '.' };
              render(); return;
            }
            SO.audio.play('blip');
            session = { leadId: r.leadId, slug: cur.slug, bank: r.bank, lead: r.lead, question: r.question, phone: r.phone };
            banner = null; view = 'overview'; render();
          };
          bgo.onclick = submit;
          root.querySelector('#b-pass').onkeydown = e => { if (e.key === 'Enter') submit(); };
        }
        const bout = root.querySelector('#b-out');
        if (bout) bout.onclick = () => { delete G.bankPending[session.leadId]; session = null; banner = null; render(); };

        const bver = root.querySelector('#b-verify');
        if (bver) {
          const check = () => {
            const ans = root.querySelector('#b-ans').value;
            const r = G.bankAnswer(session.leadId, ans);
            SO.audio.play(r.ok ? 'win' : 'error');
            if (r.ok) session.question = null;
            banner = { ok: r.ok, msg: r.msg };
            render();
          };
          bver.onclick = check;
          root.querySelector('#b-ans').onkeydown = e => { if (e.key === 'Enter') check(); };
        }

        const vov = root.querySelector('#v-ov'); if (vov) vov.onclick = () => { view = 'overview'; banner = null; render(); };
        const vxf = root.querySelector('#v-xf'); if (vxf) vxf.onclick = () => { view = 'xfer'; banner = null; render(); };

        const bsend = root.querySelector('#b-send');
        if (bsend) bsend.onclick = () => {
          const amt = Number(root.querySelector('#b-amt').value || 0);
          const payee = (root.querySelector('#b-payee').value || '').trim();
          const acct = (root.querySelector('#b-acct').value || '').trim();
          const from = (root.querySelector('#b-from') && root.querySelector('#b-from').value) || 'checking';
          const r = G.bankStartChallenge(session.leadId, { amount: amt, payee, acct, from });
          SO.audio.play(r.ok ? 'blip' : 'error');
          banner = { ok: r.ok, msg: r.msg };
          render();
        };

        const bapp = root.querySelector('#b-approve');
        if (bapp) {
          const finish = () => {
            const otp = (root.querySelector('#b-otp').value || '').trim();
            const r = G.bankMove(session.leadId, null, otp);
            SO.audio.play(r.ok ? 'cash' : 'error');
            banner = { ok: r.ok, msg: r.msg };
            if (r.ok) view = 'overview';
            render();
          };
          bapp.onclick = finish;
          root.querySelector('#b-otp').onkeydown = e => { if (e.key === 'Enter') finish(); };
        }
        const bres = root.querySelector('#b-resend');
        if (bres) bres.onclick = () => {
          const r = G.bankResend(session.leadId);
          SO.audio.play(r.ok ? 'blip' : 'error');
          banner = { ok: r.ok, msg: r.msg };
          render();
        };
        const bcan = root.querySelector('#b-cancel');
        if (bcan) bcan.onclick = () => { delete G.bankPending[session.leadId]; banner = null; render(); };
      }
      render();
    }
  });
})();
