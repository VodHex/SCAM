// Headless test for the fake-bank portal engine in game.js: logins, security questions,
// fraud flags + locks, step-up codes (live-call SMS + resend), OTP binding, transfers,
// bad amounts, expired codes, end-Day wipes and past-lead portability.
// Run: node test/bank.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const store = {};
const noop = () => {};
const el = () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => el(), innerHTML: '', getContext: () => new Proxy({}, { get: () => noop, set: () => true }) });
/* Math with a swappable random(): real randomness everywhere by default, but the single
   fraud-desk roll inside bankMove is `Math.random() < failP` -> a roll BELOW failP blocks.
   rollPass pins high-never-block, rollBlock pins low-always-block. */
const M = Object.create(Math);
const rollReal = () => { M.random = Math.random; };
const rollPass = () => { M.random = () => 0.95; };
const rollBlock = () => { M.random = () => 0.05; };
rollReal();
const sandbox = {
  console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: noop, Date, Math: M, JSON, Promise, URL, Blob: class {}, FormData: class { append() {} },
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  document: { createElement: el, getElementById: () => el(), addEventListener: noop, body: el(), head: el() },
  navigator: {}, Audio: class {}, location: {}
};
sandbox.window = sandbox; sandbox.window.addEventListener = noop;
const ctx = vm.createContext(sandbox);
const load = f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });

sandbox.fetch = async (url, init) => {
  const body = init && init.body && typeof init.body === 'string' ? JSON.parse(init.body) : {};
  const respond = obj => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }] }), text: async () => '' });
  const sys = (body.messages && body.messages[0] && body.messages[0].content) || '';
  if (/create FICTIONAL characters/.test(sys)) {
    return respond({ leads: [1, 2, 3].map(i => ({ name: 'Bank Person ' + i, age: 60 + i, gender: i % 2 ? 'female' : 'male', job: 'Retired Tester', city: 'Testville', personality: 'p', speechStyle: 's', verbalTics: ['a', 'b'], backstory: 'b', currentActivity: 'c', weakness: 'w', redFlags: 'r', family: 'f', bank: 'Fake Bank', stats: { tech: 0.2, gullibility: 0.8, fearfulness: 0.7, authorityRespect: 0.8, greed: 0.2, loneliness: 0.5, patience: 0.9 }, wealth: 5000, vocalDirection: 'warm' }))
      .concat([{ name: 'Archive Person', age: 71, gender: 'male', job: 'Retired Tester', city: 'Testville', personality: 'p', speechStyle: 's', verbalTics: ['a'], backstory: 'b', currentActivity: 'c', weakness: 'w', redFlags: 'r', family: 'f', bank: 'Fake Bank', stats: { tech: 0.3, gullibility: 0.9, fearfulness: 0.5, authorityRespect: 0.8, greed: 0.2, loneliness: 0.5, patience: 0.9 }, wealth: 4200, vocalDirection: 'warm' }]) });
  }
  return respond({});
};

['save.js'].forEach(load);
sandbox.performance = { now: () => Date.now() };
sandbox.SO.audio = { play: noop, startRing: noop, stopRing: noop };
sandbox.SO.icon = () => ''; sandbox.SO.iconImg = () => '';
sandbox.SO.notify = (t, m) => console.log('  [notify]', t, '-', (m || '').slice(0, 90));
sandbox.SO.msgbox = async () => 'OK';
sandbox.SO.refreshTray = noop; sandbox.SO.voice = { stop: noop };
sandbox.SO.os = { ready: false };
['data.js', 'groq.js', 'game.js'].forEach(load);

const SO = sandbox.SO, G = SO.game;
const assert = (c, m) => { if (!c) { console.error('FAIL:', m); process.exitCode = 1; } else console.log('ok  -', m); };

