/* SCAM OS - Wallet: balance, loot handling, bots, ledger. Nothing here is real. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);

  function open() {
    let unsub = null;
    const w = SO.wm.open({ id: 'wallet', title: 'Dark Wallet', icon: 'wallet', w: 713, h: 375, minW: 560, minH: 340, onClose: () => unsub && unsub() });
    if (!w.fresh) return w;
    const G = SO.game;
    /* Older saves: make sure every captured bank login has its own portal site. */
    if (G.healBankLoots) G.healBankLoots();
    w.body.innerHTML = '<div class="scroll grow pad" id="wl"></div>';

    function lootActions(l) {
      if (l.type === 'card') return ' <button class="xp-btn small green" data-open="cardterminal">Open Terminal</button>';
      if (l.type === 'giftcard') return ' <button class="xp-btn small green" data-open="giftredeem">Open CardRedeem</button>';
      if (l.type === 'remote') {
        const hint = G.owns('t_remote') ? '' : ' title="Requires the Remote-Access tool"';
        return ' <button class="xp-btn small green" data-open="remotedesk"' + hint + '>Use Session</button>';
      }
      if (l.type === 'banklogin' && l.details) return ' <button class="xp-btn small green" data-bankurl="' + esc(l.details.slug) + '">Open Bank Site</button>';
      if (l.type === 'info') return ' <button class="xp-btn small green" data-open="idforge">Open ID Forge</button>';
      return ' <button class="xp-btn small" data-id="' + l.id + '">Quick Sell</button>';
    }
    function lootDetail(l) {
      const d = l.details || {};
      if (l.type === 'card') return 'issuer limit $' + (d.limit || 500) + ', charged $' + (d.charged || 0) + (d.tested ? ' (tested)' : '') + (d.flagged ? ' - FLAGGED' : '') + ' - <span class="selectable" style="user-select:text">' + esc(l.data) + '</span>';
      if (l.type === 'giftcard') return 'face $' + (d.faceValue || '?') + ', resale ' + Math.round((d.rate || 0.78) * 100) + '% - <span class="selectable" style="user-select:text">' + esc(d.code || l.data) + '</span>';
      if (l.type === 'remote') return 'ONE session - transfer window $' + (d.limit || 800) + ' - <span class="selectable" style="user-select:text">' + esc(l.data) + '</span>';
      if (l.type === 'otp') return 'one-time code: <span class="selectable" style="user-select:text">' + esc(d.code || '') + '</span> (' + esc(d.bank || 'bank') + ' profile - dies overnight; type it into their bank step-up page in IE)';
      if (l.type === 'banklogin') return 'site www.' + esc(d.slug || '') + '.com - <span class="selectable" style="user-select:text">' + esc(d.user) + ' / ' + esc(d.pass) + '</span> (type them into the site yourself)';
      if (l.type === 'info') return 'dossier for ' + esc(d.name || l.from) + ' - full fields listed in the ID Forge Registry';
      return '<span class="selectable" style="user-select:text">' + esc(l.data) + '</span>';
    }

    function render() {
      const d = SO.save.d;
      const loot = d.loot.map(l => {
        return '<tr><td><span class="tag ' + (l.type === 'card' || l.type === 'giftcard' || l.type === 'remote' ? 'o' : 'g') + '">' + esc(l.type.toUpperCase()) + '</span></td><td>' + esc(l.from) + '</td><td>' + lootDetail(l) + '</td><td>' + G.fmt(l.value) + '</td><td nowrap>' + lootActions(l) + '</td></tr>';
      }).join('');

      const led = d.ledger.slice(0, 12).map(e => '<tr><td>' + new Date(e.t).toLocaleTimeString() + '</td><td>' + esc(e.text) + '</td><td class="' + (e.amt >= 0 ? 'good' : 'bad') + '">' + (e.amt >= 0 ? '+' : '') + G.fmt(e.amt) + '</td></tr>').join('');

      w.body.querySelector('#wl').innerHTML =
        '<div class="card row" style="gap:26px;align-items:center;flex-wrap:wrap;padding:10px 14px">' +
        '<div><div class="muted" style="font-size:16px">Balance</div><b class="good" style="font-size:30px">' + G.fmt(d.cash) + '</b></div>' +
        '<div class="tsep" style="height:36px;width:2px;margin:0"></div>' +
        '<div><div class="muted" style="font-size:16px">Total earned</div><b style="font-size:24px">' + G.fmt(d.totalEarned) + '</b></div>' +
        '<div><div class="muted" style="font-size:16px">Bots</div><b style="font-size:24px">' + d.bots + '</b></div>' +
        '<div><div class="muted" style="font-size:16px">Level / XP</div><b style="font-size:24px">' + G.level() + ' / ' + d.xp + '</b></div></div>' +
        '<h3 class="sec">Captured loot</h3>' +
        (d.loot.length ? '<table class="grid"><thead><tr><th>Type</th><th>From</th><th>Details</th><th>Value</th><th></th></tr></thead><tbody>' + loot + '</tbody></table>' : '<div class="panel pad muted">No loot yet.</div>') +
        '<h3 class="sec">Recent transactions</h3><table class="grid"><tbody>' + (led || '<tr><td class="muted">No transactions.</td></tr>') + '</tbody></table>';

      w.body.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => {
        const r = G.cashout(b.dataset.id);
        if (r) SO.notify(r.ok ? 'Cashed out ' + G.fmt(r.amt) : r.ok === false ? 'Channel failed' : 'No channel', r.ok ? G.fmt(r.amt) + ' added. ' + r.msg : (r.msg || 'The channel failed. Heat +3.'), r.ok ? 'cash' : 'error', { sound: r.ok ? 'cash' : 'error' });
      });

      w.body.querySelectorAll('button[data-open]').forEach(b => b.onclick = () => {
        SO.openApp(b.dataset.open);
      });

      w.body.querySelectorAll('button[data-bankurl]').forEach(b => b.onclick = () => {
        SO.openApp('ie', { url: 'http://www.' + b.dataset.bankurl + '.com' });
      });
    }

    unsub = G.sub(() => { if (SO.wm.get('wallet')) render(); });
    render();
    return w;
  }
  SO.registerApp({ id: 'wallet', name: 'Wallet', icon: 'wallet', desktop: true, start: true, order: 5, open });
})();
