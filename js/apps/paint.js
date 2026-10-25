(function () {
  'use strict';
  const SO = window.SO = window.SO || {};
  const PAL = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000',
    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'];
  const TOOLS = [['pencil', 'Pen', 'Pencil'], ['brush', 'Brsh', 'Brush'], ['eraser', 'Ers', 'Eraser'], ['fill', 'Fill', 'Fill With Color'],
    ['line', 'Line', 'Line'], ['rect', 'Rect', 'Rectangle'], ['ellipse', 'Oval', 'Ellipse'], ['picker', 'Pick', 'Pick Color']];

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function injectCss() {
    if (document.getElementById('pt-css')) return;
    const s = el('style'); s.id = 'pt-css';
    s.textContent =
      '.pt-mid{flex:1;display:flex;min-height:0}' +
      '.pt-tools{width:68px;flex:none;padding:4px;display:grid;grid-template-columns:1fr 1fr;gap:2px;align-content:start;background:#ece9d8}' +
      '.pt-tools .xp-btn{padding:2px 0;min-width:0;font-size:16px}.pt-tools .xp-btn.on{background:#fff;border-style:inset}' +
      '.pt-tools select{grid-column:1/3;margin-top:4px;width:100%}' +
      '.pt-area{flex:1;overflow:auto;background:#808080;padding:4px;min-width:0}' +
      '.pt-cv{display:block;background:#fff;image-rendering:pixelated;cursor:crosshair}' +
      '.pt-bot{display:flex;align-items:center;gap:8px;padding:3px 6px;background:#ece9d8}' +
      '.pt-cur{position:relative;width:34px;height:30px;flex:none}' +
      '.pt-cur i{position:absolute;width:18px;height:18px;border:2px solid;border-color:#808080 #fff #fff #808080}' +
      '.pt-pal{display:grid;grid-template-columns:repeat(14,18px);grid-auto-rows:18px;gap:2px}' +
      '.pt-pal i{border:1px solid;border-color:#808080 #fff #fff #808080;cursor:default}';
    document.head.appendChild(s);
  }
  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function hex(r, g, b) { return '#' + [r, g, b].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }

  function open() {
    try {
      injectCss();
      const w = SO.wm.open({ id: 'paint', title: 'untitled - Paint', icon: 'paint', w: 560, h: 480 });
      if (!w || !w.fresh) return w;
      const W = 400, H = 300;
      let tool = 'pencil', fg = '#000000', bg = '#ffffff', size = 1;
      const undo = [];

      const mb = el('div', 'menubar');
      const mid = el('div', 'pt-mid');
      const tools = el('div', 'pt-tools');
      const area = el('div', 'pt-area');
      const cv = el('canvas', 'pt-cv'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = false;
      area.appendChild(cv);
      const bot = el('div', 'pt-bot');
      const cur = el('div', 'pt-cur'), cb = el('i'), cf = el('i');
      cb.style.cssText = 'left:12px;top:10px'; cf.style.cssText = 'left:2px;top:2px';
      cur.appendChild(cb); cur.appendChild(cf);
      const pal = el('div', 'pt-pal');
      const sb = el('div', 'statusbar'); sb.textContent = 'Pencil';
      mid.appendChild(tools); mid.appendChild(area); bot.appendChild(cur); bot.appendChild(pal);
      [mb, mid, bot, sb].forEach(function (x) { w.body.appendChild(x); });

      function setCols() { cf.style.background = fg; cb.style.background = bg; }
      PAL.forEach(function (c) {
        const i = el('i'); i.style.background = c; i.title = c;
        i.addEventListener('mousedown', function (e) { if (e.button === 2) bg = c; else fg = c; setCols(); });
        i.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        pal.appendChild(i);
      });
      setCols();

      const tbtn = {};
      TOOLS.forEach(function (t) {
        const b = el('button', 'xp-btn', t[1]); b.title = t[2];
        b.addEventListener('click', function () { setTool(t[0]); });
        tbtn[t[0]] = b; tools.appendChild(b);
      });
      function setTool(t) {
        tool = t;
        Object.keys(tbtn).forEach(function (k) { tbtn[k].classList.toggle('on', k === t); });
        sb.textContent = TOOLS.find(function (x) { return x[0] === t; })[2];
      }
      const sz = el('select', 'xp-input');
      [1, 2, 3, 4, 6, 8].forEach(function (n) { const o = el('option', null, 'Size ' + n); o.value = n; sz.appendChild(o); });
      sz.addEventListener('change', function () { size = +sz.value; });
      tools.appendChild(sz);
      setTool('pencil');

      function pushUndo() { try { undo.push(ctx.getImageData(0, 0, W, H)); if (undo.length > 30) undo.shift(); } catch (e) { } }
      function doUndo() { const s = undo.pop(); if (s) ctx.putImageData(s, 0, 0); }
      function clear() { pushUndo(); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); }
      function plot(x, y, s, c) { ctx.fillStyle = c; const o = s >> 1; ctx.fillRect(x - o, y - o, s, s); }
      function line(x0, y0, x1, y1, s, c) {
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        for (let n = 0; n < 5000; n++) {
          plot(x0, y0, s, c);
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err;
          if (e2 >= dy) { err += dy; x0 += sx; }
          if (e2 <= dx) { err += dx; y0 += sy; }
        }
      }
      function rect(x0, y0, x1, y1, s, c) { line(x0, y0, x1, y0, s, c); line(x1, y0, x1, y1, s, c); line(x1, y1, x0, y1, s, c); line(x0, y1, x0, y0, s, c); }
      function ellipse(x0, y0, x1, y1, s, c) {
        let a = Math.abs(x1 - x0), b = Math.abs(y1 - y0), b1 = b & 1;
        let dx = 4 * (1 - a) * b * b, dy = 4 * (b1 + 1) * a * a, err = dx + dy + b1 * a * a, e2;
        if (x0 > x1) { x0 = x1; x1 += a; }
        if (y0 > y1) y0 = y1;
        y0 += (b + 1) >> 1; y1 = y0 - b1; a *= 8 * a; b1 = 8 * b * b;
        const p = function (x, y) { plot(x, y, s, c); };
        let guard = 0;
        do {
          p(x1, y0); p(x0, y0); p(x0, y1); p(x1, y1);
          e2 = 2 * err;
          if (e2 <= dy) { y0++; y1--; err += dy += a; }
          if (e2 >= dx || 2 * err > dy) { x0++; x1--; err += dx += b1; }
        } while (x0 <= x1 && ++guard < 5000);
        while (y0 - y1 < b && guard++ < 10000) { p(x0 - 1, y0); p(x1 + 1, y0++); p(x0 - 1, y1); p(x1 + 1, y1--); }
      }
      function fill(sx, sy, col) {
        if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
        const img = ctx.getImageData(0, 0, W, H), d = new Uint32Array(img.data.buffer);
        const c = rgb(col), target = ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
        const from = d[sy * W + sx];
        if (from === target) return;
        const st = [sy * W + sx];
        while (st.length) {
          const i = st.pop();
          if (d[i] !== from) continue;
          d[i] = target;
          const x = i % W;
          if (x > 0) st.push(i - 1);
          if (x < W - 1) st.push(i + 1);
          if (i >= W) st.push(i - W);
          if (i < W * (H - 1)) st.push(i + W);
        }
        ctx.putImageData(img, 0, 0);
      }
      function pt(e) {
        const r = cv.getBoundingClientRect();
        return [Math.floor((e.clientX - r.left) * W / r.width), Math.floor((e.clientY - r.top) * H / r.height)];
      }

      cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      cv.addEventListener('mousedown', function (e) {
        if (e.button !== 0 && e.button !== 2) return;
        e.preventDefault();
        const col = e.button === 2 ? bg : fg;
        const p0 = pt(e);
        if (tool === 'picker') {
          try { const d = ctx.getImageData(p0[0], p0[1], 1, 1).data; const h = hex(d[0], d[1], d[2]); if (e.button === 2) bg = h; else fg = h; setCols(); } catch (er) { }
          return;
        }
        pushUndo();
        if (tool === 'fill') { fill(p0[0], p0[1], col); return; }
        const s = tool === 'pencil' ? 1 : tool === 'eraser' ? Math.max(4, size * 3) : size;
        const c = tool === 'eraser' ? bg : col;
        const freehand = tool === 'pencil' || tool === 'brush' || tool === 'eraser';
        const snap = freehand ? null : ctx.getImageData(0, 0, W, H);
        let last = p0;
        if (freehand) plot(p0[0], p0[1], s, c);
        function move(ev) {
          const p = pt(ev);
          sb.textContent = p[0] + ', ' + p[1];
          if (freehand) { line(last[0], last[1], p[0], p[1], s, c); last = p; return; }
          ctx.putImageData(snap, 0, 0);
          if (tool === 'line') line(p0[0], p0[1], p[0], p[1], size, c);
          else if (tool === 'rect') rect(p0[0], p0[1], p[0], p[1], size, c);
          else if (tool === 'ellipse') ellipse(p0[0], p0[1], p[0], p[1], size, c);
        }
        function up() {
          document.removeEventListener('mousemove', move);
          document.removeEventListener('mouseup', up);
        }
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        if (!freehand) move(e);
      });
      cv.addEventListener('mousemove', function (e) { const p = pt(e); sb.textContent = p[0] + ', ' + p[1]; });
      w.body.tabIndex = 0;
      w.body.addEventListener('keydown', function (e) { if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); doUndo(); } });

      function savePng() {
        try {
          const a = document.createElement('a');
          a.href = cv.toDataURL('image/png'); a.download = 'untitled.png';
          document.body.appendChild(a); a.click(); a.remove();
        } catch (e) { SO.msgbox({ title: 'Paint', text: 'Could not save the image.', icon: 'error', buttons: ['OK'] }); }
      }
      SO.xpmenu.bar(mb, [
        { label: 'File', items: [{ label: 'New', fn: clear }, { label: 'Save as PNG...', fn: savePng }, { sep: true }, { label: 'Exit', fn: function () { w.close(); } }] },
        { label: 'Edit', items: function () { return [{ label: 'Undo', disabled: !undo.length, fn: doUndo }, { sep: true }, { label: 'Clear Image', fn: clear }]; } }
      ]);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      return w;
    } catch (err) { console.error('paint', err); }
  }

  SO.registerApp({ id: 'paint', name: 'Paint', icon: 'paint', desktop: true, start: true, order: 40, open: open });
})();
