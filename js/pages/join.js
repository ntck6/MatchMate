/* Join a game: two-sided demo (Ha.Runner ↔ Khoa.Smash). URL: join.html?id=<matchId>
   State machine: idle → pending → approved | rejected   (Host approves)
                  idle → approved                         (Instant join) */
(function () {
  'use strict';
  const MM = window.MM, G = MM.G, $ = MM.$, $$ = MM.$$, t = MM.t, esc = MM.esc, icon = MM.icon;
  const HOST = MM.HOST, JOINER = MM.JOINER;

  const requested = MM.byId(MM.params.get('id'));
  const m0 = requested && MM.openSlots(requested) > 0 ? requested : MM.byId('m1');
  const saved = MM.joinStatus(m0.id);
  const j = { matchId: m0.id, mode: m0.joinMode, status: saved || 'idle', party: 0 };

  function match() { return MM.byId(j.matchId); }
  function setStatus(s) { j.status = s; MM.joinStatus(j.matchId, s === 'idle' ? null : s); }
  function emailLog(to, key) {
    const el = $('#email-log');
    el.innerHTML = icon('mail', 'icon-sm') + '<span>' + esc(t('join.email', { to: to, subject: t(key) })) + '</span>';
    if (G) G.from(el, { y: 8, opacity: 0, duration: .4, ease: 'power2.out' });
  }

  function render() {
    const m = match();
    const host = m.hostId === HOST.id ? HOST : { displayName: m.host, fullName: m.host, phone: '09•• ••• •••', initials: m.host.slice(0, 2).toUpperCase() };
    const lvl = JOINER.skill[m.sport];
    const inRange = lvl != null && lvl >= m.skillMin && lvl <= m.skillMax;
    const unlocked = j.status === 'approved';
    const maxParty = Math.min(2, Math.max(0, MM.openSlots(m) - 1));
    if (j.party > maxParty) j.party = maxParty;
    const filledNow = m.filled + (unlocked ? j.party + 1 : 0);

    const statusIcon = { idle: 'users', pending: 'hourglass', approved: 'check', rejected: 'x' }[j.status];
    const statusHTML = '<div class="status status-' + j.status + '">' + icon(statusIcon) + '<span>' + esc(t('join.status.' + j.status)) + '</span></div>';

    const s1 = j.status !== 'idle' ? 'is-done' : '';
    const s2 = j.status === 'pending' ? 'is-current' : j.status === 'approved' ? 'is-done' : j.status === 'rejected' ? 'is-fail' : '';
    const s3 = unlocked ? 'is-done' : '';
    const step = j.status === 'idle' ? 0 : j.status === 'pending' || j.status === 'rejected' ? 1 : 2;
    const timeline = '<ol class="timeline" aria-label="Progress" style="--tl:' + (step / 2) + '">' +
      '<li class="' + s1 + '"><span class="tl-dot">' + icon('check', 'icon-sm') + '</span>' + esc(t('join.step1')) + '</li>' +
      '<li class="' + s2 + '"><span class="tl-dot">' + icon(j.mode === 'auto' ? 'zap' : j.status === 'rejected' ? 'x' : j.status === 'approved' ? 'check' : 'hourglass', 'icon-sm') + '</span>' + esc(j.mode === 'auto' ? t('mode.auto') : t('join.step2')) + '</li>' +
      '<li class="' + s3 + '"><span class="tl-dot">' + icon('unlock', 'icon-sm') + '</span>' + esc(t('join.step3')) + '</li></ol>';

    const lvlHTML = lvl == null ? '' : '<p class="level-note ' + (inRange ? 'ok' : 'warn') + '">' + icon(inRange ? 'check' : 'alert', 'icon-sm') +
      '<span>' + esc(inRange ? t('join.levelOk', { lvl: MM.skillCode(m.sport, lvl) }) : t('join.levelWarn', { lvl: MM.skillCode(m.sport, lvl), range: MM.skillRange(m) })) + '</span></p>';

    const contact = '<div class="contact-card' + (unlocked ? ' is-unlocked' : '') + '">' +
      '<div class="contact-head"><span>' + esc(t('join.contact')) + '</span><span class="lock">' + icon(unlocked ? 'unlock' : 'lock', 'icon-sm') + esc(unlocked ? t('join.unlocked') : t('join.locked')) + '</span></div>' +
      '<div class="contact-row"><span class="avatar avatar-khoa" aria-hidden="true">' + esc(host.initials) + '</span><div class="contact-info">' +
        '<span class="contact-name">' + esc(host.displayName) + (unlocked ? ' · ' + esc(host.fullName) : '') + '</span>' +
        (unlocked ? '<span class="contact-phone">' + esc(host.phone) + '</span>'
          : '<span class="contact-phone"><span class="redacted" aria-hidden="true">0901 234 567</span><span class="sr-only">' + esc(t('join.locked')) + '</span></span>') +
      '</div></div>' +
      (unlocked ? '<div class="contact-actions">' +
        '<a class="btn btn-primary btn-sm" href="tel:' + esc(host.phone.replace(/\s/g, '')) + '">' + icon('phone', 'icon-sm') + esc(t('join.call')) + '</a>' +
        '<a class="btn btn-ghost btn-sm" href="feed.html?route=' + encodeURIComponent(m.id) + '">' + icon('nav', 'icon-sm') + esc(t('join.directions')) + '</a></div>' : '') +
      '</div>';

    let controls;
    if (j.status === 'idle') {
      controls = '<div class="party"><span class="label">' + esc(t('join.party')) + '</span><div class="party-ctrl">' +
        '<button type="button" class="icon-btn" data-action="party-dec" aria-label="' + esc(t('join.partyDec')) + '"' + (j.party <= 0 ? ' disabled' : '') + '>' + icon('minus') + '</button>' +
        '<span class="party-val" aria-live="polite">' + esc(j.party === 0 ? t('join.partyMe') : t('join.partyPlus', { n: j.party })) + '</span>' +
        '<button type="button" class="icon-btn" data-action="party-inc" aria-label="' + esc(t('join.partyInc')) + '"' + (j.party >= maxParty ? ' disabled' : '') + '>' + icon('plus') + '</button>' +
        '</div></div>' +
        '<button type="button" class="btn btn-primary btn-lg btn-block btn-shine" id="join-cta" data-action="join-primary">' + icon(j.mode === 'auto' ? 'zap' : 'shield') + esc(j.mode === 'auto' ? t('join.cta.auto') : t('join.cta.pending')) + '</button>';
    } else if (j.status === 'pending') {
      controls = '<button type="button" class="btn btn-ghost btn-block" data-action="join-cancel">' + icon('x') + esc(t('join.cta.cancel')) + '</button>';
    } else if (j.status === 'approved') {
      controls = '<button type="button" class="btn btn-danger-ghost btn-block" data-action="join-leave">' + esc(t('join.cta.leave')) + '</button>';
    } else {
      controls = '<a class="btn btn-primary btn-block" href="feed.html?sport=' + m.sport + '">' + icon('search') + esc(t('join.cta.similar')) + '</a>';
    }

    $('#join-player-body').innerHTML = statusHTML + MM.cardHTML(Object.assign({}, m, { filled: filledNow, joinMode: j.mode }), { noActions: true }) + lvlHTML + timeline + contact + controls;

    let inbox;
    if (j.mode === 'auto') inbox = '<p class="empty-sm">' + icon('zap', 'icon-sm') + '<span>' + esc(t('create.auto.desc')) + '</span></p>';
    else if (j.status === 'pending') {
      inbox = '<div class="req-card is-highlight" id="req-card">' +
        '<div class="req-who"><span class="avatar avatar-ha" aria-hidden="true">' + esc(JOINER.initials) + '</span>' +
        '<div><strong>' + esc(JOINER.displayName) + (j.party ? ' +' + j.party : '') + '</strong>' +
        '<p class="req-meta">' + esc(t('sport.' + m.sport)) + ' · ' + esc(lvl != null ? MM.skillCode(m.sport, lvl) : '—') + ' · ' + esc(t('join.inbox.played', { n: JOINER.gamesPlayed })) + '</p></div></div>' +
        '<div class="req-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="host-decline">' + icon('x', 'icon-sm') + esc(t('join.decline')) + '</button>' +
          '<button type="button" class="btn btn-primary btn-sm" data-action="host-accept">' + icon('check', 'icon-sm') + esc(t('join.accept')) + '</button>' +
        '</div></div>';
    } else inbox = '<p class="empty-sm">' + icon('mail', 'icon-sm') + '<span>' + esc(t('join.inbox.empty')) + '</span></p>';

    const names = ['Khoa.Smash', 'Minh.T', 'Bao.Ng', 'Quynh.L', 'An.P', 'Duc.H'];
    let roster = '';
    for (let i = 0; i < Math.min(m.filled, 6); i++) roster += '<li><span class="avatar" aria-hidden="true">' + esc(names[i].slice(0, 2).toUpperCase()) + '</span>' + esc(i === 0 ? host.displayName : names[i]) + '</li>';
    if (m.filled > 6) roster += '<li class="muted">+' + (m.filled - 6) + '</li>';
    if (unlocked) roster += '<li class="is-new" id="roster-me"><span class="avatar" aria-hidden="true">' + esc(JOINER.initials) + '</span>' + esc(JOINER.displayName) + (j.party ? ' +' + j.party : '') + '</li>';

    $('#join-host-body').innerHTML = '<h4 class="h3">' + icon('mail') + esc(t('join.inbox')) + '</h4>' +
      '<div class="inbox">' + inbox + '</div>' +
      '<div class="roster"><p class="roster-h">' + esc(t('join.roster')) + ' · <span class="tabular">' + filledNow + '/' + m.total + '</span></p><ul>' + roster + '</ul></div>';
  }

  /* ---------- transitions between states ---------- */
  function animateChange(from, to) {
    if (!G) return;
    G.from('.status', { y: -8, opacity: 0, duration: .4, ease: 'power3.out' });
    G.from('.timeline li.is-done .tl-dot, .timeline li.is-current .tl-dot, .timeline li.is-fail .tl-dot', { scale: .3, duration: .5, ease: 'back.out(3)', stagger: .08 });
    if (to === 'pending') {
      // a ghost of the request flies from the CTA to the host inbox
      const card = $('#req-card');
      if (card && lastCta) {
        const a = lastCta, b = card.getBoundingClientRect();
        G.from(card, { x: a.left - b.left, y: a.top - b.top, scale: .6, opacity: 0, duration: .75, ease: 'power3.inOut' });
      }
    }
    if (to === 'approved') {
      G.fromTo('.contact-card', { scale: .96 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .5)' });
      G.from('.contact-name, .contact-phone', { filter: 'blur(6px)', opacity: .3, duration: .6, ease: 'power2.out', stagger: .08 });
      G.from('.contact-head .lock .icon', { rotate: -25, scale: 1.4, duration: .6, ease: 'back.out(3)' });
      G.from('.contact-actions .btn', { y: 10, opacity: 0, stagger: .08, duration: .4, delay: .2, ease: 'power3.out' });
      G.from('#roster-me', { x: 30, opacity: 0, duration: .5, ease: 'back.out(1.6)', delay: .15 });
      MM.confetti($('.contact-card'));
    }
    if (to === 'rejected') G.fromTo('.status', { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1.2, .3)' });
    if (from === 'approved' && to === 'idle') G.from('.contact-card', { opacity: .4, duration: .4 });
  }

  let lastCta = null;
  function go(to) {
    const from = j.status;
    setStatus(to);
    render();
    animateChange(from, to);
  }

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const m = match();
    const maxParty = Math.min(2, Math.max(0, MM.openSlots(m) - 1));
    switch (el.dataset.action) {
      case 'party-inc': j.party = Math.min(maxParty, j.party + 1); render(); if (G) G.from('.party-val', { y: -8, opacity: 0, duration: .25 }); break;
      case 'party-dec': j.party = Math.max(0, j.party - 1); render(); if (G) G.from('.party-val', { y: 8, opacity: 0, duration: .25 }); break;
      case 'join-primary':
        lastCta = el.getBoundingClientRect();
        if (j.mode === 'auto') { go('approved'); emailLog(JOINER.displayName, 'join.email.ok'); MM.toast(t('hero.toast.approved'), 'check'); }
        else { go('pending'); emailLog(m.host, 'join.email.req'); MM.toast(t('hero.toast.pending'), 'hourglass'); }
        break;
      case 'join-cancel': go('idle'); $('#email-log').innerHTML = ''; break;
      case 'host-accept': go('approved'); emailLog(JOINER.displayName, 'join.email.ok'); MM.toast(t('hero.toast.approved'), 'check'); break;
      case 'host-decline': go('rejected'); emailLog(JOINER.displayName, 'join.email.no'); break;
      case 'join-leave': j.party = 0; go('idle'); MM.toast(t('join.toast.left'), 'reset'); $('#email-log').innerHTML = ''; break;
    }
  });

  $$('input[name="join-mode"]').forEach(function (r) {
    r.checked = r.value === j.mode;
    r.addEventListener('change', function () {
      j.mode = r.value; j.party = 0; setStatus('idle');
      $('#email-log').innerHTML = '';
      render();
      if (G) MM.staggerIn($$('#join-player-body > *, #join-host-body > *'), { stagger: .03, duration: .4 });
    });
  });
  $('#join-reset').addEventListener('click', function () {
    j.mode = match().joinMode; j.party = 0; setStatus('idle');
    $$('input[name="join-mode"]').forEach(function (r) { r.checked = r.value === j.mode; });
    $('#email-log').innerHTML = '';
    render();
    if (G) MM.staggerIn($$('#join-player-body > *, #join-host-body > *'), { stagger: .03, duration: .4 });
  });

  MM.onRender(function (why) {
    render();
    if (why === 'init' && G) {
      G.from('.join-player', { x: -40, opacity: 0, duration: .8, ease: 'expo.out', delay: .25, clearProps: 'transform,opacity' });
      G.from('.join-host', { x: 40, opacity: 0, duration: .8, ease: 'expo.out', delay: .35, clearProps: 'transform,opacity' });
    }
  });
  MM.ready();
})();
