/* Wallet - Financial Clearing Desk, Mule Receiving Coordinates & General Ledger */
(function () {
  const SO = window.SO, G = SO.game, esc = SO.esc;

  SO.registerApp('wallet', {
    title: 'Wallet — Financial Clearing & Ledger', icon: 'wallet', w: 780, h: 550, minW: 620, minH: 430, singleton: true,
    open() {
      let refInput = '', routeMode = 'standard', clearMsg = null, unsub = null;
      const win = SO.wm.open({
        id: 'wallet', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div class="main"></div>',
        onClose: () => unsub && unsub()
      });
      const root = win.body.firstChild;

      function render() {
        const d = SO.save.d, q = G.quota(), pct = Math.min(100, Math.round(d.earnedToday / q * 100));
        const pendingWires = (d.loot || []).filter(l => l.type === 'transfer' || l.type === 'crypto');

        root.innerHTML =
          /* Top KPI Row */
          '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">' +
            '<div class="sunken" style="padding:10px"><div class="muted">Liquid Cash Balance</div><div class="mono" style="font-size:20px;font-weight:800;color:#16a34a">' + G.fmt(d.cash) + '</div></div>' +
            '<div class="sunken" style="padding:10px"><div class="muted">Lifetime Cleared</div><div class="mono" style="font-size:20px;font-weight:800;color:#2563eb">' + G.fmt(d.totalEarned) + '</div></div>' +
            '<div class="sunken" style="padding:10px"><div class="muted">Active Botnet Nodes</div><div class="mono" style="font-size:20px;font-weight:800;color:#7c3aed">' + d.bots + ' <span style="font-size:11px;font-weight:500">($' + (d.bots * 3) + '/20s)</span></div></div>' +
            '<div class="sunken" style="padding:10px"><div class="muted">Receiving Coordinates</div><div class="mono" style="font-size:11px;font-weight:700;color:#0f172a">ACH: 021000021 / 88412055<br>BTC: bc1q9x0m4f8k2l</div></div>' +
          '</div>' +

          /* Daily Shift Quota */
          '<div class="group" style="margin:8px 0 0 0">' +
            '<div class="group-title">Day ' + d.day + ' Shift Quota</div>' +
            '<div class="meter"><span class="lbl">' + G.fmt(d.earnedToday) + ' / ' + G.fmt(q) + '</span><div class="bar"><i style="width:' + pct + '%;--c:' + (pct >= 100 ? '#16a34a' : '#2563eb') + '"></i></div><span class="val">' + pct + '%</span></div>' +
          '</div>' +

          /* Manual Wire & Crypto Settlement Clearing Desk */
          '<div class="group" style="margin:8px 0 0 0">' +
            '<div class="group-title">Manual Wire &amp; Crypto Settlement Clearing Desk</div>' +
            '<div class="muted" style="margin-bottom:6px">When a target initiates a Wire Transfer (<span class="mono">WIRE-XXXXXX</span>) or Bitcoin Transfer (<span class="mono">bc1q...</span>), enter the reference code below to route and clear the funds into cash:</div>' +
            '<div class="row" style="gap:8px">' +
              '<input class="xp-in mono" id="w-ref" placeholder="Type Reference Code (WIRE-XXXXXX or bc1q...)" value="' + esc(refInput) + '" style="flex:1.2;font-weight:700">' +
              '<select class="xp-sel" id="w-route" style="flex:1">' +
                '<option value="standard" ' + (routeMode === 'standard' ? 'selected' : '') + '>Standard Mule Account (85% payout, normal heat)</option>' +
                '<option value="mixer" ' + (routeMode === 'mixer' ? 'selected' : '') + '>Offshore Tumbler / Mixer (75% payout, low heat, high approval)</option>' +
              '</select>' +
              '<button class="xp-btn green" id="w-clear">Verify &amp; Clear</button>' +
            '</div>' +
            (clearMsg ? '<div style="margin-top:6px;font-size:11.5px;font-weight:700;color:' + (clearMsg.ok ? '#16a34a' : '#dc2626') + '">' + esc(clearMsg.text) + '</div>' : '') +
            (pendingWires.length ? (
              '<div class="muted" style="margin-top:6px;font-size:11px">Unsettled Wire/Crypto References on file: ' +
                pendingWires.map(pw => '<span class="mono" style="background:#f1f5f9;padding:2px 6px;border-radius:4px;margin-right:4px;color:#0f172a;font-weight:700">' + esc((pw.details && (pw.details.ref || pw.details.addr)) || pw.data) + ' (' + G.fmt(pw.value) + ')</span>').join(' ') +
              '</div>'
            ) : '') +
          '</div>' +

          /* Split Bottom: Captured Credentials Reference & General Ledger */
          '<div style="display:grid;grid-template-columns:1.25fr 1fr;gap:10px;flex:1;min-height:0;margin-top:8px">' +
            '<div class="group" style="margin:0;display:flex;flex-direction:column;overflow:hidden">' +
              '<div class="group-title">Recorded Credentials &amp; Instruments (' + d.loot.length + ')</div>' +
              '<div class="sunken" style="flex:1;overflow:auto;padding:6px">' +
                (d.loot.length === 0 ? '<div class="muted" style="padding:10px">No unlaundered credentials on file.</div>' :
                  '<table class="table"><thead><tr><th>Type</th><th>Source</th><th>Recorded Data (Key into corresponding app)</th></tr></thead><tbody>' +
                  d.loot.map(l => {
                    const P = SO.data.PAYLOADS[l.type] || { label: l.type };
                    return '<tr>' +
                      '<td><span class="tag b">' + esc(P.label) + '</span></td>' +
                      '<td><b>' + esc(l.from) + '</b></td>' +
                      '<td class="mono" style="font-size:11px">' + esc(l.data) + '</td>' +
                    '</tr>';
                  }).join('') +
                  '</tbody></table>'
                ) +
              '</div>' +
            '</div>' +

            '<div class="group" style="margin:0;display:flex;flex-direction:column;overflow:hidden">' +
              '<div class="group-title">General Cash Ledger</div>' +
              '<div class="sunken" style="flex:1;overflow:auto;padding:6px">' +
                (d.ledger.length === 0 ? '<div class="muted" style="padding:10px">No ledger entries yet.</div>' :
                  '<table class="table"><thead><tr><th>Time</th><th>Entry</th><th style="text-align:right">Amount</th></tr></thead><tbody>' +
                  d.ledger.slice(0, 25).map(e =>
                    '<tr><td class="muted mono">' + new Date(e.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</td>' +
                    '<td>' + esc(e.text) + '</td>' +
                    '<td class="mono" style="text-align:right;font-weight:700;color:' + (e.amt >= 0 ? '#16a34a' : '#dc2626') + '">' + (e.amt >= 0 ? '+' : '-') + G.fmt(Math.abs(e.amt)) + '</td></tr>'
                  ).join('') +
                  '</tbody></table>'
                ) +
              '</div>' +
            '</div>' +
          '</div>';

        const refEl = root.querySelector('#w-ref');
        if (refEl) refEl.oninput = e => { refInput = e.target.value; };
        const rtEl = root.querySelector('#w-route');
        if (rtEl) rtEl.onchange = e => { routeMode = e.target.value; };
        const doClear = () => {
          const r = G.clearReferenceManual(refInput, routeMode);
          clearMsg = { ok: r.ok, text: r.msg };
          if (r.ok) refInput = '';
          SO.audio.play(r.ok ? 'cash' : 'error');
          render();
        };
        const clrBtn = root.querySelector('#w-clear');
        if (clrBtn) clrBtn.onclick = doClear;
        if (refEl) refEl.onkeydown = e => { if (e.key === 'Enter') doClear(); };
      }

      unsub = G.sub(render);
      render();
    }
  });
})();
