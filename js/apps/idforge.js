/* ID Forge & OSINT Registry - Manual Credential Press & Public Records Search */
(function () {
  const SO = window.SO, G = SO.game, esc = SO.esc;

  const SEALS = [
    { id: 'fed', label: 'Federal Gold Seal', col: '#8a6816', bg: '#f6edd3' },
    { id: 'bank', label: 'Bank Fraud Bureau', col: '#0f2747', bg: '#dde7f3' },
    { id: 'tech', label: 'Enterprise Support Shield', col: '#1f5a43', bg: '#daf0e5' },
    { id: 'util', label: 'Municipal Inspector', col: '#5b224b', bg: '#f0ddf0' },
    { id: 'court', label: 'County Clerk Warrant', col: '#6d1c1c', bg: '#f5dada' }
  ];

  function badgeCard(c) {
    const s = SEALS.find(x => x.id === c.seal) || SEALS[0];
    return '<div style="border:2px solid ' + s.col + ';background:linear-gradient(135deg,' + s.bg + ',#fff);padding:10px 12px;border-radius:8px;box-shadow:0 2px 6px rgba(15,23,42,0.08)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ' + s.col + ';padding-bottom:4px;margin-bottom:6px">' +
        '<div style="font-weight:800;color:' + s.col + ';font-size:12px;letter-spacing:.5px;text-transform:uppercase">★ ' + esc(c.org || 'OFFICIAL') + '</div>' +
        '<span class="mono" style="font-size:10px;background:' + s.col + ';color:#fff;padding:1px 6px;border-radius:4px">ID #' + esc(c.badge || '0000') + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:10px;align-items:center">' +
        '<div style="width:44px;height:52px;background:' + s.col + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;border-radius:6px">' + esc(String(c.name || '?').slice(0, 1).toUpperCase()) + '</div>' +
        '<div style="flex:1;font-size:11px;line-height:1.4">' +
          '<div style="font-size:13px;font-weight:800;color:#0f172a">' + esc(c.name || 'Unnamed') + '</div>' +
          '<div style="color:' + s.col + ';font-weight:700">' + esc(c.title || 'Representative') + '</div>' +
          '<div class="mono muted">Verify Line: ' + esc(c.phone || '800-555-0100') + '</div>' +
          (c.memo ? '<div class="muted" style="font-style:italic">"' + esc(c.memo) + '"</div>' : '') +
        '</div>' +
      '</div></div>';
  }

  SO.registerApp('idforge', {
    title: 'ID Forge & OSINT Public Records', icon: 'id', w: 780, h: 550, minW: 620, minH: 430, singleton: true,
    open() {
      let tab = 'press', searchQ = '', banner = null, unsub = null;
      const draft = {
        name: 'Agent R. Vance',
        title: 'Senior Fraud Investigator',
        org: 'Federal Banking Oversight Division',
        badge: 'FB-' + Math.floor(1000 + Math.random() * 8999),
        phone: '800-555-0142',
        memo: 'Authorized to verify wire holds',
        seal: 'fed'
      };

      const win = SO.wm.open({
        id: 'idforge', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div class="main"></div>',
        onClose: () => unsub && unsub()
      });
      const root = win.body.firstChild;

      function renderPress() {
        const d = SO.save.d;
        const ids = d.ids || [];
        return '<div class="split" style="flex:1;min-height:0">' +
          '<div style="flex:1.1;display:flex;flex-direction:column;gap:8px;padding-right:10px;overflow:auto">' +
            '<div class="group" style="margin:0"><div class="group-title">Mint Cover Identity ($25 per badge)</div>' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
                '<label style="font-size:11px">Operative Name<input class="xp-in" id="id-name" value="' + esc(draft.name) + '"></label>' +
                '<label style="font-size:11px">Official Title<input class="xp-in" id="id-title" value="' + esc(draft.title) + '"></label>' +
                '<label style="font-size:11px">Agency / Institution<input class="xp-in" id="id-org" value="' + esc(draft.org) + '"></label>' +
                '<label style="font-size:11px">Badge / Licence #<input class="xp-in mono" id="id-badge" value="' + esc(draft.badge) + '"></label>' +
                '<label style="font-size:11px">Verification Line<input class="xp-in mono" id="id-phone" value="' + esc(draft.phone) + '"></label>' +
                '<label style="font-size:11px">Seal Style<select class="xp-sel" id="id-seal">' + SEALS.map(s => '<option value="' + s.id + '" ' + (s.id === draft.seal ? 'selected' : '') + '>' + s.label + '</option>').join('') + '</select></label>' +
                '<label style="font-size:11px;grid-column:span 2">Authorization Footnote<input class="xp-in" id="id-memo" value="' + esc(draft.memo) + '"></label>' +
              '</div>' +
            '</div>' +
            '<div class="group" style="margin:0"><div class="group-title">Live Badge Preview</div><div id="id-prev">' + badgeCard(draft) + '</div>' +
              '<div class="row" style="justify-content:space-between;margin-top:8px">' +
                '<span class="muted">Minting cost: <b>$25</b></span>' +
                '<button class="xp-btn green" id="id-print">🖨 Mint Credential ($25)</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div style="flex:1;display:flex;flex-direction:column;min-height:0">' +
            '<div style="font-weight:700;margin-bottom:6px">Minted Cover Badges (' + ids.length + ')</div>' +
            '<div class="sunken" style="flex:1;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:8px">' +
              (ids.length === 0 ? '<div class="muted" style="padding:12px">No cover badges minted yet. Mint a badge on the left and register it as your Active Switchboard Cover.</div>' :
                ids.map(c => {
                  const isAct = d.activeCoverId === c.id;
                  return '<div>' + badgeCard(c) +
                    '<div class="row" style="justify-content:space-between;margin-top:4px">' +
                      (isAct ? '<span class="tag g">ACTIVE SWITCHBOARD COVER</span>' : '<button class="xp-btn" data-act="' + esc(c.id) + '" style="padding:3px 8px;font-size:11px">Set as Active Cover</button>') +
                      '<div class="row">' +
                        '<button class="xp-btn primary" data-flash="' + esc(c.id) + '" style="padding:3px 8px;font-size:11px">State on Live Call</button>' +
                        '<button class="xp-btn red" data-del="' + esc(c.id) + '" style="padding:3px 8px;font-size:11px">Shred</button>' +
                      '</div>' +
                    '</div></div>';
                }).join('')) +
            '</div>' +
          '</div></div>';
      }

      function renderRecords() {
        const d = SO.save.d;
        const leads = (d.leads || []).concat(Object.values(d.pastLeads || {}));
        const unlocked = new Set((d.loot || []).filter(l => l.type === 'info' && l.details).map(l => l.details.leadId || l.from));
        const qClean = searchQ.trim().toLowerCase();
        const matches = qClean
          ? leads.filter(l => (l.name + ' ' + (l.phone || '') + ' ' + (l.city || '') + ' ' + (l.bank || '')).toLowerCase().includes(qClean))
          : leads;

        return '<div style="display:flex;flex-direction:column;flex:1;min-height:0;gap:8px">' +
          '<div class="group" style="margin:0">' +
            '<div class="group-title">County Clerk &amp; OSINT Identity Query ($80 per full background pull)</div>' +
            '<div class="row" style="gap:8px">' +
              '<input class="xp-in" id="osint-q" placeholder="Search by Full Name, Phone Number (555-XXXX), City, or Bank..." value="' + esc(searchQ) + '" style="flex:1">' +
              '<button class="xp-btn" id="osint-clr">Show All (' + leads.length + ')</button>' +
            '</div>' +
            '<div class="muted" style="margin-top:4px;font-size:11px">Full background pulls reveal <b>DOB, SSN Last 4, Mother\'s Maiden Name, First Pet, First Car, and Childhood Street</b> for passing bank security checks.</div>' +
          '</div>' +
          '<div class="sunken" style="flex:1;overflow:auto;padding:8px">' +
            (matches.length === 0 ? '<div class="muted" style="padding:12px">No county records match "' + esc(searchQ) + '".</div>' :
              '<table class="table"><thead><tr><th>Subject</th><th>Line / City</th><th>Unlocked Background Dossier</th><th>Action</th></tr></thead><tbody>' +
              matches.map(l => {
                const openRec = unlocked.has(l.id) || unlocked.has(l.name);
                const doss = openRec ? G.dossierFor(l) : null;
                return '<tr>' +
                  '<td><b>' + esc(l.name) + '</b><div class="muted">' + l.age + ' · ' + esc(l.job) + ' · ' + esc(l.bank) + '</div></td>' +
                  '<td class="mono">' + esc(l.phone || '555-0100') + '<div class="muted" style="font-family:var(--sans)">' + esc(l.city) + '</div></td>' +
                  '<td style="font-size:11px">' + (doss
                    ? '<div><b>DOB:</b> ' + esc(doss.dob) + ' · <b>SSN4:</b> ' + esc(doss.ssn4) + '</div>' +
                      '<div><b>Addr:</b> ' + esc(doss.address) + '</div>' +
                      '<div><b>Maiden:</b> ' + esc(doss.maiden) + ' · <b>Pet:</b> ' + esc(doss.firstPet) + ' · <b>Car:</b> ' + esc(doss.firstCar) + '</div>' +
                      '<div><b>Childhood St:</b> ' + esc(doss.firstStreet) + '</div>'
                    : '<span class="muted">🔒 Sealed County Record — Pull full dossier ($80) or ask on a call</span>') + '</td>' +
                  '<td>' + (openRec ? '<span class="tag g">UNLOCKED</span>' : '<button class="xp-btn primary" data-pull="' + esc(l.id) + '">Pull Record ($80)</button>') + '</td>' +
                '</tr>';
              }).join('') +
              '</tbody></table>') +
          '</div></div>';
      }

      function render() {
        root.innerHTML =
          '<div class="row" style="justify-content:space-between;margin-bottom:6px">' +
            '<div class="row">' +
              '<button class="xp-btn ' + (tab === 'press' ? 'primary' : '') + '" id="t-press">🪪 Credential Press</button>' +
              '<button class="xp-btn ' + (tab === 'rec' ? 'primary' : '') + '" id="t-rec">🗂 OSINT County Records</button>' +
            '</div>' +
            '<span class="muted">Balance: <b>' + G.fmt(SO.save.d.cash) + '</b></span>' +
          '</div>' +
          (banner ? '<div class="banner ' + (banner.ok ? '' : 'err') + '" style="margin-bottom:6px">' + esc(banner.msg) + '</div>' : '') +
          (tab === 'press' ? renderPress() : renderRecords());

        root.querySelector('#t-press').onclick = () => { tab = 'press'; banner = null; render(); };
        root.querySelector('#t-rec').onclick = () => { tab = 'rec'; banner = null; render(); };

        if (tab === 'press') {
          const bindIn = (id, k) => {
            const el = root.querySelector('#' + id);
            if (!el) return;
            el.oninput = el.onchange = () => {
              draft[k] = el.value;
              const p = root.querySelector('#id-prev');
              if (p) p.innerHTML = badgeCard(draft);
            };
          };
          bindIn('id-name', 'name'); bindIn('id-title', 'title'); bindIn('id-org', 'org');
          bindIn('id-badge', 'badge'); bindIn('id-phone', 'phone'); bindIn('id-memo', 'memo'); bindIn('id-seal', 'seal');

          root.querySelector('#id-print').onclick = () => {
            if (!draft.name.trim() || !draft.org.trim()) { banner = { ok: false, msg: 'Every credential needs a name and an agency.' }; render(); return; }
            if (!G.spend(25, 'Minted Cover ID: ' + draft.name + ' (' + draft.org + ')')) { SO.audio.play('error'); banner = { ok: false, msg: 'Printing a badge costs $25.' }; render(); return; }
            const d = SO.save.d; d.ids = d.ids || [];
            const newId = Object.assign({ id: 'id_' + Date.now() }, draft);
            d.ids.unshift(newId);
            if (!d.activeCoverId) d.activeCoverId = newId.id;
            SO.save.save(); SO.audio.play('cash');
            draft.badge = 'FB-' + Math.floor(1000 + Math.random() * 8999);
            banner = { ok: true, msg: 'Minted credential for ' + newId.name + '.' };
            render();
          };
          root.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
            SO.save.d.activeCoverId = b.dataset.act;
            SO.save.save();
            banner = { ok: true, msg: 'Updated active switchboard cover identity.' };
            render();
          });
          root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
            const d = SO.save.d; d.ids = (d.ids || []).filter(x => x.id !== b.dataset.del);
            if (d.activeCoverId === b.dataset.del) d.activeCoverId = (d.ids[0] && d.ids[0].id) || null;
            SO.save.save(); render();
          });
          root.querySelectorAll('[data-flash]').forEach(b => b.onclick = () => {
            const id = (SO.save.d.ids || []).find(x => x.id === b.dataset.flash);
            if (!id) return;
            const ok = G.callEvent(G.flashIdEvent(id));
            banner = ok ? { ok: true, msg: 'Stated ' + id.name + ' (' + id.org + ') on the active call.' } : { ok: false, msg: 'No active call. Dial a target in Softphone first.' };
            render();
          });
        } else {
          const qIn = root.querySelector('#osint-q');
          if (qIn) {
            qIn.oninput = e => {
              searchQ = e.target.value;
              const pos = qIn.selectionStart;
              render();
              const nq = root.querySelector('#osint-q');
              if (nq) { nq.focus(); try { nq.setSelectionRange(pos, pos); } catch (err) {} }
            };
          }
          const clr = root.querySelector('#osint-clr');
          if (clr) clr.onclick = () => { searchQ = ''; render(); };
          root.querySelectorAll('[data-pull]').forEach(b => b.onclick = () => {
            const r = G.recordLookup(b.dataset.pull);
            SO.audio.play(r.ok ? 'cash' : 'error');
            banner = { ok: r.ok, msg: r.msg };
            render();
          });
        }
      }

      unsub = G.sub(render);
      render();
    }
  });
})();
