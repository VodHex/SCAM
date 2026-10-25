/* SCAM OS - procedurally drawn 16x16 pixel-art icons (shown scaled with image-rendering: pixelated). */
(function () {
  const SO = window.SO;
  const cache = {};
  const K = '#1a1a2e', W = '#ffffff', G1 = '#c0c0c0', G2 = '#808080', G3 = '#404040';
  const Y1 = '#ffd94a', Y2 = '#c99a12', R1 = '#e63232', R2 = '#8a1010', B1 = '#2a6bff', B2 = '#0a2f9e';
  const GR1 = '#3cc23c', GR2 = '#16741c', BR = '#8b5a2b', BG = '#ece9d8';

  function circle(r, cx, cy, rad, col) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= rad * rad) r(x, y, 1, 1, col);
    }
  }

  const D = {
    start: r => { r(1, 2, 6, 5, R1); r(8, 2, 7, 5, GR1); r(1, 8, 6, 6, B1); r(8, 8, 7, 6, Y1); r(0, 1, 16, 1, K); r(7, 1, 1, 14, K); r(0, 7, 16, 1, K); r(0, 14, 16, 1, K); },
    phone: r => { r(1, 8, 14, 6, G1); r(1, 8, 14, 1, W); r(1, 13, 14, 1, G3); r(2, 3, 12, 4, G3); r(1, 4, 2, 4, G3); r(13, 4, 2, 4, G3); r(5, 9, 6, 4, K); r(6, 10, 1, 1, GR1); r(8, 10, 1, 1, GR1); r(6, 12, 1, 1, GR1); r(8, 12, 1, 1, GR1); r(2, 2, 12, 1, K); },
    shop: r => { r(3, 5, 10, 9, GR1); r(3, 5, 10, 1, GR2); r(3, 13, 10, 1, GR2); r(5, 2, 1, 4, K); r(10, 2, 1, 4, K); r(5, 2, 6, 1, K); r(7, 7, 2, 1, W); r(6, 8, 1, 1, W); r(7, 9, 2, 1, W); r(9, 10, 1, 1, W); r(6, 11, 3, 1, W); r(7, 6, 1, 7, W); },
    crm: r => { r(1, 2, 14, 12, W); r(1, 2, 14, 3, B1); r(1, 2, 14, 1, B2); r(3, 6, 4, 4, '#f2c28a'); r(3, 10, 4, 3, B2); r(9, 7, 5, 1, G2); r(9, 9, 5, 1, G2); r(9, 11, 3, 1, G2); r(1, 2, 14, 1, K); r(1, 13, 14, 1, K); },
    notepad: r => { r(3, 2, 11, 13, W); r(3, 2, 11, 3, B1); for (let i = 0; i < 4; i++) r(4 + i * 3, 1, 1, 3, G3); r(5, 7, 7, 1, G2); r(5, 9, 7, 1, G2); r(5, 11, 5, 1, G2); r(2, 2, 1, 13, K); r(14, 2, 1, 13, K); r(2, 14, 13, 1, K); },
    wallet: r => { r(1, 4, 14, 10, BR); r(1, 4, 14, 1, '#b57a3f'); r(2, 2, 11, 3, GR1); r(2, 2, 11, 1, GR2); r(10, 8, 5, 4, Y1); r(12, 9, 1, 2, Y2); r(1, 13, 14, 1, '#4a2e12'); },
    tools: r => { r(1, 6, 14, 8, R1); r(1, 6, 14, 1, '#ff7070'); r(1, 13, 14, 1, R2); r(5, 3, 6, 1, K); r(5, 3, 1, 3, K); r(10, 3, 1, 3, K); r(1, 9, 14, 1, R2); r(7, 8, 2, 3, Y1); },
    mail: r => { r(1, 3, 14, 10, W); r(1, 3, 14, 1, K); r(1, 12, 14, 1, K); r(1, 3, 1, 10, K); r(14, 3, 1, 10, K); for (let i = 0; i < 6; i++) { r(2 + i, 4 + i, 1, 1, G2); r(13 - i, 4 + i, 1, 1, G2); } r(7, 10, 2, 1, G2); },
    taskmgr: r => { r(1, 2, 14, 10, G1); r(2, 3, 12, 8, K); r(3, 9, 2, 1, GR1); r(4, 8, 2, 1, GR1); r(5, 6, 2, 1, GR1); r(6, 5, 2, 1, GR1); r(8, 7, 2, 1, GR1); r(9, 8, 2, 1, GR1); r(10, 6, 2, 1, GR1); r(5, 12, 6, 2, G2); r(3, 14, 10, 1, G3); },
    shield: r => { r(3, 1, 10, 8, B1); r(4, 9, 8, 2, B1); r(5, 11, 6, 2, B1); r(7, 13, 2, 2, B1); r(3, 1, 10, 1, B2); r(3, 1, 1, 8, B2); r(12, 1, 1, 8, B2); r(5, 6, 2, 2, W); r(6, 7, 2, 2, W); r(8, 5, 2, 3, W); r(9, 4, 2, 2, W); },
    settings: r => { r(1, 3, 14, 10, BG); r(1, 3, 14, 1, G3); r(1, 12, 14, 1, G3); r(1, 3, 1, 10, G3); r(14, 3, 1, 10, G3); r(3, 5, 10, 1, G2); r(3, 8, 10, 1, G2); r(3, 11, 10, 1, G2); r(5, 4, 2, 3, B1); r(9, 7, 2, 3, R1); r(6, 10, 2, 3, GR1); },
    mines: r => { circle(r, 8, 8, 4.5, K); r(7, 1, 2, 14, K); r(1, 7, 14, 2, K); r(3, 3, 2, 2, K); r(11, 3, 2, 2, K); r(3, 11, 2, 2, K); r(11, 11, 2, 2, K); r(6, 6, 2, 2, W); },
    paint: r => { circle(r, 8, 8, 7, '#e8c88a'); circle(r, 8, 8, 7, '#e8c88a'); r(4, 5, 2, 2, R1); r(8, 3, 2, 2, B1); r(11, 6, 2, 2, GR1); r(10, 10, 2, 2, Y1); circle(r, 5, 11, 2, BG); r(0, 0, 0, 0, K); },
    cmd: r => { r(1, 2, 14, 12, K); r(1, 2, 14, 2, G2); r(3, 6, 1, 1, W); r(4, 7, 1, 1, W); r(3, 8, 1, 1, W); r(6, 8, 4, 1, W); r(1, 13, 14, 1, G3); },
    bin: r => { r(3, 4, 10, 10, G1); r(2, 3, 12, 2, G2); r(6, 1, 4, 2, G2); r(5, 6, 1, 7, G2); r(8, 6, 1, 7, G2); r(11, 6, 1, 7, G2); r(3, 13, 10, 1, G3); },
    ie: r => { circle(r, 8, 8, 7, B1); circle(r, 8, 8, 4, BG); r(6, 7, 5, 1, B2); r(6, 9, 5, 1, B2); r(6, 7, 1, 3, B2); r(10, 7, 1, 2, B2); r(1, 6, 14, 2, Y1); r(0, 0, 0, 0, K); },
    computer: r => { r(2, 2, 12, 9, BG); r(2, 2, 12, 1, W); r(3, 3, 10, 7, B1); r(4, 4, 8, 3, '#6fb4ff'); r(6, 11, 4, 2, G2); r(3, 13, 10, 2, BG); r(3, 14, 10, 1, G2); r(2, 2, 12, 1, K); },
    folder: r => { r(1, 3, 6, 2, Y2); r(1, 4, 14, 9, Y1); r(1, 4, 14, 1, '#ffe98a'); r(1, 12, 14, 1, Y2); r(1, 5, 14, 1, Y2); },
    file: r => { r(3, 1, 10, 14, W); r(3, 1, 10, 1, K); r(3, 14, 10, 1, K); r(3, 1, 1, 14, K); r(12, 1, 1, 14, K); r(5, 4, 6, 1, G2); r(5, 6, 6, 1, G2); r(5, 8, 6, 1, G2); r(5, 10, 4, 1, G2); },
    user: r => { circle(r, 8, 5, 3.5, '#f2c28a'); r(4, 9, 8, 6, B1); r(4, 9, 8, 1, B2); r(6, 4, 1, 1, K); r(9, 4, 1, 1, K); },
    warn: r => { for (let y = 0; y < 13; y++) { const w = 1 + y; r(8 - Math.ceil(w / 2), 2 + y, w + (w % 2 ? 0 : 0), 1, Y1); } r(7, 6, 2, 5, K); r(7, 12, 2, 2, K); },
    skull: r => { circle(r, 8, 6, 5.5, W); r(4, 10, 8, 4, W); r(4, 5, 3, 3, K); r(9, 5, 3, 3, K); r(7, 8, 2, 2, K); r(5, 12, 1, 3, K); r(7, 12, 1, 3, K); r(9, 12, 1, 3, K); r(11, 12, 1, 2, K); },
    cash: r => { r(1, 4, 14, 8, GR1); r(1, 4, 14, 1, GR2); r(1, 11, 14, 1, GR2); circle(r, 8, 8, 2.5, GR2); r(7, 7, 2, 2, '#c9ffc9'); r(2, 5, 1, 1, GR2); r(13, 10, 1, 1, GR2); },
    info: r => { circle(r, 8, 8, 7, B1); r(7, 3, 2, 2, W); r(7, 6, 2, 7, W); },
    error: r => { circle(r, 8, 8, 7, R1); for (let i = 0; i < 8; i++) { r(4 + i, 4 + i, 2, 1, W); r(10 - i, 4 + i, 2, 1, W); } },
    tip: r => { circle(r, 8, 6, 5, Y1); r(6, 11, 4, 3, G2); r(7, 14, 2, 1, G3); r(7, 5, 2, 3, W); },

    mic: r => { r(6, 1, 4, 8, G3); r(7, 2, 1, 5, G1); r(5, 2, 1, 6, G3); r(10, 2, 1, 6, G3); r(4, 7, 1, 3, G3); r(11, 7, 1, 3, G3); r(5, 10, 6, 1, G3); r(7, 11, 2, 3, G3); r(5, 14, 6, 1, G3); },
    micoff: r => { D.mic(r); for (let i = 0; i < 14; i++) { r(1 + i, 1 + i, 2, 1, R1); } r(0, 0, 0, 0, K); },
    speaker: r => { r(2, 6, 3, 4, G3); r(5, 5, 2, 6, G3); r(7, 3, 2, 10, G3); r(10, 5, 1, 6, G3); r(12, 3, 1, 10, G3); r(3, 7, 1, 2, G1); },
    speakeroff: r => { r(2, 6, 3, 4, G3); r(5, 5, 2, 6, G3); r(7, 3, 2, 10, G3); for (let i = 0; i < 5; i++) { r(10 + i, 5 + i, 1, 1, R1); r(14 - i, 5 + i, 1, 1, R1); r(10 + i, 5 + i + 1, 1, 1, R1); r(14 - i, 5 + i + 1, 1, 1, R1); } },
    headset: r => { r(4, 2, 8, 1, G3); r(3, 3, 1, 2, G3); r(12, 3, 1, 2, G3); r(2, 5, 1, 4, G3); r(13, 5, 1, 4, G3); r(1, 8, 3, 5, B1); r(12, 8, 3, 5, B1); r(1, 8, 3, 1, B2); r(12, 8, 3, 1, B2); r(4, 12, 3, 1, G3); r(6, 13, 4, 1, G3); },
    hangup: r => { r(2, 6, 12, 4, R1); r(1, 8, 3, 4, R1); r(12, 8, 3, 4, R1); r(2, 6, 12, 1, '#ff8a8a'); r(5, 9, 6, 1, R2); r(3, 12, 1, 1, R2); r(12, 12, 1, 1, R2); },
    send: r => { r(2, 7, 9, 2, B1); r(9, 4, 2, 8, B1); r(11, 5, 1, 6, B1); r(12, 6, 1, 4, B1); r(13, 7, 1, 2, B1); r(2, 7, 9, 1, '#6fa4ff'); },
    stop: r => { r(4, 2, 8, 12, R1); r(2, 4, 12, 8, R1); r(5, 7, 6, 2, W); },
    script: r => { D.notepad(r); },
    lock: r => { r(3, 7, 10, 8, Y1); r(3, 7, 10, 1, Y2); r(5, 2, 1, 6, G3); r(10, 2, 1, 6, G3); r(5, 2, 6, 1, G3); r(7, 10, 2, 3, K); },
    police: r => { r(2, 6, 12, 6, B1); r(3, 3, 4, 3, R1); r(9, 3, 4, 3, B2); r(3, 12, 3, 2, K); r(10, 12, 3, 2, K); r(4, 7, 8, 2, W); },
    card: r => { r(1, 3, 14, 10, B2); r(1, 3, 14, 1, '#4a7aff'); r(1, 12, 14, 1, '#001a5e'); r(1, 5, 14, 2, K); r(3, 8, 3, 2, Y1); r(7, 9, 6, 1, W); r(3, 11, 4, 1, G1); },
    id: r => { r(6, 0, 4, 2, G2); r(7, 0, 1, 3, G3); r(3, 2, 10, 12, BG); r(3, 2, 10, 1, '#fff'); r(3, 13, 10, 1, G2); r(3, 2, 1, 12, G1); r(12, 2, 1, 12, G2); r(4, 4, 4, 4, '#f2c28a'); r(4, 4, 4, 1, '#6b4423'); r(4, 8, 4, 2, B1); r(9, 5, 4, 1, G2); r(9, 7, 4, 1, G2); r(9, 9, 4, 1, G2); r(4, 11, 9, 2, Y2); },
    bank: r => { r(1, 4, 14, 2, '#4a7aff'); r(0, 6, 16, 1, B2); r(2, 7, 2, 6, BG); r(6, 7, 2, 6, BG); r(10, 7, 2, 6, BG); r(14, 7, 0, 6, BG); r(13, 7, 2, 6, BG); r(2, 13, 12, 1, G2); r(1, 14, 14, 1, G3); r(7, 7, 2, 6, '#f7e37a'); r(6, 1, 4, 2, '#f7e37a'); },
    giftcard: r => { r(2, 3, 12, 10, R1); r(2, 3, 12, 1, '#ff7070'); r(2, 12, 12, 1, R2); r(7, 3, 2, 10, Y1); r(2, 7, 12, 2, Y1); r(5, 1, 3, 2, Y1); r(8, 1, 3, 2, Y1); },
    pos: r => { r(2, 1, 12, 14, G3); r(3, 2, 10, 1, G2); r(3, 3, 10, 4, '#1b3b1b'); r(4, 4, 8, 2, GR1); r(3, 8, 10, 6, G2); for(let y=0;y<3;y++) for(let x=0;x<3;x++) r(4+x*3, 9+y*2, 2, 1, K); },
    remotedesk: r => { r(1, 1, 10, 8, '#2a6bff'); r(2, 2, 8, 6, '#ffffff'); r(5, 9, 2, 3, '#888888'); r(3, 12, 6, 1, '#888888'); r(7, 6, 8, 8, '#e63232'); r(8, 7, 6, 6, '#ffffff'); r(9, 8, 4, 4, '#e63232'); }
  };

  SO.icon = function (key) {
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const x = c.getContext('2d');
    const r = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px, py, w, h); };
    try { (D[key] || D.file)(r); } catch (e) { D.file(r); }
    return (cache[key] = c.toDataURL());
  };
  SO.iconImg = function (key, size) {
    return '<img class="ico" src="' + SO.icon(key) + '" width="' + (size || 16) + '" height="' + (size || 16) + '" alt="">';
  };

  /* Pixel avatar for victims/NPCs: a seeded 24x24 bust. Renders TWO frames
     (mouth closed + mouth open) so the call view can lip-flap while the victim
     speaks. Same seed+opts always draws the same face. */
  function avatarKey(seed, opts) { return 'av_' + seed + '|' + ((opts && opts.gender) || '?') + '|' + ((opts && opts.age) || 0); }
  SO.avatarUrl = function (seed, opts, talk) {
    const key = avatarKey(seed, opts);
    if (!cache[key]) {
      cache[key] = drawBust(seed, opts, false);
      cache[key + '|t'] = drawBust(seed, opts, true);
    }
    return cache[talk ? (key + '|t') : key];
  };
  SO.avatar = function (seed, size, opts) {
    const sz = size || 48;
    return '<img class="avatar" src="' + SO.avatarUrl(seed, opts, false) + '" width="' + sz + '" height="' + sz + '" alt="">';
  };

  function drawBust(seed, opts, talk) {
    let h = 7; const s = String(seed);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; if (!h) h = 9;
    const rnd = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
    const female = (opts && opts.gender) === 'female';
    const old = ((opts && opts.age) || 40) >= 62;
    const c = document.createElement('canvas'); c.width = 24; c.height = 24;
    const x = c.getContext('2d');
    const r = (px, py, w, h2, col) => { x.fillStyle = col; x.fillRect(px, py, w, h2); };

    const skins = ['#f6c9a0', '#eab894', '#dc9f70', '#c68642', '#a06a38', '#8a5430', '#ffdbac'];
    const hairCols = ['#1f1a17', '#42302a', '#6b4423', '#8a5a2b', '#c9a227', '#b5412b', '#2b2b2b', '#575153'];
    const shirts = ['#2a6bff', '#e63232', '#3cc23c', '#9b4dca', '#ff9f1a', '#20b2aa', '#556277', '#c2185b', '#7a5230'];
    const walls = [['#9ec9ff', '#7ba7e8'], ['#bfe8c8', '#95cbaa'], ['#f2e3c2', '#dcc59a'], ['#e3d2f7', '#c5aee6'], ['#f7cbc4', '#e2a094'], ['#cfd8e3', '#a9b6c6']];
    const caps = [['#b03a2e', '#7d241d'], ['#2e5fb0', '#1d3d7d'], ['#2e8b57', '#1d5c3a'], ['#4a4a4a', '#2e2e2e']];
    const skin = skins[Math.floor(rnd() * skins.length)];
    let hair = hairCols[Math.floor(rnd() * hairCols.length)];
    const shirt = shirts[Math.floor(rnd() * shirts.length)];
    const wall = walls[Math.floor(rnd() * walls.length)];
    const glasses = rnd() < (old ? 0.45 : 0.3);
    const earring = female ? rnd() < 0.55 : rnd() < 0.18;
    const necklace = rnd() < 0.45;
    const blush = female && rnd() < 0.6;
    const lipstick = female && rnd() < 0.75;
    const stubble = !female && rnd() < 0.3;
    const mustache = !female && rnd() < 0.22;
    if (old && rnd() < 0.72) hair = ['#d9d9d9', '#bdbdbd', '#8f8f8f'][Math.floor(rnd() * 3)];
    const shade = 'rgba(0,0,0,0.18)', lite = 'rgba(255,255,255,0.16)', dark = '#1b1414';
    const lipc = lipstick ? '#c2415e' : '#9c4a3c';

    // room wall + trim
    r(0, 0, 24, 24, wall[0]);
    r(0, 17, 24, 7, wall[1]);
    r(0, 17, 24, 1, lite);

    // ears + earrings
    r(6, 10, 1, 2, skin); r(17, 10, 1, 2, skin);
    if (earring) { r(6, 12, 1, 1, '#f3d34a'); if (female) r(17, 12, 1, 1, '#f3d34a'); }

    // head (rounded block)
    r(9, 4, 6, 1, skin); r(8, 5, 8, 1, skin);
    r(7, 6, 10, 8, skin); r(8, 14, 8, 1, skin);
    r(16, 7, 1, 7, shade);            // right cheek shadow
    r(8, 7, 1, 6, lite);              // left highlight
    r(9, 14, 6, 1, 'rgba(0,0,0,0.10)'); // chin

    // neck
    r(10, 15, 4, 3, skin); r(10, 17, 4, 1, shade);

    // shoulders / torso
    r(2, 18, 20, 6, shirt);
    r(1, 19, 1, 5, shirt); r(22, 19, 1, 5, shirt);
    r(0, 21, 1, 3, shirt); r(23, 21, 1, 3, shirt);
    r(2, 18, 20, 1, lite); r(2, 23, 20, 1, 'rgba(0,0,0,0.15)');
    r(9, 19, 1, 4, '#f4f4f4'); r(14, 19, 1, 4, '#f4f4f4');   // collar
    if (necklace) { r(11, 20, 2, 1, '#f3d34a'); r(11, 21, 1, 1, '#f3d34a'); r(12, 21, 1, 1, '#f3d34a'); }

    // hair styles (drawn over head + may cover shoulders)
    const H = hair;
    const hs = Math.floor(rnd() * (female ? 5 : 6));
    if (female) {
      if (hs === 0) { r(6, 2, 12, 4, H); r(5, 4, 2, 13, H); r(17, 4, 2, 13, H); r(5, 15, 2, 2, H); r(17, 15, 2, 2, H); r(7, 5, 3, 1, H); r(14, 5, 3, 1, H); }   // long
      else if (hs === 1) { r(6, 2, 12, 4, H); r(5, 4, 2, 8, H); r(17, 4, 2, 8, H); r(7, 5, 4, 1, H); r(13, 5, 4, 1, H); }                                        // bob
      else if (hs === 2) { r(6, 2, 12, 4, H); r(9, 0, 6, 2, H); r(6, 4, 1, 4, H); r(17, 4, 1, 4, H); }                                                           // bun
      else if (hs === 3) { r(6, 2, 12, 5, H); r(6, 5, 1, 4, H); r(17, 5, 1, 4, H); r(6, 5, 3, 2, H); r(15, 5, 3, 2, H); }                                        // pixie
      else { r(6, 2, 12, 4, H); r(5, 3, 2, 7, H); r(17, 2, 2, 10, H); r(16, 12, 3, 2, H); }                                                                      // ponytail
    } else {
      if (hs === 0) { r(6, 2, 12, 4, H); r(6, 4, 1, 2, H); r(17, 4, 1, 2, H); }                                                                                  // crop
      else if (hs === 1) { r(6, 2, 12, 4, H); r(6, 5, 5, 1, H); r(6, 6, 2, 1, H); }                                                                              // side part
      else if (hs === 2) { r(6, 2, 3, 1, H); r(15, 2, 3, 1, H); r(6, 3, 2, 2, H); r(16, 3, 2, 2, H); }                                                           // receding
      else if (hs === 3) { r(7, 10, 1, 2, H); }                                                                                                                  // bald + sideburns
      else if (hs === 4) { r(7, 3, 10, 2, H); r(7, 10, 1, 1, H); r(16, 10, 1, 1, H); }                                                                           // buzz
      else { const cap = caps[Math.floor(rnd() * caps.length)]; r(6, 1, 12, 4, cap[0]); r(6, 5, 12, 1, cap[1]); r(0, 0, 0, 0, K); }                              // cap
    }

    // face details
    if (old) r(9, 6, 6, 1, 'rgba(0,0,0,0.09)');
    r(9, 7, 2, 1, dark); r(13, 7, 2, 1, dark);                          // brows
    r(9, 9, 2, 2, '#fff'); r(10, 10, 1, 1, dark);                       // left eye
    r(13, 9, 2, 2, '#fff'); r(13, 10, 1, 1, dark);                      // right eye
    r(11, 11, 1, 2, shade);                                             // nose
    if (old) { r(7, 9, 1, 1, shade); r(16, 9, 1, 1, shade); r(7, 10, 1, 1, shade); r(16, 10, 1, 1, shade); }
    if (blush) { r(8, 12, 1, 1, 'rgba(224,110,110,0.4)'); r(15, 12, 1, 1, 'rgba(224,110,110,0.4)'); }
    if (mustache) r(10, 12, 4, 1, H);
    if (stubble) { r(8, 13, 8, 1, 'rgba(0,0,0,0.13)'); r(9, 14, 6, 1, 'rgba(0,0,0,0.18)'); }
    if (glasses) { r(8, 8, 4, 1, '#2b2b2b'); r(12, 8, 4, 1, '#2b2b2b'); r(7, 9, 1, 1, '#2b2b2b'); r(16, 9, 1, 1, '#2b2b2b'); }

    // MOUTH: the only thing that differs between the closed and talking frame.
    if (talk) { r(10, 12, 4, 3, '#6b1f14'); r(10, 12, 4, 1, '#fff'); r(9, 13, 1, 1, lipc); r(14, 13, 1, 1, lipc); }
    else r(10, 13, 4, 1, lipc);

    return c.toDataURL();
  }
})();
