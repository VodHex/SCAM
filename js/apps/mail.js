/* SCAM OS - Mail: boss messages, daily quota reports, tutorial. */
(function () {
  const SO = window.SO, esc = s => SO.esc(s);

  function open() {
    let unsub = null;
    const w = SO.wm.open({ id: 'mail', title: 'Mail - Inbox', icon: 'mail', w: 720, h: 460, minW: 480, minH: 300, onClose: () => unsub && unsub() });
    if (!w.fresh) return w;
    let sel = null;
    w.body.innerHTML = '<div class="toolbar"><button class="xp-btn small" id="ml-del">Delete</button><button class="xp-btn small" id="ml-all">Mark all read</button></div><div class="row grow" style="align-items:stretch;gap:0;min-height:0"><div class="col" style="width:290px;flex:none;min-height:0"><table class="grid"><thead><tr><th style="width:42%">From</th><th>Subject</th></tr></thead></table><div class="panel grow" id="ml-list" style="border-top:none"></div></div><div class="grow scroll selectable col" id="ml-body" style="padding:12px 14px;background:#fff;border-left:1px solid #aca899;user-select:text;gap:6px;align-items:flex-start"></div></div><div class="statusbar"><span id="ml-sb"></span></div>';
    const q = s => w.body.querySelector(s);
    function render() {
      const mails = SO.save.d.mail;
      if (!mails.find(m => m.id === sel)) sel = mails[0] && mails[0].id;
      const list = q('#ml-list'); list.innerHTML = '';
      mails.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'display:flex;align-items:center;gap:6px;padding:2px 7px;cursor:pointer;border-bottom:1px solid #f0eee6;white-space:nowrap;' + (m.id === sel ? 'background:#316ac5;color:#fff;' : '');
        r.innerHTML = '<span style="display:inline-block;width:7px;height:7px;flex:none;background:' + (m.read ? 'transparent' : (m.id === sel ? '#fff' : '#0054e3')) + '"></span>' +
          '<span style="width:38%;flex:none;overflow:hidden;text-overflow:ellipsis;' + (m.read ? '' : 'font-weight:bold;') + '">' + esc(m.from) + '</span>' +
          '<span class="grow" style="overflow:hidden;text-overflow:ellipsis' + (m.read ? '' : ';font-weight:bold') + '">' + esc(m.subject) + '</span>';
        r.onclick = () => { sel = m.id; m.read = true; SO.save.save(); SO.game.emit(); SO.os.refreshIcons(); render(); };
        list.appendChild(r);
      });
      const m = mails.find(x => x.id === sel);
      q('#ml-body').innerHTML = m ? '<h3 class="sec" style="align-self:stretch;margin:0 0 2px">' + esc(m.subject) + '</h3><div class="muted" style="font-size:16px">From: <b>' + esc(m.from) + '</b></div><div class="muted" style="font-size:16px">Sent: ' + new Date(m.t).toLocaleString() + '</div><div class="hr" style="align-self:stretch"></div><div class="selectable" style="white-space:pre-wrap;user-select:text;align-self:stretch">' + esc(m.body) + '</div>' : '<div class="muted">No mail.</div>';
      q('#ml-sb').textContent = mails.length + ' message(s), ' + mails.filter(x => !x.read).length + ' unread';
    }
    q('#ml-del').onclick = () => { SO.save.d.mail = SO.save.d.mail.filter(m => m.id !== sel); SO.save.save(); SO.os.refreshIcons(); render(); };
    q('#ml-all').onclick = () => { SO.save.d.mail.forEach(m => m.read = true); SO.save.save(); SO.os.refreshIcons(); render(); };
    unsub = SO.game.sub(() => { if (SO.wm.get('mail')) render(); });
    // opening marks the first mail as read after a moment
    render();
    return w;
  }
  SO.registerApp({ id: 'mail', name: 'Mail', icon: 'mail', desktop: true, start: true, order: 3, badge: () => (SO.game ? SO.game.unreadMail() : 0), open });
})();
