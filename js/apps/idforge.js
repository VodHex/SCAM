/* SCAM OS - ID Forge & Registry.
   1) Forge: builds entirely fictional identity badges ("authority" covers) the scammer
      can flash during a live call (the AI reacts) or print to the fake Desktop.
   2) Registry: lists Personal-info payloads (stolen dossiers) with every data field
      exposed - maiden names, first pets, online-banking credentials - so the bank's
      security questions can be beaten, plus a paid records-lookup for leads you have not
      phished yet. Every person, badge and phone number here is generated fiction. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);
  const D = () => SO.save.d;
  const G = SO.game;
  const digits = n => { let o = ''; for (let i = 0; i < n; i++) o += Math.floor(Math.random() * 10); return o; };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  const FIRST = ['Chadwick', 'Brad', 'Randall', 'Dominic', 'Alvin', 'Terrence', 'Lenny', 'Maurice', 'Stan', 'Gordon', 'Vernon', 'Darryl', 'Wilbur', 'Hank', 'Merle', 'Ambrose', 'Delmar', 'Spencer', 'Colton', 'Roland'];
  const LAST = ['Blobberdeck', 'Truckle', 'Farnsworth', 'Grimsby', 'Quimby', 'Latzke', 'Bunsen', 'Huddle', 'Spackle', 'Rudge', 'McSporran', 'Vandersnoot', 'Plimpton', 'Dobbins', 'Featherstone', 'Crumb', 'Hackett', 'Dooley', 'Bricker', 'Mudd'];

  const ARCH = [
    { t: 'Bank Fraud Officer', orgs: ['FrontLine National - Fraud Desk', 'Meridian Trust Security Office', 'Crestbank Financial Protection Div.'], memos: ['Following up on the complaint you filed earlier today.', 'There is a pending reversal on your account; the file has to be closed today.'] },
    { t: 'Medicare Inspector', orgs: ['National Health Audit Unit', 'Federal Medical Billing Oversight'], memos: ['We are auditing your new card in the mail - confirm you received it.', 'Your current plan shows an unused benefit that expires this week.'] },
    { t: 'Federal Agent', orgs: ['Federal Bureau of Consumer Affairs', 'Interstate Compliance Bureau (fictional)'], memos: ['A parcel of undeclared goods was seized carrying your name.', 'The warrant on your file is awaiting one final signature.'] },
    { t: 'Internal Revenue Officer', orgs: ['Fictional Revenue Service - Collections', 'Bureau of Tax Compliance'], memos: ['The balance on file grows every day it is unpaid.', 'Legal paperwork is scheduled for delivery to your home address.'] },
    { t: 'Tech Support Engineer', orgs: ['Certified Windows Repair Network', 'GlobalPC Support Center (fictional)'], memos: ['The error logs from your machine just got worse.', 'Our engineers need one clearance step before the remote fix.'] },
    { t: 'Delivery Courier Manager', orgs: ['UltrPost Regional Depot', 'ParcelLine Customs Office'], memos: ['Your parcel is on the scanner as "held - ID required".', 'The driver needs one verbal clearance before re-attempting delivery.'] },
    { t: 'Utility Field Agent', orgs: ['City Power & Water - Disconnection Unit', 'Regional Utilities Enforcement'], memos: ['The meter team is at your street right now.', 'The cutoff order prints at the end of the day.'] },
    { t: 'Police Detective', orgs: ['County Fraud Squad (fictional)', 'Metropolitan Cybercrime Unit'], memos: ['I spoke to your bank this morning; the trail is warm.', 'You are listed as a witness, not a suspect - so far.'] },
    { t: 'ROI Investment Manager', orgs: ['GrandView Capital Partners', 'Sterling Yield Group'], memos: ['The allocation window closes before the market opens Monday.', 'Tier-one accounts only; I am bending a rule to call you.'] },
    { t: 'Church Charity Worker', orgs: ['St. Bede Benevolent Fund', 'Good Samaritan Relief Drive'], memos: ['The matching gift runs out at midnight tonight.', 'The bishop personally signed your case file.'] }
  ];
  const BADGE = ['FD-' + digits(4), 'BC-' + digits(5), 'INS-' + digits(3) + String.fromCharCode(65 + Math.floor(Math.random() * 26)), 'EPS' + digits(4)];

  function forgeObject() {
    const a = pick(ARCH);
    return {
      id: 'i' + Date.now() + Math.floor(Math.random() * 999),
      arch: a.t,
      name: pick(FIRST) + ' ' + pick(LAST),
      title: (Math.random() < 0.5 ? 'Senior ' : '') + a.t,
      org: pick(a.orgs),
      badge: pick(BADGE),
      phone: '555-' + digits(4),
      memo: pick(a.memos),
      verified: [true, false][Math.floor(Math.random() * 2)],
      issued: new Date().toLocaleDateString()
    };
  }
  function cardText(o) {
    return 'FICTIONAL ID BADGE (SCAM OS parody - this person does not exist)\r\n' +
      '='.repeat(56) + '\r\n' +
      '  NAME:      ' + o.name + '\r\n' +
      '  TITLE:     ' + o.title + '\r\n' +
      '  AGENCY:    ' + o.org + '\r\n' +
      '  BADGE #:   ' + o.badge + '\r\n' +
      '  VERIF TEL: ' + o.phone + '\r\n' +
      '  COVERLINE: ' + (o.memo || '') + '\r\n' +
      '  ISSUED:    ' + o.issued + '\r\n' + '='.repeat(56) + '\r\n';
  }
  function liveCall() { const ac = SO.activeCall; return ac && ac.isActive && ac.isActive() ? ac : null; }
  function flash(o) {
    const ac = liveCall();
    if (!ac) { SO.notify('No one is on the line', 'A badge only counts while the victim can hear you say it. Open a live call first.', 'info'); return false; }
    try { ac.call.tactics.authority = (ac.call.tactics.authority || 0) + 1; } catch (e) { }
    ac.event(G.flashIdEvent(o));
    SO.save.save();
    return true;
  }
  function print(o) {
    const fn = 'ID_' + String(o.name || 'card').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 24) + '.txt';
    const ok = SO.fs.write('C:\\Documents and Settings\\Scammer\\Desktop\\' + fn, cardText(o));
    SO.notify(ok ? 'Badge printed' : 'Print failed', ok ? fn + ' is on the (fake) Desktop. Notepad can open it.' : 'The fake filesystem refused the write.', ok ? 'tip' : 'error', { sound: ok ? 'ding' : 'error' });
  }

  function open() {
    let tab = 'Forge', draft = null;
    let unsubG = null, unsubFs = null;
    const w = SO.wm.open({ id: 'idforge', title: 'ID Forge & Registry', icon: 'id', w: 660, h: 540, minW: 500, minH: 420, onClose: () => { if (unsubG) unsubG(); if (unsubFs) unsubFs(); } });
    if (!w.fresh) return w;
    w.body.innerHTML = '<div class="tabs" id="if-tabs"></div><div class="scroll grow pad" id="if-b"></div>';

    function render() {
      const tabs = w.body.querySelector('#if-tabs'); tabs.innerHTML = '';
      [['Forge', 'Forge'], ['Registry', 'Registry']].forEach(([k, t]) => {
        const e = document.createElement('div'); e.className = 'tab' + (k === tab ? ' on' : '');
        e.textContent = t; e.onclick = () => { tab = k; render(); }; tabs.appendChild(e);
      });
      tab === 'Forge' ? renderForge() : renderRegistry();
    }

    /* ---------------- Forge tab ---------------- */
    function renderForge() {
      const b = w.body.querySelector('#if-b');
      if (!draft) draft = forgeObject();
      const onCall = !!liveCall();
      const field = (k, label, ml) =>
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><b style="width:92px;flex:none;font-size:17px">' + label + '</b>' +
        '<input class="xp-input grow" data-f="' + k + '" maxlength="' + (ml || 40) + '" autocomplete="off" spellcheck="false" value="' + esc(draft[k] || '') + '"></div>';
      b.innerHTML =
        '<div class="card" style="padding:10px">' +
        '<div style="display:flex;gap:12px;align-items:flex-start">' +
        '<div style="width:120px;flex:none;text-align:center">' + SO.avatar(draft.id, 84, { gender: draft.arch.match(/Officer|Inspector|Detective|Agent/) ? 'male' : 'female' }) + '<div class="muted" style="font-size:15px;margin-top:2px">laminated art</div></div>' +
        '<div class="grow" style="min-width:0">' +
        '<div class="col" style="gap:3px">' +
        field('name', 'Name:', 34) +
        field('title', 'Title:', 40) +
        field('org', ' Agency:', 44) +
        field('badge', 'Badge #:', 14) +
        '<div style="display:flex;gap:8px;margin-bottom:4px"><b style="width:92px;flex:none;font-size:17px">Verif tel:</b><input class="xp-input" data-f="phone" maxlength="10" style="width:120px" autocomplete="off" value="' + esc(draft.phone || '') + '"><span class="muted" style="font-size:15px;align-self:center">(555-: every number here is fictional)</span></div>' +
        '<div style="display:flex;gap:8px"><b style="width:92px;flex:none;font-size:17px">Coverline:</b><input class="xp-input grow" data-f="memo" maxlength="80" autocomplete="off" value="' + esc(draft.memo || '') + '"></div>' +
        '</div></div></div>' +
        '<div class="muted" style="font-size:15px;margin-top:4px">Cover story &ldquo;' + esc(draft.arch) + '&rdquo; &bull; badge appears in the victim\'s ears, not eyes: it is spoken aloud.</div>' +
        '</div>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">' +
        '<button class="xp-btn" id="if-new">Forge a new cover</button>' +
        '<button class="xp-btn green" id="if-save">Commit to album</button>' +
        '<button class="xp-btn' + (onCall ? ' green' : '') + '" id="if-flash"' + (onCall ? '' : ' title="Open a live call first"') + '>Flash on live call</button>' +
        '<button class="xp-btn" id="if-print">Print to Desktop file</button>' +
        '</div>' +
        '<div class="panel pad muted" style="margin-top:8px;font-size:16px">Nothing here is real: names, badges, agencies and 555-numbers are generated fiction. Real officers never work this way over the phone.</div>';

      b.querySelectorAll('input[data-f]').forEach(i => i.oninput = () => { draft[i.dataset.f] = i.value; });
      b.querySelector('#if-new').onclick = () => { draft = forgeObject(); SO.audio.play('click'); render(); };
      b.querySelector('#if-save').onclick = () => {
        const d = D(); d.ids = d.ids || [];
        d.ids.unshift(Object.assign({}, draft)); d.ids = d.ids.slice(0, 30);
        SO.save.save(); SO.audio.play('win');
        SO.notify('Cover committed', draft.title + ' \u201c' + draft.name + '\u201d joined the album (' + d.ids.length + ').', 'id', { sound: 'win' });
        render();
      };
      b.querySelector('#if-flash').onclick = () => { if (flash(draft)) { SO.audio.play('click'); b.querySelector('#if-flash').textContent = 'Flashed!'; setTimeout(render, 900); } };
      b.querySelector('#if-print').onclick = () => print(draft);
    }

    /* ---------------- Registry tab ---------------- */
    function renderRegistry() {
      const b = w.body.querySelector('#if-b');
      const d = D();
      const ids = d.ids || [];
      /* stolen dossiers: info payloads carrying the full per-victim data set */
      const seen = {};
      const doss = [];
      (d.loot || []).forEach(l => {
        if (l.type === 'info' && l.details) seen[l.details.leadId] = l;
      });
      Object.keys(seen).forEach(leadId => doss.push(seen[leadId]));
      const pend = (d.leads || []).filter(l => !seen[l.id]).map(l => ({ lead: l }));

      let html = '<h3 class="sec" style="margin:2px 0">Cover identity album (' + ids.length + ')</h3>';
      html += ids.length
        ? '<table class="grid"><thead><tr><th>Person</th><th>Title / agency</th><th>Badge</th><th>Issued</th><th nowrap>Actions</th></tr></thead><tbody>' +
          ids.map(i => '<tr>' +
            '<td><b>' + esc(i.name) + '</b></td>' +
            '<td>' + esc(i.title) + '<br><span class="muted" style="font-size:15px">' + esc(i.org) + '</span></td>' +
            '<td style="font-family:monospace">' + esc(i.badge) + '<br><span class="muted" style="font-size:15px">' + esc(i.phone) + '</span></td>' +
            '<td>' + esc(i.issued) + '</td>' +
            '<td nowrap><button class="xp-btn small green" data-flash="' + esc(i.id) + '">Flash</button> <button class="xp-btn small" data-print="' + esc(i.id) + '">Print</button> <button class="xp-btn small red" data-shred="' + esc(i.id) + '">Shred</button></td>' +
            '</tr>').join('') + '</tbody></table>'
        : '<div class="panel pad muted">No covers forged yet. IDs only matter when spoken aloud on a live call &mdash; untruthful lamination is not a crime here, it is the whole gag.</div>';
      html += '<div class="muted" style="font-size:15px;margin:2px 0 6px">"Flash" only works with a victim on the line: it is spoken through the phone.</div>';

      html += '<h3 class="sec">Stolen dossiers from the Wallet (' + doss.length + ')</h3>';
      html += doss.map(l => {
        const det = l.details || {};
        const rows = [
          ['DOB', det.dob], ['Home', det.address], ['Phone', det.phone], ['Email', det.email],
          ['Employer', det.employer], ['SSN (last 4)', det.ssn4],
          ['Maiden name', det.maiden], ['First pet', det.firstPet], ['First car', det.firstCar], ['Childhood street', det.firstStreet]
        ].filter(r => r[1] != null && r[1] !== '').map(r => '<div class="row" style="gap:6px;padding:1px 0"><b style="width:118px;flex:none;font-size:16px">' + esc(r[0]) + ':</b><span class="selectable" style="user-select:text">' + esc(r[1]) + '</span></div>').join('');
        const logins = (det.bankUser ? '<div class="row" style="gap:6px;padding:1px 0"><b style="width:118px;flex:none;font-size:16px">Bank login:</b><span class="selectable" style="user-select:text">' + esc(det.bankUser) + ' / ' + esc(det.bankPass) + '</span></div>' : '');
        const lk = (D().banks || {})[det.leadId];
        const openBtn = lk ? '<button class="xp-btn small green" data-bank-url="' + esc(lk.slug) + '">Open ' + esc(det.bank || 'their bank') + ' site</button>' : '';
        return '<div class="card" style="padding:8px;margin-bottom:6px;flex-direction:column;align-items:stretch;display:flex">' +
          '<div class="row" style="justify-content:space-between"><b>' + SO.iconImg('user', 20) + esc(det.name || l.from) + '</b><span class="tag g">DOSSIER</span></div>' +
          '<div style="margin-top:4px;font-size:17px;line-height:19px">' + rows + logins + '</div>' +
          '<div class="row" style="margin-top:4px;gap:6px">' + openBtn + '<span class="muted" style="font-size:15px">These exact strings answer the bank\'s identity checks.</span></div></div>';
      }).join('');
      if (pend.length) {
        html += '<div class="panel pad" style="margin-top:2px"><b>No dossier yet for ' + pend.length + ' lead(s).</b><div class="muted" style="font-size:16px">A records pull costs $80 and buys the WHOLE dossier &mdash; including the bank\'s security answers &mdash; but raises heat.</div>' +
          '<div class="col" style="gap:3px;margin-top:4px">' + pend.map(x =>
            '<div class="row" style="gap:8px"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>' + esc(x.lead.name) + '</b> <span class="muted">(' + esc(x.lead.bank || 'unknown bank') + ')</span></span><button class="xp-btn small" data-lookup="' + esc(x.lead.id) + '">Pull records ($80)</button></div>'
          ).join('') + '</div></div>';
      }
      if (!ids.length && !doss.length && !pend.length) html += '<div class="panel pad muted">Ghost town. Collect payloads on calls first.</div>';
      b.innerHTML = html;

      b.querySelectorAll('[data-flash]').forEach(bt => bt.onclick = () => {
        const o = (d.ids || []).find(x => x.id === bt.dataset.flash);
        if (o && flash(o)) SO.audio.play('click');
      });
      b.querySelectorAll('[data-print]').forEach(bt => bt.onclick = () => {
        const o = (d.ids || []).find(x => x.id === bt.dataset.print);
        if (o) print(o);
      });
      b.querySelectorAll('[data-shred]').forEach(bt => bt.onclick = () => {
        const i = d.ids.findIndex(x => x.id === bt.dataset.shred);
        if (i < 0) return;
        d.ids.splice(i, 1); SO.save.save(); SO.audio.play('blip'); render();
      });
      b.querySelectorAll('[data-bank-url]').forEach(bt => bt.onclick = () => {
        const host = 'http://www.' + bt.dataset.bankUrl + '.com';
        const ie = SO.wm.get('ie');
        if (ie && ie.navigo) { ie.navigo(host); return; }
        SO.openApp('ie', { url: host });
      });
      b.querySelectorAll('[data-lookup]').forEach(bt => bt.onclick = () => {
        const r = G.recordLookup(bt.dataset.lookup);
        SO.notify(r.ok ? 'Records purchased' : 'Lookup refused', r.msg, r.ok ? 'tip' : 'warn', { sound: r.ok ? 'cash' : 'error' });
        if (r.ok) render();
      });
    }

    const iv = setInterval(() => { if (SO.wm.get('idforge')) render(); else clearInterval(iv); }, 3000);
    unsubG = G.sub(() => { if (SO.wm.get('idforge')) render(); });

    render();
    return w;
  }

  SO.registerApp({ id: 'idforge', name: 'ID Forge', icon: 'id', desktop: true, start: true, order: 7, open });
})();
