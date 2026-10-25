/* SCAM OS - ScamMart: an app-store style shop (Microsoft Store / Play Store layout). Fictional items. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);
  const CATS = ['Tools', 'Leads', 'Cover', 'Upgrades'];
  const COLORS = { Tools: '#e63232', Leads: '#2fa84f', Cover: '#9b4dca', Upgrades: '#ff9f1a' };
  const CAT_ICON = { Tools: 'tools', Leads: 'crm', Cover: 'shield', Upgrades: 'computer' };
  let style = false;
  function css() {
    if (style) return; style = true;
    const s = document.createElement('style');
    s.textContent = '.st{display:flex;flex:1;min-height:0;background:#fff}.st-nav{width:172px;flex:none;background:linear-gradient(180deg,#3f6ad8 0,#274bb8 40%,#1d3da6);color:#fff;padding:8px 0;display:flex;flex-direction:column;overflow:auto;border-right:1px solid #0d2a7e}' +
      '.st-nav .brand{padding:2px 14px 10px;font-size:26px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #ffffff2b;margin-bottom:6px}.st-nav .ni{padding:3px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:19px;border-left:4px solid transparent;color:#e8efff}' +
      '.st-nav .ni:hover{background:#ffffff1f}.st-nav .ni.on{background:#ffffff2b;border-left-color:#ffd94a;color:#fff}.st-nav .sp{flex:1}.st-main{flex:1;display:flex;flex-direction:column;min-width:0}' +
      '.st-top{display:flex;gap:10px;align-items:center;padding:4px 8px;background:linear-gradient(#fdfdfb,#f4f4ee 45%,#e4e1d6);border-bottom:1px solid #aca899}.st-top .xp-input{flex:1}.st-top b{font-size:19px}' +
      '.st-body{flex:1;overflow:auto;padding:12px 14px;min-height:0;user-select:text}' +
      '.st-hero{display:flex;align-items:center;gap:16px;padding:14px 18px;background:#fff;border:1px solid #aca899;border-left:6px solid #2a6bff;cursor:pointer;margin-bottom:14px}' +
      '.st-hero h2{margin:2px 0 10px;font-size:32px;font-weight:normal;line-height:.9}.st-hero .big{width:84px;height:84px;flex:none;background:linear-gradient(#5b8bff,#2a5bd7);padding:12px;border:1px solid #274bb8}' +
      '.st-sec{display:flex;justify-content:space-between;align-items:baseline;margin:12px 0 6px}.st-sec h3{margin:0;font-size:22px;font-weight:normal;color:#0046d5}.st-sec a{color:#0054e3;cursor:pointer;text-decoration:underline;font-size:17px}' +
      '.st-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.st-tile{border:1px solid #aca899;background:#fff;padding:10px;cursor:pointer;display:flex;flex-direction:column;gap:4px}' +
      '.st-tile:hover{border-color:#316ac5;box-shadow:inset 0 0 0 1px #316ac5}.st-ic{width:56px;height:56px;padding:10px;background:#2a6bff;flex:none;align-self:flex-start}.st-ic img{width:100%;height:100%}' +
      '.st-tile b{font-weight:normal;font-size:19px;line-height:17px;min-height:34px}.st-sub{color:#666;font-size:15px}' +
      '.st-get{margin-top:auto;min-width:0;width:100%}' +
      '.st-rev{border-top:1px solid #e8e5da;padding:6px 0}.st-chip{display:inline-block;padding:0 7px;border:1px solid #aca899;background:linear-gradient(#fdfdfb,#ece9d8);font-size:15px;margin-right:4px;color:#333}';
    document.head.appendChild(s);
  }

  function open(args) {
    args = args || {};
    css();
    let unsub = null;
    const w = SO.wm.open({ id: 'shop', title: 'ScamMart - Store', icon: 'shop', w: 880, h: 600, minW: 640, minH: 420, onClose: () => unsub && unsub() });
    if (!w.fresh) { if (args.itemId && w.focusItem) w.focusItem(args.itemId); return w; }
    const G = SO.game; const body = w.body;
    let page = 'home', query = '', installing = null;
    body.innerHTML = '<div class="st"><div class="st-nav" id="st-nav"></div><div class="st-main"><div class="st-top"><input class="xp-input" id="st-q" placeholder="Search"><span id="st-cash"></span></div><div class="st-body" id="st-body"></div></div></div>';
    const q = s => body.querySelector(s);

    function opener(it) {
      if (it.cat === 'Tools') return ['Open Tools', 'tools'];
      if (it.cat === 'Leads') return ['Open Database', 'crm']; if (it.cat === 'Cover') return ['Task Manager', 'taskmgr'];
      return null;
    }
    function status(it) {
      const owned = !it.consumable && G.owns(it.id);
      if (owned) return { t: 'Installed', cls: '', dis: true };
      if (G.level() < it.level) return { t: 'Locked L' + it.level, cls: '', dis: true };
      return { t: it.price ? '$' + it.price : 'Free', cls: 'green', dis: false };
    }
    function tile(it) {
      const st = status(it), d = document.createElement('div'); d.className = 'st-tile';
      d.innerHTML = '<div class="st-ic" style="background:' + COLORS[it.cat] + '"><img src="' + SO.icon(it.icon || CAT_ICON[it.cat]) + '"></div><b>' + esc(it.name) + '</b><div class="st-sub">' + it.cat + (it.consumable ? ' - one-time' : '') + '</div>';
      const b = document.createElement('button'); b.className = 'xp-btn small st-get ' + st.cls; b.textContent = st.t; b.disabled = st.dis; b.setAttribute('data-get', it.id);
      d.appendChild(b); d.onclick = () => install(it);
      return d;
    }
    function grid(items) { const g = document.createElement('div'); g.className = 'st-row'; items.forEach(i => g.appendChild(tile(i))); return g; }
    function section(title, items, link) {
      const f = document.createDocumentFragment(), h = document.createElement('div'); h.className = 'st-sec';
      h.innerHTML = '<h3>' + title + '</h3>' + (link ? '<a>See all</a>' : ''); if (link) h.querySelector('a').onclick = () => { page = link; render(); };
      f.appendChild(h); f.appendChild(grid(items)); return f;
    }

    function install(it) {
      if (installing) return;
      if (!it.consumable && G.owns(it.id)) return;
      if (G.level() < it.level) { SO.notify('Not available yet', it.name + ' unlocks at Level ' + it.level + ' - you are Level ' + G.level() + '. Earn XP by answering calls.', 'warn', { sound: 'error' }); return; }
      installing = it.id; render();
      const b = q('button[data-get="' + it.id + '"]'); let p = 0;
      if (b) b.textContent = 'Installing 0%';
      const iv = setInterval(async () => {
        p += 8 + Math.random() * 10; if (b) b.textContent = 'Installing ' + Math.min(99, Math.round(p)) + '%';
        if (p >= 100) {
          clearInterval(iv);
          const err = await G.buy(it);
          installing = null;
          if (err) SO.notify('Purchase failed', err, 'error', { sound: 'error' });
          else SO.notify(it.consumable ? 'Delivered' : 'Installed', it.name + (it.consumable ? ' delivered.' : ' installed.'), 'cmd', { sound: 'win' });
          render();
        } else SO.audio.play('blip');
      }, 140);
    }

    function render() {
      q('#st-cash').innerHTML = 'Cash <b>' + G.fmt(SO.save.d.cash) + '</b> &bull; Level ' + G.level();
      const nav = q('#st-nav'); nav.innerHTML = '<div class="brand">' + SO.iconImg('shop', 28) + 'ScamMart</div>';
      const add = (id, label, icon) => { const n = document.createElement('div'); n.className = 'ni' + (page === id ? ' on' : ''); n.innerHTML = SO.iconImg(icon, 20) + label; n.onclick = () => { page = id; query = ''; q('#st-q').value = ''; render(); }; nav.appendChild(n); };
      add('home', 'Home', 'computer'); CATS.forEach(c => add(c, c, CAT_ICON[c]));
      nav.insertAdjacentHTML('beforeend', '<div class="sp"></div>'); add('library', 'My Library', 'folder');
      const b = q('#st-body'); b.innerHTML = '';
      if (query) {
        const ql = query.toLowerCase();
        const res = SO.data.SHOP.filter(i => (i.name + ' ' + i.desc + ' ' + i.cat).toLowerCase().includes(ql));
        b.innerHTML = '<div class="st-sec"><h3>Results for "' + esc(query) + '" (' + res.length + ')</h3></div>'; b.appendChild(res.length ? grid(res) : Object.assign(document.createElement('div'), { className: 'muted', textContent: 'Nothing found.' })); return;
      }
      if (page === 'home') {
        const shopItems = SO.data.SHOP;
        const feat = shopItems.filter(i => !G.owns(i.id) && G.level() >= i.level && i.price <= Math.max(SO.save.d.cash * 1.5, 150)).sort((a, c) => c.price - a.price)[0] || shopItems[0];
        const hero = document.createElement('div'); hero.className = 'st-hero'; hero.style.background = 'linear-gradient(90deg,' + (COLORS[feat.cat] || '#333') + ',#0b1a3a)';
        const fst = status(feat);
        hero.innerHTML = '<div class="big"><img src="' + SO.icon(feat.icon || CAT_ICON[feat.cat]) + '" style="width:100%;height:100%"></div><div><span class="st-chip" style="color:#000">FEATURED</span><h2>' + esc(feat.name) + '</h2><button class="xp-btn small green">' + (fst.dis ? fst.t : feat.price ? 'Buy - $' + feat.price : 'Get') + '</button></div>';
        hero.onclick = () => install(feat); b.appendChild(hero);
        const by = c => shopItems.filter(i => i.cat === c);
        b.appendChild(section('Tools', by('Tools').slice(0, 6), 'Tools'));
        b.appendChild(section('Leads', by('Leads'), 'Leads'));
        b.appendChild(section('Cover', by('Cover'), 'Cover'));
        b.appendChild(section('Upgrades', by('Upgrades'), 'Upgrades'));
      } else if (CATS.includes(page)) {
        b.innerHTML = '<div class="st-sec"><h3>' + page + '</h3></div>'; b.appendChild(grid(SO.data.SHOP.filter(i => i.cat === page)));
      } else if (page === 'library') {
        const own = SO.data.SHOP.filter(i => !i.consumable && G.owns(i.id));
        b.innerHTML = '<div class="st-sec"><h3>My Library (' + own.length + ')</h3></div>';
        if (!own.length) b.insertAdjacentHTML('beforeend', '<div class="muted">Nothing installed yet.</div>');
        own.forEach(it => { const r = document.createElement('div'); r.className = 'st-rev row'; const o = opener(it); r.innerHTML = '<div class="st-ic" style="width:40px;height:40px;padding:5px;background:' + (COLORS[it.cat] || '#333') + '"><img src="' + SO.icon(it.icon || CAT_ICON[it.cat]) + '"></div><div class="grow"><b>' + esc(it.name) + '</b><div class="st-sub">' + it.cat + '</div></div>'; if (o) { const bt = document.createElement('button'); bt.className = 'xp-btn small'; bt.textContent = o[0]; bt.onclick = () => SO.openApp(o[1]); r.appendChild(bt); } b.appendChild(r); });
      }
    }
    q('#st-q').oninput = e => { query = e.target.value.trim(); render(); };
    /* Deep-link: another app (e.g. the RemoteDesk nag) opens the shop pre-searched for an item.
       Nothing is bought automatically - the operator clicks the buy button themselves. */
    w.focusItem = id => { const it = SO.data.SHOP.find(x => x.id === id); if (it) { page = 'home'; query = it.name; q('#st-q').value = query; render(); } };
    unsub = G.sub(() => { if (SO.wm.get('shop') && !installing) render(); });
    render();
    if (args.itemId) w.focusItem(args.itemId);
    return w;
  }
  SO.registerApp({ id: 'shop', name: 'ScamMart', icon: 'shop', desktop: true, start: true, order: 4, open });
})();
