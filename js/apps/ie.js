(function () {
  'use strict';
  const SO = window.SO = window.SO || {};
  const HOME = 'http://www.searchbuddy.com';

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function key(u) {
    return String(u || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('#')[0].replace(/\/+$/, '');
  }
  function injectCss() {
    if (document.getElementById('ie-css')) return;
    const s = el('style'); s.id = 'ie-css';
    s.textContent =
      '.ie-bar{display:flex;gap:4px;align-items:center;padding:3px 4px;flex-wrap:wrap}' +
      '.ie-addr{flex:1;min-width:120px}' +
      '.ie-th{width:24px;height:24px;flex:none;border:2px solid #0054e3;background:#fff;position:relative;overflow:hidden;margin-left:auto}' +
      '.ie-th:after{content:"";position:absolute;left:4px;top:4px;width:12px;height:12px;background:#0054e3;box-shadow:4px 4px 0 #ff8a00}' +
      '.ie-th.go:after{animation:iespin .5s steps(4) infinite}' +
      '@keyframes iespin{0%{transform:translate(0,0)}25%{transform:translate(2px,0)}50%{transform:translate(2px,2px)}75%{transform:translate(0,2px)}}' +
      '.ie-view{flex:1;overflow:auto;background:#fff;color:#000;border:2px solid;border-color:#808080 #fff #fff #808080;min-height:0}' +
      '.ie-pg{padding:10px 16px;font-size:18px;line-height:1.15}.ie-pg a{color:#00e;text-decoration:underline;cursor:pointer}' +
      '.ie-pg h1{font-size:30px;margin:6px 0}.ie-pg h2{font-size:24px;margin:10px 0 4px}.ie-pg ul{margin:4px 0 4px 22px;padding:0;list-style:square}' +
      '.ie-pg .ie-hero{padding:10px;border:2px solid #000;margin:8px 0}.ie-pg .ie-btn{font-family:inherit;font-size:18px;padding:3px 10px;background:#ece9d8;border:2px outset #fff;cursor:pointer;color:#000}' +
      '.ie-pg .ie-btn:active{border-style:inset}.ie-pg input.ie-q{font-family:inherit;font-size:20px;width:60%;border:2px inset #808080;padding:2px}' +
      '.ie-pg .ie-mq{background:#ff0;border:2px solid #f00;padding:2px;overflow:hidden;white-space:nowrap}.ie-pg .ie-mq span{display:inline-block;animation:iemq 12s linear infinite}' +
      '@keyframes iemq{from{transform:translateX(100%)}to{transform:translateX(-100%)}}.ie-pg small{font-size:15px;color:#666}' +
      /* 2003-era bank portal styling */
      '.ie-bk{border:2px solid #003a7d;background:#fff;margin:8px 0;overflow:hidden}' +
      '.ie-bk-top{background:#003a7d;color:#fff;padding:6px 12px;font-size:26px;font-weight:bold;letter-spacing:1px;display:flex;justify-content:space-between;align-items:center}' +
      '.ie-bk-top small{font-weight:normal;font-size:14px;color:#9fc1f0}' +
      '.ie-bk-nav{background:#e8ecf5;border-bottom:1px solid #6a7fae;padding:3px 10px;font-size:16px}' +
      '.ie-bk-box{border:2px inset #cfcfc0;padding:8px 10px;margin:10px auto;width:62%;min-width:240px;background:#f4f6fb}' +
      '.ie-bk-row{margin:6px 0;font-size:18px}' +
      '.ie-bk-row label{display:inline-block;width:104px}' +
      '.ie-bk input{font-family:inherit;font-size:18px;border:2px inset #808080;padding:2px 5px;width:100%;box-sizing:border-box;background:#fff}' +
      '.ie-tbl{border-collapse:collapse;width:100%;font-size:17px;margin:4px 0}' +
      '.ie-tbl th{background:#003a7d;color:#fff;text-align:left;padding:3px 8px;font-size:15px;font-weight:bold}' +
      '.ie-tbl td{border-bottom:1px solid #ccd;padding:3px 8px}' +
      '.ie-tbl .neg{color:#c00}.ie-tbl .pos{color:#060}' +
      '.ie-bal{font-size:24px;font-weight:bold;color:#002a63}' +
      '.ie-note{background:#ffffd8;border:2px dashed #b8a000;padding:5px 9px;font-size:15px;margin:10px 0;color:#333}' +
      '.ie-lock{background:#fff0f0;border:2px solid #c00;padding:10px;margin:10px 0;color:#700}' +
      '.ie-ok{background:#eef8ee;border:2px solid #060;padding:10px;margin:10px 0;color:#030}';
    document.head.appendChild(s);
  }

  const L = function (u, t) { return '<a href="' + u + '">' + t + '</a>'; };
  const PAGES = {
    'searchbuddy.com': {
      url: HOME, title: 'SearchBuddy - Your Pal For Searching',
      html: function () {
        return '<div style="text-align:center"><h1 style="font-size:48px;color:#0054e3;margin-top:24px">Search<span style="color:#ff8a00">Buddy</span></h1>' +
          '<p>The web\'s friendliest (fictional) search engine!</p>' +
          '<form class="ie-search"><input class="ie-q" name="q" placeholder="Search the totally real web"> <button class="ie-btn" type="submit">Search</button></form>' +
          '<p>' + L('http://www.totallylegit.inc', 'TotallyLegit Solutions') + ' | ' + L('http://darkmarket.scam', 'DarkMarket') + ' | ' + L('http://www.scamwatch.org', 'ScamWatch') + ' | ' + L('http://www.news.scam/today', 'Today\'s News') + '</p>' +
          '<div class="ie-mq"><span>*** SearchBuddy: now with 40% more buddies! *** You are visitor number 000,001 ***</span></div>' +
          '<p><small>&copy; SearchBuddy Inc. A fictional parody. Best viewed in Internet Explorer 6 at 800x600.</small></p></div>';
      }
    },
    'totallylegit.inc': {
      url: 'http://www.totallylegit.inc', title: 'TotallyLegit Solutions Inc.',
      html: function () {
        return '<h1 style="color:#006400">TotallyLegit Solutions Inc.&trade;</h1><div class="ie-mq"><span>WE ARE LEGIT!!! 100% LEGIT!!! ASK ANYONE (please do not ask anyone)</span></div>' +
          '<div class="ie-hero" style="background:#e8ffe8"><h2>Our Mission</h2>Synergize the paradigm of your computer\'s feelings. We help customers with problems they did not know they had.</div>' +
          '<h2>Our Services</h2><ul><li>Virus Detection (we detect them in 100% of PCs)</li><li>Remote Assistance (you hand us the controls, what could go wrong?)</li><li>Premium Gold Platinum Deluxe Support Plans</li><li>Warranty for things you never bought</li></ul>' +
          '<h2>Testimonials</h2><p>"I paid and I feel safer." - <i>Anonymous Person #1</i><br>"They called me first, so they must care." - <i>Definitely Real Customer</i></p>' +
          '<p><small>Disclaimer: This company is entirely fictional and part of a parody game. Real companies do not cold-call you about viruses. Learn the signs at ' + L('http://www.scamwatch.org', 'ScamWatch') + '.</small></p><p>' + L(HOME, '&lt;&lt; Back to SearchBuddy') + '</p>';
      }
    },
    'darkmarket.scam': {
      url: 'http://darkmarket.scam', title: 'DarkMarket - Shop in the Shadows (Parody)',
      html: function () {
        return '<div style="background:#111;color:#0f0;padding:10px;margin:-10px -16px"><h1 style="color:#0f0">DARK_MARKET.exe</h1><p>&gt; Welcome, anonymous shopper. Everything here is fake, like the stock photos.</p>' +
          '<ul><li>Used Headset (slightly haunted) ... 3 Kibble Coins</li><li>Lead List (names only, vibes included) ... 12 Kibble Coins</li><li>"Official" Badge, looks real from 40 meters ... 99 Kibble Coins</li><li>Mystery Box (contains: a box) ... 5 Kibble Coins</li></ul>' +
          '<p><button class="ie-btn" data-open="shop">Open the real in-game Shop</button></p>' +
          '<p style="color:#0a0">&gt; No refunds. No questions. No actual crimes: this is a parody.</p><p>' + L(HOME, '[ back to surface web ]') + '</p></div>';
      }
    },
    'scamwatch.org': {
      url: 'http://www.scamwatch.org', title: 'ScamWatch - Protect Yourself',
      html: function () {
        return '<h1 style="color:#0054e3">ScamWatch: Spot a Scam</h1><p>Scams by phone, email and text cost people billions. Anyone can be fooled. Here is how to protect yourself and your family.</p>' +
          '<div class="ie-hero" style="background:#fff8d0"><h2>Red flags</h2><ul>' +
          '<li><b>Urgency and fear:</b> "Act NOW or your account will be closed / you will be arrested!" Scammers want you to panic, not think.</li>' +
          '<li><b>Payment by gift card, crypto or wire transfer:</b> No real company or government agency demands gift cards. Ever.</li>' +
          '<li><b>Remote-access requests:</b> Never let a caller install software or take control of your computer, even if they say they are "tech support".</li>' +
          '<li><b>Unsolicited contact:</b> Real companies rarely call out of the blue to say your computer has a virus.</li>' +
          '<li><b>Too good to be true:</b> Surprise prizes, inheritances and guaranteed returns are bait.</li></ul></div>' +
          '<h2>What to do</h2><ul><li>Never share your card number, CVV, PIN, passwords or one-time codes.</li><li>Hang up. Then call back using the official number on your card, bill or the real website, not one the caller gave you.</li>' +
          '<li>Do not click links in unexpected messages. Go to the website yourself.</li><li>Talk to someone you trust before sending money.</li>' +
          '<li>If you already paid, contact your bank immediately, change passwords, and watch your accounts.</li><li>Report it to your national consumer protection or police fraud authority.</li></ul>' +
          '<p>Remember: SCAM OS is a parody. Real scams hurt real people, often the elderly and vulnerable. Share this page with someone.</p><p>' + L(HOME, '&lt;&lt; Back to SearchBuddy') + '</p>';
      }
    },
    'news.scam/today': {
      url: 'http://www.news.scam/today', title: 'The Daily Scam - Fake News (Parody)',
      html: function () {
        return '<h1 style="font-family:serif;border-bottom:4px double #000">The Daily Scam</h1><small>All news is fictional. Just like your free iPad.</small>' +
          '<h2>BREAKING: Local Man Receives Email From Prince, Declines For First Time</h2><p>"I just felt something was off," said the man, who wished to remain unnamed and unwired.</p>' +
          '<h2>Call Center Employee Hangs Up On Self, Calls Back To Verify</h2><p>Experts praise his security habits.</p>' +
          '<h2>Study: 9 out of 10 Viruses Are Actually Cat Hair On The Webcam</h2><p>The tenth is real, and was installed by "tech support".</p>' +
          '<h2>Gift Card Shortage Blamed On Increasingly Suspicious Phone Calls</h2><p>Governments reminded: they do not accept gift cards.</p>' +
          '<h2>Area Grandma Wins Argument Against Scammer, Gets His Address, Sends Cookies</h2><p>"He needed them," she said.</p><p>' + L(HOME, '&lt;&lt; Back to SearchBuddy') + '</p>';
      }
    }
  };
  PAGES['news.scam'] = PAGES['news.scam/today'];

  function searchPage(q) {
    const e = esc(q || '');
    const sites = [['http://www.totallylegit.inc', 'TotallyLegit Solutions Inc.', 'We found your problem. It is you not paying us.'], ['http://darkmarket.scam', 'DarkMarket', 'Haunted headsets, 3 coins.'],
      ['http://www.scamwatch.org', 'ScamWatch - How to spot scams', 'Educational, helpful, and not at all sponsored by us.'], ['http://www.news.scam/today', 'The Daily Scam', 'News as accurate as the weather on Mars.']];
    return { url: HOME + '/search?q=' + encodeURIComponent(q || ''), title: 'SearchBuddy results',
      html: '<h2 style="color:#0054e3">SearchBuddy Results for "' + e + '"</h2><p><small>About 0 to 4 results (0.00 seconds)</small></p>' +
        sites.map(function (s) { return '<p>' + L(s[0], s[1]) + '<br>' + s[2] + '<br><small style="color:#080">' + s[0] + '</small></p>'; }).join('') + '<p>' + L(HOME, 'New search') + '</p>' };
  }
  function notFound(url) {
    return { url: url, title: 'Cannot find server', html:
      '<div style="font-family:Arial,sans-serif;font-size:16px"><h1 style="font-size:26px;border-bottom:1px solid #000">The page cannot be displayed</h1>' +
      '<p>The page you are looking for is currently unavailable. The Web site might be experiencing technical difficulties, or you may need to adjust your browser settings.</p><hr>' +
      '<p>Please try the following:</p><ul><li>Click the Refresh button, or try again later.</li><li>If you typed the page address in the Address bar, make sure that it is spelled correctly.</li>' +
      '<li>To check your connection settings, click the Tools menu, and then click Internet Options.</li><li>Or try these sites: ' + L(HOME, 'SearchBuddy') + '</li></ul>' +
      '<p><b>Cannot find server or DNS Error</b><br>Internet Explorer<br><small>(This browser has no real internet. Only fictional pages exist here.)</small></p></div>' };
  }
  /* ---------- captured bank-account portals ----------
     Every victim whose banking login you captured has its own fictional site
     (www.<slug>.com). Log in BY HAND with the Wallet's credentials, answer the
     bank's identity checks with stolen dossier data, then move their money.
     A step-up SMS only reaches a live call: no call, no code. Parody: all banks,
     people and balances are generated fiction. */
  function bankHosts() {
    const d = SO.save.d, out = {};
    /* Legacy banklogin loots may predate their portal: heal them in place first. */
    if (SO.game.healBankLoots) SO.game.healBankLoots();
    Object.keys(d.banks || {}).forEach(id => { const b = d.banks[id]; if (b && b.slug) out[b.slug + '.com'] = id; });
    /* Older saves: a captured login may predate its account row. */
    (d.loot || []).forEach(l => {
      if (l.type === 'banklogin' && l.details && l.details.slug && out[l.details.slug + '.com'] === undefined) out[l.details.slug + '.com'] = null;
    });
    return out;
  }
  function bankAccForHost(host) {
    const map = bankHosts();
    if (!(host in map)) return null;
    let id = map[host];
    if (id == null) {
      const loot = (SO.save.d.loot || []).find(l => l.type === 'banklogin' && l.details && l.details.slug === host.slice(0, host.indexOf('.')));
      if (!loot || !loot.details || !loot.details.leadId) return null;
      const lead = SO.game.leadById && SO.game.leadById(loot.details.leadId);
      if (!lead) return null;
      const acc = SO.game.bankFor && SO.game.bankFor(lead, true);
      if (!acc) return null;
      id = lead.id;
    }
    return id;
  }
  const bfm = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bfd = t => new Date(t).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

  function bankPortal(host, hash, sess) {
    const G = SO.game, d = SO.save.d;
    const leadId = bankAccForHost(host);
    if (!leadId) return null;
    const lead = G.leadById(leadId), b = (d.banks || {})[leadId], doss = (d.dossiers || {})[leadId];
    if (!lead || !b || !d.dossiers) return null;
    const url = 'http://www.' + b.slug + '.com';
    const bn = String(b.bank || lead.bank || 'First Virtual Trust').toUpperCase();
    const route = String(hash || '').replace(/^#\//, '').replace(/^#/, '');
    const lnk = (r, t) => '<a href="' + url + '#' + r + '">' + t + '</a>';
    const navBar = '<div class="ie-bk-nav">' + (sess.leadId === leadId
      ? lnk('dash', 'Overview') + ' | ' + lnk('txns', 'Transactions') + ' | ' + lnk('move', 'Transfer Money') + ' | <a href="' + url + '" data-banklogout="1">Sign Off</a>'
      : 'Welcome to ' + esc(bn) + ' Online') + '</div>';
    const foot = '<p style="margin-top:10px"><small>Fictitious bank of the SCAM OS parody game: no real accounts, money or people exist here.</small></p>';
    let body = '', hint = '';
    let title = bn + ' Online Banking';

    if (b.locked || sess.locked) {
      title = 'Access Suspended - ' + bn;
      body = '<div class="ie-lock" style="padding:16px"><b>ONLINE ACCESS SUSPENDED</b><br>The holder\'s profile is locked while our fraud team reviews recent activity.' +
        (b.flags ? ' This session raised ' + b.flags + ' of 3 possible security flags.' : '') + '</div>' +
        '<p>' + L(HOME, 'SearchBuddy') + '</p>' + foot;
    } else if (sess.leadId !== leadId) {
      body = '<div class="ie-bk-box">' +
        '<b style="font-size:22px">Sign on to Online Banking</b>' +
        (sess.err ? '<div class="ie-lock">' + esc(sess.err) + '</div>' : '') +
        '<form data-bank="login" autocomplete="off" spellcheck="false">' +
        '<div class="ie-bk-row"><label>Username:</label><input name="u" maxlength="24" autocapitalize="off"></div>' +
        '<div class="ie-bk-row"><label>Password:</label><input name="p" type="password" maxlength="24" autocapitalize="off"></div>' +
        '<div style="margin-top:8px"><button class="ie-btn" type="submit">Sign On</button></div>' +
        '</form><small>Only logins captured on calls (Wallet) open this profile. Nothing is filled in for you.</small></div>' + foot;
      hint = 'Logins + passwords come from bank-login payloads (Wallet). They are typed, never pasted by the app.';
    } else if (sess.secure) {
      if (!sess.q) { const q = G.bankQuestion(leadId); sess.q = { text: q.q, f: q.f }; }
      body = '<div class="ie-bk-box"><b style="font-size:22px">Identity Check</b>' +
        (sess.err ? '<div class="ie-lock">' + esc(sess.err) + '</div>' : '') +
        '<div style="margin:6px 0">Hi ' + esc(String(lead.name).split(' ')[0]) + ', for your protection please confirm the following:</div>' +
        '<div style="border:2px inset #cfcfc0;background:#fff;padding:8px;margin:6px 0;font-size:19px">' + esc(sess.q.text) + '</div>' +
        '<form data-bank="secure" autocomplete="off" spellcheck="false"><div class="ie-bk-row"><label>Answer:</label><input name="a" maxlength="34"></div>' +
        '<div><button class="ie-btn" type="submit">Verify</button></div></form>' +
        '<small>Verification answers must match the holder\'s records exactly. Three failures lock the profile.</small></div>' + foot;
      hint = 'Dossier data (Wallet / ID Forge Registry) holds these answers.';
    } else if (route === 'send') {
      const pend = G.bankPending[leadId];
      const live = !!(sess.stepUp && sess.stepUp.live);
      if (!pend) {
        body = '<div class="ie-lock" style="padding:14px">There is no pending approval on this session: begin a fresh transfer.</div><p>' + lnk('move', 'Transfer Money') + '</p>' + foot;
      } else {
        const mins = Math.max(0, Math.ceil((6e5 - (Date.now() - pend.t)) / 6e4));
        const hh = sess.stepUp && sess.stepUp.live ? 'You may hear their phone buzz wherever the call log lives; the code only reaches THEM.' :
          (SO.activeCall && SO.activeCall.isActive()
            ? 'They are on the line now: press <b>Send it again</b> so the code text buzzes through this call.'
            : 'No live call carried the SMS: the holder\'s phone buzzed to nobody but them. Dial ' + esc((doss && doss.phone) || '555-' + String(1000 + (parseInt(lead.id.replace(/\D/g, '') || 3) % 9000))) + ' in the Phone app, then press Send it again - or type one of THEIR unused one-time codes from the Wallet.');
        body = '<div class="ie-bk-box" style="width:78%"><b style="font-size:22px">Approve this transfer</b>' +
          '<table class="ie-tbl">' +
          '<tr><th>To</th><th>Debit</th><th>Amount</th></tr>' +
          '<tr><td>' + esc(pend.payee) + (pend.acct ? ' (...' + esc(pend.acct) + ')' : '') + '</td><td>' + (pend.from === 'checking' ? 'Checking' : pend.from === 'savings' ? 'Savings' : 'All accounts') + '</td><td>' + bfm(pend.amount) + '</td></tr></table>' +
          '<div style="margin:6px 0">A 6-digit approval code was texted to the holder\'s phone ending in <b>' + esc(String((doss && doss.phone) || '555-0000').replace(/\d(?=\d{2})/g, '\u2022')) + '</b>.</div>' +
          '<div class="ie-note">' + hh + '</div>' +
          (sess.err ? '<div class="ie-lock">' + esc(sess.err) + '</div>' : '') +
          '<form data-bank="code" autocomplete="off" spellcheck="false"><div class="ie-bk-row"><label>Code:</label><input name="c" maxlength="6" inputmode="numeric" placeholder="______"></div>' +
          '<div class="row" style="display:flex;gap:8px;align-items:center"><button class="ie-btn" type="submit">Verify code</button>' +
          ' <a href="javascript://" data-bankresend="1">Send it again</a></div></form>' +
          '<small>Codes die in ' + (mins || 1) + ' minute(s). Verification code attempts: 3 before a security flag.</small></div>' + foot;
        hint = 'The holder\'s phone got the 6 digits: hear them read it on a live call, then type the code here - or burn one of THEIR unused Wallet codes.';
      }
    } else if (route === 'r' && sess.receipt) {
      title = 'Transfer Approved - ' + bn;
      body = '<div class="ie-ok" style="padding:14px"><b style="font-size:24px">TRANSFER APPROVED</b><br>' +
        bfm(sess.receipt.amt) + ' moved from ' + esc(bn) + ' to <b>' + esc(sess.receipt.payee) + '</b>' + (sess.receipt.acct ? ' (...' + esc(sess.receipt.acct) + ')' : '') +
        '<br>Reference: ' + esc(sess.receipt.ref) + '<br><small>Fraud desks log transfers like this. The holder may notice the missing funds soon.</small></div>' +
        '<p>' + lnk('move', 'Move more money') + ' | ' + lnk('dash', 'Back to Overview') + '</p>' + foot;
      sess.receipt = null;
    } else if (route === 'txns') {
      body = '<h2 style="margin:6px 0">Account activity</h2><table class="ie-tbl"><tr><th>Date</th><th>Description</th><th>Amount</th></tr>' +
        b.txns.map(t => '<tr><td>' + bfd(t.d) + '</td><td>' + esc(t.txt) + '</td><td class="' + (t.amt < 0 ? 'neg' : 'pos') + '">' + (t.amt < 0 ? '-' : '+') + bfm(Math.abs(t.amt)) + '</td></tr>').join('') + '</table>' +
        '<p>' + lnk('dash', 'Back to Overview') + '</p>' + foot;
    } else if (route === 'move') {
      const maxCap = Math.min(9500, Math.round(Math.max(1200, (lead.wealth || 800) * 0.55)));
      body = '<h2 style="margin:6px 0">Transfer money</h2>' +
        (sess.err ? '<div class="ie-lock">' + esc(sess.err) + '</div>' : '') +
        '<div class="ie-bk-box" style="width:86%">' +
        '<form data-bank="move" autocomplete="off" spellcheck="false">' +
        '<div class="ie-bk-row"><label>To (payee):</label><input name="payee" maxlength="28"></div>' +
        '<div class="ie-bk-row"><label>Account/memo:</label><input name="acct" maxlength="6" placeholder="123456 (optional)"></div>' +
        '<div class="ie-bk-row"><label>Amount ($):</label><input name="amt" inputmode="decimal" maxlength="8"></div>' +
        '<div class="ie-bk-row"><label>Debit:</label><select name="from" style="font-family:inherit;font-size:18px"><option value="all">All accounts</option><option value="checking">Everyday Checking</option><option value="savings">Savings</option></select></div>' +
        '<div style="margin-top:8px"><button class="ie-btn" type="submit">Continue</button></div></form>' +
        '<small>Available including savings: ' + bfm(b.checking + b.savings) + ' &bull; per-transfer ceiling: ' + bfm(maxCap) + ' &bull; a reply text is required to release funds.</small></div>' + foot;
      hint = 'Amounts over the ceiling are refused by the bank engine; big slices of the balance invite the fraud desk.';
    } else {
      /* Overview (also the default signed-in landing page) */
      const maxCap = Math.min(9500, Math.round(Math.max(1200, (lead.wealth || 800) * 0.55)));
      body = '<h2 style="margin:6px 0 2px">Good day, ' + esc(lead.name) + '</h2>' +
        '<small>Holder since 1998 &#8226; ' + esc((doss && doss.city) || lead.city || '') + ' &bull; member services: 555-01' + String(100 + (String(lead.id).length * 7) % 900) + '</small>' +
        '<div class="ie-bk-box" style="width:88%">' +
        '<table class="ie-tbl"><tr><th>Account</th><th>Balance</th></tr>' +
        '<tr><td>Everyday Checking</td><td>' + bfm(b.checking) + '</td></tr>' +
        '<tr><td>Savings</td><td>' + bfm(b.savings) + '</td></tr>' +
        '<tr><td><b>Available to move</b></td><td><b>' + bfm(b.checking + b.savings) + '</b></td></tr></table>' +
        '<div style="margin:4px 0">Per-transfer ceiling: <b>' + bfm(maxCap) + '</b></div>' +
        (b.flags ? '<div class="ie-lock">Security flags: ' + b.flags + ' of 3. One more risky move could deactivate online access.</div>' : '') +
        '</div>' +
        '<h3 style="margin:4px 0 2px">Recent activity</h3><table class="ie-tbl">' +
        b.txns.slice(0, 4).map(t => '<tr><td>' + bfd(t.d) + '</td><td>' + esc(t.txt) + '</td><td class="' + (t.amt < 0 ? 'neg' : 'pos') + '">' + (t.amt < 0 ? '-' : '+') + bfm(Math.abs(t.amt)) + '</td></tr>').join('') + '</table>' +
        '<p>' + lnk('move', 'Move money') + ' | ' + lnk('txns', 'View all transactions') + '</p>' + foot;
    }
    return { url: url + (route ? '#' + route : ''), title: title, html: '<div class="ie-bk"><div class="ie-bk-top">' + esc(bn) + '<small>Online Banking Service</small></div>' + navBar + '<div style="padding:0 12px 12px">' + body + '</div></div>', hint };
  }

  function lookup(url, sess) {
    const k = key(url);
    if (k.indexOf('searchbuddy.com/search') === 0) {
      let q = ''; const m = k.match(/[?&]q=([^&]*)/);
      try { q = m ? decodeURIComponent((String(url).match(/[?&]q=([^&#]*)/) || [0, ''])[1]).replace(/\+/g, ' ') : ''; } catch (e) { q = ''; }
      return searchPage(q);
    }
    const p = PAGES[k];
    if (p) return { url: p.url, title: p.title, html: p.html() };
    /* Captured bank-account portals live on their own host: www.<slug>.com(#route) */
    const hm = String(url).match(/#(.*)$/);
    const bp = bankPortal(k.indexOf('/') < 0 ? k : k.slice(0, k.indexOf('/')), hm ? '#' + hm[1] : '', sess);
    if (bp) return bp;
    return notFound(/^https?:\/\//i.test(url) ? url : 'http://' + url);
  }

  function open(args) {
    args = args || {};
    try {
      injectCss();
      const w = SO.wm.open({ id: 'ie', title: 'Internet Explorer', icon: 'ie', w: 720, h: 500, onClose: function () { clearTimeout(tm); } });
      if (!w || !w.fresh) {
        /* Re-visiting an open browser: hand it the requested page if one was asked for. */
        if (w && args.url && w.navigo) w.navigo(args.url);
        return w;
      }
      let hist = [], hi = -1, tm = null, cur = HOME;
      /* The bank-portal session lives with the window, like real session cookies. */
      const sess = { leadId: null, secure: false, q: null, err: '', locked: false, stepUp: null, receipt: null, hint: '' };
      const G = SO.game;

      const mb = el('div', 'menubar');
      const tb = el('div', 'toolbar ie-bar');
      const bBack = el('button', 'xp-btn', '< Back'), bFwd = el('button', 'xp-btn', 'Forward >'), bRef = el('button', 'xp-btn', 'Refresh'), bHome = el('button', 'xp-btn', 'Home');
      const th = el('div', 'ie-th');
      [bBack, bFwd, bRef, bHome, th].forEach(function (b) { tb.appendChild(b); });
      const ar = el('div', 'ie-bar');
      const addr = el('input', 'xp-input ie-addr'), go = el('button', 'xp-btn', 'Go');
      ar.appendChild(el('span', null, 'Address')); ar.appendChild(addr); ar.appendChild(go);
      const view = el('div', 'ie-view');
      const sb = el('div', 'statusbar'); sb.textContent = 'Done';
      [mb, tb, ar, view, sb].forEach(function (x) { w.body.appendChild(x); });

      SO.xpmenu.bar(mb, [
        { label: 'File', items: [{ label: 'Close', fn: function () { w.close(); } }] },
        { label: 'Favorites', items: function () {
            const its = [{ label: 'SearchBuddy', fn: function () { nav(HOME); } }, { label: 'ScamWatch', fn: function () { nav('http://www.scamwatch.org'); } }, { label: 'The Daily Scam', fn: function () { nav('http://www.news.scam/today'); } }];
            /* Captured bank profiles get their own Favorites entries. */
            const d = SO.save.d;
            if (SO.game.healBankLoots) SO.game.healBankLoots();
            const accs = Object.keys(d.banks || {}).map(id => ({ id, b: d.banks[id] })).filter(x => x.b && x.b.slug && G.leadById(x.id));
            if (accs.length) {
              its.push({ sep: true });
              its.push({ label: 'Your captured bank portals:', disabled: true });
              accs.forEach(x => its.push({ label: (x.b.bank || 'Bank') + ' - ' + (G.leadById(x.id) || {}).name, fn: function () { nav('http://www.' + x.b.slug + '.com'); } }));
            }
            return its;
          } }
      ]);

      function buttons() { bBack.disabled = hi <= 0; bFwd.disabled = hi >= hist.length - 1; }
      function show(url, pushHist) {
        clearTimeout(tm);
        let u = String(url || '').trim();
        if (!u) return;
        if (!/^[a-z]+:\/\//i.test(u)) u = 'http://' + u;
        addr.value = u; sb.textContent = 'Opening page ' + u + '...'; th.classList.add('go');
        if (pushHist) { hist = hist.slice(0, hi + 1); hist.push(u); hi++; }
        buttons();
        tm = setTimeout(function () {
          if (!w.el.isConnected) return;
          const p = lookup(u, sess);
          cur = u; addr.value = u;
          view.innerHTML = ''; const pg = el('div', 'ie-pg'); pg.innerHTML = p.html; view.appendChild(pg); view.scrollTop = 0;
          th.classList.remove('go');
          sess.hint = p.hint || '';
          sb.textContent = sess.hint || 'Done';
          titlePage(p.title);
          try { SO.audio && SO.audio.play('click'); } catch (e) { }
        }, 300);
      }
      function titlePage(t) { w.setTitle(String(t || '') + ' - Microsoft Internet Explorer'); }
      function nav(u) { sess.err = ''; show(u, true); }
      view.addEventListener('click', function (e) {
        const b = e.target.closest && e.target.closest('[data-open]');
        if (b) { try { SO.openApp(b.getAttribute('data-open')); } catch (er) { } return; }
        const rs = e.target.closest && e.target.closest('[data-bankresend]');
        if (rs && sess.leadId) {
          const r = G.bankResend(sess.leadId);
          if (sess.stepUp) sess.stepUp.live = !!r.live;
          sess.err = r.msg;
          show(cur, false);
          return;
        }
        const lg = e.target.closest && e.target.closest('[data-banklogout]');
        if (lg) { sess.leadId = null; sess.secure = false; sess.q = null; sess.err = ''; sess.stepUp = null; sess.receipt = null; nav(HOME); return; }
        const a = e.target.closest && e.target.closest('a');
        if (a) { e.preventDefault(); const h = a.getAttribute('href'); if (h && h[0] !== '#' && h !== 'javascript://') nav(h); }
      });
      view.addEventListener('mouseover', function (e) {
        const a = e.target.closest && e.target.closest('a');
        sb.textContent = a ? a.getAttribute('href') : (th.classList.contains('go') ? sb.textContent : (sess.hint || 'Done'));
      });
      view.addEventListener('submit', function (e) {
        e.preventDefault();
        const f = e.target;
        if (!f || !f.dataset || !f.dataset.bank) { nav(HOME + '/search?q=' + encodeURIComponent(f && f.q ? f.q.value : '')); return; }
        const kind = f.dataset.bank;
        if (!sess.leadId && kind !== 'login') return;
        if (kind === 'login') {
          const u = f.u ? f.u.value : '', pw = f.p ? f.p.value : '';
          if (!u.trim() || !pw.trim()) { sess.err = 'Enter both your username and password.'; show(cur, false); return; }
          const r = G.bankLogin(u, pw);
          if (!r.ok) {
            sess.err = r.msg;
            if (r.locked) sess.locked = true;
            show(cur, false);
            return;
          }
          sess.leadId = r.leadId; sess.err = ''; sess.secure = !!r.question; sess.q = r.question; sess.stepUp = null; sess.receipt = null;
          show('http://www.' + (r.bank.slug) + '.com' + (r.question ? '#secure' : '#dash'), true);
        } else if (kind === 'secure') {
          const r = G.bankAnswer(sess.leadId, f.a ? f.a.value : '');
          if (r.ok) { sess.secure = false; sess.q = null; sess.err = ''; show('http://www.' + (SO.save.d.banks[sess.leadId] || {}).slug + '.com#dash', true); }
          else {
            sess.err = r.msg;
            if (r.locked) sess.locked = true;
            show(cur, false);
          }
        } else if (kind === 'move') {
          const mv = { payee: f.payee ? f.payee.value : '', acct: f.acct ? f.acct.value : '', amount: f.amt ? f.amt.value : '', from: f.from ? f.from.value : 'all' };
          if (!String(mv.payee).trim() || !(Number(mv.amount) > 0)) { sess.err = 'The bank needs a payee and an amount before anything can move.'; show(cur, false); return; }
          const r = G.bankStartChallenge(sess.leadId, mv);
          if (r.ok) { sess.err = ''; sess.stepUp = { amt: r.amt, payee: String(mv.payee).trim(), acct: String(mv.acct).trim(), live: !!r.live, from: mv.from }; show('http://www.' + (SO.save.d.banks[sess.leadId] || {}).slug + '.com#send', true); }
          else { sess.err = r.msg; if (r.locked) sess.locked = true; show(cur, false); }
        } else if (kind === 'code') {
          const r = G.bankMove(sess.leadId, null, f.c ? f.c.value : '');
          if (r.ok) {
            sess.err = '';
            sess.receipt = { amt: r.amt, payee: sess.stepUp ? sess.stepUp.payee : 'BENEFICIARY', acct: sess.stepUp ? sess.stepUp.acct : '', ref: 'IBT-' + String(Date.now()).slice(-8) };
            show('http://www.' + (SO.save.d.banks[sess.leadId] || {}).slug + '.com#r', true);
          } else { sess.err = r.msg; if (r.locked) sess.locked = true; show(cur, false); }
        }
      });
      bBack.addEventListener('click', function () { if (hi > 0) { hi--; show(hist[hi], false); } });
      bFwd.addEventListener('click', function () { if (hi < hist.length - 1) { hi++; show(hist[hi], false); } });
      bRef.addEventListener('click', function () { show(cur, false); });
      bHome.addEventListener('click', function () { nav(HOME); });
      go.addEventListener('click', function () { nav(addr.value); });
      addr.addEventListener('keydown', function (e) { if (e.key === 'Enter') nav(addr.value); });
      w.navigo = function (u) { w.focus(); nav(u); };   // other apps can point this browser at a page
      nav(args.url || HOME);
      return w;
    } catch (err) { console.error('ie', err); }
  }

  SO.registerApp({ id: 'ie', name: 'Internet Explorer', icon: 'ie', desktop: true, start: true, order: 10, open: open });
})();
