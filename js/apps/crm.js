/* Victim Database (CRM) - Lead Intelligence & Case Notes */
(function () {
  const SO = window.SO, G = SO.game, esc = SO.esc;

  SO.registerApp('crm', {
    title: 'Victim Database — Lead Intelligence', icon: 'crm', w: 800, h: 550, minW: 620, minH: 420, singleton: true,
    open() {
      let sel = null, tab = 'active', q = '', unsub = null;
      const win = SO.wm.open({
        id: 'crm', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div class="split"></div>',
        onClose: () => unsub && unsub()
      });
      const root = win.body.firstChild;

      function angles(L) {
        const st = L.stats || {}, out = [];
        if ((st.tech || 0) < 0.35) out.push('Tech Support');
        if ((st.authorityRespect || 0) > 0.6) out.push('Tax / Authority');
        if ((st.greed || 0) > 0.55) out.push('Sweepstakes / Crypto');
        if ((st.fearfulness || 0) > 0.6) out.push('Bank Fraud Alert');
        if ((st.loneliness || 0) > 0.6) out.push('Friendly Rapport');
        if ((L.age || 40) >= 62) out.push('Grandchild / Family');
        out.push('Courier / Redelivery');
        return out.slice(0, 4);
      }

      function render() {
        const d = SO.save.d;
        const activeLeads = G.leads();
        const archivedLeads = Object.values(d.pastLeads || {});
        const pool = tab === 'active' ? activeLeads : archivedLeads;
        const filtered = pool.filter(L => {
          if (!q) return true;
          const s = (L.name + ' ' + L.city + ' ' + L.bank + ' ' + (L.phone || '') + ' ' + L.job).toLowerCase();
          return s.includes(q.toLowerCase());
        });
        if (!sel || !filtered.find(x => x.id === sel.id)) sel = filtered[0] || null;
        const bar = (lbl, v, c) =>
          '<div class="meter"><span class="lbl">' + lbl + '</span><div class="bar"><i style="width:' + Math.round((v || 0) * 100) + '%;--c:' + c + '"></i></div><span class="val">' + Math.round((v || 0) * 100) + '%</span></div>';

        const dossUnlocked = sel && (d.loot || []).some(l => l.type === 'info' && l.details && l.details.leadId === sel.id);
        const doss = sel && dossUnlocked ? G.dossierFor(sel) : null;

        root.innerHTML =
          '<div class="side" style="width:270px;display:flex;flex-direction:column;gap:8px">' +
            '<div class="row" style="justify-content:space-between">' +
              '<div class="row" style="gap:4px">' +
                '<button class="xp-btn ' + (tab === 'active' ? 'primary' : '') + '" id="t-act" style="padding:4px 8px;font-size:11px">Active (' + activeLeads.length + ')</button>' +
                '<button class="xp-btn ' + (tab === 'past' ? 'primary' : '') + '" id="t-past" style="padding:4px 8px;font-size:11px">Archive (' + archivedLeads.length + ')</button>' +
              '</div>' +
              '<button class="xp-btn" id="gen" style="padding:4px 8px;font-size:11px" ' + (G.isGenerating() ? 'disabled' : '') + '>' + (G.isGenerating() ? '...' : '+5 Leads') + '</button>' +
            '</div>' +
            '<input class="xp-in" id="crm-q" placeholder="Filter name, phone, bank, city..." value="' + esc(q) + '" style="font-size:11px;padding:5px 8px">' +
            '<div style="overflow:auto;flex:1;display:flex;flex-direction:column;gap:4px">' +
              (filtered.map(L =>
                '<div class="card ' + (sel && sel.id === L.id ? 'sel' : '') + '" data-id="' + L.id + '" style="padding:7px 9px">' +
                  '<div class="row" style="gap:8px">' +
                    '<img src="' + SO.avatarUrl(L, false, 64) + '" style="width:36px;height:36px;border-radius:8px;border:1px solid #cbd5e1">' +
                    '<div style="min-width:0;flex:1">' +
                      '<div class="row" style="justify-content:space-between">' +
                        '<b style="font-size:12px">' + esc(L.name) + '</b>' +
                        '<span class="mono" style="font-size:11px;color:#2563eb;font-weight:700">' + esc(L.phone || '555-0100') + '</span>' +
                      '</div>' +
                      '<div class="muted" style="font-size:10px">' + L.age + ' · ' + esc(L.job) + ' · ' + esc(L.bank) + '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>'
              ).join('') || '<div class="muted" style="padding:12px;text-align:center">' + (SO.groq.hasKey() ? 'No leads match filter. Click "+5 Leads" to generate new personas.' : 'Add your Groq API key in Settings > AI first.') + '</div>') +
            '</div>' +
          '</div>' +

          '<div class="main">' +
            (!sel ? '<div class="muted" style="padding:20px">Select a lead from the left directory to inspect their profile.</div>' :
              '<div class="row" style="gap:14px;align-items:flex-start">' +
                '<img src="' + SO.avatarUrl(sel, false, 128) + '" style="width:76px;height:76px;border:1px solid #cbd5e1;border-radius:12px">' +
                '<div style="flex:1">' +
                  '<div class="row" style="justify-content:space-between">' +
                    '<div style="font-size:17px;font-weight:800">' + esc(sel.name) + ' <span class="muted" style="font-weight:500">(' + sel.age + ', ' + esc(sel.gender) + ')</span></div>' +
                    '<span class="tag g">Est. Liquid Wealth: ' + G.fmt(sel.wealth) + '</span>' +
                  '</div>' +
                  '<div class="muted" style="margin-top:2px">' + esc(sel.job) + ' — ' + esc(sel.city) + '</div>' +
                  '<div class="row" style="margin-top:6px;gap:8px;flex-wrap:wrap">' +
                    '<span class="tag b">Phone: <b class="mono">' + esc(sel.phone || '555-0100') + '</b></span>' +
                    '<span class="tag">Bank: <b>' + esc(sel.bank) + '</b></span>' +
                    '<span class="tag">Calls: ' + (sel.called || 0) + '</span>' +
                  '</div>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:5px">' +
                  '<button class="xp-btn mono" id="copy-ph" title="Copy phone number to clipboard">📋 Copy ' + esc(sel.phone || '555-0100') + '</button>' +
                  '<button class="xp-btn" id="open-ph" title="Open Softphone dialpad">📞 Open Softphone</button>' +
                '</div>' +
              '</div>' +

              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">' +
                '<div class="group" style="margin:0">' +
                  '<div class="group-title">Persona &amp; Background</div>' +
                  '<div style="font-size:11.5px;line-height:1.45">' +
                    '<div><b>Temperament:</b> ' + esc(sel.personality) + '</div>' +
                    '<div style="margin-top:3px"><b>Backstory:</b> ' + esc(sel.backstory) + '</div>' +
                    (sel.family ? '<div style="margin-top:3px"><b>Family:</b> ' + esc(sel.family) + '</div>' : '') +
                    '<div style="margin-top:3px"><b>Current Activity:</b> ' + esc(sel.currentActivity) + '</div>' +
                    '<div style="margin-top:3px;color:#16a34a"><b>Exploitable Lever:</b> ' + esc(sel.weakness) + '</div>' +
                    '<div style="margin-top:3px;color:#dc2626"><b>Suspicion Triggers:</b> ' + esc(sel.redFlags) + '</div>' +
                  '</div>' +
                '</div>' +

                '<div class="group" style="margin:0">' +
                  '<div class="group-title">Psychometric Profile</div>' +
                  bar('Tech Literacy', sel.stats.tech, '#2563eb') +
                  bar('Gullibility', sel.stats.gullibility, '#16a34a') +
                  bar('Fear Response', sel.stats.fearfulness, '#d97706') +
                  bar('Authority Respect', sel.stats.authorityRespect, '#7c3aed') +
                  bar('Greed Index', sel.stats.greed, '#ca8a04') +
                  bar('Loneliness', sel.stats.loneliness, '#0891b2') +
                  bar('Patience', sel.stats.patience, '#15803d') +
                '</div>' +
              '</div>' +

              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;flex:1">' +
                '<div class="group" style="margin:0">' +
                  '<div class="group-title">Public Records &amp; Approach Angles</div>' +
                  '<div style="margin-bottom:6px">' +
                    angles(sel).map(a => '<span class="tag b" style="margin:2px">' + esc(a) + '</span>').join(' ') +
                  '</div>' +
                  (doss ? (
                    '<div class="sunken mono" style="padding:6px 8px;font-size:11px;line-height:1.4">' +
                      '<div><b>DOB:</b> ' + esc(doss.dob) + ' · <b>SSN4:</b> ' + esc(doss.ssn4) + '</div>' +
                      '<div><b>Address:</b> ' + esc(doss.address) + '</div>' +
                      '<div><b>Email:</b> ' + esc(doss.email) + '</div>' +
                      '<div><b>Maiden:</b> ' + esc(doss.maiden) + ' · <b>Pet:</b> ' + esc(doss.firstPet) + '</div>' +
                    '</div>'
                  ) : '<div class="muted" style="font-size:11px">Full background dossier locked. Pull county records in <b>ID Forge &amp; Registry</b> ($80) or ask on a call.</div>') +
                '</div>' +

                '<div class="group" style="margin:0;display:flex;flex-direction:column">' +
                  '<div class="group-title">Operator Case Notes (' + esc(sel.name) + ')</div>' +
                  '<textarea class="xp-ta mono" id="lead-note" placeholder="Record call notes, spoken credentials, or pretext details for ' + esc(sel.name) + '..." style="flex:1;resize:none;font-size:11px">' + esc((d.leadNotes && d.leadNotes[sel.id]) || '') + '</textarea>' +
                '</div>' +
              '</div>'
            ) +
          '</div>';

        root.querySelectorAll('.card[data-id]').forEach(el => el.onclick = () => {
          sel = filtered.find(x => x.id === el.dataset.id);
          render();
        });
        const tAct = root.querySelector('#t-act');
        if (tAct) tAct.onclick = () => { tab = 'active'; render(); };
        const tPast = root.querySelector('#t-past');
        if (tPast) tPast.onclick = () => { tab = 'past'; render(); };
        const qIn = root.querySelector('#crm-q');
        if (qIn) {
          qIn.oninput = e => {
            q = e.target.value;
            const pos = qIn.selectionStart;
            render();
            const nq = root.querySelector('#crm-q');
            if (nq) { nq.focus(); try { nq.setSelectionRange(pos, pos); } catch (err) {} }
          };
        }
        const gen = root.querySelector('#gen');
        if (gen) gen.onclick = () => G.refill(5);
        const copyPh = root.querySelector('#copy-ph');
        if (copyPh && sel) copyPh.onclick = () => {
          const num = sel.phone || '555-0100';
          try { navigator.clipboard.writeText(num); } catch (e) {}
          SO.notify('Phone Number Copied', 'Copied ' + num + ' (' + sel.name + '). Key it into Softphone.', 'info');
        };
        const openPh = root.querySelector('#open-ph');
        if (openPh) openPh.onclick = () => SO.openApp('phone');
        const noteEl = root.querySelector('#lead-note');
        if (noteEl && sel) noteEl.oninput = e => {
          d.leadNotes = d.leadNotes || {};
          d.leadNotes[sel.id] = e.target.value;
          SO.save.save();
        };
      }
      unsub = G.sub(render);
      render();
    }
  });
})();
