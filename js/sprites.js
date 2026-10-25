/* SCAM OS - Modern High-DPI Vector Icon & Character Portrait Engine (SVG).
   Replaces pixelated 16x16 icons and blocky avatars with crisp vector graphics and lip-sync portraits. */
(function () {
  const SO = (window.SO = window.SO || {});
  const cache = {};

  function svgDataUrl(svg) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
  }

  function wrapIcon(bg1, bg2, inner) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg1}"/>
          <stop offset="100%" stop-color="${bg2}"/>
        </linearGradient>
        <filter id="s" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.28"/>
        </filter>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#g)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
      <g filter="url(#s)">${inner}</g>
    </svg>`;
  }

  const ICONS = {
    start: () => wrapIcon('#2563eb', '#1d4ed8', `
      <rect x="16" y="16" width="14" height="14" rx="3" fill="#fff"/>
      <rect x="34" y="16" width="14" height="14" rx="3" fill="#93c5fd"/>
      <rect x="16" y="34" width="14" height="14" rx="3" fill="#93c5fd"/>
      <rect x="34" y="34" width="14" height="14" rx="3" fill="#60a5fa"/>
    `),
    phone: () => wrapIcon('#10b981', '#047857', `
      <path d="M22 16c1.5 0 3 1 3.6 2.4l2 4.8c.5 1.2.2 2.6-.8 3.5l-2.6 2.2c2 3.8 5.1 6.9 8.9 8.9l2.2-2.6c.9-1 2.3-1.3 3.5-.8l4.8 2c1.4.6 2.4 2.1 2.4 3.6v2c0 2.2-1.8 4-4 4C27.6 46 18 36.4 18 20c0-2.2 1.8-4 4-4h0z" fill="#fff"/>
    `),
    shop: () => wrapIcon('#8b5cf6', '#6d28d9', `
      <path d="M18 24h28l-2.5 22a3 3 0 0 1-3 2.6h-17a3 3 0 0 1-3-2.6L18 24z" fill="#fff"/>
      <path d="M25 24v-3a7 7 0 0 1 14 0v3" fill="none" stroke="#ede9fe" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="27" cy="34" r="2" fill="#6d28d9"/>
      <circle cx="37" cy="34" r="2" fill="#6d28d9"/>
    `),
    crm: () => wrapIcon('#0ea5e9', '#0369a1', `
      <circle cx="26" cy="24" r="6" fill="#fff"/>
      <path d="M15 44c0-5.5 4.9-10 11-10s11 4.5 11 10" fill="#fff"/>
      <circle cx="41" cy="26" r="4.5" fill="#bae6fd"/>
      <path d="M36 44c.5-4.2 3.8-7.5 8.5-7.5 2.5 0 4.5 1 5.5 2.5" fill="none" stroke="#bae6fd" stroke-width="3" stroke-linecap="round"/>
    `),
    notepad: () => wrapIcon('#f59e0b', '#d97706', `
      <rect x="17" y="14" width="30" height="36" rx="4" fill="#fff"/>
      <line x1="22" y1="23" x2="42" y2="23" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="22" y1="30" x2="42" y2="30" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="22" y1="37" x2="35" y2="37" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="17" y="14" width="30" height="5" rx="2" fill="#fef3c7"/>
    `),
    wallet: () => wrapIcon('#14b8a6', '#0f766e', `
      <rect x="14" y="18" width="36" height="28" rx="5" fill="#fff"/>
      <path d="M14 25h36" stroke="#0f766e" stroke-width="3"/>
      <rect x="34" y="30" width="12" height="9" rx="3" fill="#0d9488"/>
      <circle cx="38" cy="34.5" r="1.8" fill="#fff"/>
    `),
    tools: () => wrapIcon('#ef4444', '#b91c1c', `
      <path d="M38.5 16a8.5 8.5 0 0 0-7.9 11.6L17 41.2a3.2 3.2 0 0 0 4.5 4.5l13.6-13.6A8.5 8.5 0 0 0 46.5 21l-4.5 4.5-4-1-1-4 4.5-4.5a8.4 8.4 0 0 0-3 0z" fill="#fff"/>
    `),
    mail: () => wrapIcon('#3b82f6', '#1d4ed8', `
      <rect x="14" y="19" width="36" height="26" rx="4" fill="#fff"/>
      <path d="M16 21l16 12 16-12" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    `),
    taskmgr: () => wrapIcon('#1e293b', '#0f172a', `
      <rect x="13" y="15" width="38" height="34" rx="4" fill="#090d16" stroke="#475569" stroke-width="2"/>
      <polyline points="17,36 24,36 28,23 33,41 37,30 41,34 47,34" fill="none" stroke="#22c55e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    `),
    shield: () => wrapIcon('#2563eb', '#1e40af', `
      <path d="M32 13l16 6v11c0 10.5-6.8 18.8-16 21-9.2-2.2-16-10.5-16-21V19l16-6z" fill="#fff"/>
      <path d="M25 32l5 5 10-10" fill="none" stroke="#1d4ed8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    `),
    settings: () => wrapIcon('#475569', '#334155', `
      <circle cx="32" cy="32" r="11" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="6 4"/>
      <circle cx="32" cy="32" r="9" fill="none" stroke="#fff" stroke-width="4"/>
      <circle cx="32" cy="32" r="4" fill="#334155"/>
    `),
    mines: () => wrapIcon('#374151', '#111827', `
      <circle cx="32" cy="32" r="11" fill="#fff"/>
      <line x1="32" y1="14" x2="32" y2="50" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="14" y1="32" x2="50" y2="32" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="19" y1="19" x2="45" y2="45" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <line x1="45" y1="19" x2="19" y2="45" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <circle cx="28" cy="28" r="3" fill="#ef4444"/>
    `),
    paint: () => wrapIcon('#ec4899', '#be185d', `
      <path d="M32 14c-10 0-18 7.5-18 17 0 6 4.5 10 9.5 10 2 0 3.5 1.2 3.5 3 0 3 2.5 5 5.5 5 9.8 0 17.5-7.8 17.5-17.5C50 21.8 41.9 14 32 14z" fill="#fff"/>
      <circle cx="24" cy="26" r="3" fill="#ef4444"/>
      <circle cx="32" cy="22" r="3" fill="#3b82f6"/>
      <circle cx="40" cy="26" r="3" fill="#10b981"/>
      <circle cx="41" cy="34" r="3" fill="#f59e0b"/>
    `),
    cmd: () => wrapIcon('#18181b', '#09090b', `
      <rect x="12" y="16" width="40" height="32" rx="4" fill="#09090b" stroke="#52525b" stroke-width="2"/>
      <polyline points="20,25 27,31 20,37" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="30" y1="37" x2="40" y2="37" stroke="#e4e4e7" stroke-width="3" stroke-linecap="round"/>
    `),
    bin: () => wrapIcon('#64748b', '#475569', `
      <path d="M21 22h22l-2 25a2 2 0 0 1-2 2H25a2 2 0 0 1-2-2l-2-25z" fill="#fff"/>
      <path d="M18 19h28" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <path d="M27 16h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <line x1="28" y1="27" x2="28" y2="43" stroke="#64748b" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="36" y1="27" x2="36" y2="43" stroke="#64748b" stroke-width="2.2" stroke-linecap="round"/>
    `),
    ie: () => wrapIcon('#0284c7', '#1d4ed8', `
      <circle cx="32" cy="32" r="17" fill="#fff"/>
      <ellipse cx="32" cy="32" rx="8" ry="17" fill="none" stroke="#0284c7" stroke-width="2.2"/>
      <line x1="15" y1="32" x2="49" y2="32" stroke="#0284c7" stroke-width="2.2"/>
      <line x1="18" y1="24" x2="46" y2="24" stroke="#0284c7" stroke-width="1.8"/>
      <line x1="18" y1="40" x2="46" y2="40" stroke="#0284c7" stroke-width="1.8"/>
    `),
    computer: () => wrapIcon('#3b82f6', '#1e3a8a', `
      <rect x="14" y="16" width="36" height="25" rx="3" fill="#fff"/>
      <rect x="17" y="19" width="30" height="19" rx="1.5" fill="#1e40af"/>
      <path d="M26 41h12l2 6H24l2-6z" fill="#cbd5e1"/>
      <rect x="21" y="46" width="22" height="2.5" rx="1" fill="#fff"/>
    `),
    folder: () => wrapIcon('#f59e0b', '#d97706', `
      <path d="M14 20a3 3 0 0 1 3-3h10l4 4h16a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V20z" fill="#fef3c7"/>
      <path d="M14 26h36v18a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V26z" fill="#fff"/>
    `),
    file: () => wrapIcon('#64748b', '#334155', `
      <path d="M20 14h16l10 10v26a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z" fill="#fff"/>
      <path d="M36 14v10h10" fill="#cbd5e1"/>
      <line x1="23" y1="31" x2="41" y2="31" stroke="#64748b" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="23" y1="37" x2="41" y2="37" stroke="#64748b" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="23" y1="43" x2="34" y2="43" stroke="#64748b" stroke-width="2.4" stroke-linecap="round"/>
    `),
    user: () => wrapIcon('#6366f1', '#4338ca', `
      <circle cx="32" cy="24" r="8" fill="#fff"/>
      <path d="M17 47c0-7.5 6.7-13 15-13s15 5.5 15 13" fill="#fff"/>
    `),
    warn: () => wrapIcon('#f59e0b', '#b45309', `
      <path d="M32 14L50 47H14L32 14z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
      <line x1="32" y1="25" x2="32" y2="36" stroke="#b45309" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="2.2" fill="#b45309"/>
    `),
    skull: () => wrapIcon('#dc2626', '#7f1d1d', `
      <path d="M32 15c-9 0-15 6.2-15 14.5 0 4.8 2.2 8.8 5.5 11.2V46h19v-5.3c3.3-2.4 5.5-6.4 5.5-11.2C47 21.2 41 15 32 15z" fill="#fff"/>
      <circle cx="26.5" cy="29" r="3.5" fill="#7f1d1d"/>
      <circle cx="37.5" cy="29" r="3.5" fill="#7f1d1d"/>
      <line x1="28" y1="42" x2="28" y2="46" stroke="#7f1d1d" stroke-width="2"/>
      <line x1="32" y1="42" x2="32" y2="46" stroke="#7f1d1d" stroke-width="2"/>
      <line x1="36" y1="42" x2="36" y2="46" stroke="#7f1d1d" stroke-width="2"/>
    `),
    cash: () => wrapIcon('#10b981', '#059669', `
      <rect x="12" y="19" width="40" height="26" rx="4" fill="#fff"/>
      <circle cx="32" cy="32" r="7" fill="#10b981"/>
      <text x="32" y="36.5" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="13" fill="#fff">$</text>
    `),
    info: () => wrapIcon('#3b82f6', '#1d4ed8', `
      <circle cx="32" cy="32" r="16" fill="#fff"/>
      <circle cx="32" cy="23" r="2.3" fill="#1d4ed8"/>
      <line x1="32" y1="29" x2="32" y2="41" stroke="#1d4ed8" stroke-width="3.5" stroke-linecap="round"/>
    `),
    error: () => wrapIcon('#ef4444', '#b91c1c', `
      <circle cx="32" cy="32" r="16" fill="#fff"/>
      <line x1="25" y1="25" x2="39" y2="39" stroke="#b91c1c" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="39" y1="25" x2="25" y2="39" stroke="#b91c1c" stroke-width="3.5" stroke-linecap="round"/>
    `),
    tip: () => wrapIcon('#eab308', '#ca8a04', `
      <path d="M32 14a12 12 0 0 0-7 21.7V41a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.3A12 12 0 0 0 32 14z" fill="#fff"/>
      <rect x="27" y="45" width="10" height="3.5" rx="1.5" fill="#fef08a"/>
    `),
    mic: () => wrapIcon('#334155', '#1e293b', `
      <rect x="26" y="14" width="12" height="21" rx="6" fill="#fff"/>
      <path d="M20 27a12 12 0 0 0 24 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <line x1="32" y1="39" x2="32" y2="47" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <line x1="25" y1="47" x2="39" y2="47" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    `),
    micoff: () => wrapIcon('#dc2626', '#991b1b', `
      <rect x="26" y="14" width="12" height="21" rx="6" fill="#fca5a5"/>
      <path d="M20 27a12 12 0 0 0 24 0" fill="none" stroke="#fca5a5" stroke-width="3" stroke-linecap="round"/>
      <line x1="16" y1="16" x2="48" y2="48" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    `),
    speaker: () => wrapIcon('#334155', '#1e293b', `
      <path d="M16 26h8l10-8v28l-10-8h-8z" fill="#fff"/>
      <path d="M40 24a10 10 0 0 1 0 16" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <path d="M45 19a17 17 0 0 1 0 26" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    `),
    speakeroff: () => wrapIcon('#dc2626', '#991b1b', `
      <path d="M16 26h8l10-8v28l-10-8h-8z" fill="#fff"/>
      <line x1="40" y1="26" x2="50" y2="38" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="50" y1="26" x2="40" y2="38" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
    `),
    headset: () => wrapIcon('#4f46e5', '#3730a3', `
      <path d="M18 34v-4a14 14 0 0 1 28 0v4" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
      <rect x="14" y="31" width="7" height="13" rx="3" fill="#fff"/>
      <rect x="43" y="31" width="7" height="13" rx="3" fill="#fff"/>
      <path d="M46 44c0 3.5-4 5-11 5" fill="none" stroke="#c7d2fe" stroke-width="2.5" stroke-linecap="round"/>
    `),
    hangup: () => wrapIcon('#ef4444', '#b91c1c', `
      <path d="M12 35c5-6 12-9 20-9s15 3 20 9l-4.5 5.5a3 3 0 0 1-3.8.4l-4.7-3.2V33c-4.5-1.2-9.5-1.2-14 0v4.7l-4.7 3.2a3 3 0 0 1-3.8-.4L12 35z" fill="#fff"/>
    `),
    send: () => wrapIcon('#2563eb', '#1d4ed8', `
      <path d="M15 31L48 16 37 49l-7-11-15-7z" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
    `),
    stop: () => wrapIcon('#dc2626', '#991b1b', `
      <rect x="20" y="20" width="24" height="24" rx="4" fill="#fff"/>
    `),
    script: () => ICONS.notepad(),
    lock: () => wrapIcon('#f59e0b', '#b45309', `
      <rect x="17" y="28" width="30" height="22" rx="4" fill="#fff"/>
      <path d="M23 28v-6a9 9 0 0 1 18 0v6" fill="none" stroke="#fff" stroke-width="3.5"/>
      <circle cx="32" cy="39" r="3" fill="#b45309"/>
    `),
    police: () => wrapIcon('#1e3a8a', '#991b1b', `
      <path d="M32 13l15 6v12c0 10-6.5 18-15 20-8.5-2-15-10-15-20V19l15-6z" fill="#fff"/>
      <polygon points="32,20 34.9,26 41.5,26.9 36.7,31.5 37.8,38 32,34.9 26.2,38 27.3,31.5 22.5,26.9 29.1,26" fill="#1e3a8a"/>
    `),
    card: () => wrapIcon('#2563eb', '#1e3a8a', `
      <rect x="12" y="18" width="40" height="28" rx="4" fill="#fff"/>
      <rect x="12" y="24" width="40" height="6" fill="#1e293b"/>
      <rect x="17" y="35" width="9" height="6" rx="1.5" fill="#f59e0b"/>
      <line x1="30" y1="38" x2="46" y2="38" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
    `),
    id: () => wrapIcon('#0f766e', '#115e59', `
      <rect x="13" y="17" width="38" height="30" rx="4" fill="#fff"/>
      <circle cx="24" cy="29" r="4.5" fill="#0f766e"/>
      <path d="M17 41c0-3.5 3.1-6 7-6s7 2.5 7 6" fill="#0f766e"/>
      <line x1="34" y1="26" x2="46" y2="26" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="34" y1="32" x2="46" y2="32" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="34" y1="38" x2="42" y2="38" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
    `),
    bank: () => wrapIcon('#1e3a8a', '#0f172a', `
      <polygon points="32,13 50,23 14,23" fill="#fff"/>
      <rect x="18" y="25" width="4" height="16" fill="#cbd5e1"/>
      <rect x="26" y="25" width="4" height="16" fill="#cbd5e1"/>
      <rect x="34" y="25" width="4" height="16" fill="#cbd5e1"/>
      <rect x="42" y="25" width="4" height="16" fill="#cbd5e1"/>
      <rect x="14" y="42" width="36" height="5" rx="1.5" fill="#fff"/>
    `),
    giftcard: () => wrapIcon('#e11d48', '#9f1239', `
      <rect x="12" y="18" width="40" height="28" rx="4" fill="#fff"/>
      <rect x="28" y="18" width="5" height="28" fill="#e11d48"/>
      <rect x="12" y="29" width="40" height="5" fill="#e11d48"/>
      <circle cx="30.5" cy="31.5" r="5" fill="#fbbf24"/>
    `),
    pos: () => wrapIcon('#059669', '#065f46', `
      <rect x="18" y="11" width="28" height="42" rx="4" fill="#fff"/>
      <rect x="22" y="15" width="20" height="11" rx="2" fill="#064e3b"/>
      <text x="32" y="23.5" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="9" fill="#34d399">$0.00</text>
      <circle cx="25" cy="32" r="2" fill="#475569"/><circle cx="32" cy="32" r="2" fill="#475569"/><circle cx="39" cy="32" r="2" fill="#475569"/>
      <circle cx="25" cy="39" r="2" fill="#475569"/><circle cx="32" cy="39" r="2" fill="#475569"/><circle cx="39" cy="39" r="2" fill="#475569"/>
      <rect x="23" y="44" width="18" height="4" rx="1.5" fill="#10b981"/>
    `),
    remotedesk: () => wrapIcon('#4f46e5', '#312e81', `
      <rect x="12" y="15" width="30" height="22" rx="3" fill="#fff"/>
      <rect x="22" y="25" width="30" height="22" rx="3" fill="#818cf8" stroke="#fff" stroke-width="2"/>
      <path d="M33 36l8-4-4 8-1.5-2.5L33 36z" fill="#fff"/>
    `)
  };

  SO.icon = function (key) {
    if (cache[key]) return cache[key];
    const fn = ICONS[key] || ICONS.file;
    return (cache[key] = svgDataUrl(fn()));
  };

  SO.iconImg = function (key, size) {
    const sz = size || 18;
    return '<img class="ico" src="' + SO.icon(key) + '" width="' + sz + '" height="' + sz + '" alt="">';
  };

  /* High-DPI SVG Character Portrait Generator (with lip-sync open/closed mouth frames) */
  function avatarKey(seed, opts) {
    return 'av_' + seed + '|' + ((opts && opts.gender) || '?') + '|' + ((opts && opts.age) || 0);
  }
  SO.avatarUrl = function (seed, opts, talk) {
    const key = avatarKey(seed, opts);
    if (!cache[key]) {
      cache[key] = drawVectorPortrait(seed, opts, false);
      cache[key + '|t'] = drawVectorPortrait(seed, opts, true);
    }
    return cache[talk ? (key + '|t') : key];
  };
  SO.avatar = function (seed, size, opts) {
    const sz = size || 48;
    return '<img class="avatar" src="' + SO.avatarUrl(seed, opts, false) + '" width="' + sz + '" height="' + sz + '" alt="">';
  };

  function drawVectorPortrait(seed, opts, talk) {
    let h = 7;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    if (!h) h = 9;
    const rnd = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };

    const female = (opts && opts.gender) === 'female';
    const age = (opts && opts.age) || 40;
    const old = age >= 62;

    const skins = ['#f8d5b8', '#eec19c', '#dfb18b', '#c99366', '#a87246', '#8d5832', '#ffe0c8'];
    const hairCols = ['#1c1917', '#3f2e21', '#6b4423', '#92400e', '#ca8a04', '#9a3412', '#27272a', '#52525b'];
    const shirts = ['#2563eb', '#dc2626', '#059669', '#7c3aed', '#d97706', '#0d9488', '#334155', '#db2777', '#4f46e5'];
    const bgs = [
      ['#1e293b', '#0f172a'],
      ['#1e3a8a', '#172554'],
      ['#064e3b', '#022c22'],
      ['#3b0764', '#1e1b4b'],
      ['#451a03', '#1c1917'],
      ['#312e81', '#0f172a']
    ];

    const skin = skins[Math.floor(rnd() * skins.length)];
    let hair = hairCols[Math.floor(rnd() * hairCols.length)];
    const shirt = shirts[Math.floor(rnd() * shirts.length)];
    const bg = bgs[Math.floor(rnd() * bgs.length)];
    const glasses = rnd() < (old ? 0.5 : 0.28);
    const mustache = !female && rnd() < 0.25;
    const beard = !female && rnd() < 0.2;
    const hairStyle = Math.floor(rnd() * 4);
    if (old && rnd() < 0.75) hair = ['#e4e4e7', '#d4d4d8', '#a1a1aa'][Math.floor(rnd() * 3)];

    let hairBack = '', hairFront = '';
    if (female) {
      if (hairStyle === 0) {
        hairBack = `<path d="M26 48 C22 72, 24 98, 30 112 L98 112 C104 98, 106 72, 102 48 Z" fill="${hair}"/>`;
        hairFront = `<path d="M30 48 C30 22, 98 22, 98 48 C86 34, 52 34, 30 48 Z" fill="${hair}"/>`;
      } else if (hairStyle === 1) {
        hairBack = `<path d="M28 48 C25 68, 28 86, 36 92 L92 92 C100 86, 103 68, 100 48 Z" fill="${hair}"/>`;
        hairFront = `<path d="M30 50 C30 20, 98 20, 98 50 C82 36, 46 36, 30 50 Z" fill="${hair}"/>`;
      } else if (hairStyle === 2) {
        hairBack = `<circle cx="64" cy="20" r="14" fill="${hair}"/>`;
        hairFront = `<path d="M32 48 C32 22, 96 22, 96 48 C80 35, 48 35, 32 48 Z" fill="${hair}"/>`;
      } else {
        hairBack = `<path d="M28 45 C24 65, 28 85, 34 96 L94 96 C100 85, 104 65, 100 45 Z" fill="${hair}"/>`;
        hairFront = `<path d="M32 46 C34 22, 94 22, 96 46 C76 34, 52 38, 32 46 Z" fill="${hair}"/>`;
      }
    } else {
      if (hairStyle === 0) {
        hairFront = `<path d="M32 48 C30 20, 98 20, 96 48 C84 32, 44 32, 32 48 Z" fill="${hair}"/>`;
      } else if (hairStyle === 1) {
        hairFront = `<path d="M33 45 C33 23, 95 23, 95 45 C86 35, 42 35, 33 45 Z" fill="${hair}"/>`;
      } else if (hairStyle === 2) {
        hairFront = `<path d="M33 46 C33 34, 42 28, 48 34 M80 34 C86 28, 95 34, 95 46" stroke="${hair}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      } else {
        hairFront = `<path d="M31 46 C31 18, 97 18, 97 46 L102 46 L96 34 L32 34 L26 46 Z" fill="#1e40af"/>`;
      }
    }

    const mouthSvg = talk
      ? `<ellipse cx="64" cy="76" rx="7.5" ry="5.2" fill="#581c1c" stroke="#be123c" stroke-width="1.5"/>
         <rect x="59" y="71.5" width="10" height="2.4" rx="1" fill="#fff"/>`
      : `<path d="M56 75 Q64 ${female ? 79 : 77} 72 75" fill="none" stroke="${female ? '#be123c' : '#6b2f24'}" stroke-width="2.6" stroke-linecap="round"/>`;

    const wrinkles = old
      ? `<path d="M48 42 Q64 40 80 42" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1.4" stroke-linecap="round"/>
         <path d="M47 68 Q44 74 47 78 M81 68 Q84 74 81 78" fill="none" stroke="rgba(0,0,0,0.16)" stroke-width="1.3" stroke-linecap="round"/>`
      : '';

    const glassesSvg = glasses
      ? `<g stroke="#1e293b" stroke-width="2.2" fill="rgba(255,255,255,0.14)">
           <rect x="42" y="49" width="17" height="12" rx="3"/>
           <rect x="69" y="49" width="17" height="12" rx="3"/>
           <line x1="59" y1="54" x2="69" y2="54"/>
           <line x1="34" y1="53" x2="42" y2="54"/>
           <line x1="86" y1="54" x2="94" y2="53"/>
         </g>`
      : '';

    const facialHair = (beard ? `<path d="M36 66 C36 88, 52 94, 64 94 C76 94, 92 88, 92 66 C88 78, 78 86, 64 86 C50 86, 40 78, 36 66 Z" fill="${hair}" opacity="0.85"/>` : '') +
      (mustache ? `<path d="M53 71 Q64 67 75 71" fill="none" stroke="${hair}" stroke-width="3.6" stroke-linecap="round"/>` : '');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg[0]}"/>
          <stop offset="100%" stop-color="${bg[1]}"/>
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="18" fill="url(#bg)"/>
      ${hairBack}
      <path d="M22 128 C22 98, 42 90, 64 90 C86 90, 106 98, 106 128 Z" fill="${shirt}"/>
      <path d="M52 90 L64 106 L76 90" fill="#f8fafc" opacity="0.9"/>
      <rect x="54" y="78" width="20" height="18" rx="6" fill="${skin}"/>
      <circle cx="33" cy="58" r="6" fill="${skin}"/>
      <circle cx="95" cy="58" r="6" fill="${skin}"/>
      <rect x="34" y="26" width="60" height="64" rx="28" fill="${skin}"/>
      ${wrinkles}
      <path d="M45 47 Q51 44 56 47" fill="none" stroke="${hair}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M72 47 Q77 44 83 47" fill="none" stroke="${hair}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="51" cy="55" r="3.2" fill="#0f172a"/>
      <circle cx="77" cy="55" r="3.2" fill="#0f172a"/>
      <circle cx="52" cy="54" r="1" fill="#fff"/>
      <circle cx="78" cy="54" r="1" fill="#fff"/>
      <path d="M64 54 L62 65 L66 66" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${facialHair}
      ${mouthSvg}
      ${glassesSvg}
      ${hairFront}
    </svg>`;
    return svgDataUrl(svg);
  }
})();