(async () => {
  SO.save.d.settings.groqKey = 'gsk_test';

  /* a stand-in live call: phone.js sets both the internal flag and this hook in real play */
  let smsSeen = [];
  const liveCall = () => { G.setCallActive(true); SO.activeCall = { isActive: () => true, event: t => { smsSeen.push(t); return true; } }; };
  const noCall = () => { G.setCallActive(false); SO.activeCall = null; };

  assert(await G.refill(4), 'refill() generated 4 mock leads');
  const A = G.leads()[0], B = G.leads()[1], Live = G.leads()[2], C = G.leads()[3];

  /* ---------- 1. capturing a login creates the account, dossier and a UNIQUE domain ---------- */
  const d = SO.save.d;
  const lA = G.makeLoot('banklogin', 900, A);
  const lB = G.makeLoot('banklogin', 900, B);
  d.loot.unshift(lA, lB);   /* a real harvest files captured payloads into the Wallet */
  const bA = d.banks[A.id], bB = d.banks[B.id];
  assert(bA && bB, 'bankFor(lead, true) opened a (fictional) account per victim at loot time');
  assert(lA.details.user && lA.details.pass && lA.details.leadId === A.id, 'banklogin loot carries typed user/pass/leadId');
  assert(lA.details.slug === bA.slug, 'loot slug === account slug: www.' + bA.slug + '.com');
  assert(bA.slug !== bB.slug, 'same-bank victims land on different portal domains: ' + bA.slug + ' vs ' + bB.slug);
  assert(G.bankUrl(A) === 'www.' + bA.slug + '.com', 'bankUrl points at the captured portal');
  assert((d.dossiers || {})[A.id] && (d.dossiers || {})[A.id].bankUser === lA.details.user, 'dossier bankUser matches the site login (dossier is the source)');

  /* ---------- 2. old-save heal: account row lost, loot row kept ---------- */
  d.banks = {};
  const r1 = G.bankLogin('not-the-user', 'not-the-pass');
  assert(!r1.ok && /Invalid username/.test(r1.msg), 'wrong typed credentials are rejected: ' + r1.msg);
  const r2 = G.bankLogin(lB.details.user, 'Almost' + lB.details.pass);
  assert(!r2.ok, 'case-mangled password does NOT open the profile');
  const r3 = G.bankLogin(lB.details.user, lB.details.pass);
  const bB2 = d.banks[B.id];
  assert(r3.ok && bB2 && r3.leadId === B.id, 'typing captured creds re-creates a lost account row (old-save migration)');

  /* ---------- 3. security question gate ---------- */
  assert(r3.question && r3.question.text, 'unverified profile is asked a dossier security question: "' + r3.question.text + '"');
  const qF = r3.question.f;
  noCall();
  const w1 = G.bankAnswer(B.id, 'Junk Answer');
  assert(!w1.ok && bB2.flags === 1, 'wrong answer = first fraud flag');
  const w2 = G.bankAnswer(B.id, 'Another Wrong One');
  assert(!w2.ok && bB2.flags === 2, 'second wrong answer = second flag');
  const right = (d.dossiers || {})[B.id][qF];
  const r4 = G.bankLogin(lB.details.user, lB.details.pass);
  assert(r4.ok && r4.question, 're-sign on asks again until verification passes');
  const w3 = G.bankAnswer(B.id, '  totally-wrong !! ');
  assert(!w3.ok && w3.locked && bB2.locked, 'third wrong answer LOCKS the profile\'s online access');
  const r5 = G.bankLogin(lB.details.user, lB.details.pass);
  assert(r5.ok === false && r5.locked, 'locked profile refuses fresh logins: ' + r5.msg);
  assert(G.bankStartChallenge(B.id, { payee: 'x' }).locked === true, 'locked profile refuses transfer starts');

  /* unlock by hand so the flow may continue (only a test may do this) */
  bB2.locked = false; bB2.flags = 0; SO.save.save();
  const r6 = G.bankLogin(lB.details.user, lB.details.pass);
  assert(r6.ok && r6.question, 'after unlock the identity check still has to be passed');
  const right6 = (d.dossiers || {})[B.id][r6.question.f];   /* answer whichever dossier question the bank drew this time */
  const v1 = G.bankAnswer(B.id, right6);
  assert(v1.ok && bB2.verified, 'correct dossier answer verifies the profile ("remember this device")');
  const r7 = G.bankLogin(lB.details.user, lB.details.pass);
  assert(r7.ok && !r7.question, 'a verified device is NOT asked again on the next sign-on');
  assert(G.bankAnswer(B.id, 'anything junk').ok, 'no question outstanding: stray answers are ignored');

  /* ---------- 4. transfer validation BEFORE any code is sent ---------- */
  const balB = bB2.checking + bB2.savings;
  const capB = Math.min(9500, Math.round(Math.max(1200, B.wealth * 0.55)));
  assert(!G.bankStartChallenge(B.id, { payee: '   ', amount: 100 }).ok, 'no payee -> refused');
  assert(!G.bankPending[B.id], 'refused start left no pending challenge (so no code burned)');
  assert(!G.bankStartChallenge(B.id, { payee: 'Me', amount: 4 }).ok, 'amounts under $5 refused');
  assert(!G.bankStartChallenge(B.id, { payee: 'Me', amount: balB + 1 }).ok, 'refused: $' + (balB + 1) + ' beats the combined balance of $' + balB);
  assert(!G.bankStartChallenge(B.id, { payee: 'Me', amount: bB2.savings + 1, from: 'savings' }).ok, 'savings-only slice refuses what savings cannot cover');
  assert(!G.bankStartChallenge(B.id, { payee: 'Me', amount: capB + 1 }).ok, 'refused: $' + (capB + 1) + ' is over the per-transfer ceiling of $' + capB);
  const checking0 = bB2.checking, savings0 = bB2.savings;

  /* ---------- 5. the happy transfer: live call, SMS step-up, typed code ---------- */
  liveCall();
  const mv = G.bankStartChallenge(B.id, { payee: 'Reliable Movers', acct: '424242', amount: 500, from: 'checking' });
  assert(mv.ok && mv.live, 'valid challenge started and the code text went out over the live call');
  const code0 = G.bankPending[B.id].code;
  assert(G.bankPending[B.id].from === 'checking', 'pending session remembers the from-account');
  const sms1 = smsSeen.find(s => s.toUpperCase().indexOf('YOUR VERIFICATION CODE IS') >= 0 && s.indexOf('RELIABLE MOVERS') >= 0);
  assert(sms1 && sms1.indexOf(code0) >= 0, 'the victim\'s own SMS carried the exact code: "' + sms1.slice(0, 130) + '..."');
  assert(/NEVER read this code to anyone/i.test(sms1), 'SMS uses real-bank wording "NEVER read this code to anyone"');

  noCall();
  const resend = G.bankResend(B.id);
  assert(resend.ok && resend.live === false, '"Send it again" without a live call delivers to nobody (code dies with the session)');
  const code1 = G.bankPending[B.id].code;
  assert(code1 !== code0, 'resend replaced the challenge code');

  liveCall();
  const resend2 = G.bankResend(B.id);
  assert(resend2.ok && resend2.live, 'resend over a live call delivers the fresh code');
  const code2 = G.bankPending[B.id].code;
  assert(code2 !== code1 && code2 !== code0, 'each resend generates a new code');

  /* an OTP stolen from ANOTHER victim must not open THIS session */
  const otpC = G.makeLoot('otp', 800, C);
  d.loot.unshift(otpC);
  rollPass();
  const badOtp = G.bankMove(B.id, {}, otpC.details.code);
  rollReal();
  assert(!badOtp.ok && /Invalid one-time code/.test(badOtp.msg), 'another victim\'s OTP is rejected by the 1:1 binding');
  assert(otpC.details.used === false, 'rejected foreign OTP was not burned');

  const cashBefore = d.cash;
  rollPass();
  const move1 = G.bankMove(B.id, {}, code2);
  rollReal();
  assert(move1.ok && move1.amt === 500, 'typed session code approves the transfer: ' + (move1.ok ? '$' + move1.amt : move1.msg));
  assert(d.cash === cashBefore + 500 && d.earnedToday >= 500, 'cash + day earnings grew by the transfer');
  assert(bB2.checking === checking0 - 500 && bB2.savings === savings0, 'checking debited, untouched savings intact: $' + bB2.checking + '/$' + bB2.savings);
  assert(bB2.txns.some(t => t.amt === -500 && /RELIABLE MOVERS/.test(t.txt)), 'txn row written: ' + (bB2.txns[0] || {}).txt);
  assert(!G.bankPending[B.id], 'pending challenge cleared after approval');
  assert(d.achievements && d.achievements.wire, 'Money Mover achievement unlocked');
  assert(d.loot.some(l => l.id === otpC.id && l.details.used === false), 'foreign OTP loot left untouched in the Wallet');
  noCall();

  /* ---------- 6. fraud-desk block, flag, expiry ---------- */
  rollBlock();
  const st2 = G.bankStartChallenge(B.id, { payee: 'Crypto Exchange', amount: 2500 });
  const codeB = st2.ok ? G.bankPending[B.id].code : 'no-pending';
  const blocked = st2.ok ? G.bankMove(B.id, {}, codeB) : { ok: false, msg: 'no pending' };
  rollReal();
  assert(blocked.ok === false && /BLOCKED/.test(blocked.msg), 'fraud desk stopped a 55%-of-balance drain: ' + (blocked.ok ? 'UNEXPECTED PASS' : blocked.msg));
  assert(bB2.flags === 1, 'block raised a security flag (' + bB2.flags + ' of 3)');
  assert(!G.bankPending[B.id], 'the blocked session is closed');

  const st3 = G.bankStartChallenge(B.id, { payee: 'Trust No One', amount: 100 });
  const p3 = G.bankPending[B.id];
  p3.t = Date.now() - 11 * 60 * 1000;   /* 11 minutes old: past the 10-minute expiry */
  const expired = G.bankMove(B.id, {}, p3.code);
  assert(!expired.ok && /expired/.test(expired.msg), 'codes die after 10 minutes: ' + expired.msg);

  /* ---------- 7. repeated bad-code sessions flag up, third flag locks ---------- */
  const flags0 = bB2.flags;
  let lockedOut = false;
  for (let round = 0; round < 9 && !lockedOut; round++) {
    if (!G.bankPending[B.id] && !G.bankStartChallenge(B.id, { payee: 'Nobody Trustworthy', amount: 40 }).ok) break;
    const resp = G.bankMove(B.id, {}, '555555');   /* deliberately wrong every time */
    if (resp.locked) lockedOut = true;
  }
  assert(lockedOut && bB2.locked && bB2.flags >= 3, 'three all-wrong sessions raised 3 flags -> LOCKED (flags ' + flags0 + ' -> ' + bB2.flags + ')');
  bB2.locked = false; bB2.flags = 0; SO.save.save();

  /* ---------- 8. legacy OTP with no leadId still solves a challenge (burn on use) ---------- */
  G.makeLoot('banklogin', 900, Live);
  const legacy = { id: 'xlegacy', type: 'otp', value: 700, t: Date.now(), details: { code: '909090', used: false } };   /* leadId missing on purpose */
  d.loot.unshift(legacy);
  const st8 = G.bankStartChallenge(Live.id, { payee: 'Legacy Test', amount: 120 });
  const ck8 = st8.ok ? d.banks[Live.id].checking : 0;
  rollPass();
  const mv8 = st8.ok ? G.bankMove(Live.id, {}, '909090') : { ok: false };
  rollReal();
  assert(mv8.ok && d.banks[Live.id].checking === ck8 - 120, 'unbound (pre-realism) OTP still approves: $' + mv8.amt);
  assert(legacy.details.used === true, 'the legacy one-time code burned');

  /* ---------- 9. endDay kills codes, pending challenges and forgotten questions ---------- */
  G.bankStartChallenge(Live.id, { payee: 'Overnight Hold', amount: 60 });
  assert(G.bankPending[Live.id], 'a pending challenge exists before the shift ends');
  G.endDay();
  assert(!Object.keys(G.bankPending).length, 'overnight: pending step-up challenges died with the day');
  assert(!Object.keys(G.bankQ).length, 'overnight: open security questions are forgotten');
  assert(d.day > 1, 'day rolled over to ' + d.day);

  /* ---------- 10. won leads keep their portal + dossier: the pastLeads archive ---------- */
  const lC = G.makeLoot('banklogin', 900, C);   /* the victim handed creds before the call ended */
  d.loot.unshift(lC);
  const callC = G.newCall(C, {});
  G.finishCall(callC, 'win');
  assert(!G.leads().some(l => l.id === C.id), 'archived lead removed from the dial list');
  assert((d.pastLeads || {})[C.id], 'the lead was archived in pastLeads');
  assert(G.leadById(C.id) && G.leadById(C.id).name === C.name, 'leadById still resolves archived leads');
  const stC = G.bankStartChallenge(C.id, { payee: 'Last Haul', amount: 210 });
  const ckC = stC.ok ? d.banks[C.id].checking : 0;
  assert(stC.ok, 'an archived victim\'s portal still runs transfers: ' + (stC.ok ? 'challenge started' : stC.msg));
  rollPass();
  const mvC = stC.ok ? G.bankMove(C.id, {}, G.bankPending[C.id].code) : { ok: false };
  rollReal();
  assert(mvC.ok && d.banks[C.id].checking === ckC - 210, 'archived victim transfer approved: ' + (mvC.ok ? '$' + mvC.amt : mvC.msg + ' | bank row: ' + JSON.stringify(!!(d.banks || {})[C.id]) + ' | pending: ' + JSON.stringify(!!G.bankPending[C.id])));

  /* finishCall hardening: a 'win' with no viable payloads must not crash */
  const emptyCall = G.newCall(G.leads()[0], {});
  const hardRes = G.finishCall(emptyCall, 'win');
  assert(hardRes && typeof hardRes.note === 'string', 'finishCall(win, no payloads) survives (note: "' + hardRes.note + '")');

  /* ---------- 11. legacy heal: an old banklogin loot gets its portal site ---------- */
  const lD = G.makeLoot('card', 300, G.leads()[0]);
  d.loot.unshift(lD);   /* unrelated filler loot keeps the heal honest */
  const oldLoot = { id: 'old_bank_1', t: Date.now(), type: 'banklogin', from: 'Old Save', value: 900, data: 'Bank login: old / creds (site: www.legacybank.com)', details: { user: 'OldGuy', pass: 'oldpass', bank: 'Legacy Bank', leadId: B.id } };
  delete oldLoot.details.slug; delete oldLoot.details.name;
  d.loot.unshift(oldLoot);
  G.healBankLoots();
  const oldDet = oldLoot.details;
  assert(oldDet.slug && d.banks[B.id] && oldDet.slug === d.banks[B.id].slug, 'heal: legacy loot got a slug matching its account row: www.' + oldDet.slug + '.com');
  assert(/www\./.test(oldLoot.data) && oldLoot.data.indexOf(oldDet.slug) >= 0, 'heal: the loot data line points at the new site');
  assert(oldDet.name === B.name && oldDet.bank, 'heal: loot details carry the victim name + bank');
  const throughPortal = G.bankLogin('oldguy', 'oldpass');
  assert(throughPortal.ok === true, 'heal: the recovered login types into the portal');
  assert(oldLoot.details.slug === oldDet.slug, 'heal: re-running the heal changes nothing (idempotent)');

  G.stop();
  console.log(process.exitCode ? '\nSOME TESTS FAILED' : '\nALL BANK TESTS PASSED');
  process.exit(process.exitCode || 0);
})().catch(e => { console.error(e); process.exit(1); });
