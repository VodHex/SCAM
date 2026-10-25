(function () {
  'use strict';
  const SO = window.SO = window.SO || {};
  const LV = { b: [9, 9, 10, 'Beginner'], i: [16, 16, 40, 'Intermediate'], e: [16, 30, 99, 'Expert'] };
  const CS = 20;
  let lastReward = 0;

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function injectCss() {
    if (document.getElementById('ms-css')) return;
    const s = el('style'); s.id = 'ms-css';
    s.textContent =
      '.ms-wrap{align-self:flex-start;background:#c0c0c0;padding:6px;border:3px solid;border-color:#fff #808080 #808080 #fff;user-select:none;-webkit-user-select:none}' +
      '.ms-head{display:flex;justify-content:space-between;align-items:center;padding:4px 6px;margin-bottom:6px;border:2px solid;border-color:#808080 #fff #fff #808080}' +
      '.ms-led{background:#000;color:#f00;font-size:30px;line-height:30px;padding:0 3px;letter-spacing:1px;border:1px solid;border-color:#808080 #fff #fff #808080;min-width:48px;text-align:center;font-family:inherit}' +
      '.ms-face{width:30px;height:30px;position:relative;background:#c0c0c0;border:3px solid;border-color:#fff #808080 #808080 #fff;cursor:default;padding:0}' +
      '.ms-face:active{border:1px solid #808080}' +
      '.ms-fc{position:absolute;left:5px;top:5px;width:16px;height:16px;border-radius:50%;background:#ff0;border:2px solid #000;box-sizing:border-box}' +
      '.ms-fc:before,.ms-fc:after{content:"";position:absolute;top:3px;width:2px;height:2px;background:#000}.ms-fc:before{left:2px}.ms-fc:after{right:2px}' +
      '.ms-fm{position:absolute;left:3px;top:7px;width:6px;height:3px;border-bottom:2px solid #000;border-radius:0 0 6px 6px}' +
      '.ms-face.o .ms-fm{height:3px;width:3px;left:4px;top:7px;border:2px solid #000;border-radius:50%}' +
      '.ms-face.d .ms-fc:before,.ms-face.d .ms-fc:after{height:2px;width:3px;top:3px}' +
      '.ms-face.d .ms-fm{border-bottom:0;border-top:2px solid #000;border-radius:6px 6px 0 0;top:8px}' +
      '.ms-face.c .ms-fc:before{left:1px;width:5px;height:2px}.ms-face.c .ms-fc:after{right:1px;width:5px;height:2px}' +
      '.ms-grid{display:grid;border:3px solid;border-color:#808080 #fff #fff #808080;background:#808080}' +
      '.ms-c{width:' + CS + 'px;height:' + CS + 'px;box-sizing:border-box;background:#c0c0c0;border:3px solid;border-color:#fff #808080 #808080 #fff;text-align:center;font-size:20px;line-height:' + (CS - 6) + 'px;font-weight:bold;overflow:hidden;cursor:default}' +
      '.ms-c.r{border:1px solid #808080;line-height:' + (CS - 2) + 'px}.ms-c.boom{background:#f00}.ms-c.wrong{background:#c0c0c0}' +
      '.ms-n1{color:#0000ff}.ms-n2{color:#008000}.ms-n3{color:#ff0000}.ms-n4{color:#000080}.ms-n5{color:#800000}.ms-n6{color:#008080}.ms-n7{color:#000}.ms-n8{color:#808080}' +
      '.ms-mine{display:block;width:10px;height:10px;background:#000;border-radius:50%;margin:3px auto;position:relative;box-shadow:0 0 0 1px #000}.ms-mine:before{content:"";position:absolute;left:2px;top:2px;width:2px;height:2px;background:#fff}' +
      '.ms-flag{display:block;position:relative;width:14px;height:14px;margin:0 auto}' +
      '.ms-flag:before{content:"";position:absolute;left:3px;top:1px;border-left:7px solid #f00;border-top:4px solid transparent;border-bottom:4px solid transparent}' +
      '.ms-flag:after{content:"";position:absolute;left:3px;top:1px;width:2px;height:11px;background:#000;box-shadow:-2px 10px 0 0 #000,2px 10px 0 0 #000}' +
      '.ms-x{color:#f00;position:absolute;left:0;right:0}';
    document.head.appendChild(s);
  }

  function open() {
    try {
      injectCss();
      const w = SO.wm.open({ id: 'mines', title: 'Minesweeper', icon: 'mines', w: 260, h: 380, noMax: true, onClose: function () { clearInterval(timer); closed = true; } });
      if (!w || !w.fresh) return w;
      let closed = false, timer = null, level = 'b';
      let rows, cols, mines, cells, started, over, flags, revealed, secs, down = false;

      const mb = el('div', 'menubar');
      const wrap = el('div', 'ms-wrap');
      const head = el('div', 'ms-head');
      const ledM = el('div', 'ms-led', '000'), ledT = el('div', 'ms-led', '000');
      const face = el('button', 'ms-face'); face.innerHTML = '<div class="ms-fc"><div class="ms-fm"></div></div>';
      head.appendChild(ledM); head.appendChild(face); head.appendChild(ledT);
      const grid = el('div', 'ms-grid');
      wrap.appendChild(head); wrap.appendChild(grid);
      w.body.style.background = '#ece9d8';
      w.body.appendChild(mb); w.body.appendChild(wrap);

      function led(n) { n = Math.max(-99, Math.min(999, n)); return n < 0 ? '-' + String(-n).padStart(2, '0') : String(n).padStart(3, '0'); }
      function setFace(c) { face.className = 'ms-face' + (c ? ' ' + c : ''); }
      function nb(i, f) {
        const r = (i / cols) | 0, c = i % cols;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) f(rr * cols + cc);
        }
      }
      function paint(i) {
        const c = cells[i], d = grid.children[i];
        let cls = 'ms-c', html = '';
        if (c.r) {
          cls += ' r';
          if (c.m) { html = '<i class="ms-mine"></i>'; if (c.boom) cls += ' boom'; }
          else if (c.n) { html = String(c.n); cls += ' ms-n' + c.n; }
        } else if (c.f) html = '<i class="ms-flag"></i>';
        if (c.wrong) { html = '<i class="ms-mine"></i><b class="ms-x">X</b>'; cls += ' r wrong'; d.style.position = 'relative'; }
        d.className = cls; d.innerHTML = html;
      }
      function fit() {
        try {
          const b = w.body, e = w.el;
          const cw = e.offsetWidth - b.clientWidth, ch = e.offsetHeight - b.clientHeight;
          e.style.width = (wrap.offsetWidth + cw) + 'px';
          e.style.height = (mb.offsetHeight + wrap.offsetHeight + ch) + 'px';
        } catch (err) { }
      }
      function newGame(lv) {
        if (lv) level = lv;
        clearInterval(timer);
        const L = LV[level]; rows = L[0]; cols = L[1]; mines = L[2];
        cells = []; started = false; over = false; flags = 0; revealed = 0; secs = 0;
        for (let i = 0; i < rows * cols; i++) cells.push({ m: false, n: 0, r: false, f: false });
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = 'repeat(' + cols + ',' + CS + 'px)';
        for (let i = 0; i < cells.length; i++) { const d = el('div', 'ms-c'); d.dataset.i = i; grid.appendChild(d); }
        ledM.textContent = led(mines); ledT.textContent = '000'; setFace('');
        requestAnimationFrame(fit); setTimeout(fit, 60);
      }
      function place(safe) {
        let left = mines;
        while (left > 0) {
          const i = (Math.random() * cells.length) | 0;
          if (i !== safe && !cells[i].m) { cells[i].m = true; left--; }
        }
        cells.forEach(function (c, i) { let k = 0; nb(i, function (j) { if (cells[j].m) k++; }); c.n = k; });
      }
      function startTimer() {
        timer = setInterval(function () {
          if (closed || !w.el.isConnected) { clearInterval(timer); return; }
          secs = Math.min(999, secs + 1); ledT.textContent = led(secs);
        }, 1000);
      }
      function lose(hit) {
        over = true; clearInterval(timer); setFace('d');
        cells.forEach(function (c, i) {
          if (c.m && !c.f) { c.r = true; if (i === hit) c.boom = true; paint(i); }
          else if (!c.m && c.f) { c.wrong = true; paint(i); }
        });
        try { SO.audio && SO.audio.play('error'); } catch (e) { }
      }
      function win() {
        over = true; clearInterval(timer); setFace('c');
        cells.forEach(function (c, i) { if (c.m && !c.f) { c.f = true; paint(i); } });
        ledM.textContent = '000';
        try { SO.audio && SO.audio.play('win'); } catch (e) { }
        if (level === 'b' && Date.now() - lastReward >= 60000) {
          lastReward = Date.now();
          try { SO.game && SO.game.addCash && SO.game.addCash(25, 'Minesweeper win'); } catch (e) { }
        }
      }
      function reveal(i) {
        const st = [i];
        while (st.length) {
          const k = st.pop(), c = cells[k];
          if (c.r || c.f) continue;
          if (c.m) { lose(k); return; }
          c.r = true; revealed++; paint(k);
          if (c.n === 0) nb(k, function (j) { if (!cells[j].r && !cells[j].f) st.push(j); });
          if (over) return;
        }
      }
      function checkWin() { if (!over && revealed === cells.length - mines) win(); }
      function act(i) {
        if (over) return;
        const c = cells[i];
        if (!started) { started = true; place(i); startTimer(); }
        if (c.r) {
          if (!c.n) return;
          let f = 0; nb(i, function (j) { if (cells[j].f) f++; });
          if (f !== c.n) return;
          nb(i, function (j) { if (!over && !cells[j].r && !cells[j].f) reveal(j); });
        } else reveal(i);
        checkWin();
      }
      function flag(i) {
        if (over) return;
        const c = cells[i];
        if (c.r) return;
        c.f = !c.f; flags += c.f ? 1 : -1; paint(i);
        ledM.textContent = led(mines - flags);
      }
      function idx(e) { const t = e.target; return t && t.dataset && t.dataset.i != null ? +t.dataset.i : (t && t.parentNode && t.parentNode.dataset && t.parentNode.dataset.i != null ? +t.parentNode.dataset.i : -1); }

      grid.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      grid.addEventListener('mousedown', function (e) {
        const i = idx(e); if (i < 0) return;
        if (e.button === 2) { flag(i); return; }
        if (e.button === 0 && !over) { down = true; setFace('o'); }
      });
      grid.addEventListener('mouseup', function (e) {
        if (e.button !== 0) return;
        if (down) { down = false; if (!over) setFace(''); }
        const i = idx(e); if (i >= 0) act(i);
      });
      document.addEventListener('mouseup', function up() {
        if (!w.el.isConnected) { document.removeEventListener('mouseup', up); return; }
        if (down) { down = false; if (!over) setFace(''); }
      });
      face.addEventListener('click', function () { newGame(); });
      function lvItem(k) { return { label: LV[k][3], check: level === k, fn: function () { newGame(k); } }; }
      SO.xpmenu.bar(mb, [{
        label: 'Game', items: function () {
          return [{ label: 'New', fn: function () { newGame(); } }, { sep: true }, lvItem('b'), lvItem('i'), lvItem('e'), { sep: true }, { label: 'Exit', fn: function () { w.close(); } }];
        }
      }]);
      newGame('b');
      return w;
    } catch (err) { console.error('minesweeper', err); }
  }

  SO.registerApp({ id: 'mines', name: 'Minesweeper', icon: 'mines', desktop: true, start: true, order: 30, open: open });
})();
