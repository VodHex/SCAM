/* ScamShield OS save system. Retains simulation state locally in browser storage; never real credentials or payment data. */
(function () {
  const SO = (window.SO = window.SO || {});
  const KEY = 'scamshield_save_v2';

  const MODELS_MIGRATE = {
    'llama-3.3-70b-versatile': 'openai/gpt-oss-20b',
    'llama-3.1-8b-instant': 'openai/gpt-oss-20b',
    'qwen/qwen3-32b': 'openai/gpt-oss-120b',
    'moonshotai/kimi-k2-instruct-0905': 'openai/gpt-oss-120b',
    'minimaxai/minimax-m2.7': 'openai/gpt-oss-20b'
  };
  const STT_MIGRATE = { 'distil-whisper-large-v3-en': 'whisper-large-v3-turbo' };

  function defaults() {
    return {
      v: 4,
      cash: 50,
      totalEarned: 0,
      xp: 0,
      heat: 0,
      rep: 0,
      day: 1,
      callsToday: 0,
      earnedToday: 0,
      owned: {},
      toolState: {
        spoof: true,
        spoofNumber: '',
        spoofName: '',
        voice: true,
        voiceProfile: 'corporate'
      },
      activeCoverId: null,
      callScratchpad: '',
      callHistory: [],
      leadNotes: {},
      posHistory: [],
      victimAssets: {},
      loot: [],
      ledger: [],
      ids: [],
      banks: {},
      dossiers: {},
      pastLeads: {},
      bots: 0,
      leads: null,
      mail: [],
      achievements: {},
      stats: { calls: 0, wins: 0, losses: 0, tactics: {}, bestPayout: 0, raids: 0, cashouts: 0, declined: 0 },
      settings: {
        volume: 0.6, muted: false, voice: true, handsFree: false, voiceSpeed: 1.12,
        autoMic: false, headphones: false, hints: true, inbound: true, autoShift: false,
        flash: true, difficulty: 'easy', difficultySet: false, wallpaper: 0, lang: 'en', crt: false,
        groqKey: '', chatModel: 'openai/gpt-oss-20b', sttModel: 'whisper-large-v3-turbo',
        ttsModel: 'canopylabs/orpheus-v1-english', ttsOn: true
      },
      tutorialDone: false,
      quizDone: false,
      fs: null,
      fs_bin: [],
      iconPos: {}
    };
  }

  function merge(base, src) {
    for (const k in src) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        merge(base[k], src[k]);
      } else base[k] = src[k];
    }
    return base;
  }

  function migrate(d) {
    const s = d.settings = d.settings || {};
    if (!s.difficultySet && s.difficulty === 'normal') s.difficulty = 'easy';
    if (MODELS_MIGRATE[s.chatModel]) s.chatModel = MODELS_MIGRATE[s.chatModel];
    if (MODELS_MIGRATE[s.ttsModel]) s.ttsModel = 'canopylabs/orpheus-v1-english';
    if (STT_MIGRATE[s.sttModel]) s.sttModel = STT_MIGRATE[s.sttModel];
    if (s.chatModel && !/^(openai\/gpt-oss|qwen\/qwen3)/.test(s.chatModel)) s.chatModel = 'openai/gpt-oss-20b';
    if (s.sttModel && !/^whisper-large-v3/.test(s.sttModel)) s.sttModel = 'whisper-large-v3-turbo';
    if (s.ttsModel && !/^canopylabs\//.test(s.ttsModel)) s.ttsModel = 'canopylabs/orpheus-v1-english';
    if (d.owned) for (const k of Object.keys(d.owned)) if (/^s_/.test(k)) delete d.owned[k];
    if (!d.banks || typeof d.banks !== 'object') d.banks = {};
    if (!d.dossiers || typeof d.dossiers !== 'object') d.dossiers = {};
    if (!d.pastLeads || typeof d.pastLeads !== 'object') d.pastLeads = {};
    if (!d.leadNotes || typeof d.leadNotes !== 'object') d.leadNotes = {};
    if (!d.victimAssets || typeof d.victimAssets !== 'object') d.victimAssets = {};
    if (!d.toolState || typeof d.toolState !== 'object') d.toolState = { spoof: true, spoofNumber: '', spoofName: '', voice: true, voiceProfile: 'corporate' };
    if (!Array.isArray(d.ids)) d.ids = [];
    if (!Array.isArray(d.callHistory)) d.callHistory = [];
    if (!Array.isArray(d.posHistory)) d.posHistory = [];
    if (typeof d.callScratchpad !== 'string') d.callScratchpad = '';
  }

  const S = {
    d: defaults(),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) this.d = merge(defaults(), JSON.parse(raw));
      } catch (e) { this.d = defaults(); }
      this.d.loot = (this.d.loot || []).filter(l => l && l.id && l.type && typeof l.value === 'number').slice(0, 60);
      this.d.bots = Math.max(0, Math.floor(this.d.bots || 0));
      migrate(this.d);
      try { localStorage.removeItem('scamos_save_v1'); } catch (e) {}
      return this.d;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.d)); } catch (e) {}
    },
    reset() {
      try { localStorage.removeItem(KEY); } catch (e) {}
      this.d = defaults();
    },
    exportJSON() { return JSON.stringify(this.d, null, 2); },
    importJSON(txt) {
      const j = JSON.parse(txt);
      this.d = merge(defaults(), j);
      delete this.d.settings.groqKey;
      migrate(this.d);
      this.save();
    }
  };
  SO.save = S;
  S.load();
})();
