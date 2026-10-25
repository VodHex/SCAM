/* SCAM OS - CardRedeem: Gift Card Liquidation Portal (fully manual).
   Simulated parody app - every code is keyed in by the operator's hand and checked
   against fictional retailer servers via G.redeemGiftCode (a code that matches a
   payload taken on a call liquidates at the brand rate; cold checks are risky). */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);
  const G = () => SO.game;
  const D = () => SO.save.d;

  function open(args) {
    args = args || {};
    const w = SO.wm.open({
      id: 'giftredeem', title: 'CardRedeem - Gift Card Liquidation Portal', icon: 'giftcard',
      w: 520, h: 600, minW: 400, minH: 500
    });
    if (!w.fresh) return w;

    const body = w.body;
    let busy = false;

    function render() {
      /* Nothing is auto-listed or auto-picked. The only flow is typing a code in. */
      body.innerHTML =
        '<div class="col grow pad" style="gap:8px;font-family:var(--px)">' +
        // Header
        '<div style="background:linear-gradient(90deg,#990000,#cc2200);color:#fff;border:1px solid #500;padding:6px 12px;display:flex;justify-content:space-between;align-items:center">' +
        '<b style="font-size:22px">GiftZap OTC Liquidator</b><span style="font-size:16px;background:#fff2;padding:2px 6px">EXCHANGE ONLINE</span>' +
        '</div>' +

        // Screen Log
        '<div id="gr-screen" style="background:#111;color:#ffcc00;padding:8px 10px;height:104px;overflow-y:auto;font-size:18px;line-height:22px;box-shadow:inset 2px 2px 0 #000;flex:none">' +
        '<div style="color:#ffe680">TYPE A GIFT-CARD CODE AND CHECK IT</div>' +
        '</div>' +

        // Manual code entry - everything is typed in by hand
        '<div class="card col" style="gap:5px;padding:8px;margin-top:2px">' +
        '<div class="row" style="justify-content:space-between"><b>Manual code entry</b><span class="tag r">RISKY</span></div>' +
        '<div class="row" style="gap:6px">' +
        '<input class="xp-input grow" id="gr-code" placeholder="XXXX-XXXX-XXXX" maxlength="29" style="font-family:monospace;letter-spacing:1px" autocomplete="off">' +
        '<button class="xp-btn" id="gr-manual" style="padding:6px 10px">CHECK &amp; SELL</button>' +
        '</div>' +
        '</div>' +
        '</div>';

      const q = s => body.querySelector(s);
      const scr = q('#gr-screen');

      /* Manual entry: type the code the victim read out. No victim behind it = mostly burned. */
      q('#gr-manual').onclick = async () => {
        if (busy) return;
        const code = q('#gr-code').value.trim();
        if (code.length < 6) {
          scr.innerHTML = '<div style="color:#ff5555">ERROR: ENTER A VALID CARD CODE</div>';
          SO.audio.play('error');
          return;
        }
        busy = true;
        scr.innerHTML = '<div>CONNECTING TO RETAILER CARD SERVERS...</div>';
        SO.audio.play('click');
        await new Promise(r => setTimeout(r, 700));
        scr.innerHTML += '<div>VALIDATING PIN &amp; UNCLAIMED BALANCE...</div>';
        SO.audio.play('blip');
        await new Promise(r => setTimeout(r, 700));
        const r = G().redeemGiftCode(code);
        if (r.ok) {
          scr.innerHTML =
            '<div style="color:#50ff50;font-weight:bold">*** CODE LIQUIDATED ***</div>' +
            '<div style="color:#ffe680">' + esc(r.msg) + '</div>' +
            '<div style="color:#50ff50;font-size:19px">PAYOUT: $' + (r.amt || 0).toLocaleString() + ' DEPOSITED TO WALLET</div>';
          SO.audio.play('cash');
          SO.notify('Gift Card Redeemed', '+' + G().fmt(r.amt || 0) + ' in your Wallet.', 'cash', { sound: 'cash' });
        } else {
          scr.innerHTML =
            '<div style="color:#ff5555;font-weight:bold">*** BALANCE $0.00 ***</div>' +
            '<div style="color:#ff8888">' + esc(r.msg) + '</div>';
          SO.audio.play('error');
          SO.notify('Check failed', r.msg, 'error', { sound: 'error' });
        }
        busy = false;
      };
    }

    render();
    return w;
  }

  SO.registerApp({
    id: 'giftredeem', name: 'CardRedeem', icon: 'giftcard',
    desktop: true, start: true, order: 4, open
  });
})();
