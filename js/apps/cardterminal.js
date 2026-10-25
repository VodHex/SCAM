/* SCAM OS - Card Terminal: Interactive Merchant Virtual POS & Credit Card Processor.
   Simulated parody app - processes fictional victim credit cards via G.chargeCard.
   Realism model: captured cards have an ISSUER LIMIT; run a $1 test charge, stay under
   the available limit, and expect fraud flags on big slices of it. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);
  const G = () => SO.game;
  const D = () => SO.save.d;

  function open(args) {
    args = args || {};
    const w = SO.wm.open({
      id: 'cardterminal', title: 'Card Terminal - FastPay Virtual POS', icon: 'pos',
      w: 500, h: 760, minW: 400, minH: 500
    });
    if (!w.fresh) return w;

    const body = w.body;
    let busy = false;

    function remaining(c) {
      const det = c && c.details || {};
      return Math.max(0, (det.limit || 500) - (det.charged || 0));
    }

    function render() {
      const d = D();
      const cards = (d.loot || []).filter(l => l.type === 'card');
      const selCard = cards[0];   // default first-dropdown selection; amounts are never pre-filled

      body.innerHTML =
        '<div class="col grow pad scroll" style="gap:8px;font-family:var(--px)">' +
        // Terminal Top Banner
        '<div style="background:#1b3b1b;color:#4af04a;border:1px solid #000;padding:6px 10px;font-size:17px;display:flex;justify-content:space-between">' +
        '<span>MERCHANT: TotallyLegit LLC</span><span>POS ONLINE</span>' +
        '</div>' +

        // Virtual Screen Area
        '<div id="pos-screen" style="background:#0a1a0a;color:#50fa50;border:2px solid #000;padding:10px;height:110px;overflow-y:auto;font-size:18px;line-height:21px;box-shadow:inset 2px 2px 0 #000;flex:none">' +
        '<div style="color:#a0ffa0">READY - SELECT A CARD OR KEY ONE IN</div>' +
        '</div>' +

        // Captured Cards Dropdown (no free-form entry: only cards actually captured in calls)
        '<div class="row" style="gap:6px">' +
        '<b style="font-size:17px;white-space:nowrap">Captured:</b>' +
        '<select class="xp-input grow" id="ct-loot"' + (cards.length ? '' : ' disabled') + '>' +
        (cards.length
          ? cards.map(c => '<option value="' + c.id + '"' + (selCard && selCard.id === c.id ? ' selected' : '') + '>' + esc(c.from) + ' - ' + esc(c.details && c.details.bank || 'Bank') + ' (left $' + remaining(c).toLocaleString() + ')</option>').join('')
          : '<option value="">No captured cards</option>') +
        '</select>' +
        '</div>' +

        (selCard
          ? '<div class="card col" id="ct-panel" style="gap:5px;padding:8px;background:#f3f0e6"></div>' +
            '<div class="row" style="gap:6px">' +
            '<button class="xp-btn" id="ct-test" style="padding:6px 12px">$1 TEST CHARGE</button>' +
            '<span style="font-size:18px">Amount:</span><span style="font-size:20px">$</span>' +
            '<input class="xp-input" id="ct-amt" inputmode="numeric" style="width:90px" placeholder="0">' +
            '<button class="xp-btn green grow" id="ct-charge" style="font-size:20px;padding:6px">CHARGE CARD</button>' +
            '</div>'
          : '<div class="panel pad" style="text-align:center" id="ct-empty">' +
            '<div style="font-size:18px">No cards in the terminal.</div>' +
            '<div class="muted" style="font-size:16px">Key in card details below.</div>' +
            '</div>') +

        // Manual entry - card details are keyed in by hand, nothing arrives by itself here
        '<div class="card col" style="gap:5px;padding:8px;margin-top:2px">' +
        '<div class="row" style="justify-content:space-between"><b>Key in card details</b><span class="tag r">RISKY</span></div>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap">' +
        '<input class="xp-input" id="ct-mh" placeholder="Cardholder name" style="flex:1;min-width:130px" autocomplete="off">' +
        '<input class="xp-input" id="ct-mno" placeholder="#### #### #### ####" maxlength="19" style="width:206px;font-family:monospace;letter-spacing:1px" autocomplete="off">' +
        '</div>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap">' +
        '<input class="xp-input" id="ct-mexp" placeholder="MM/YY" maxlength="5" style="width:80px;font-family:monospace" autocomplete="off">' +
        '<input class="xp-input" id="ct-mcvv" placeholder="CVV" maxlength="4" style="width:64px;font-family:monospace" autocomplete="off">' +
        '<input class="xp-input" id="ct-mbank" placeholder="Issuing bank (optional)" style="flex:1;min-width:120px" autocomplete="off">' +
        '<button class="xp-btn green" id="ct-add" style="padding:6px 10px">ADD CARD</button>' +
        '</div>' +
        '</div>' +
        '</div>';

      const q = s => body.querySelector(s);
      const scr = q('#pos-screen');

      /* Manual card entry: key in the details the victim read out -> it lands in the list, then YOU charge it. */
      q('#ct-add').onclick = () => {
        const r = G().manualCard({
          name: q('#ct-mh').value, number: q('#ct-mno').value,
          exp: q('#ct-mexp').value, cvv: q('#ct-mcvv').value, bank: q('#ct-mbank').value
        });
        if (r.ok) {
          scr.innerHTML = '<div style="color:#a0ffa0">CARD KEYED IN - SELECT IT ABOVE AND PROCESS IT</div>';
          SO.audio.play('win');
          render();
        } else {
          scr.innerHTML = '<div style="color:#ff5555">ERROR: ' + esc(r.msg) + '</div>';
          SO.audio.play('error');
        }
      };

      if (!selCard) return;
      paintCard(selCard);
      if (selCard.details.tested) { const b = q('#ct-test'); if (b) { b.disabled = true; b.textContent = 'Card verified'; } }

      function paintCard(c) {
        const det = c.details || {};
        q('#ct-panel').innerHTML =
          '<div class="row"><b style="width:120px">Cardholder:</b><span>' + esc(c.from) + '</span></div>' +
          '<div class="row"><b style="width:120px">Issuing bank:</b><span>' + esc(det.bank || 'Unknown') + '</span></div>' +
          '<div class="row"><b style="width:120px">Card number:</b><span style="font-family:monospace;letter-spacing:1px">' + esc(det.number || '(masked)') + '</span></div>' +
          '<div class="row"><b style="width:120px">Exp / CVV:</b><span style="font-family:monospace">' + esc(det.exp || '--/--') + ' / ' + esc(det.cvv || '---') + '</span></div>' +
          '<div class="row"><b style="width:120px">Issuer limit:</b><span>$' + (det.limit || 500).toLocaleString() + '</span></div>' +
          '<div class="row"><b style="width:120px">Charged so far:</b><span>$' + (det.charged || 0).toLocaleString() + (det.tested ? ' (incl. $1 test)' : '') + '</span></div>' +
          '<div class="row"><b style="width:120px">Available:</b><span class="good"><b>$' + remaining(c).toLocaleString() + '</b> / flag status: <span class="' + ((det.flagged || 0) ? 'bad' : 'good') + '">' + ((det.flagged || 0) ? 'FLAGGED x' + det.flagged : 'clean') + '</span></span></div>';
        const amt = q('#ct-amt');
        if (amt) amt.max = String(remaining(c));   // amount is never pre-filled: the operator types it
      }

      // Loot selector change
      q('#ct-loot').onchange = e => {
        const c = cards.find(x => x.id === e.target.value);
        if (!c) return;
        selCard = c;
        const tb = q('#ct-test');
        if (tb) { tb.disabled = !!c.details.tested; tb.textContent = c.details.tested ? 'Card verified' : '$1 TEST CHARGE'; }
        paintCard(c);
        scr.innerHTML = '<div style="color:#a0ffa0">LOADED CARD FOR: ' + esc(c.from) + '</div><div style="color:#309030">AVAILABLE: $' + remaining(c).toLocaleString() + '</div>';
      };

      async function run(fn, kind) {
        if (busy) return;
        busy = true;
        q('#ct-test').disabled = true; q('#ct-charge').disabled = true;
        scr.innerHTML = '<div>CONNECTING TO MERCHANT GATEWAY...</div>';
        SO.audio.play('click');
        await new Promise(r => setTimeout(r, 550));
        scr.innerHTML += '<div>TRANSMITTING EMV DATA & CVV...</div>';
        SO.audio.play('blip');
        await new Promise(r => setTimeout(r, 650));
        scr.innerHTML += '<div>CONTACTING ISSUING BANK (' + esc(selCard.details.bank || 'ISSUER') + ')...</div>';
        SO.audio.play('blip');
        await new Promise(r => setTimeout(r, 700));
        const r = fn();
        if (r.ok) {
          scr.innerHTML =
            '<div style="color:#50ff50;font-weight:bold">' + (kind === 'test' ? '*** TEST CHARGE APPROVED ***' : '*** APPROVED ***') + '</div>' +
            '<div style="color:#a0ffa0">' + esc(r.msg) + '</div>' +
            '<div style="color:#80ff80">FUNDS TRANSFERRED TO DARK WALLET</div>';
          SO.audio.play('cash');
          SO.notify(kind === 'test' ? 'Test charge approved' : 'Payment Approved', r.msg, 'cash', { sound: 'cash' });
        } else {
          scr.innerHTML =
            '<div style="color:#ff5555;font-weight:bold">*** TRANSACTION DECLINED ***</div>' +
            '<div style="color:#ff8888">' + esc(r.msg) + '</div>';
          SO.audio.play('error');
          SO.notify('Transaction Declined', r.msg, 'error', { sound: 'error' });
        }
        if (!D().loot.some(x => x.id === selCard.id)) {
          // card drained / closed: refresh the terminal
          busy = false;
          scr.innerHTML += '<div style="color:#ffaaaa">CARD CLOSED: issuer cut off the remaining limit.</div>';
          render();
        } else {
          busy = false;
          if (q('#ct-test')) { q('#ct-test').disabled = !!selCard.details.tested; q('#ct-test').textContent = selCard.details.tested ? 'Card verified' : '$1 TEST CHARGE'; }
          if (q('#ct-charge')) q('#ct-charge').disabled = false;
          const opt = q('#ct-loot').querySelector('option[value="' + selCard.id + '"]');
          if (opt) opt.textContent = selCard.from + ' - ' + (selCard.details.bank || 'Bank') + ' (left $' + remaining(selCard).toLocaleString() + ')';
          paintCard(selCard);
          const amt2 = q('#ct-amt'); if (amt2) amt2.max = String(remaining(selCard));
        }
      }

      q('#ct-test').onclick = () => run(() => G().chargeCard(selCard.id, 1, true), 'test');
      q('#ct-charge').onclick = () => {
        const amt = Math.round(Number(q('#ct-amt').value) || 0);
        const cap = remaining(selCard);
        if (amt > cap) {
          scr.innerHTML = '<div style="color:#ff5555">ERROR: $' + amt.toLocaleString() + ' EXCEEDS THE AVAILABLE WINDOW ($' + cap.toLocaleString() + ').</div>';
          return;
        }
        run(() => G().chargeCard(selCard.id, amt, false), 'charge');
      };
    }

    render();
    return w;
  }

  SO.registerApp({
    id: 'cardterminal', name: 'Card Terminal', icon: 'pos',
    desktop: true, start: true, order: 2, open
  });
})();
