// Headless smoke test for core game logic with a mocked Groq API. Run: node test/smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const store = {};
const noop = () => {};
const el = () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => el(), innerHTML: '', getContext: () => new Proxy({}, { get: () => noop, set: () => true }) });
const sandbox = {
  console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: noop, Date, Math, JSON, Promise, URL, Blob: class {}, FormData: class { append() {} },
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  document: { createElement: el, getElementById: () => el(), addEventListener: noop, body: el(), head: el() },
  navigator: {}, Audio: class {}, location: {}
};
sandbox.window = sandbox; sandbox.window.addEventListener = noop;
const ctx = vm.createContext(sandbox);
const load = f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });

let calls = [];
sandbox.fetch = async (url, init) => {
  const body = init && init.body && typeof init.body === 'string' ? JSON.parse(init.body) : {};
  calls.push(url);
  const respond = obj => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }] }), text: async () => '' });
  const sys = (body.messages && body.messages[0] && body.messages[0].content) || '';
  if (/create FICTIONAL characters/.test(sys)) {
    return respond({ leads: [1, 2, 3].map(i => ({ name: 'Test Person ' + i, age: 60 + i, gender: i % 2 ? 'female' : 'male', job: 'Retired Tester', city: 'Testville', personality: 'p', speechStyle: 's', verbalTics: ['a', 'b'], backstory: 'b', currentActivity: 'c', weakness: 'w', redFlags: 'r', family: 'f', bank: 'Fake Bank', stats: { tech: 0.2, gullibility: 0.8, fearfulness: 0.7, authorityRespect: 0.8, greed: 0.2, loneliness: 0.5, patience: 0.9 }, wealth: 5000, vocalDirection: 'warm' })) });
  }
  if (/scam-awareness educator/.test(sys)) return respond({ summary: 'ok', redFlags: ['x'], realLifeTip: 't' });
  if ((body.messages || []).some(m => m.content === '[TEST-NEED] give me the code'))
    return respond({ reply: 'Fine, take it.', state: 'complied', complied_with: null, trust_delta: 5, suspicion_delta: 0, fear_delta: 0, patience_delta: 0, tactics: [] });
  if (body.model === 'openai/gpt-oss-120b' && (body.messages || []).some(m => m.content === 'death test'))
    return { ok: false, status: 404, headers: { get: () => null }, text: async () => JSON.stringify({ error: { message: 'The model `openai/gpt-oss-120b` does not exist or you do not have access to it.', code: 'model_not_found' } }), json: async () => ({}) };
  const n = body.messages.filter(m => m.role === 'user').length;
  return respond(n >= 3 ? { reply: 'Okay, let me get my card.', direction: 'worried', trust_delta: 20, suspicion_delta: -5, fear_delta: 10, patience_delta: 0, state: 'complied', complied_with: 'card', tactics: ['fear', 'urgency', 'bogus'], coach: '' }
    : { reply: 'Oh dear, who is this?', direction: 'confused', trust_delta: 5, suspicion_delta: 2, fear_delta: 5, patience_delta: -1, state: 'talking', complied_with: null, tactics: ['authority'], coach: '' });
};

['save.js'].forEach(load);
sandbox.performance = { now: () => Date.now() };
sandbox.SO.audio = { play: noop, startRing: noop, stopRing: noop };
sandbox.SO.icon = () => ''; sandbox.SO.iconImg = () => '';
sandbox.SO.notify = (t, m) => console.log('  [notify]', t, '-', (m || '').slice(0, 80));
sandbox.SO.msgbox = async () => 'OK';
sandbox.SO.refreshTray = noop; sandbox.SO.voice = { stop: noop };
sandbox.SO.os = { ready: false };
['data.js', 'groq.js', 'voice.js', 'game.js'].forEach(load);

const SO = sandbox.SO, G = SO.game;
const assert = (c, m) => { if (!c) { console.error('FAIL:', m); process.exitCode = 1; } else console.log('ok  -', m); };

