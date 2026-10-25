/* SCAM OS - Scam Tools app: toggles, harassment actions, and tool demos. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);

  const ACTIONS = {
    t_popup: { id: 't_popup', label: 'Fake virus popup', fx: 'A loud fake antivirus alert just popped up on your computer screen with big red warnings saying YOUR PC IS INFECTED and a phone number to call.', tag: 'fear' },
    t_bsod: { id: 't_bsod', label: 'Fake BSOD', fx: 'Your computer screen suddenly turned solid blue with a scary error message and the machine froze.', tag: 'fear' },
    t_form: { id: 't_form', label: 'Send payment link', fx: 'You just received a link to a very professional, official-looking payment web page from the caller.', tag: 'proof' },
    t_remote: { id: 't_remote', label: 'Send remote app', fx: 'You received a download link for a "support tool"; the caller wants you to run it. A window opens saying "Connecting to technician...".', tag: 'remote' }
  };

  function demoPopup() {
    const w = SO.wm.open({ id: 'demo-av-' + Date.now(), title: 'SECURITY WARNING', icon: 'warn', w: 380, h: 250, noMax: true });
    w.body.innerHTML = '<div class="pad col" style="background:#fff3f3;flex:1;align-items:center;text-align:center"><div style="font-size:28px;color:#c00">7 VIRUSES FOUND!</div><div>Your PC is at risk. Call 1-800-NOT-REAL now. (Parody demo only.)</div><div class="grow"></div><div class="row"><button class="xp-btn red" id="a">Remove now</button><button class="xp-btn" id="b">Ignore</button></div></div>';
    w.body.querySelector('#a').onclick = () => { SO.audio.play('error'); }; w.body.querySelector('#b').onclick = () => w.close();
    SO.audio.play('error');
  }
  function demoRemote() {
    const w = SO.wm.open({ id: 'demo-remote', title: 'RemoteHelper 3.1 (fake)', icon: 'cmd', w: 380, h: 220, noMax: true });
    w.body.innerHTML = '<div class="pad col" style="flex:1"><div>Connecting to technician...</div><div class="meter"><div class="bar"><i id="rb" style="--c:#2a6bff"></i></div></div><div class="muted" id="rs">Contacting fake server...</div><div class="grow"></div></div>';
    let p = 0; const iv = setInterval(() => { p += 7; const b = w.body.querySelector('#rb'); if (!b) return clearInterval(iv); b.style.width = Math.min(100, p) + '%'; if (p >= 100) { clearInterval(iv); w.body.querySelector('#rs').textContent = 'Connected. (Not really. Nothing happened.)'; SO.audio.play('ding'); } }, 250);
  }
  const DECLINES = ['DECLINED: Insufficient funds.', 'DECLINED: Card blocked by issuer.', 'DECLINED: Your bank\'s fraud filter flagged this charge.', 'DECLINED: Issuer did not respond.', 'DECLINED: Card number is not valid.'];
  function demoForm() {
    const w = SO.wm.open({ id: 'demo-form', title: 'SecurePay Checkout (fake)', icon: 'cash', w: 430, h: 352, noMax: true });
    w.body.innerHTML = '<div class="pad col" style="flex:1;gap:7px;background:#f7f7f4;overflow:auto">' +
      '<div class="row" style="align-items:center"><div class="grow"><b>SecurePay</b> &mdash; Courier Relief Fund</div>' + SO.iconImg('cash', 32) + '</div>' +
      '<div class="muted" style="font-size:12px">Redelivery fee: <b>$2.99</b>. This is a FAKE demo of the payment pages scammers send: nothing is transmitted or stored, and every charge fails.</div>' +
      '<input class="xp-input" data-f="card" maxlength="23" inputmode="numeric" placeholder="Card number (type any digits)" autocomplete="off">' +
      '<div class="row" style="gap:6px"><input class="xp-input" data-f="exp" maxlength="5" placeholder="MM/YY" autocomplete="off"><input class="xp-input" data-f="cvv" maxlength="4" inputmode="numeric" placeholder="CVV" autocomplete="off"><input class="xp-input" data-f="zip" maxlength="5" inputmode="numeric" placeholder="ZIP" autocomplete="off"></div>' +
      '<button class="xp-btn green" data-pay>Pay $2.99</button>' +
      '<div data-verdict style="display:none"></div>' +
      '<div class="muted grow" style="font-size:11px">Parody demo. Rule of thumb: never type card details onto any page a caller sends you.</div></div>';
    const b = w.body, fields = [...b.querySelectorAll('[data-f]')], v = b.querySelector('[data-verdict]');
    const verdictBad = html => { v.style.display = ''; v.style.background = '#fff0f0'; v.style.border = '2px solid #c00'; v.style.padding = '6px 8px'; v.style.color = '#600'; v.innerHTML = html; };
    const verdictWait = () => { v.style.display = ''; v.style.background = '#fff'; v.style.border = '1px solid #919b9c'; v.style.padding = '6px 8px'; v.style.color = '#000'; v.innerHTML = '<div class="row"><b class="grow">Contacting issuer...</b><div class="meter"><div class="bar"><i id="pfb" style="--c:#2a6bff;width:5%"></i></div></div></div>'; };
    fields.forEach(i => {
      i.oninput = () => {
        i.value = i.dataset.f === 'exp' ? i.value.replace(/[^\d/]/g, '') : i.value.replace(/\D+/g, '');
        v.style.display = 'none';
        i.style.background = '';
      };
    });
    b.querySelector('[data-pay]').onclick = () => {
      const missing = fields.filter(i => !String(i.value).trim());
      if (missing.length) {
        missing.forEach(i => { i.style.background = '#ffdede'; });
        verdictBad('<b>Please complete every field before paying.</b><div style="font-size:12px">This site validates just like a real checkout - a preview of how scam payment pages act.</div>');
        SO.audio.play('error');
        return;
      }
      const btn = b.querySelector('[data-pay]');
      btn.disabled = true; btn.textContent = 'Processing...';
      verdictWait();
      let p = 3;
      const iv = setInterval(() => { const bar = b.querySelector('#pfb'); if (!bar) return clearInterval(iv); p += 4 + Math.random() * 9; bar.style.width = Math.min(100, p) + '%'; if (p >= 100) { clearInterval(iv); finish(); } }, 220);
      function finish() {
        btn.disabled = false; btn.textContent = 'Pay $2.99';
        verdictBad('<b>' + DECLINES[Math.floor(Math.random() * DECLINES.length)] + '</b><div style="font-size:12px">Amount attempted: $2.99 &bull; nothing was charged &bull; no data left this window.</div>');
        SO.audio.play('error');
      }
    };
  }

  function open() {
    let unsub = null;
    const w = SO.wm.open({ id: 'tools', title: 'Scam Tools', icon: 'tools', w: 620, h: 480, minW: 420, minH: 320, onClose: () => unsub && unsub() });
    if (!w.fresh) return w;
    const G = SO.game;
    w.body.innerHTML = '<div class="scroll grow pad" id="tl"></div>';

    function render() {
      const d = SO.save.d, tools = SO.data.SHOP.filter(i => i.cat === 'Tools');
      const el = w.body.querySelector('#tl');
      const callActive = SO.activeCall && SO.activeCall.isActive();
      const activeLead = callActive ? SO.activeCall.lead() : null;

      let callBanner = '';
      if (callActive && activeLead) {
        callBanner = '<div class="row" style="background:#cfe0f7;border-bottom:1px solid #aca899;padding:5px 10px;margin-bottom:6px">' +
          SO.avatar(activeLead.id, 32, { gender: activeLead.gender, age: activeLead.age }) +
          '<b class="grow">ON CALL: ' + esc(activeLead.name) + '</b><span class="tag b">DEPLOY READY</span>' +
          '</div>';
      }

      el.innerHTML = callBanner + tools.map(t => {
        const own = G.owns(t.id);
        let extra = '';
        if (own && t.id === 't_spoof') extra = '<label><input type="checkbox" data-k="spoof"' + (d.toolState.spoof !== false ? ' checked' : '') + '> Enabled</label>';
        else if (own && t.id === 't_voice') extra = '<label><input type="checkbox" data-k="voice"' + (d.toolState.voice !== false ? ' checked' : '') + '> Enabled</label>';
        else if (own && ACTIONS[t.id]) {
          if (callActive) {
            extra = '<button class="xp-btn small green" data-call-act="' + t.id + '">Deploy on Call</button>';
          } else {
            extra = '<button class="xp-btn small" data-d="' + t.id.replace('t_', '') + '">Preview / Test</button>';
          }
        }
        return '<div class="card row" style="margin-bottom:6px;' + (own ? '' : 'opacity:.55') + '">' +
          SO.iconImg(t.icon, 32) +
          '<b class="grow">' + esc(t.name) + '</b> ' + (own ? '<span class="tag g">INSTALLED</span>' : '<span class="tag r">LOCKED</span>') +
          (own ? extra : '<button class="xp-btn small" data-d="shop">ScamMart</button>') +
          '</div>';
      }).join('');

      el.querySelectorAll('input[data-k]').forEach(i => i.onchange = () => { d.toolState[i.dataset.k] = i.checked; SO.save.save(); });
      el.querySelectorAll('button[data-call-act]').forEach(b => b.onclick = () => {
        const actId = b.dataset.callAct;
        if (ACTIONS[actId] && SO.activeCall) {
          const ok = SO.activeCall.doAction(ACTIONS[actId]);
          if (ok) {
            b.disabled = true;
            b.textContent = 'Deployed!';
            SO.audio.play('click');
          }
        }
      });
      el.querySelectorAll('button[data-d]').forEach(b => b.onclick = () => {
        const k = b.dataset.d;
        if (k === 'popup') demoPopup();
        else if (k === 'bsod') SO.bsod('FAKE_TOOL_DEMO', 3000);
        else if (k === 'form') demoForm();
        else if (k === 'remote') demoRemote();
        else SO.openApp('shop');
      });
    }

    unsub = G.sub(() => { if (SO.wm.get('tools')) render(); });
    const iv = setInterval(() => { if (SO.wm.get('tools')) render(); else clearInterval(iv); }, 2000);
    render();
    return w;
  }
  SO.registerApp({ id: 'tools', name: 'Scam Tools', icon: 'tools', desktop: true, start: true, order: 6, open });
})();
