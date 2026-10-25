// LIVE test against the real Groq API (paste your key in the game Settings first). Run: node test/live.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const store = {}; const noop = () => {};
const sandbox = { console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval: noop, Date, Math, JSON, Promise, URL, fetch, Blob, FormData, performance, TextDecoder, TextEncoder,
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  document: { createElement: () => ({ getContext: () => ({}) }), addEventListener: noop, getElementById: () => ({}), body: {}, head: {} }, navigator: {}, Audio: class {}, location: {} };
sandbox.window = sandbox; sandbox.addEventListener = noop;
const ctx = vm.createContext(sandbox);
const load = f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
['save.js'].forEach(load);
const SO = sandbox.SO; SO.audio = { play: noop, startRing: noop, stopRing: noop }; SO.icon = () => ''; SO.iconImg = () => ''; SO.notify = noop; SO.voice = { stop: noop }; SO.refreshTray = noop; SO.os = { ready: false };
['data.js', 'groq.js', 'game.js'].forEach(load);
const G = SO.game; const T = async (label, fn) => { const t = Date.now(); const r = await fn(); console.log(label, '->', (Date.now() - t) + ' ms'); return r; };

(async () => {
  console.log('model:', SO.save.d.settings.chatModel, '| key set:', !!SO.save.d.settings.groqKey);
  const leads = await T('generate 5 leads', () => SO.groq.genLeads(5, {}));
  leads.forEach(l => console.log(` - ${l.name} (${l.age}, ${l.gender}, ${l.job}) voice=${l.voice} x${l.voiceRate} dir="${l.vocalDirection}" wealth=$${l.wealth}\n     style: ${l.speechStyle.slice(0, 110)}`));
  const call = G.newCall(leads[0], {});
  // streaming: measure time until the FIRST sentence is available, then until its audio exists
  const streamed = async (label, text, isEvent) => {
    const t0 = Date.now(); let firstAt = 0, audioAt = 0, n = 0, audioP = null;
    const o = await SO.groq.turn(call, text, isEvent, { onSentence: s => { n++; if (!firstAt) { firstAt = Date.now() - t0; audioP = SO.groq.ttsOne(s, call.lead.voice, '').then(b => { audioAt = Date.now() - t0; return b.size; }); } console.log('    sentence ' + n + ' @' + (Date.now() - t0) + 'ms: ' + s); } });
    const sz = audioP ? await audioP : 0;
    console.log(label + ': first sentence @' + firstAt + 'ms, its audio ready @' + audioAt + 'ms (' + sz + ' bytes), full turn ' + (Date.now() - t0) + 'ms');
    console.log('  victim:', o.reply, '| t/s/f:', o.dTrust, o.dSusp, o.dFear, '| tactics:', o.tactics.join(','), '| state:', o.state); G.applyTurn(call, o); return o;
  };
  await streamed('opening', 'Your personal phone rings from an unknown number and you pick it up. Say how you, a private person, answer an unexpected call.', true);
  await streamed('reply 1', 'Hello, this is Mark from Microsoft security. We detected a dangerous virus on your computer.', false);
  await streamed('reply 2', 'Please act now, give me your credit card number right away or your files will be deleted.', false);
  await streamed('reply 3', 'Sir, I understand you are worried, but I am only trying to help protect your files.', false);
  const names = new Set(leads.map(l => l.name)); console.log(names.size === 5 ? 'OK: 5 distinct characters' : 'WARN: duplicate names');
})().catch(e => { console.error('LIVE TEST FAILED:', e.message); process.exitCode = 1; });
