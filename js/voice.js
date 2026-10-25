/* SCAM OS - voice layer (100% built into the browser, no cloud audio).
   OUT: streamed sentence-by-sentence playback through the browser's speechSynthesis voice.
   IN : always-on microphone through the browser's SpeechRecognition, with a mute switch and barge-in. */
(function () {
  const SO = window.SO;
  const S = () => SO.save.d.settings;

  let token = 0, speaking = false;
  let playing = 0, lastAudioEnd = 0; // real playback state (used to stop the mic hearing the speakers)
  const listeners = [];
  const emit = s => listeners.forEach(f => { try { f(s); } catch (e) {} });

  function hashStr(s) { let h = 7; for (let i = 0; i < String(s || '').length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0; return h; }

  /* ---------------- playback (browser text to speech) ---------------- */
  function browserSpeak(text, gender, rate, seed) {
    return new Promise(res0 => {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return res0();
      let fin = false, started = false;
      playing++;
      const res = () => { if (fin) return; fin = true; playing = Math.max(0, playing - 1); lastAudioEnd = performance.now(); res0(); };
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = gender === 'female' ? 1.2 : 0.85;
      u.rate = Math.max(0.5, Math.min(1.6, rate || 1.1));
      u.volume = S().muted ? 0 : 1;
      const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
      // STABLE voice: derived from the character's voice id (seed), so a lead always sounds the same
      if (vs.length) u.voice = vs[seed ? hashStr(seed) % vs.length : Math.floor(Math.random() * vs.length)];
      u.onstart = () => { started = true; };
      u.onend = u.onerror = res;
      // Watchdogs: some environments (headless, blocked audio) never start or never finish an utterance - never stall the line.
      setTimeout(() => { if (!fin && !started) { try { speechSynthesis.cancel(); } catch (e) {} res(); } }, 2600);
      setTimeout(() => { if (!fin) { try { speechSynthesis.cancel(); } catch (e) {} res(); } }, 15000);
      speechSynthesis.speak(u);
    });
  }

  /* A speech session: push(sentence) as the text streams in, end() when finished.
     onStart(sentence) fires exactly when that sentence's audio starts (so text appears as you hear it). */
  function session(o) {
    stop();
    const tok = ++token;
    speaking = true; emit('speaking');
    const rate = Math.max(0.8, Math.min(1.6, (S().voiceSpeed || 1.1) * (o.rate || 1)));
    let chain = Promise.resolve(), resolveDone; const done = new Promise(r => { resolveDone = r; });
    function push(text) {
      text = String(text || '').trim(); if (!text) return;
      if (!o.tts) { o.onStart && o.onStart(text); return; }
      const parts = SO.groq.chunk(text, 190);
      chain = chain.then(async () => {
        let first = true;
        for (let i = 0; i < parts.length; i++) {
          if (tok !== token) return;
          if (first) { first = false; o.onStart && o.onStart(text); }
          await browserSpeak(parts[i], o.gender, rate, o.voice);
        }
      });
    }
    function end() {
      chain = chain.then(() => { if (tok === token) { speaking = false; emit('idle'); } resolveDone(); });
    }
    return { push, end, done, cancelled: () => tok !== token };
  }
  function stop() {
    token++;
    if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} }
    playing = 0; lastAudioEnd = performance.now();
    if (speaking) { speaking = false; emit('idle'); }
  }

  /* ---------------- always-on microphone (browser speech recognition) ---------------- */
  let cont = null, micMuted = false;
  const srCtor = () => window.SpeechRecognition || window.webkitSpeechRecognition;

  async function startListening(o) {
    if (cont) return true;
    if (!srCtor()) { o.onError && o.onError('This browser has no speech recognition. Use Chrome or Edge, or type instead.'); return false; }
    const c = cont = { o, rc: null, seg: { heard: false, lastHeard: 0 }, fails: 0, timer: null };
    beginRec(c, 0);
    o.onState && o.onState('listening');
    return true;
  }

  function beginRec(c, delay) {
    if (cont !== c) return;
    if (c.timer) { clearTimeout(c.timer); c.timer = null; }
    c.timer = setTimeout(() => {
      c.timer = null;
      if (cont !== c || micMuted) return;
      let rc;
      try { rc = new (srCtor())(); } catch (e) { c.o.onError && c.o.onError('Speech recognition failed to start.'); stopListening(); return; }
      c.rc = rc;
      try {
        rc.continuous = true; rc.interimResults = true; rc.lang = 'en-US'; rc.maxAlternatives = 1;
        rc.onstart = () => { if (cont === c) c.fails = 0; };
        rc.onspeechstart = () => { if (cont === c) onSpeech(c); };
        rc.onresult = e => {
          if (cont !== c || micMuted) return;
          let fin = '', live = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i]; const t = r[0] && typeof r[0].transcript === 'string' ? r[0].transcript : '';
            if (r.isFinal) fin += ' ' + t; else live += ' ' + t;
          }
          if (live.trim()) heard(c);
          fin = fin.trim();
          if (!fin) return;
          heard(c);
          deliver(c, fin);
        };
        rc.onspeechend = () => { tEv(c, false); };
        rc.onerror = ev => {
          if (cont !== c) return;
          const code = (ev && ev.error) || 'error';
          if (code === 'aborted' || code === 'no-speech') return;
          if (code === 'not-allowed' || code === 'service-not-allowed') {
            c.o.onError && c.o.onError('Microphone blocked. Allow mic access in your browser, or type instead.');
            stopListening(); return;
          }
          c.fails++;
        };
        rc.onend = () => {
          c.rc = null;
          tEv(c, false);
          if (cont !== c || micMuted) return;
          beginRec(c, Math.min(2500, 150 + (c.fails || 0) * 500)); // auto-restart so the mic is always back up
        };
        rc.start();
      } catch (e) { c.o.onError && c.o.onError('Speech recognition failed to start.'); stopListening(); }
    }, delay || 0);
  }

  function tEv(c, on) {
    if (cont === c && !((c.o.isDeaf && c.o.isDeaf()) || micMuted)) c.o.onTranscribing && c.o.onTranscribing(!!on);
  }

  /* The user actually spoke (recognition heard them). Refresh the decay marker,
     and only signal barge-in when it cannot be our own victim audio bouncing back. */
  function onSpeech(c) {
    const now = performance.now();
    c.seg.lastHeard = now;
    if (micMuted || (c.o.isDeaf && c.o.isDeaf()) || (!S().headphones && echoGate(now))) return;
    if (!c.seg.heard) c.seg.heard = true;
    c.o.onSpeechStart && c.o.onSpeechStart();
  }
  function heard(c) {
    const now = performance.now();
    c.seg.lastHeard = now;
    if (micMuted) return;
    if (c.o.isDeaf && c.o.isDeaf()) return;
    if (!c.seg.heard) { c.seg.heard = true; c.o.onSpeechStart && c.o.onSpeechStart(); }
    tEv(c, true);
  }

  function deliver(c, text) {
    tEv(c, false);
    text = String(text || '').trim(); if (!text) return;
    if (c.o.isDeaf && c.o.isDeaf()) return;                // victim thinking / app busy: never deliver
    if (!S().headphones && echoGate(performance.now())) return; // never deliver our own victim audio
    c.seg.heard = false;
    c.o.onResult && c.o.onResult(text);
  }

  function stopListening() {
    const c = cont; if (!c) return;
    cont = null;
    if (c.timer) { clearTimeout(c.timer); c.timer = null; }
    if (c.rc) { try { c.rc.abort(); } catch (e) {} c.rc = null; }
    c.seg.lastHeard = 0;
    c.o.onState && c.o.onState('idle');
  }
  function setMicMuted(m) {
    micMuted = !!m;
    if (cont) {
      if (micMuted) {
        if (cont.timer) { clearTimeout(cont.timer); cont.timer = null; }
        if (cont.rc) { try { cont.rc.abort(); } catch (e) {} cont.rc = null; }
        if (cont.seg) cont.seg.heard = false;
      } else beginRec(cont, 0); // mute = stop; unmute = start again
    }
  }

  const echoGate = now => playing > 0 || (now || performance.now()) - lastAudioEnd < 1500;
  const words = t => String(t || '').toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
  /* True when a transcript is mostly the victim's own recent words coming back through the speakers. */
  function isEcho(transcript, refTexts) {
    const w = words(transcript); if (!w.length) return true;
    const ref = new Set(); (refTexts || []).forEach(t => words(t).forEach(x => ref.add(x)));
    if (!ref.size) return false;
    const hit = w.filter(x => ref.has(x)).length / w.length;
    const recent = performance.now() - lastAudioEnd < 2500 || playing > 0;
    if (w.length >= 3) return hit >= 0.72;
    return recent && hit === 1;
  }

  SO.voice = {
    session, stop, startListening, stopListening, setMicMuted, isEcho,
    audioActive: () => playing > 0, msSinceAudio: () => performance.now() - lastAudioEnd,
    isSpeaking: () => speaking, isListening: () => !!cont, isMicMuted: () => micMuted,
    userSpeaking: () => !!(cont && cont.seg && performance.now() - cont.seg.lastHeard < 1200),
    onChange(f) { listeners.push(f); return () => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); }; },
    micSupported: () => !!srCtor()
  };
})();
