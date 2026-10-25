/* Card Terminal - Manual Virtual POS Payment Gateway (ISO-8583 Simulation) */
(function () {
  const SO = window.SO, G = SO.game, esc = SO.esc;

  SO.registerApp('cardterminal', {
    title: 'Card Terminal — Virtual POS Gateway', icon: 'card', w: 780, h: 540, minW: 640, minH: 440, singleton: true,
    open() {
      let lastReceipt = null, unsub = null;
      // Preserve form state across re-renders so background events don't wipe typed digits
      const form = {
        pan: '',
        exp: '',
        cvv: '',
        name: '',
        bank: '',
        descriptor: 'GLOBAL TECH SERVICES',
        amt: '250'
      };

      const win = SO.wm.open({
        id: 'cardterminal', title: this.title, icon: this.icon, w: this.w, h: this.h, minW: this.minW, minH: this.minH,
        body: '<div class="split"></div>',
        onClose: () => unsub && unsub()
      });
      const root = win.body.firstChild;

      function render() {
        const d = SO.save.d;
        const cards = (d.loot || []).filter(l => l.type === 'card' && l.details);
        const hist = d.posHistory || [];

        root.innerHTML =
          /* Left Column: Manual POS Entry Form */
          '<div class="main" style="flex:1.15;border-right:1px solid #e2e8f0">' +
            '<div class="row" style="justify-content:space-between;margin-bottom:8px">' +
              '<div><b style="font-size:14px">Manual Card-Not-Present (CNP) Terminal</b><div class="muted">Key in the 16-digit PAN, MM/YY expiration, and 3-digit CVV2 to authorize</div></div>' +
              '<span class="tag g">GATEWAY ONLINE</span>' +
            '</div>' +

            '<div class="group" style="margin:0 0 10px 0">' +
              '<div class="group-title">Cardholder &amp; Instrument Data</div>' +
              '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px">' +
                '<div><label class="muted" style="font-size:11px;font-weight:600">16-Digit Card Number (PAN)</label>' +
                  '<input class="xp-in mono" id="pos-pan" placeholder="4XXX XXXX XXXX XXXX" maxlength="19" value="' + esc(form.pan) + '" style="font-size:13px;font-weight:700;letter-spacing:0.5px">' +
                '</div>' +
                '<div><label class="muted" style="font-size:11px;font-weight:600">Expiry (MM/YY)</label>' +
                  '<input class="xp-in mono" id="pos-exp" placeholder="MM/YY" maxlength="5" value="' + esc(form.exp) + '" style="font-size:13px;font-weight:700">' +
                '</div>' +
                '<div><label class="muted" style="font-size:11px;font-weight:600">CVV2 / CVC</label>' +
                  '<input class="xp-in mono" id="pos-cvv" placeholder="3 digits" maxlength="4" value="' + esc(form.cvv) + '" style="font-size:13px;font-weight:700">' +
                '</div>' +
              '</div>' +

              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">' +
                '<div><label class="muted" style="font-size:11px;font-weight:600">Cardholder Name</label>' +
                  '<input class="xp-in" id="pos-name" placeholder="Name on card" value="' + esc(form.name) + '">' +
                '</div>' +
                '<div><label class="muted" style="font-size:11px;font-weight:600">Statement Billing Descriptor</label>' +
                  '<select class="xp-sel" id="pos-desc">' +
                    ['GLOBAL TECH SERVICES', 'SECUREPC SUPPORT LLC', 'CLOUD BACKUP RENEWAL', 'OVERSEAS CONSULTING INC'].map(x =>
                      '<option value="' + x + '" ' + (form.descriptor === x ? 'selected' : '') + '>' + x + '</option>'
                    ).join('') +
                  '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="group" style="margin:0 0 10px 0">' +
              '<div class="group-title">Transaction Authorization</div>' +
              '<div class="row" style="gap:8px;align-items:flex-end">' +
                '<div style="flex:1">' +
                  '<label class="muted" style="font-size:11px;font-weight:600">Charge Amount ($ USD)</label>' +
                  '<input class="xp-in mono" id="pos-amt" type="number" min="5" max="6000" step="25" value="' + esc(form.amt) + '" style="font-size:15px;font-weight:700">' +
                '</div>' +
                '<button class="xp-btn" id="pos-test" style="padding:8px 12px" title="Run a $1.00 AVS/CVV pre-authorization check">Run $1.00 Pre-Auth</button>' +
                '<button class="xp-btn green" id="pos-charge" style="padding:8px 16px">Authorize Charge</button>' +
                '<button class="xp-btn" id="pos-clear" style="padding:8px 10px">Clear</button>' +
              '</div>' +
              '<div class="muted" style="margin-top:6px;font-size:11px">' +
                'Protocol: Run a <b>$1.00 Pre-Auth</b> first to verify PAN/Expiry/CVV2 and warm up issuer fraud scoring before submitting larger charges.' +
              '</div>' +
            '</div>' +

            /*ISO-8583 Thermal Receipt Output*/
            '<div class="group" style="margin:0;flex:1;display:flex;flex-direction:column">' +
              '<div class="group-title">ISO-8583 Gateway Response Slip</div>' +
              '<div class="sunken mono" style="flex:1;padding:10px;background:#0f172a;color:#e2e8f0;font-size:11.5px;line-height:1.5">' +
                (lastReceipt ? (
                  '<div style="display:flex;justify-content:space-between;border-bottom:1px dashed #334155;padding-bottom:4px;margin-bottom:6px">' +
                    '<span>MERCHANT: ' + esc(lastReceipt.descriptor) + '</span>' +
                    '<span style="color:' + (lastReceipt.ok ? '#4ade80' : '#f87171') + ';font-weight:700">RESP CODE: ' + esc(lastReceipt.code || (lastReceipt.ok ? '00' : '05')) + '</span>' +
                  '</div>' +
                  '<div>PAN: ' + esc(lastReceipt.pan) + ' · HOLDER: ' + esc(lastReceipt.holder || 'N/A') + '</div>' +
                  '<div>AMOUNT: $' + Number(lastReceipt.amt || 0).toFixed(2) + (lastReceipt.isTest ? ' (AVS/CVV PRE-AUTH)' : ' (SALE)') + '</div>' +
                  '<div style="margin-top:4px;color:' + (lastReceipt.ok ? '#4ade80' : '#f87171') + ';font-weight:700">' + esc(lastReceipt.msg) + '</div>'
                ) : '<div style="color:#64748b">Awaiting manual card entry and authorization...</div>') +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Right Column: Reference Notes (No One-Click Auto-Charge) & Settlement Log */
          '<div class="side" style="width:295px;display:flex;flex-direction:column;gap:10px">' +
            '<div class="group" style="margin:0;flex:1;display:flex;flex-direction:column;overflow:hidden">' +
              '<div class="group-title">Captured Card Notes (Read &amp; Key In)</div>' +
              '<div style="overflow:auto;flex:1;font-size:11px;display:flex;flex-direction:column;gap:6px">' +
                (cards.length === 0 ? '<div class="muted" style="padding:8px">No cards recorded yet. Convince a target to read out their card number, expiry, and CVV on a call.</div>' :
                  cards.map(c => {
                    const det = c.details;
                    return '<div class="sunken" style="padding:7px 8px">' +
                      '<div style="display:flex;justify-content:space-between"><b>' + esc(det.holder || c.from) + '</b><span class="tag ' + (det.tested ? 'g' : 'y') + '">' + (det.tested ? 'AVS OK' : 'UNVERIFIED') + '</span></div>' +
                      '<div class="mono" style="margin-top:3px;font-weight:700;color:#0f172a">' + esc(det.number) + '</div>' +
                      '<div class="mono muted">EXP: <b>' + esc(det.exp) + '</b> · CVV: <b>' + esc(det.cvv) + '</b> · Charged: $' + (det.charged || 0) + '</div>' +
                    '</div>';
                  }).join('')
                ) +
              '</div>' +
            '</div>' +

            '<div class="group" style="margin:0;height:185px;display:flex;flex-direction:column;overflow:hidden">' +
              '<div class="group-title">Gateway Batch Log</div>' +
              '<div style="overflow:auto;flex:1;font-size:11px">' +
                (hist.length === 0 ? '<div class="muted" style="padding:8px">No gateway transactions in current batch.</div>' :
                  hist.slice(0, 12).map(h =>
                    '<div style="display:flex;justify-content:space-between;padding:4px 2px;border-bottom:1px solid #f1f5f9">' +
                      '<span class="mono">' + esc(h.pan) + ' ($' + h.amt + ')</span>' +
                      '<span class="tag ' + (h.ok ? 'g' : 'r') + '">' + (h.ok ? 'AUTH 00' : 'DECL ' + esc(h.code || '05')) + '</span>' +
                    '</div>'
                  ).join('')
                ) +
              '</div>' +
            '</div>' +
          '</div>';

        const panIn = root.querySelector('#pos-pan');
        const expIn = root.querySelector('#pos-exp');
        const cvvIn = root.querySelector('#pos-cvv');
        const nameIn = root.querySelector('#pos-name');
        const descIn = root.querySelector('#pos-desc');
        const amtIn = root.querySelector('#pos-amt');

        if (panIn) panIn.oninput = e => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
          form.pan = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
          e.target.value = form.pan;
        };
        if (expIn) expIn.oninput = e => {
          let v = e.target.value.replace(/[^\d/]/g, '');
          if (v.length === 2 && !v.includes('/') && form.exp.length < 2) v += '/';
          form.exp = v.slice(0, 5);
          e.target.value = form.exp;
        };
        if (cvvIn) cvvIn.oninput = e => {
          form.cvv = e.target.value.replace(/\D/g, '').slice(0, 4);
          e.target.value = form.cvv;
        };
        if (nameIn) nameIn.oninput = e => { form.name = e.target.value; };
        if (descIn) descIn.onchange = e => { form.descriptor = e.target.value; };
        if (amtIn) amtIn.oninput = e => { form.amt = e.target.value; };

        const runGateway = isTest => {
          const r = G.posLookupAndCharge({
            number: form.pan,
            exp: form.exp,
            cvv: form.cvv,
            name: form.name,
            descriptor: form.descriptor,
            amount: Number(form.amt || 0),
            isTest
          });
          lastReceipt = {
            ok: r.ok,
            code: r.code || (r.ok ? '00' : '05'),
            pan: '•••• ' + String(form.pan || '').replace(/\D/g, '').slice(-4),
            holder: r.holder || form.name || 'Cardholder',
            amt: isTest ? 1 : Number(form.amt || 0),
            isTest,
            descriptor: form.descriptor,
            msg: r.msg
          };
          SO.audio.play(r.ok ? 'cash' : 'error');
          render();
        };

        const testBtn = root.querySelector('#pos-test');
        if (testBtn) testBtn.onclick = () => runGateway(true);
        const chgBtn = root.querySelector('#pos-charge');
        if (chgBtn) chgBtn.onclick = () => runGateway(false);
        const clrBtn = root.querySelector('#pos-clear');
        if (clrBtn) clrBtn.onclick = () => {
          form.pan = ''; form.exp = ''; form.cvv = ''; form.name = '';
          lastReceipt = null;
          render();
        };
      }
      unsub = G.sub(render);
      render();
    }
  });
})();
