/* SCAM OS - Task Manager: running windows, fake processes, HEAT performance graph. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);
  const hist = [];

  function open() {
    let iv = null;
    const w = SO.wm.open({ id: 'taskmgr', title: 'Windows Task Manager', icon: 'taskmgr', w: 520, h: 460, minW: 400, minH: 320, onClose: () => clearInterval(iv) });
    if (!w.fresh) return w;
    let tab = 'Applications';
    w.body.innerHTML = '<div class="tabs" id="tm-tabs"></div><div class="grow col" style="padding:6px;min-height:0" id="tm-body"></div><div class="statusbar"><span id="tm-s1"></span><span id="tm-s2"></span></div>';
    const q = s => w.body.querySelector(s);
    function render() {
      const d = SO.save.d, tabs = q('#tm-tabs'); tabs.innerHTML = '';
      ['Applications', 'Processes', 'Performance'].forEach(t => { const e = document.createElement('div'); e.className = 'tab' + (t === tab ? ' on' : ''); e.textContent = t; e.onclick = () => { tab = t; render(); }; tabs.appendChild(e); });
      const b = q('#tm-body');
      if (tab === 'Applications') {
        b.innerHTML = '<div class="panel grow" id="tm-l"></div><div class="row" style="justify-content:flex-end"><button class="xp-btn" id="tm-end">End Task</button></div>';
        let sel = null; const l = q('#tm-l');
        const draw = () => { l.innerHTML = ''; SO.wm.list().forEach(x => { const r = document.createElement('div'); r.style.cssText = 'padding:2px 6px;cursor:default;' + (sel === x.id ? 'background:#0054e3;color:#fff' : ''); r.innerHTML = SO.iconImg(x.icon, 16) + ' ' + esc(x.title); r.onclick = () => { sel = x.id; draw(); }; l.appendChild(r); }); };
        draw(); q('#tm-end').onclick = () => { const x = SO.wm.get(sel); if (x) { x.close(); draw(); } };
      } else if (tab === 'Processes') {
        const procs = [['system.exe', 'SYSTEM', 1], ['scamcenter.exe', 'Scammer', 12], ['victimdb.exe', 'Scammer', 3], ['totallylegit.svc', 'SYSTEM', 2], ['microsoft_support_pls_trust.exe', 'Scammer', 6]];
        if (SO.game.owns('t_spoof')) procs.push(['callerid_spoof.exe', 'Scammer', 1]);
        if (SO.game.owns('t_voice')) procs.push(['voicechanger.exe', 'Scammer', 2]);
        if (d.bots) procs.push(['botnet_client.exe x' + d.bots, 'Scammer', d.bots]);
        b.innerHTML = '<div class="panel grow"><table class="grid"><thead><tr><th>Image Name</th><th>User</th><th>CPU</th></tr></thead><tbody>' + procs.map(p => '<tr><td>' + esc(p[0]) + '</td><td>' + p[1] + '</td><td>' + String(Math.min(99, p[2] + Math.floor(Math.random() * 3))).padStart(2, '0') + '</td></tr>').join('') + '</tbody></table></div>';
      } else {
        b.innerHTML = '<b id="tm-gt">Heat history</b><canvas id="tm-c" width="400" height="140" style="width:100%;height:140px;background:#000;border:2px inset #888"></canvas><div class="row"><div class="grow"><div class="meter"><b>Heat</b><div class="bar"><i style="width:' + d.heat + '%;--c:#e63232"></i></div><span class="val">' + Math.round(d.heat) + '</span></div></div></div>';
        drawGraph();
      }
      q('#tm-s1').textContent = 'Processes: ' + (SO.wm.list().length + 5); q('#tm-s2').textContent = 'Heat: ' + Math.round(d.heat) + '%';
    }
    function drawGraph() {
      const c = q('#tm-c'); if (!c) return; const x = c.getContext('2d');
      x.fillStyle = '#000'; x.fillRect(0, 0, 400, 140); x.strokeStyle = '#0a4a0a';
      for (let i = 0; i < 400; i += 20) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 140); x.stroke(); }
      for (let i = 0; i < 140; i += 20) { x.beginPath(); x.moveTo(0, i); x.lineTo(400, i); x.stroke(); }
      x.strokeStyle = '#3cff3c'; x.lineWidth = 2; x.beginPath();
      hist.slice(-100).forEach((v, i, a) => { const px = i * 4, py = 138 - v * 1.36; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
    }
    iv = setInterval(() => { hist.push(SO.save.d.heat); if (hist.length > 300) hist.shift(); if (tab === 'Performance') render(); else if (tab === 'Processes') render(); }, 1500);
    hist.push(SO.save.d.heat);
    render();
    return w;
  }
  SO.registerApp({ id: 'taskmgr', name: 'Task Manager', icon: 'taskmgr', desktop: true, start: true, order: 8, open });
})();
