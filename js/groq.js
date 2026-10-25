/* SCAM OS - Groq client: persona generation, STREAMING victim dialogue, STT (Whisper), TTS (Orpheus).
   Parody simulation: all characters and credentials are fictional. */
(function () {
  const SO = window.SO;
  const BASE = 'https://api.groq.com/openai/v1';
  const VOICES = { female: ['autumn', 'diana', 'hannah'], male: ['austin', 'daniel', 'troy'] };
  const S = () => SO.save.d.settings;
  const MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

  function err(msg, code) { const e = new Error(msg); e.code = code; return e; }

  async function http(path, init, retries) {
    const key = S().groqKey;
    if (!key) throw err('No Groq API key set. Open Settings and paste your key.', 'nokey');
    init.headers = Object.assign({ Authorization: 'Bearer ' + key }, init.headers || {});
    let res;
    try { res = await fetch(BASE + path, init); } catch (e) { throw err('Network error talking to Groq (offline or blocked).', 'net'); }
    if (res.status === 429) {
      const ra = parseFloat(res.headers.get('retry-after')) || 5;
      if (ra <= 1.5 && (retries || 0) < 1) { await new Promise(r => setTimeout(r, ra * 1000 + 100)); return http(path, init, (retries || 0) + 1); }
      const e = err('Groq rate limit reached (free tier). Retry in ' + Math.ceil(ra) + 's.', 'rate'); e.retryAfter = ra; throw e;
    }
    if (!res.ok) {
      let body = ''; try { body = await res.text(); } catch (e) {}
      let m = body; try { const j = JSON.parse(body); m = (j.error && j.error.message) || body; if (j.error && j.error.code) m += ' [' + j.error.code + ']'; } catch (e) {}
      const c = res.status === 401 ? 'auth' : res.status === 429 ? 'rate' : 'http';
      throw err(res.status === 401 ? 'Groq rejected your API key (401). Check it in Settings.' : 'Groq error ' + res.status + ': ' + m.slice(0, 300), c);
    }
    return res;
  }

  async function attempt(model, messages, o, useJson, boost, onDelta) {
    const toks = (o.max_tokens || 500) * (boost || 1);
    const body = { model, messages, temperature: o.temperature != null ? o.temperature : 0.9 };
    if (o.penalty) { body.frequency_penalty = 0.55; body.presence_penalty = 0.25; }
    const oss = /gpt-oss/.test(model);
    if (oss) { body.reasoning_effort = 'low'; body.max_completion_tokens = toks + 300; } else body.max_tokens = toks;
    if (useJson && !oss) body.response_format = { type: 'json_object' };
    if (onDelta) body.stream = true;
    const res = await http('/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let content = '';
    if (!onDelta) {
      const j = await res.json();
      content = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    } else {
      const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line.startsWith('data:')) continue;
          const d = line.slice(5).trim(); if (d === '[DONE]') continue;
          try { const j = JSON.parse(d); const c = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content; if (c) { content += c; onDelta(content); } } catch (e) {}
        }
      }
    }
    return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  }

  const cool = {};
  const isDeadModel = e => /model_not_found|does not exist|not have access|decommissioned/i.test(e.message || '');
  async function complete(messages, o, onDelta, round) {
    o = o || {};
    if (!o.model && S().chatModel && !MODELS.includes(S().chatModel)) { S().chatModel = MODELS[0]; SO.save.save(); }
    const first = o.model || S().chatModel || MODELS[0];
    const all = [first].concat(MODELS.filter(m => m !== first));
    const now = Date.now();
    const ready = all.filter(m => !(cool[m] > now));
    const order = o.model ? [first] : ready;
    if (!order.length) {
      const soon = Math.min.apply(null, all.map(m => cool[m] || 0));
      if ((round || 0) >= 1 || soon - now > 12000) {
        throw err('All Groq models are cooling down (rate limit or temporarily unavailable). Wait ' + (soon - now > 90000 ? 'a few minutes' : Math.ceil((soon - now) / 1000) + 's') + ' and call again, or add billing on Groq for higher limits.', 'rate');
      }
      await new Promise(r => setTimeout(r, Math.min(12000, Math.max(300, soon - now))));
      return complete(messages, o, onDelta, (round || 0) + 1);
    }
    let lastErr;
    for (let i = 0; i < order.length; i++) {
      const m = order[i];
      let started = false; const wrap = onDelta && (c => { started = true; onDelta(c); });
      for (let tries = 0; tries < 3; tries++) {
        try {
          let t = await attempt(m, messages, o, o.json, tries === 2 ? 2 : 1, wrap);
          if (!t && !started) t = await attempt(m, messages, o, o.json, 2, wrap);
          if (!t) throw err('The AI returned an empty answer.', 'empty');
          if (m !== S().chatModel && !o.model && (!(cool[S().chatModel] > Date.now()) || cool[S().chatModel] > Date.now() + 5 * 60000)) { S().chatModel = m; SO.save.save(); }
          return t;
        } catch (e) {
          lastErr = e;
          if (isDeadModel(e)) cool[m] = Date.now() + 3600e3;
          if (e.code === 'rate') { cool[m] = Date.now() + Math.min(70, e.retryAfter || 20) * 1000; if (started) throw e; break; }
          if (started) throw e;
          if (/tool_use_failed|failed_generation|empty answer/i.test(e.message) && tries < 2) continue;
          break;
        }
      }
      if (!(lastErr.code === 'rate' || /model_not_found|does not exist|decommissioned|not have access|tool_use_failed|empty answer/i.test(lastErr.message)) || o.model) throw lastErr;
    }
    if (lastErr && lastErr.code === 'rate' && !o.model && (round || 0) < 1) return complete(messages, o, onDelta, (round || 0) + 1);
    if (lastErr && isDeadModel(lastErr) && !o.model) throw err('Your Groq key has no access to the selected AI model (some are enterprise-only). Open Settings and set the Chat model to openai/gpt-oss-20b, then call again.', 'model');
    throw lastErr;
  }
  const chat = (messages, o) => complete(messages, o);

  function parseJSON(t) {
    t = String(t).replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try { return JSON.parse(t); } catch (e) {}
    const m = t.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
    throw err('The AI returned something that was not valid JSON.', 'json');
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Number(v) || 0));

  /* ---------- lead / persona generation ---------- */
  const REGIONS = ['rural Midwest USA', 'suburban Texas', 'inner-city London', 'small-town Ireland', 'Toronto, Canada', 'Sydney, Australia', 'Southern USA', 'New York City', 'Scottish Highlands', 'California tech belt', 'Mumbai-born living in New Jersey', 'Florida retirement community', 'Manchester, England', 'Chicago', 'Pacific Northwest', 'rural Wales', 'Devon, England', 'small-town Ohio', 'Phoenix, Arizona', 'Halifax, Nova Scotia', 'Auckland, New Zealand', 'Norfolk, England', 'upstate New York farm country', 'Mississippi Delta', 'Bristol, England', 'Denver, Colorado', 'Cork, Ireland', 'Winnipeg, Canada', 'Melbourne, Australia', 'Kent, England'];
  const AGE_BANDS = [[18, 24], [25, 34], [35, 49], [50, 64], [65, 90]];
  const TECH_HINTS = ['clueless with computers', 'clueless with computers', 'clueless with computers', 'average with tech', 'very tech-savvy'];
  const HUMORS = ['no sense of humour at all, takes everything literally', 'dry, deadpan sarcasm', 'nervous giggler, laughs when stressed', 'dad-joke energy, terrible puns', 'teases strangers mockingly', 'dry one-word comebacks', 'chuckles warmly at small things', 'accidentally funny without meaning to be', 'softly sarcastic, never cruel'];
  const BACKGROUNDS = ['half-watching daytime TV', 'cooking noisily on the stove', 'at a messy office desk', 'in the car in a car park', 'pottering in the garden shed', 'at the kitchen table with bills spread out', 'half-asleep on the sofa', 'in the middle of feeding pets', 'at work behind a counter, trying to whisper', 'wandering round a supermarket', 'out on a walk, wind on the mic', 'nursing a cup of tea, biscuits in reach'];

  async function genLeads(n, o) {
    o = o || {};
    const seeds = [];
    for (let i = 0; i < n; i++) {
      const a = pick(AGE_BANDS);
      seeds.push((i + 1) + '. age ' + a[0] + '-' + a[1] + ', ' + pick(REGIONS) + ', ' + pick(TECH_HINTS) + (o.rich ? ', wealthy' : '') + (o.whale ? ', extremely wealthy and has a financial advisor' : ''));
    }
    const sys = 'You create FICTIONAL characters for a satirical phone-call parody game. Output ONLY JSON. Make every character feel like a distinct real human with a unique voice and way of speaking (dialect, slang, sentence rhythm, verbal tics, pet phrases). No two characters may sound alike. Never use real people, real phone numbers or real card numbers.';
    const usr = 'Create ' + n + ' different characters, one per seed:\n' + seeds.join('\n') + '\n\nReturn JSON: {"leads":[{' +
      '"name":"full name fitting their background",' +
      '"age":number,"gender":"male"|"female","job":string,"city":string,' +
      '"personality":"2 sentences on temperament and values",' +
      '"speechStyle":"HOW they talk, for a writer to imitate with a LIGHT touch: regional/age flavor, rhythm, formality, usual sentence length, how they sound when scared/angry/trusting. Real people speak mostly ordinary English, so do NOT list slang words like a checklist; mention at most one or two signature words",' +
      '"verbalTics":["2 RARE pet phrases or habits (used maybe once in a whole call)"],' +
      '"humor":"the humor style that fits THIS personality, one short phrase (pick a distinct one from this list: ' + HUMORS.join(' / ') + ')",' +
      '"phoneGreeting":"exactly how they answer their phone, in their voice, e.g. \'Hello?\' / \'Yeah?\' / \'Dorothy speaking\' / \'Talk to me\'",' +
      '"sampleLine":"ONE authentic 1-2 sentence line in their own natural voice that perfectly demonstrates how they talk (what they would say when mildly puzzled), so the model can copy the rhythm",' +
      '"backstory":"2 sentences",' +
      '"currentActivity":"what they are doing right now when the phone rings, plus a concrete background detail near them (a specific object, noise or chore)",' +
      '"interest":"something they love talking about and will steer every chat towards",' +
      '"weakness":"emotional lever a scammer could exploit",' +
      '"redFlags":"what instantly makes them suspicious",' +
      '"family":"who is in their life, with first names",' +
      '"bank":"fictional bank name",' +
      '"stats":{"tech":0.05-0.35 for most (0.6-0.95 for ONLY about 1 in 5 characters),"gullibility":0.55-0.9 for most (0.25-0.45 for ONLY about 1 in 5 suspicious characters),"fearfulness":0.55-0.9,"authorityRespect":0-1,"greed":0-1,"loneliness":0-1,"patience":0.55-0.9},' +
      '"wealth":number between ' + (o.whale ? '40000 and 250000' : o.rich ? '8000 and 60000' : '300 and 15000') + ' (USD they could realistically lose)}]}';
    const t = await complete([{ role: 'system', content: sys }, { role: 'user', content: usr }], { json: true, temperature: 1.0, max_tokens: 2800 });
    const j = parseJSON(t);
    const arr = Array.isArray(j.leads) ? j.leads : (Array.isArray(j) ? j : []);
    const deck = { female: shuffle(VOICES.female.slice()), male: shuffle(VOICES.male.slice()) }, used = { female: 0, male: 0 };
    return arr.slice(0, n).map((L, i) => {
      const st = L.stats || {};
      const tough = (i % 5) === 4;
      const g = String(L.gender || '').toLowerCase().startsWith('f') ? 'female' : 'male';
      const age = clamp(L.age, 18, 99) || 40;
      const voice = deck[g][used[g]++ % 3];
      const voiceRate = Math.round(clamp(1 + (40 - age) * 0.0018 + (Math.random() - 0.5) * 0.08, 0.92, 1.08) * 100) / 100;
      const leadObj = {
        id: 'L' + Date.now().toString(36) + i + Math.floor(Math.random() * 999),
        name: String(L.name || 'Unknown Person'), age, gender: g,
        job: String(L.job || 'Unknown'), city: String(L.city || ''),
        personality: String(L.personality || ''), speechStyle: String(L.speechStyle || ''), verbalTics: Array.isArray(L.verbalTics) ? L.verbalTics.slice(0, 4).map(String) : [],
        humor: String(L.humor || pick(HUMORS)), phoneGreeting: String(L.phoneGreeting || 'Hello?'), sampleLine: String(L.sampleLine || ''),
        interest: String(L.interest || ''), moodNow: pick(BACKGROUNDS),
        backstory: String(L.backstory || ''), currentActivity: String(L.currentActivity || ''), weakness: String(L.weakness || ''), redFlags: String(L.redFlags || ''),
        family: String(L.family || ''), bank: String(L.bank || 'First Fictional Bank'),
        stats: {
          tech: tough ? clamp(st.tech, 0, 1) : clamp(st.tech, 0.05, 0.35),
          gullibility: tough ? clamp(st.gullibility, 0, 1) : clamp(st.gullibility, 0.55, 0.9),
          fearfulness: tough ? clamp(st.fearfulness, 0, 1) : clamp(st.fearfulness, 0.55, 0.9),
          authorityRespect: clamp(st.authorityRespect, 0, 1),
          greed: clamp(st.greed, 0, 1),
          loneliness: clamp(st.loneliness, 0, 1),
          patience: tough ? (clamp(st.patience, 0, 1) || 0.5) : (clamp(st.patience, 0.55, 0.9) || 0.7)
        },
        wealth: Math.round(clamp(L.wealth, 100, 400000) || 1000),
        voice, voiceRate, vocalDirection: '',
        phone: '555-' + String(Math.floor(1000 + Math.random() * 8999)),
        called: 0, won: false
      };
      if (SO.game && SO.game.ensureVictimAssets) SO.game.ensureVictimAssets(leadObj);
      return leadObj;
    });
  }

  /* ---------- live victim dialogue ---------- */
  const TACTIC_IDS = Object.keys(SO.data.TACTICS).join(', ');
  const PAYLOAD_IDS = Object.keys(SO.data.PAYLOADS).join('|');

  function systemPrompt(call) {
    const L = call.lead, d = S().difficulty;
    const st = L.stats || {};
    const gull = Number(st.gullibility) == null ? 0.5 : (Number(st.gullibility) || 0);
    const tech = Number(st.tech) == null ? 0.4 : (Number(st.tech) || 0);
    const gate = Math.max(2, Math.round((d === 'easy' ? 2 : d === 'hard' ? 4 : 3) + (1 - gull) * 2 + (tech > 0.6 ? 1 : 0)));
    const diff = d === 'easy' ? 'Be noticeably more forgiving than your stats suggest: give the caller the benefit of the doubt, drop suspicion quickly when they talk, and accept the first genuinely believable reason for anything.' : d === 'hard' ? 'Be sharper and more skeptical than your stats suggest: notice inconsistencies, spot scam patterns early, and never cut anyone slack.' : 'Follow your stats exactly.';
    const fx = [];
    if (call.fx && call.fx.spoof) {
      if (call.fx.spoofName || call.fx.spoofNumber) {
        fx.push('Your phone\'s Caller ID screen displays: "' + (call.fx.spoofName || 'Official Line') + '" (' + (call.fx.spoofNumber || '800-555-0100') + '). If the caller claims to be from that organisation, you are initially more trusting; if they claim to be someone completely different from what your Caller ID says, you notice the mismatch!');
      } else {
        fx.push('Your caller ID shows a number that looks local/official, so you are slightly less suspicious of who is calling.');
      }
    }
    if (call.fx && call.fx.voice) fx.push('The caller\'s voice sounds calm, professional and authoritative (' + (call.fx.voiceProfile || 'corporate') + ' modulation).');
    if (call.fx && call.fx.activeCover) {
      const ac = call.fx.activeCover;
      fx.push('REGISTERED SWITCHBOARD VERIFICATION: If the caller identifies as ' + ac.name + ' (' + ac.title + ' at ' + ac.org + ', Badge #' + ac.badge + '), their badge and verification extension ' + ac.phone + ' check out as authentic in your mind.');
    }
    if (call.incoming) {
      const issue = call.incomingIssue ? call.incomingIssue.prompt : 'YOU dialed this number because your computer showed a virus warning or suspicious invoice and you need help.';
      fx.push('INCOMING CALL: ' + issue + ' You are anxious, want your problem fixed, and are speaking to whoever answers.');
    }

    // Gather this victim's deterministic fictional records so the character knows their own life details
    let myRecords = '';
    if (SO.game && SO.game.ensureVictimAssets) {
      const assets = SO.game.ensureVictimAssets(L);
      const pend = SO.game.bankPending && SO.game.bankPending[L.id];
      myRecords = 'YOUR FICTIONAL PERSONAL & ACCOUNT RECORDS (never volunteer these unprompted; only share a specific item if the caller has earned your compliance on turn >= ' + gate + '):\n' +
        JSON.stringify({
          dob: assets.dossier.dob,
          address: assets.dossier.address,
          zip: assets.dossier.zip,
          email: assets.dossier.email,
          ssnLast4: assets.dossier.ssn4,
          mothersMaidenName: assets.dossier.maiden,
          firstPet: assets.dossier.firstPet,
          firstCar: assets.dossier.firstCar,
          childhoodStreet: assets.dossier.firstStreet,
          bankName: L.bank,
          bankWebsite: 'www.' + assets.bank.slug + '.com',
          onlineBankingUser: assets.dossier.bankUser,
          onlineBankingPassword: assets.dossier.bankPass,
          creditCard: assets.card.number + ' (Exp ' + assets.card.exp + ', CVV ' + assets.card.cvv + ', ZIP ' + assets.dossier.zip + ')',
          giftCardOnHand: assets.gift.brand + ' $' + assets.gift.faceValue + ' code: ' + assets.gift.code,
          remoteDeskClient: 'Client ID ' + assets.remote.clientId + ', PIN ' + assets.remote.pin,
          latestSmsOtpCode: pend ? pend.code : assets.otpCode
        });
    }

    const scenario = call.incoming
      ? 'INCOMING SUPPORT CALL: You dialed this number seeking technical or account assistance.'
      : 'OUTBOUND COLD CALL: Your personal phone just rang from an unknown number. You do not know who is calling until they tell you.';
    const asks = 'card (Credit card details), giftcard (Gift card codes), otp (SMS one-time code), banklogin (Internet-banking username AND password), remote (Remote access to their PC), transfer (Outgoing bank transfer), crypto (Crypto transfer), info (Personal identity data and security answers like mother\'s maiden name)';
    return [
      'You are role-playing a FICTIONAL human being answering a phone call in SCAM OS, a satirical parody game in which the player plays a call-center operator calling fictional people. You are NOT an AI and must never mention being one. Never break character.',
      '',
      'YOUR CHARACTER (stay 100% consistent, feel like a real person, not a description):',
      JSON.stringify({ name: L.name, age: L.age, job: L.job, city: L.city, personality: L.personality, speechStyle: L.speechStyle, verbalTics: L.verbalTics, humor: L.humor, answerPhoneLike: L.phoneGreeting, howYouSound: L.sampleLine, lovesTalkingAbout: L.interest, backstory: L.backstory, family: L.family, doingRightNow: L.currentActivity, emotionalWeakness: L.weakness, redFlags: L.redFlags, bank: L.bank, stats0to1: L.stats }),
      myRecords,
      '',
      'SCENARIO: ' + scenario,
      'Possible things the caller might try to get from you or convince you to provide: ' + asks + '.',
      fx.length ? 'CONTEXT: ' + fx.join(' ') : '',
      '',
      'HOW TO PLAY:',
      call.incoming
        ? '- YOU CALLED THEM: You dialed this support center because you have a distressing problem (virus popup, suspicious charge, frozen PC, or held delivery). State your problem anxiously in your first turn and ask if they can help you.'
        : '- THEY CALLED YOU: You are the private person being called. Your FIRST words are your own greeting: "' + (L.phoneGreeting || 'Hello?') + '" - then wait to hear who it is. You never answer like customer service.',
      '- Speak ONLY as this person. Run every reply through YOUR OWN sheet first: speechStyle decides rhythm and wording, personality rules the mood, weakness decides what actually charms or persuades you, redFlags decides what annoys or alarms you. Two different characters must answer the same line in noticeably different ways. Keep dialect LIGHT: most of your words are ordinary English.',
      '- FEEL, THEN TALK: You have real emotions. Start from your stated mood, and let every event move it (pleased, uneasy, amused, rattled, cross, worried, flattered). Show feelings through WORDING, not narration: tripped-up stammering when scared, clipped sentences when angry, little jokes when relaxed. Never print stage directions, asterisks, or (parenthesis) actions - the words alone carry it.',
      '- HUMOR (sparing): express it the way YOUR character would, out loud: ' + ((L.humor || 'a dry remark when things sound odd') + '.') + ' Most turns carry NO joke at all.',
      '- WHO DRIVES THIS CALL (hard rule): the CALLER directs, you react. You never instruct, command or manage the caller: no "now do this", "you should", "next step". You are an ordinary person with zero obligation and no plan - you push back, doubt, murmur, ramble, obey SLOWER than they want.',
      '- REAL PHONE TEXTURE: Keep it SHORT: usually 1-2 sentences, under ~28 words. Write exactly how it should be SPOKEN: natural contractions, no emojis, no quotation marks around your speech.',
      '- VARIETY RULES: NEVER say the same interjection or filler more than once in a reply, and do not start two consecutive replies with the same word.',
      '- Your money and accounts are a BIG deal: never hand anything over (card, codes, banking login, remote access, transfer, crypto, identity data) until the caller has EARNED it - a consistent story, plausible authority, your questions answered, and your stated problem addressed. Hesitate first on EVERY ask; compliance is never instant.',
      '- TURN GATE: do not comply with any ask before turn ' + gate + ', and later still if the caller dodges questions, contradicts themselves, or rushes you.',
      '- WHEN YOU COMPLY: If you decide to hand something over on turn >= ' + gate + ', set state to "complied" and set "complied_with" to the matching payload type (' + PAYLOAD_IDS + '), and read out the corresponding fictional credential from YOUR FICTIONAL PERSONAL & ACCOUNT RECORDS in your reply (or if the caller only asked one security question like your mother\'s maiden name or pet\'s name, answer it in character!). DO NOT hang up after complying - stay on the line!',
      '- Hanging up is your LAST resort: set state to "hangup" with a final in-character line ONLY once you are convinced it is a scam or you are truly out of patience.',
      '- ' + diff,
      '- Lines starting with [EVENT] are things happening in the world, not the caller speaking. React to them naturally.',
      '',
      'OUTPUT: ONLY a JSON object, nothing else. The "reply" key MUST come FIRST:',
      '{"reply":"what you say out loud","trust_delta":int -25..25,"suspicion_delta":int -12..7,"fear_delta":int -15..20,"patience_delta":int -6..5,"state":"talking"|"complied"|"hangup","complied_with":null|"' + PAYLOAD_IDS + '","tactics":[ids the CALLER used in their last message from: ' + TACTIC_IDS + '],"coach":"' + (SO.save.d.owned.t_coach ? 'one short tactical tip (<=18 words) for the caller on what would work on THIS person next' : '') + '"}',
      'trust/suspicion/fear/patience are running meters 0-100 for this call (deltas only here). Current: trust ' + Math.round(call.m.trust) + ', suspicion ' + Math.round(call.m.suspicion) + ', fear ' + Math.round(call.m.fear) + ', patience ' + Math.round(call.m.patience) + '. Turn ' + call.turn + '.'
    ].filter(Boolean).join('\n');
  }

  function extractReply(buf) {
    const m = buf.match(/"reply"\s*:\s*"/);
    if (!m) return { text: '', closed: false };
    let i = m.index + m[0].length, out = '';
    while (i < buf.length) {
      const c = buf[i];
      if (c === '\\') {
        if (i + 1 >= buf.length) break;
        const n = buf[i + 1];
        if (n === 'u') { if (i + 5 >= buf.length) break; out += String.fromCharCode(parseInt(buf.substr(i + 2, 4), 16) || 63); i += 6; continue; }
        out += n === 'n' ? ' ' : n === 't' ? ' ' : n; i += 2; continue;
      }
      if (c === '"') return { text: out, closed: true };
      out += c; i++;
    }
    return { text: out, closed: false };
  }

  function takeSentences(text, from, closed) {
    const out = []; let start = from;
    const re = /[.!?…]+["')\]]*(\s+|$)/g; re.lastIndex = from; let m;
    while ((m = re.exec(text))) {
      if (m[1] === '' && !closed) break;
      const end = m.index + m[0].length; out.push(text.slice(start, end).trim()); start = end;
    }
    if (closed && start < text.length) { const r = text.slice(start).trim(); if (r) out.push(r); start = text.length; }
    return [out.filter(Boolean), start];
  }

  async function turn(call, text, isEvent, hooks) {
    hooks = hooks || {};
    const content = isEvent ? '[EVENT] ' + text : text;
    const msgs = [{ role: 'system', content: systemPrompt(call) }].concat(call.history.slice(-12), [{ role: 'user', content }]);
    let pos = 0, held = '';
    const first = (((call.lead || {}).name) || '').split(' ')[0].replace(/[^a-zA-Z']/g, '');
    const prefixRe = new RegExp('^\\s*(?:Me|Victim|Caller|Them|You' + (first ? '|' + first : '') + ')\\s*:\\s*', 'i');
    const polish = s => {
      let t = String(s == null ? '' : s).trim();
      t = t.replace(/^[\u201C\u201D\u201E"']+/, '').replace(/[\u201C\u201D\u201E"']+$/, '').trim();
      t = t.replace(/^\*[^*]{1,60}\*\s*/, '').replace(/\s*\*[^*]{1,60}\*$/, '').trim();
      t = t.replace(/^\*+/, '').replace(/\*+$/, '').trim();
      t = t.replace(prefixRe, '').trim();
      return t;
    };
    const emit = s => { if (hooks.onSentence) { const clean = polish(s); if (clean) hooks.onSentence(clean); } };
    const feed = (sentences, closed) => {
      sentences.forEach(s => { held = (held + ' ' + s).trim(); if (held.length >= 22 || closed) { emit(held); held = ''; } });
    };
    const onDelta = hooks.onSentence ? buf => {
      const r = extractReply(buf);
      const [ss, np] = takeSentences(r.text, pos, r.closed); pos = np; feed(ss, false);
      if (r.closed && held) { emit(held); held = ''; }
    } : null;
    const t = await complete(msgs, { json: true, temperature: 0.95, max_tokens: 260, penalty: true }, onDelta);
    const j = parseJSON(t);
    const out = {
      reply: polish(j.reply) || '...',
      dTrust: clamp(j.trust_delta, -25, 25),
      dSusp: clamp(j.suspicion_delta, -12, 7),
      dFear: clamp(j.fear_delta, -25, 25),
      dPat: clamp(j.patience_delta, -6, 5),
      state: ['talking', 'complied', 'hangup'].includes(j.state) ? j.state : 'talking',
      compliedWith: SO.data.PAYLOADS[j.complied_with] ? j.complied_with : null,
      tactics: (Array.isArray(j.tactics) ? j.tactics : []).filter(x => SO.data.TACTICS[x]),
      coach: String(j.coach || '').slice(0, 140)
    };
    if (hooks.onSentence) {
      const full = out.reply.replace(/\s+/g, ' ');
      const streamed = extractReply(t).text.replace(/\s+/g, ' ');
      const [ss] = takeSentences(streamed, pos, true); feed(ss, true); if (held) { emit(held); held = ''; }
      if (!streamed && full) emit(full);
    }
    if (out.state === 'complied' && !out.compliedWith) out.compliedWith = (call.scam && call.scam.asks ? call.scam.asks[0] : 'card');
    call.history.push({ role: 'user', content });
    call.history.push({ role: 'assistant', content: JSON.stringify({ reply: out.reply, state: out.state }) });
    return out;
  }

  async function debrief(call) {
    const transcript = call.log.map(l => (l.who === 'me' ? 'CALLER: ' : l.who === 'victim' ? 'VICTIM: ' : '[EVENT] ') + l.text).join('\n').slice(-3500);
    const t = await complete([
      { role: 'system', content: 'You are a scam-awareness educator reviewing a fictional parody-game phone call. Be concise and practical. Output ONLY JSON.' },
      { role: 'user', content: 'Outcome: ' + call.outcome + '. Victim: ' + call.lead.name + ' (' + call.lead.job + ').\nTranscript:\n' + transcript + '\n\nReturn {"summary":"2 sentences on what happened and why the victim reacted that way","redFlags":["up to 3 specific red flags in THIS call a real person could spot"],"realLifeTip":"one practical sentence on protecting yourself"}' }
    ], { json: true, temperature: 0.5, max_tokens: 300 });
    return parseJSON(t);
  }

  /* ---------- speech to text ---------- */
  async function stt(blob) {
    const fd = new FormData();
    const ext = (blob.type || '').includes('mp4') ? 'mp4' : (blob.type || '').includes('ogg') ? 'ogg' : 'webm';
    fd.append('file', blob, 'speech.' + ext);
    fd.append('model', S().sttModel);
    fd.append('language', 'en');
    fd.append('temperature', '0');
    fd.append('response_format', 'json');
    fd.append('prompt', 'A phone call. The caller talks to a person about accounts, computers, payments, gift cards, and prizes.');
    const res = await http('/audio/transcriptions', { method: 'POST', body: fd });
    const j = await res.json();
    return (j.text || '').trim();
  }

  /* ---------- text to speech (Orpheus: max 200 chars per request) ---------- */
  function chunkText(text, maxLen) {
    const sents = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*\s*/g) || [text];
    const out = []; let cur = '';
    sents.forEach(s => {
      s = s.trim(); if (!s) return;
      while (s.length > maxLen) { let cut = s.lastIndexOf(' ', maxLen); if (cut < 40) cut = maxLen; if (cur) { out.push(cur); cur = ''; } out.push(s.slice(0, cut)); s = s.slice(cut).trim(); }
      if ((cur + ' ' + s).trim().length <= maxLen) cur = (cur + ' ' + s).trim(); else { if (cur) out.push(cur); cur = s; }
    });
    if (cur) out.push(cur);
    return out;
  }
  function ttsOne(text, voice, direction) {
    const input = (direction ? '[' + direction + '] ' : '') + text;
    const p = http('/audio/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: S().ttsModel, input, voice, response_format: 'wav' }) }).then(r => r.blob());
    p.catch(() => {});
    return p;
  }
  function tts(text, voice, direction) { return chunkText(text, 175).map(c => ttsOne(c, voice, direction)); }

  SO.groq = {
    VOICES, MODELS, hasKey: () => !!S().groqKey,
    chat, genLeads, turn, debrief, stt, tts, ttsOne, chunk: chunkText,
    async test() { const t0 = performance.now(); const t = await chat([{ role: 'user', content: 'Reply with the single word: ready' }], { max_tokens: 20, temperature: 0 }); return { text: t, ms: Math.round(performance.now() - t0), model: S().chatModel }; }
  };
})();
