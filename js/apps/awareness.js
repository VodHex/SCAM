/* SCAM OS - Scam Awareness: real-life defenses, quiz, and your tactic stats. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);
  const QUIZ = [
    { q: 'A caller says you owe taxes and must pay today with gift cards or you will be arrested. What is this?', a: ['A normal government process', 'A scam', 'A bank error'], c: 1, why: 'Government agencies never demand gift cards or threaten immediate arrest by phone.' },
    { q: 'Someone who called you says you must install software so they can fix your computer. What do you do?', a: ['Install it to be safe', 'Hang up and contact the company using its official website', 'Give them your password first'], c: 1, why: 'Never give remote access to an inbound caller. Verify independently.' },
    { q: 'Your "grandchild" calls in tears and begs you not to tell anyone. What is the best move?', a: ['Send money right away', 'Hang up and call the grandchild on their known number', 'Ask them to buy gift cards'], c: 1, why: 'Secrecy plus urgency is a classic emotional manipulation pattern. Call back on a known number.' },
    { q: 'A bank caller asks you to read the one-time code you just received by text. What should you do?', a: ['Read it, they are the bank', 'Never share it: hang up and call the number on your card', 'Read half of it'], c: 1, why: 'Banks never ask for one-time codes. Those codes protect YOU.' },
    { q: 'You "won" a lottery you never entered, but must pay a fee first. What is this?', a: ['An advance-fee scam', 'Good luck', 'A tax refund'], c: 0, why: 'Real prizes do not require upfront fees, and you cannot win contests you never entered.' },
    { q: 'Caller ID shows your bank\'s real number. Does that prove the caller is your bank?', a: ['Yes', 'No, caller ID can be spoofed', 'Only on mobile'], c: 1, why: 'Caller ID is easy to fake. Hang up and dial the official number yourself.' },
    { q: 'How much did US adults 60+ report losing to fraud in 2025 (FTC)?', a: ['About $3 billion', 'About $30 million', 'Older adults do not get scammed'], c: 0, why: 'Adults 60+ reported $3B+ in losses in 2025, with a median reported loss near $2,000 for people 80+.' },
    { q: 'Which scam payment channel had the highest median reported loss (phone, 2025)?', a: ['Phone calls (median ~$3,000)', 'Email codes', 'Text apps (median ~$599)'], c: 0, why: 'Scams that start with a phone call cost far more than most online channels: a live voice is the scammer\'s best weapon.' },
    { q: 'Someone you met online promises huge crypto returns if you "invest" through them. This is:', a: ['A pig-butchering / investment scam', 'A smart opportunity', 'Broker software'], c: 0, why: 'Romance-plus-investment ("pig butchering") scams start with small wins, then empty the account. Platforms turn out fake.' },
    { q: 'A "courier" texts that your parcel is held at customs for a $3.50 fee. You should:', a: ['Pay the small fee by card on their link', 'Check directly with the real courier site, never the link', 'Pay with a gift card'], c: 1, why: 'Delivery-fee scams harvest card data. Small asked amounts are the bait - the card details are the theft.' },
    { q: 'Your antivirus auto-renewed and a "support agent" calls offering a refund that needs remote access first. This is:', a: ['A legit refund flow', 'A remote-access refund scam', 'Customer retention'], c: 1, why: '"Refund plus remote access" is a well-known scam pattern: they overpay on purpose, then drain the account.' }
  ];

  function open() {
    const w = SO.wm.open({ id: 'awareness', title: 'Scam Awareness Center', icon: 'shield', w: 680, h: 520, minW: 480, minH: 340 });
    if (!w.fresh) return w;
    let tab = 'Tactics'; let qi = 0, score = 0;
    w.body.innerHTML = '<div class="tabs" id="aw-tabs"></div><div class="scroll grow pad selectable" id="aw-b" style="background:#fff;user-select:text"></div>';
    const q = s => w.body.querySelector(s);
    function render() {
      const tabs = q('#aw-tabs'); tabs.innerHTML = '';
      ['Tactics', 'Real world', 'Quiz', 'Your stats'].forEach(t => { const e = document.createElement('div'); e.className = 'tab' + (t === tab ? ' on' : ''); e.textContent = t; e.onclick = () => { tab = t; qi = 0; score = 0; render(); }; tabs.appendChild(e); });
      const b = q('#aw-b'), T = SO.data.TACTICS;
      if (tab === 'Tactics') {
        b.innerHTML = '<p>Everything in this game is fiction, but the manipulation tactics are real. Learn them and you will spot them.</p>' + Object.values(T).map(t => '<div class="card" style="margin:6px 0"><b style="font-size:21px">' + esc(t.name) + '</b><br>' + esc(t.what) + '<br><span class="good"><b>Defense:</b></span> ' + esc(t.defense) + '</div>').join('') +
          '<div class="card" style="margin:6px 0;background:#fff8d6"><b>If you were scammed in real life:</b> contact your bank immediately, report to your national fraud agency / police, change passwords, and tell someone you trust. It is not your fault.</div>';
      } else if (tab === 'Real world') {
        const S = SO.data.REAL_STATS || [], O = SO.data.REAL_ORGS || [];
        b.innerHTML = '<p><b>This game is fiction; these numbers are not.</b> Every stat below comes from public US consumer-agency summaries (FTC / FBI). The same tactics your in-game call uses are the ones that drain billions of dollars for real.</p>' +
          S.map(s => '<div class="card" style="margin:6px 0"><b style="font-size:22px;color:#990000">' + esc(s.n) + (s.yr ? ' <span class="muted" style="font-size:16px">(' + s.yr + ')</span>' : '') + '</b><div>' + esc(s.t) + '</div></div>').join('') +
          '<h3 class="sec">Where real people report scams</h3>' +
          O.map(o => '<div class="card" style="margin:6px 0"><b>' + esc(o.n) + (o.u ? ' - <a href="https://' + esc(o.u) + '" target="_blank" rel="noreferrer noopener">' + esc(o.u) + '</a>' : '') + '</b><div>' + esc(o.w) + '</div></div>').join('');
      } else if (tab === 'Quiz') {
        if (qi >= QUIZ.length) {
          const first = !SO.save.d.quizDone && score >= 9;
          if (first) { SO.save.d.quizDone = true; SO.game.addXP(60); SO.game.unlockAch('learner'); SO.save.save(); }
          b.innerHTML = '<h2>Score: ' + score + ' / ' + QUIZ.length + '</h2><p>' + (score >= 9 ? 'Excellent: you are scam-proof!' : 'Review the Tactics and Real world tabs and try again.') + (first ? ' <b class="good">+60 XP</b>' : '') + '</p><button class="xp-btn" id="aw-r">Retry</button>';
        } else {
          const Q = QUIZ[qi];
          b.innerHTML = '<div class="muted">Question ' + (qi + 1) + ' / ' + QUIZ.length + '</div><h3 style="font-weight:normal;font-size:22px">' + esc(Q.q) + '</h3>' + Q.a.map((a, i) => '<div><button class="xp-btn" style="width:100%;text-align:left;margin:3px 0" data-i="' + i + '">' + esc(a) + '</button></div>').join('') + '<div id="aw-fb"></div>';
          b.querySelectorAll('button[data-i]').forEach(btn => btn.onclick = () => {
            const ok = +btn.dataset.i === Q.c; if (ok) score++; SO.audio.play(ok ? 'ding' : 'error');
            b.querySelectorAll('button[data-i]').forEach(x => x.disabled = true);
            q('#aw-fb').innerHTML = '<p class="' + (ok ? 'good' : 'bad') + '"><b>' + (ok ? 'Correct! ' : 'Not quite. ') + '</b>' + esc(Q.why) + '</p><button class="xp-btn green" id="aw-n">Next</button>';
          });
        }
        const nxt = q('#aw-n'); if (nxt) nxt.onclick = () => { qi++; render(); };
        const rtry = q('#aw-r'); if (rtry) rtry.onclick = () => { qi = 0; score = 0; render(); };
      } else {
        const st = SO.save.d.stats; const tt = Object.keys(st.tactics).sort((a, c) => (st.tactics[c] || 0) - (st.tactics[a] || 0));
        b.innerHTML = '<p>Calls: <b>' + st.calls + '</b> - Wins: <b>' + st.wins + '</b> - Losses: <b>' + st.losses + '</b> - Cash-outs: <b>' + (st.cashouts || 0) + '</b> - Declines: <b>' + (st.declined || 0) + '</b></p>' +
          '<h3 class="sec">Tactics you have used</h3>' + (tt.length ? tt.map(k => '<div class="row"><div style="width:230px">' + esc((T[k] && T[k].name) || k) + '</div><div class="meter grow"><div class="bar"><i style="width:' + Math.min(100, (st.tactics[k] || 0) * 5) + '%;--c:#2a6bff"></i></div><span class="val">' + st.tactics[k] + '</span></div></div>').join('') : '<div class="muted">No calls yet.</div>');
      }
    }
    render();
    return w;
  }
  SO.registerApp({ id: 'awareness', name: 'Scam Awareness', icon: 'shield', desktop: true, start: true, order: 7, open });
})();
