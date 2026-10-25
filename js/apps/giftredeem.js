/* CardRedeem - Manual OTC Gift Card Verification & Broker Desk */
(function () {
  const SO = window.SO, G = SO.game, esc = SO.esc;

  const BRANDS = [
    { name: 'Amazon', prefix: 'AMZN', rate: 88, col: '#d97706' },
    { name: 'Apple', prefix: 'APPL', rate: 84, col: '#334155' },
    { name: 'Target', prefix: 'TARG', rate: 82, col: '#dc2626' },
    { name: 'Google Play', prefix: 'GPLA', rate: 80, col: '#16a34a' },
    { name: 'eBay', prefix: 'EBAY', rate: 78, col: '#2563eb' },
    { name: 'Steam', prefix: 'STEAM', rate: 70, col: '#1e293b' }
  ];

  SO.registerApp('giftredeem', {
    title: 'CardRedeem — OTC Gift Card Exchange', icon: 'gift', w: 720, h: 480, minW: 580, minH: 400, singleton: true,
    open() {
      let typedCode = '', verifiedQuote = null, statusMsg = null, unsub = null;
      const win = SO.wm.open({
        id: 'giftredeem', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div class="split"></div>',
        onClose: () => unsub && unsub()
      });
      const root = win.body.firstChild;

      function render() {
        const gifts = (SO.save.d.loot || []).filter(l => l.type === 'giftcard' && l.details);
        root.innerHTML =
          '<div class="main" style="flex:1.2;border-right:1px solid #e2e8f0">' +
            '<div class="row" style="justify-content:space-between;margin-bottom:8px">' +
              '<div><b style="font-size:14px">OTC Gift Card Verification &amp; Liquidation</b><div class="muted">Step 1: Enter PIN &amp; Verify Balance · Step 2: Accept Broker Bid</div></div>' +
              '<span class="tag g">MARKET OPEN</span>' +
            '</div>' +

            '<div class="group" style="margin:0 0 10px 0">' +
              '<div class="group-title">Live OTC Desk Buy Rates (% of Face Value)</div>' +
              '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">' +
                BRANDS.map(b =>
                  '<div class="sunken" style="padding:5px 8px;display:flex;justify-content:space-between;align-items:center">' +
                    '<b style="color:' + b.col + ';font-size:11px">' + b.name + '</b>' +
                    '<span class="mono" style="font-weight:700;font-size:11px">' + b.rate + '%</span>' +
                  '</div>'
                ).join('') +
              '</div>' +
            '</div>' +

            '<div class="group" style="margin:0 0 10px 0">' +
              '<div class="group-title">Step 1 — Retailer PIN Verification</div>' +
              '<div class="row" style="gap:8px">' +
                '<input class="xp-in mono" id="gc-code" placeholder="XXXX-XXXX-XXXX-XXXX" value="' + esc(typedCode) + '" style="flex:1;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px">' +
                '<button class="xp-btn primary" id="gc-verify">1. Verify Balance</button>' +
                '<button class="xp-btn" id="gc-clr">Clear</button>' +
              '</div>' +
            '</div>' +

            '<div class="group" style="margin:0;flex:1;display:flex;flex-direction:column">' +
              '<div class="group-title">Step 2 — OTC Broker Settlement Quote</div>' +
              (verifiedQuote ? (
                '<div class="sunken" style="padding:12px;background:#f0fdf4;border-color:#86efac;flex:1;display:flex;flex-direction:column;justify-content:space-between">' +
                  '<div>' +
                    '<div class="row" style="justify-content:space-between"><b style="font-size:14px;color:#166534">' + esc(verifiedQuote.brand) + ' Gift Voucher Verified</b><span class="tag g">ACTIVE PIN</span></div>' +
                    '<div class="mono" style="margin-top:6px;font-size:12px">Code: <b>' + esc(verifiedQuote.code) + '</b> · Face Value: <b>$' + verifiedQuote.faceValue + '.00</b></div>' +
                    '<div class="mono" style="margin-top:2px;font-size:12px">OTC Desk Bid (' + Math.round(verifiedQuote.rate * 100) + '%): <b style="color:#15803d;font-size:14px">$' + verifiedQuote.payout + '.00 USD</b></div>' +
                  '</div>' +
                  '<div class="row" style="justify-content:flex-end;margin-top:10px">' +
                    '<button class="xp-btn green" id="gc-sell" style="padding:8px 18px">2. Accept Bid &amp; Liquidate (+$' + verifiedQuote.payout + ')</button>' +
                  '</div>' +
                '</div>'
              ) : (
                '<div class="sunken" style="padding:12px;flex:1;display:flex;align-items:center;justify-content:center;color:#64748b">' +
                  (statusMsg ? '<span style="color:' + (statusMsg.ok ? '#16a34a' : '#dc2626') + ';font-weight:600">' + esc(statusMsg.text) + '</span>' : 'Type a gift card code above and click "1. Verify Balance" to request a broker quote.') +
                '</div>'
              )) +
            '</div>' +
          '</div>' +

          /* Right Sidebar: Captured Gift Card Notes (Read & Type Manually) */
          '<div class="side" style="width:255px;display:flex;flex-direction:column">' +
            '<div class="group" style="margin:0;flex:1;display:flex;flex-direction:column;overflow:hidden">' +
              '<div class="group-title">Recorded Gift Codes (Reference)</div>' +
              '<div class="muted" style="font-size:11px;margin-bottom:6px">Type the code into the verifier on the left to check balance and sell.</div>' +
              '<div style="overflow:auto;flex:1;display:flex;flex-direction:column;gap:6px;font-size:11px">' +
                (gifts.length === 0 ? '<div class="muted" style="padding:8px">No gift codes recorded yet. Convince a target to read out a gift card PIN on a call.</div>' :
                  gifts.map(g => {
                    const det = g.details;
                    return '<div class="sunken" style="padding:7px 8px">' +
                      '<div class="row" style="justify-content:space-between"><b>' + esc(det.brand || 'Retail') + ' ($' + (det.faceValue || g.value) + ')</b><span class="tag ' + (det.verified ? 'g' : 'y') + '">' + (det.verified ? 'VERIFIED' : 'UNCHECKED') + '</span></div>' +
                      '<div class="mono" style="margin-top:4px;font-weight:700;color:#0f172a;font-size:12px">' + esc(det.code) + '</div>' +
                      '<div class="muted" style="margin-top:2px">Source: ' + esc(g.from) + '</div>' +
                    '</div>';
                  }).join('')
                ) +
              '</div>' +
            '</div>' +
          '</div>';

        const codeIn = root.querySelector('#gc-code');
        if (codeIn) {
          codeIn.oninput = e => {
            typedCode = e.target.value.toUpperCase();
            verifiedQuote = null;
          };
          codeIn.onkeydown = e => {
            if (e.key === 'Enter') {
              if (verifiedQuote) sellNow();
              else verifyNow();
            }
          };
        }

        function verifyNow() {
          const r = G.verifyGiftCode(typedCode);
          if (r.ok) {
            verifiedQuote = r;
            statusMsg = null;
            SO.audio.play('blip');
          } else {
            verifiedQuote = null;
            statusMsg = { ok: false, text: r.msg };
            SO.audio.play('error');
          }
          render();
        }

        function sellNow() {
          const codeToSell = (verifiedQuote && verifiedQuote.code) || typedCode;
          const r = G.redeemGiftCode(codeToSell);
          verifiedQuote = null;
          if (r.ok) {
            typedCode = '';
            statusMsg = { ok: true, text: 'SETTLED: +' + G.fmt(r.amt) + ' — ' + r.msg };
          } else {
            statusMsg = { ok: false, text: r.msg };
          }
          render();
        }

        const vBtn = root.querySelector('#gc-verify');
        if (vBtn) vBtn.onclick = verifyNow;
        const sBtn = root.querySelector('#gc-sell');
        if (sBtn) sBtn.onclick = sellNow;
        const cBtn = root.querySelector('#gc-clr');
        if (cBtn) cBtn.onclick = () => { typedCode = ''; verifiedQuote = null; statusMsg = null; render(); };
      }
      unsub = G.sub(render);
      render();
    }
  });
})();
