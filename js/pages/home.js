/* Home: hero showcase, how-it-works, explore cards, live games. */
(function () {
  'use strict';
  const MM = window.MM, G = MM.G, $ = MM.$, $$ = MM.$$;

  function render() {
    const top = MM.suggestions(null, 3);
    $('#hero-cards').innerHTML = top.map(function (x) { return MM.cardHTML(x.m, { score: x.s.score, noActions: true }); }).join('');
    $('#home-live').innerHTML = top.map(function (x) { return MM.cardHTML(x.m, { score: x.s.score, reasons: x.s.reasons }); }).join('');
  }
  MM.onRender(function (why) { render(); if (why === 'lang') MM.staggerIn($$('#home-live .mcard')); });

  function heroIntro() {
    if (!G) return;
    const tl = G.timeline({ defaults: { ease: 'power3.out' }, delay: .15 });
    tl.from('.browser', { y: 60, rotateX: 14, opacity: 0, duration: 1, ease: 'expo.out' })
      .from('.block-lime', { scale: .6, rotate: -20, opacity: 0, duration: .9, ease: 'back.out(1.4)' }, '<.1')
      .from('.block-orange', { scale: .4, rotate: 30, opacity: 0, duration: .8, ease: 'back.out(1.6)' }, '<.1')
      .from('#hero-cards .mcard', { y: 24, opacity: 0, stagger: .1, duration: .55 }, '-=.55')
      .from('.bm-pin', { y: -40, opacity: 0, stagger: .09, duration: .7, ease: 'bounce.out' }, '-=.5')
      .from('.bm-home', { scale: 0, duration: .5, ease: 'back.out(2)' }, '-=.3')
      .from('.ft-1', { x: -30, scale: .8, opacity: 0, duration: .6, ease: 'back.out(1.8)' }, '-=.2')
      .from('.ft-2', { x: 30, scale: .8, opacity: 0, duration: .6, ease: 'back.out(1.8)' }, '+=.5')
      .add(function () { document.querySelector('.hero .hl').classList.add('is-drawn'); }, .9);
    // gentle idle float once the entrance settles
    tl.add(function () {
      G.to('.ft-1', { y: -10, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      G.to('.ft-2', { y: -12, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: .6 });
      G.to('.bm-home', { boxShadow: '0 0 0 44px rgba(37,99,235,.06)', duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
  }

  // 3D tilt following the pointer (pointer devices only)
  function heroTilt() {
    const zone = $('.hero'), tilt = $('#hero-tilt');
    if (!G || !window.matchMedia('(pointer: fine)').matches) return;
    const rx = G.quickTo(tilt, 'rotationX', { duration: .8, ease: 'power3.out' });
    const ry = G.quickTo(tilt, 'rotationY', { duration: .8, ease: 'power3.out' });
    zone.addEventListener('pointermove', function (e) {
      const r = zone.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 10);
      rx(-((e.clientY - r.top) / r.height - .5) * 8);
    });
    zone.addEventListener('pointerleave', function () { rx(0); ry(0); });
    // orbs drift slightly with scroll
    G.to('.hero .orb-1', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero .orb-2', { yPercent: -30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // How-it-works connector fills as you scroll through it
  function howLine() {
    if (!G || !window.ScrollTrigger) { $('#how-fill').style.transform = 'scaleX(1)'; return; }
    G.fromTo('#how-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.how-track', start: 'top 75%', end: 'bottom 55%', scrub: .6 } });
    $$('.how-icon').forEach(function (el, i) {
      G.from(el, { scale: .4, rotate: -25, duration: .7, ease: 'back.out(2)', scrollTrigger: { trigger: el, start: 'top 85%', once: true }, delay: i * .08 });
    });
  }

  // Spotlight that follows the cursor across explore cards
  function spotlight() {
    $$('.feature').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  MM.ready(); // runs render() via onRender('init')
  heroIntro();
  heroTilt();
  howLine();
  spotlight();
})();
