/* Who it's for: personas + shared skill scales. */
(function () {
  'use strict';
  const MM = window.MM, G = MM.G, D = MM.D, $ = MM.$, $$ = MM.$$, t = MM.t, esc = MM.esc, icon = MM.icon, pick = MM.pick;

  function personaHTML(p, kind) {
    const isHost = kind === 'host';
    const years = MM.I.lang === 'vi' ? 'tuổi' : 'years old';
    const levels = Object.keys(p.skill).map(function (sport) {
      return '<span class="tag tag-' + sport + '">' + esc(t('sport.' + sport)) + ' · ' + esc(MM.skillCode(sport, p.skill[sport])) + '</span>';
    }).join('');
    const stats = isHost
      ? [[p.gamesPlayed, t('persona.stats.games')], [p.hosted, t('persona.stats.hosted')], [p.age, years]]
      : [[p.gamesPlayed, t('persona.stats.games')], [p.radiusKm, t('persona.stats.radius')], [p.age, years]];
    return '<article class="persona persona-' + kind + ' reveal">' +
      '<div class="persona-top"><span class="avatar avatar-lg" aria-hidden="true">' + esc(p.initials) + '</span>' +
        '<div><h2 class="persona-name">' + esc(p.displayName) + '</h2><p class="persona-sub">' + esc(p.fullName) + ' · ' + esc(pick(p.job)) + '</p></div>' +
        '<span class="tag persona-role">' + esc(isHost ? t('persona.host') : t('persona.joiner')) + '</span></div>' +
      '<div class="persona-body">' +
        '<p class="persona-quote">' + esc(pick(p.quote)) + '</p>' +
        '<div class="persona-stats">' + stats.map(function (s) { return '<div><strong data-count>' + esc(s[0]) + '</strong><span>' + esc(s[1]) + '</span></div>'; }).join('') + '</div>' +
        '<p class="persona-levels">' + esc(t('persona.levels')) + ': ' + levels + ' · ' + icon('pin', 'icon-sm') + esc(pick(p.area)) + '</p>' +
        '<div class="persona-cols">' +
          '<div class="goals"><h3>' + esc(t('persona.goals')) + '</h3><ul>' + pick(p.goals).map(function (g) { return '<li>' + icon('check', 'icon-sm') + '<span>' + esc(g) + '</span></li>'; }).join('') + '</ul></div>' +
          '<div class="pains"><h3>' + esc(t('persona.pains')) + '</h3><ul>' + pick(p.pains).map(function (g) { return '<li>' + icon('x', 'icon-sm') + '<span>' + esc(g) + '</span></li>'; }).join('') + '</ul></div>' +
        '</div></div></article>';
  }

  function renderLadders() {
    ['football', 'badminton'].forEach(function (sport) {
      const scale = D.SKILLS[sport];
      $('#ladder-' + sport).innerHTML = scale.map(function (s, i) {
        const k = i / (scale.length - 1);
        const bg = sport === 'football'
          ? 'hsl(150 ' + (55 + k * 20) + '% ' + (52 - k * 34) + '%)'
          : 'hsl(' + (32 - k * 14) + ' ' + (85 + k * 5) + '% ' + (52 - k * 30) + '%)';
        return '<li style="--w:' + (0.3 + 0.7 * k) + '"><span class="code" style="background:' + bg + '">' + esc(s.code) + '</span>' +
          '<span class="name">' + esc(s.vi) + (MM.I.lang === 'en' ? '<small>' + esc(s.en) + '</small>' : '') + '</span>' +
          '<span class="ladder-bar" aria-hidden="true"><i style="background:' + bg + '"></i></span></li>';
      }).join('');
    });
  }

  function ladderMotion() {
    if (!G || !window.ScrollTrigger) return;
    $$('.ladder').forEach(function (ladder) {
      G.from($$('.ladder-bar i', ladder), { scaleX: 0, duration: .8, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: ladder, start: 'top 80%', once: true } });
      G.from($$('.code', ladder), { x: -12, opacity: 0, duration: .4, stagger: .05, ease: 'power2.out', scrollTrigger: { trigger: ladder, start: 'top 80%', once: true } });
    });
  }

  // Cards lean toward the pointer
  function tiltCards() {
    if (!G || !window.matchMedia('(pointer: fine)').matches) return;
    $$('.persona').forEach(function (card) {
      const rx = G.quickTo(card, 'rotationX', { duration: .6, ease: 'power3.out' });
      const ry = G.quickTo(card, 'rotationY', { duration: .6, ease: 'power3.out' });
      card.addEventListener('pointermove', function (e) {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 6);
        rx(-((e.clientY - r.top) / r.height - .5) * 6);
      });
      card.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  MM.onRender(function (why) {
    $('#persona-grid').innerHTML = personaHTML(MM.HOST, 'host') + personaHTML(MM.JOINER, 'joiner');
    renderLadders();
    if (why === 'lang') { $$('#persona-grid .reveal').forEach(function (e) { e.classList.add('is-visible'); }); tiltCards(); }
  });
  MM.ready();
  ladderMotion();
  tiltCards();
})();