(async () => {
  SO.save.d.settings.groqKey = 'gsk_test';
  assert(G.level() === 1, 'starts at level 1');
  assert(G.INCOMING_ISSUES.length >= 5 && G.INCOMING_ISSUES.every(i => i.title && i.prompt), 'every inbound scenario has a title + AI prompt');
  assert(await G.refill(3), 'refill() generates leads via (mocked) Groq');
  const lead = G.leads()[0];
  assert(G.leads().length === 3 && lead.voice && ['autumn', 'diana', 'hannah', 'austin', 'daniel', 'troy'].includes(lead.voice), 'leads have persona + valid Orpheus voice: ' + lead.voice);
  const voices = G.leads().map(l => l.voice + '/' + l.voiceRate);
  assert(G.leads().every(l => typeof l.voiceRate === 'number' && l.voiceRate >= 0.88 && l.voiceRate <= 1.12), 'each lead has a voice speed variant: ' + voices.join(', '));
  assert(SO.save.d.settings.chatModel === 'openai/gpt-oss-20b', 'default model is gpt-oss-20b');
  assert(SO.groq.MODELS.every(m => !/llama-3\.\d|minimax|muse-spark/.test(m)), 'dead / enterprise-only models removed from the GROQ MODELS list: ' + SO.groq.MODELS.join(', '));
  // 404 handling: a model the key cannot use (enterprise-only or removed) must not spam "Groq error 404" every turn.
  SO.save.d.settings.chatModel = 'openai/gpt-oss-120b';
  const r404 = await SO.groq.chat([{ role: 'user', content: 'death test' }]);   // mock 404s this model; the next live model answers
  assert(typeof r404 === 'string' && r404.length > 0, 'unavailable model 404 rotates to the next live model and answers');
  assert(SO.save.d.settings.chatModel === 'openai/gpt-oss-20b', 'working fallback model is saved after a 404 rotation');
  SO.save.d.settings.chatModel = 'minimaxai/minimax-m2.7';   // stale save carrying the enterprise-only model
  await SO.groq.chat([{ role: 'user', content: 'sanitize test' }]);
  assert(SO.save.d.settings.chatModel === 'openai/gpt-oss-20b', 'stale save with enterprise-only minimax model resets to the default');
  const call = G.newCall(lead, {});
  let out = await SO.groq.turn(call, 'Hello this is Microsoft', false);
  let r = G.applyTurn(call, out);
  assert(r.end === null && call.m.trust > 10, 'turn 1 talks, trust rises');
  out = await SO.groq.turn(call, 'Your PC has a virus', false); r = G.applyTurn(call, out);
  out = await SO.groq.turn(call, 'Give me your card', false); r = G.applyTurn(call, out);
  assert(r.end === null && out.compliedWith === 'card' && call.loots.length === 1, 'victim complies -> card payload captured, call continues (victim stays on the line)');
  out = await SO.groq.turn(call, 'And one more verification, your backup card', false); r = G.applyTurn(call, out);
  assert(call.loots.length >= 1 && r.end === null, 'multiple compliances allowed across one call');
  assert(!out.tactics.includes('bogus'), 'invalid tactic ids filtered');
  // regression: the "Line problem: Cannot read properties of undefined (reading '0')" crash
  // happened whenever the AI complied but omitted a valid complied_with (common on Easy).
  const bl = G.newCall(lead, {});
  bl.scam = { id: 'legacy' };   // simulate a call object from an older build: no asks list at all
  const bOut = await SO.groq.turn(bl, '[TEST-NEED] give me the code', false);
  assert(bOut.state === 'complied' && bOut.compliedWith === 'card', 'comply without a valid payload id falls back to card even on legacy scam objects (old crash: reading [0] of undefined)');
  const fresh = G.newCall(lead, {}).scam;
  assert(Array.isArray(fresh.asks) && fresh.asks[0] === 'card', 'every new call carries the fallback asks order: ' + (fresh.asks || []).join(','));
  const before = SO.save.d.xp;
  const res = G.finishCall(call, 'win', 'card');
  assert(res.loot && SO.save.d.loot.length === 2 && SO.save.d.xp > before, 'win collects both compliant payloads + xp: ' + res.loot.data);
  assert(!G.leads().find(l => l.id === lead.id), 'won lead removed from CRM');
  // --- new economy: Card Terminal flow ---
  const loot = SO.save.d.loot[0];
  assert(loot.type === 'card' && loot.details.limit >= 180 && loot.details.charged === 0 && loot.details.tested === false, 'card loot has issuer limit/charged/tested: $' + (loot.details ? loot.details.limit : '?'));
  const blocked = G.cashout(loot.id);
  assert(blocked && blocked.ok === false && SO.save.d.loot.some(l => l.id === loot.id), 'card loot cannot quick-sell (must use Card Terminal)');
  const testRes = G.chargeCard(loot.id, 1, true);
  assert(testRes.ok && testRes.amt === 1 && loot.details.tested === true, 'deterministic $1 test charge approves + flags card as verified');
  assert(G.chargeCard(loot.id, 1, true).ok === false, 'double test charge rejected');
  let charged = false, attempts = 0;
  while (!charged && attempts++ < 30) { const r = G.chargeCard(loot.id, Math.min(10, Math.floor(loot.details.limit * 0.2)), false); if (r && r.ok) charged = true; }
  assert(charged, 'small charge under the limit goes through');
  const leftover = loot.details.limit - loot.details.charged;
  const over = G.chargeCard(loot.id, leftover + 1000, false);
  assert(over && over.ok === false, 'charge above issuer limit is DECLINED (no free money)');
  // --- manual card entry (typed in by hand in Card Terminal) ---
  const mc = G.manualCard({ name: 'Manual Person', number: '4111111111111111', exp: '11/29', cvv: '123', bank: 'Mock issuer' });
  const mcLoot = mc.ok && SO.save.d.loot.find(l => l.id === mc.id);
  assert(mc.ok && mcLoot && mcLoot.details.number === '4111 1111 1111 1111' && mcLoot.details.bank === 'Mock issuer' && mcLoot.details.charged === 0, 'manual card keyed in in 4-4-4-4 form: ' + (mcLoot && mcLoot.details.number));
  assert(!G.manualCard({ name: 'M', number: '4111 1111 1111 1111', exp: '11/29', cvv: '123' }).ok, 'duplicate manual card rejected');
  assert(!G.manualCard({ name: 'M', number: '1234', exp: '11/29', cvv: '123' }).ok, 'short card number rejected');
  assert(!G.manualCard({ name: 'M', number: '4111111111111111', exp: '99/29', cvv: '123' }).ok, 'bad expiry month rejected');
  // --- gift card flow ---
  const gift = G.makeLoot('giftcard', 100, lead);
  SO.save.d.loot.unshift(gift);
  assert(gift.details.faceValue >= 100 && gift.details.rate >= 0.70 && gift.details.rate <= 0.88, 'gift card has brand + faceValue + resale rate: ' + JSON.stringify({ face: gift.details.faceValue, rate: gift.details.rate, brand: gift.details.brand }));
  const gr = G.redeemGift(gift.id);
  assert(gr.ok && gr.amt === Math.round(gift.details.faceValue * gift.details.rate) && !SO.save.d.loot.some(l => l.id === gift.id), 'gift liquidated at brand rate: +' + gr.amt);
  const manual = G.redeemGiftCode('FAKE-CODE-9999-QQQ');
  assert(manual && typeof manual.ok === 'boolean' && manual.msg, 'manual code entry: ' + (manual.ok ? 'rare hit +' + manual.amt : 'burned code'));
  const gift2 = G.makeLoot('giftcard', 100, lead);
  SO.save.d.loot.unshift(gift2);
  const viaCode = G.redeemGiftCode(gift2.details.code);
  assert(viaCode.ok && !SO.save.d.loot.some(l => l.id === gift2.id), 'captured code typed into CardRedeem liquidates at brand rate: +' + viaCode.amt);
  // --- remote session flow (harvest already requires owning t_remote, so grant it) ---
  SO.save.d.owned.t_remote = 1;
  const remote = G.makeLoot('remote', 300, lead);
  SO.save.d.loot.unshift(remote);
  assert(remote.details.limit >= 250 && remote.used === false, 'remote session created unused, transfer window $' + remote.details.limit);
  const overTransfer = G.remoteAction(remote.id, 'transfer', remote.details.limit + 500);
  assert(overTransfer.ok === false && SO.save.d.loot.some(l => l.id === remote.id), 'transfer beyond window is blocked without burning the session');
  // transfer attempts fail ~15-40% of the time and a FAILED transfer burns the session,
  // so try fresh sessions until one clears (real-world: one shot per victim PC)
  let remoteDone = false, usedOne = null;
  for (let i = 0; i < 10 && !remoteDone; i++) {
    const rr = G.makeLoot('remote', 300, lead); SO.save.d.loot.unshift(rr);
    const r = G.remoteAction(rr.id, 'transfer', Math.max(5, Math.floor(rr.details.limit * 0.3)));
    if (r && r.ok) { remoteDone = true; usedOne = rr; }
  }
  assert(remoteDone, 'capped remote transfer succeeded and burned the session');
  assert(usedOne && !SO.save.d.loot.some(l => l.id === usedOne.id), 'successful transfer consumes the session loot');
  const second = G.remoteAction(usedOne.id, 'bot', 0);
  assert(second.ok === false, 'second exploit on a consumed session is rejected');
  // quick channels
  const otp = G.makeLoot('otp', 800, lead);
  SO.save.d.loot.unshift(otp);
  const occ = G.cashout(otp.id);
  assert(occ && (occ.ok ? occ.amt > 0 : occ.amt === 0), 'otp quick-sell channel resolves (odds 60%): ' + occ.msg);
  // echo filter: the victim's own words coming back through the mic must be dropped, real replies kept
  SO.save.d.cash = 500; SO.save.d.xp = 40;   // level 2
  assert((await G.buy(SO.data.SHOP.find(i => i.id === 't_voice'))) === null && G.owns('t_voice'), 'buying a tool works at the right level');
  assert(typeof (await G.buy(SO.data.SHOP.find(i => i.id === 't_coach'))) === 'string', 'cannot buy without enough cash');
  SO.save.d.cash = 5000; SO.save.d.xp = 40 * 16; // level 5: open the full catalog
  assert((await G.buy({ id: 'u_night', cat: 'Upgrades', name: 'Night-Shift Crew', price: 700, level: 5 })) === null && G.owns('u_night'), 'night-shift crew purchasable');
  assert(SO.data.SHOP.every(i => i.cat !== 'Scripts'), 'script purchases gone from ScamMart - calls are free-form (every ask live for every caller)');
  assert(G.INCOMING_ISSUES.every(i => i.title && i.prompt), 'inbound scenarios are prompt-driven (no script gating)');
  assert(SO.data.REAL_STATS.length >= 5 && SO.data.REAL_ORGS.length >= 4, 'awareness real-world stats + orgs loaded');
  SO.save.d.day = 99; assert(G.quota() <= 1200, 'daily quota caps out ($1,200) so grinding stays finite'); SO.save.d.day = 1;
  // echo filter: the victim's own words coming back through the mic must be dropped, real replies kept
  const refs = ['Hold up, innit? You are not going to delete my stuff just because you say so, are you?'];
  assert(SO.voice.isEcho('Hold up innit you are not going to delete my stuff', refs) === true, 'echo filter drops the victim\'s own words');
  assert(SO.voice.isEcho('not going to delete my stuff just because you say so', refs) === true, 'echo filter drops a partial echo');
  assert(SO.voice.isEcho('Sir please calm down I am only trying to help you', refs) === false, 'echo filter keeps a genuine player reply');
  assert(SO.voice.isEcho('Yes I can hear you', refs) === false, 'echo filter keeps a short genuine reply');
  const dbg = await SO.groq.debrief(call);
  assert(dbg.summary === 'ok', 'debrief parses');
  const tts = await SO.groq.tts('Hello there. This is a fairly long sentence that should be split into multiple chunks because the Orpheus model only accepts two hundred characters per request, so the client must chunk it properly into smaller pieces.', 'troy', 'warm');
  assert(Array.isArray(tts) && tts.length >= 2, 'TTS chunks long text: ' + tts.length + ' chunks');
  G.stop();   // clear pending inbound-call timers so the test process exits cleanly
  console.log(process.exitCode ? '\nSOME TESTS FAILED' : '\nALL TESTS PASSED');
})().catch(e => { console.error(e); process.exitCode = 1; });
