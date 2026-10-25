/* SCAM OS - Victim Database (CRM): AI-generated fictional leads. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);

  function open() {
    let unsub = null;
    const w = SO.wm.open({ id: 'crm', title: 'Victim Database - TotallyLegit CRM', icon: 'crm', w: 800, h: 520, minW: 560, minH: 340, onClose: () => unsub && unsub() });
    if (!w.fresh) return w;
    const G = SO.game; let sel = null;
    w.body.innerHTML = '<div class="toolbar"><button class="xp-btn small" id="cr-new">Get 5 leads</button><button class="xp-btn small green" id="cr-call">Call selected</button><button class="xp-btn small" id="cr-del">Delete</button><span class="grow"></span><span class="muted" id="cr-info"></span></div>' +
      '<div class="row grow" style="align-items:stretch;gap:0;min-height:0"><div class="panel grow" id="cr-list" style="min-width:0"></div><div class="col scroll selectable" id="cr-det" style="width:300px;padding:10px;border-left:1px solid #aca899;background:#fff;user-select:text;align-items:stretch"></div></div><div class="statusbar"><span id="cr-sb"></span></div>';
    const q = s => w.body.querySelector(s);
    /* Which asks could work on this lead, straight from their AI-generated stats. */
    function angles(L) {
      const s = (L && L.stats) || {}, P = SO.data.PAYLOADS;
      const fits = [
        ['card', 40 + s.authorityRespect * 130 + s.fearfulness * 45 - s.tech * 105],
        ['otp', 30 + s.authorityRespect * 120 + s.fearfulness * 55 - s.tech * 95],
        ['giftcard', 20 + (1 - s.tech) * 95 + s.fearfulness * 55 + (s.gullibility || 0) * 70],
        ['remote', 10 + s.fearfulness * 85 + (1 - s.tech) * 105 + s.authorityRespect * 35],
        ['transfer', 30 + s.authorityRespect * 135 + (s.greed || 0) * 35 - s.tech * 105],
        ['crypto', -10 + (s.greed || 0) * 145 + (s.loneliness || 0) * 55 - s.tech * 55],
        ['info', 15 + (1 - s.tech) * 55 + (s.gullibility || 0) * 65]
      ];
      fits.forEach(f => { f[1] -= s.patience * 60; f[1] += Math.random() * 16 - 8; });
      fits.sort((a, b) => b[1] - a[1]);
      return '<div class="group" style="margin-top:8px;background:#fbfbf6"><div class="gt" style="background:#fbfbf6">Promising asks</div>' +
        fits.slice(0, 2).map(f => esc((P[f[0]] && P[f[0]].label) || f[0]) + (f[1] > 95 ? ' <span class="good">strong fit</span>' : f[1] > 15 ? '' : ' <span class="bad">weak fit</span>')).join('<br>') + '</div>';
    }
    function render() {
      const leads = G.leads();
      if (!leads.find(l => l.id === sel)) sel = leads[0] && leads[0].id;
      q('#cr-info').textContent = SO.groq.hasKey() ? '' : 'No Groq key - Settings';
      q('#cr-new').disabled = G.isGenerating(); q('#cr-new').textContent = G.isGenerating() ? 'Creating...' : 'Get 5 leads';
      q('#cr-sb').textContent = leads.length + ' lead(s)';
      const t = document.createElement('table'); t.className = 'grid';
      t.innerHTML = '<thead><tr><th>Name</th><th>Age</th><th>Job</th><th>City</th><th>Tech</th><th>Calls</th></tr></thead>';
      const tb = document.createElement('tbody');
      leads.forEach(l => {
        const tr = document.createElement('tr'); if (l.id === sel) tr.className = 'sel';
        tr.innerHTML = '<td>' + esc(l.name) + '</td><td>' + l.age + '</td><td>' + esc(l.job) + '</td><td>' + esc(l.city) + '</td><td>' + (l.stats.tech > 0.66 ? 'High' : l.stats.tech > 0.33 ? 'Mid' : 'Low') + '</td><td>' + (l.called || 0) + '</td>';
        tr.onclick = () => { sel = l.id; render(); }; tr.ondblclick = () => SO.openApp('phone', { select: l.id });
        tb.appendChild(tr);
      });
      t.appendChild(tb); const list = q('#cr-list'); list.innerHTML = ''; list.appendChild(t);
      const L = leads.find(l => l.id === sel), det = q('#cr-det');
      det.innerHTML = L ?
        '<div class="row" style="gap:10px;align-items:center">' + SO.avatar(L.id, 64, { gender: L.gender, age: L.age }) +
        '<div style="min-width:0"><div style="font-size:22px;line-height:20px">' + esc(L.name) + '</div><div class="muted" style="font-size:16px">' + L.age + ' / ' + esc(L.job) + '</div><div class="muted" style="font-size:16px">' + esc(L.city) + '</div></div></div>' +
        '<div class="row" style="gap:20px;margin-top:4px;flex-wrap:wrap">' +
        '<div><div class="muted" style="font-size:15px">Bank</div><b>' + esc(L.bank) + '</b></div>' +
        '<div><div class="muted" style="font-size:15px">Est. funds</div><b>$' + (L.wealth || 0).toLocaleString() + '</b></div>' +
        '<div><div class="muted" style="font-size:15px">Calls</div><b>' + (L.called || 0) + '</b></div></div>' +
        '<div class="hr"></div>' +
        '<div class="group"><div class="gt">Personality</div><span class="selectable" style="user-select:text">' + esc(L.personality) + '</span></div>' +
        '<div class="group"><div class="gt">Background</div><span class="selectable" style="user-select:text">' + esc(L.backstory) + '</span></div>' +
        '<div class="group"><div class="gt">Family</div><span class="selectable" style="user-select:text">' + esc(L.family) + '</span></div>' +
        angles(L) +
        (G.owns('t_coach') ? '<div class="group"><div class="gt">Coach notes</div><span>Weak spot: ' + esc(L.weakness) + '</span><br><span>Hates: ' + esc(L.redFlags) + '</span></div>' : '') :
        '<div class="muted">No lead selected.</div>';
    }
    q('#cr-new').onclick = () => G.refill(5);
    q('#cr-call').onclick = () => { if (sel) SO.openApp('phone', { select: sel }); };
    q('#cr-del').onclick = () => { SO.save.d.leads = G.leads().filter(l => l.id !== sel); SO.save.save(); G.emit(); };
    unsub = G.sub(() => { if (SO.wm.get('crm')) render(); });
    render();
    return w;
  }
  SO.registerApp({ id: 'crm', name: 'Victim Database', icon: 'crm', desktop: true, start: true, order: 2, open });
})();
