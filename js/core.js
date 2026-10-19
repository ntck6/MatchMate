/* MatchMate — shared runtime for every page.
   Helpers, match card, MATCH-A scoring, cross-page store, theme + language,
   header behaviour and the motion system (GSAP + View Transitions). */
window.MM = (function () {
  'use strict';

  const I = window.MM_I18N;
  const D = window.MM_DATA;
  const t = I.t;
  const pick = I.pick;
  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = !reduce && window.gsap ? window.gsap : null;
  if (G && window.ScrollTrigger) G.registerPlugin(window.ScrollTrigger);

  const HOST = D.PERSONAS.host;
  const JOINER = D.PERSONAS.joiner;
  const params = new URLSearchParams(location.search);

  /* ---------------- basic helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(id, cls) { return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function store(area, key, val) {
    try {
      const s = area === 'session' ? window.sessionStorage : window.localStorage;
      if (val === undefined) return s.getItem(key);
      if (val === null) s.removeItem(key); else s.setItem(key, val);
    } catch (e) { /* private mode / blocked */ }
    return null;
  }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function fmtDay(d) {
    const now = new Date(), tmr = new Date();
    tmr.setDate(now.getDate() + 1);
    if (sameDay(d, now)) return t('day.today');
    if (sameDay(d, tmr)) return t('day.tomorrow');
    return new Intl.DateTimeFormat(I.locale, { weekday: 'short', day: 'numeric', month: 'numeric' }).format(d);
  }
  function fmtTime(d) { return new Intl.DateTimeFormat(I.locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d); }
  function fmtWhen(m) { return fmtDay(m.start) + ' · ' + fmtTime(m.start) + '–' + fmtTime(m.end); }
  function fmtVnd(n) { return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'; }
  function fmtCost(m) {
    if (!m.cost) return '<span class="mcard-cost">' + esc(t('card.free')) + '</span>';
    return '<span class="mcard-cost">' + fmtVnd(m.cost) + ' <small>' + esc(m.costUnit === 'total' ? t('card.total') : t('card.perPerson')) + '</small></span>';
  }
  function skillCode(sport, idx) { return D.SKILLS[sport][idx].code; }
  function skillRange(m) { return m.skillMin === m.skillMax ? skillCode(m.sport, m.skillMin) : skillCode(m.sport, m.skillMin) + ' – ' + skillCode(m.sport, m.skillMax); }
  function formatName(sport, id) { const f = D.FORMATS[sport].filter(function (x) { return x.id === id; })[0]; return f ? pick(f) : ''; }
  function openSlots(m) { return Math.max(0, m.total - m.filled); }
  function km(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function blockOf(h) { return h < 11 ? 'morning' : h < 14 ? 'noon' : h < 17 ? 'afternoon' : 'evening'; }
  function titleOf(m) { return typeof m.title === 'string' ? m.title : pick(m.title); }

  /* ---------------- cross-page store ---------------- */
  // Matches published on create.html persist so feed/join pages can show them.
  function loadCreated() {
    try {
      return JSON.parse(store('local', 'mm-created') || '[]').map(function (m) {
        return Object.assign(m, { start: new Date(m.start), end: new Date(m.end) });
      }).filter(function (m) { return m.end > new Date(); });
    } catch (e) { return []; }
  }
  let MATCHES = D.buildMatches().concat(loadCreated());
  function matches() { return MATCHES; }
  function byId(id) { return MATCHES.filter(function (m) { return m.id === id; })[0]; }
  function addCreated(m) {
    MATCHES.push(m);
    const list = loadCreated();
    list.push(m);
    store('local', 'mm-created', JSON.stringify(list));
  }
  // Ha.Runner's join status per match, kept for the browser session.
  function joinStatus(id, val) {
    let map = {};
    try { map = JSON.parse(store('session', 'mm-join') || '{}'); } catch (e) { map = {}; }
    if (val === undefined) return map[id] || null;
    if (val) map[id] = val; else delete map[id];
    store('session', 'mm-join', JSON.stringify(map));
    return val;
  }

  /* ---------------- MATCH-A (rule-based ranking) ---------------- */
  function scoreFor(m, p) {
    const lvl = p.skill[m.sport];
    const eligible = lvl != null && openSlots(m) > 0 && m.start > new Date() && m.hostId !== p.id;
    if (!eligible) return { eligible: false, score: 0, reasons: [] };
    const scaleMax = D.SKILLS[m.sport].length - 1;
    const inRange = lvl >= m.skillMin && lvl <= m.skillMax;
    const gap = inRange ? 0 : Math.min(Math.abs(lvl - m.skillMin), Math.abs(lvl - m.skillMax));
    const sSkill = inRange ? 1 : Math.max(0, 1 - (gap / scaleMax) * 3);
    const dist = km(p.home, m);
    const sDist = Math.max(0, 1 - dist / (p.radiusKm * 2));
    const free = (p.availability[m.start.getDay()] || []).indexOf(blockOf(m.start.getHours())) !== -1;
    const open = openSlots(m);
    const sUrg = open <= 2 ? 1 : open <= 4 ? 0.6 : 0.3;
    const score = Math.round((0.4 * sSkill + 0.3 * sDist + 0.2 * (free ? 1 : 0) + 0.1 * sUrg) * 100);
    const reasons = [];
    if (inRange) reasons.push(t('reason.level'));
    reasons.push(t('reason.km', { km: dist.toFixed(1) }));
    if (free) reasons.push(t('reason.free'));
    if (open <= 3) reasons.push(t('reason.slots', { n: open }));
    return { eligible: true, score: score, reasons: reasons, dist: dist };
  }
  function suggestions(list, n) {
    return (list || MATCHES)
      .map(function (m) { return { m: m, s: scoreFor(m, JOINER) }; })
      .filter(function (x) { return x.s.eligible; })
      .sort(function (a, b) { return b.s.score - a.s.score; })
      .slice(0, n || 3);
  }

  /* ---------------- match card ---------------- */
  function cardHTML(m, opts) {
    opts = opts || {};
    const open = openSlots(m), full = open === 0;
    const pct = Math.round((m.filled / m.total) * 100);
    const you = joinStatus(m.id);
    const sportTag = '<span class="tag tag-' + m.sport + '">' + icon(m.sport === 'badminton' ? 'shuttle' : 'ball', 'icon-sm') + esc(t('sport.' + m.sport)) + ' · ' + esc(formatName(m.sport, m.format)) + '</span>';
    const modeTag = m.joinMode === 'auto'
      ? '<span class="tag tag-auto">' + icon('zap', 'icon-sm') + esc(t('mode.auto')) + '</span>'
      : '<span class="tag tag-pending">' + icon('shield', 'icon-sm') + esc(t('mode.pending')) + '</span>';
    const youTag = you === 'pending' ? '<span class="tag tag-pending">' + icon('hourglass', 'icon-sm') + esc(t('card.you.pending')) + '</span>'
      : you === 'approved' ? '<span class="tag tag-you">' + icon('check', 'icon-sm') + esc(t('card.you.approved')) + '</span>' : '';
    const newTag = m.isNew ? '<span class="tag tag-new">NEW</span>' : '';
    const scoreTag = opts.score != null ? '<span class="tag tag-score">' + esc(t('card.match', { n: opts.score })) + '</span>' : '';
    const reasons = opts.reasons && opts.reasons.length
      ? '<div class="mcard-reasons">' + opts.reasons.map(function (r) { return '<span class="tag tag-reason">' + esc(r) + '</span>'; }).join('') + '</div>' : '';
    const mapBtn = opts.mapButton
      ? '<button type="button" class="btn btn-ghost btn-sm" data-action="show-map" data-id="' + m.id + '">' + icon('pin', 'icon-sm') + '<span>' + esc(t('card.showMap')) + '</span></button>'
      : '<a class="btn btn-ghost btn-sm" href="feed.html?focus=' + encodeURIComponent(m.id) + '">' + icon('pin', 'icon-sm') + '<span>' + esc(t('card.showMap')) + '</span></a>';
    const joinBtn = full
      ? '<span class="btn btn-primary btn-sm" aria-disabled="true">' + esc(t('card.full')) + '</span>'
      : '<a class="btn btn-primary btn-sm" href="join.html?id=' + encodeURIComponent(m.id) + '"><span>' + esc(t('card.join')) + '</span>' + icon('arrow', 'icon-sm') + '</a>';
    const actions = opts.noActions ? '' : '<div class="mcard-actions">' + mapBtn + joinBtn + '</div>';

    return '<article class="mcard' + (full ? ' is-full' : '') + (opts.selected ? ' is-selected' : '') + '" data-card="' + esc(m.id) + '">' +
      '<div class="mcard-top">' + sportTag + modeTag + youTag + newTag + scoreTag + '</div>' +
      '<h3 class="mcard-title">' + esc(titleOf(m)) + '</h3>' +
      reasons +
      '<ul class="mcard-meta">' +
        '<li>' + icon('calendar', 'icon-sm') + '<span><strong>' + esc(fmtWhen(m)) + '</strong></span></li>' +
        '<li>' + icon('pin', 'icon-sm') + '<span>' + esc(m.venue) + (m.address ? ' · ' + esc(m.address) : '') + '</span></li>' +
        '<li>' + icon('bar', 'icon-sm') + '<span>' + esc(skillRange(m)) + '</span></li>' +
      '</ul>' +
      '<div class="mcard-row">' +
        '<div class="slots"><div class="slots-label"><span>' + esc(t('card.slots', { filled: m.filled, total: m.total })) + '</span><span class="open">' + esc(full ? t('card.full') : t('card.open', { n: open })) + '</span></div>' +
        '<div class="slots-bar" role="presentation"><i style="--p:' + (pct / 100) + '"></i></div></div>' +
        fmtCost(m) +
      '</div>' +
      '<p class="mcard-host">' + icon('users', 'icon-sm') + esc(t('card.hostBy', { name: m.host })) + '</p>' +
      actions + '</article>';
  }

  /* ---------------- maps ---------------- */
  const TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  function pinIcon(m, opts) {
    opts = opts || {};
    const full = openSlots(m) === 0;
    const badge = full || opts.noBadge ? '' : '<span class="pin-badge">' + openSlots(m) + '</span>';
    return window.L.divIcon({
      className: 'pin-wrap' + (opts.drop ? ' is-drop' : ''),
      html: '<span class="pin pin-' + m.sport + (full ? ' is-full' : '') + (opts.active ? ' is-active' : '') + '" style="--d:' + (opts.delay || 0) + 'ms">' +
            '<svg aria-hidden="true"><use href="#i-' + (opts.glyph || (m.sport === 'badminton' ? 'shuttle' : 'ball')) + '"/></svg>' + badge + '</span>',
      iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -38]
    });
  }
  function createMap(target, center, zoom) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    const map = window.L.map(el, { scrollWheelZoom: false }).setView(center, zoom);
    window.L.tileLayer(TILE, { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    // Leaflet only measures on init; re-measure whenever the layout resizes.
    if ('ResizeObserver' in window) {
      let raf = 0;
      new ResizeObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { map.invalidateSize(); }); }).observe(el);
    }
    return map;
  }

  /* ---------------- toast ---------------- */
  function toast(msg, iconId) {
    const region = $('#toasts');
    if (!region) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span class="toast-icon">' + icon(iconId || 'check') + '</span><span>' + esc(msg) + '</span>';
    region.appendChild(el);
    if (G) G.from(el, { y: 24, opacity: 0, scale: .96, duration: .45, ease: 'back.out(1.6)' });
    setTimeout(function () {
      if (G) G.to(el, { y: 10, opacity: 0, duration: .22, ease: 'power2.in', onComplete: function () { el.remove(); } });
      else el.remove();
    }, 3600);
  }

  /* ---------------- motion system ---------------- */
  // Split a short headline into words (keeps Vietnamese diacritics intact).
  function splitWords(el) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = '1';
    const out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function walk(node) {
      if (node.nodeType === 3) {
        const parts = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = p;
          w.appendChild(i); frag.appendChild(w); out.push(i);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        Array.prototype.slice.call(node.childNodes).forEach(walk);
      }
    });
    return out;
  }
  function revealHeadline(el, delay) {
    if (!G || !el) return;
    const words = splitWords(el);
    G.from(words, { yPercent: 110, rotate: 4, opacity: 0, duration: .8, ease: 'expo.out', stagger: .055, delay: delay || 0 });
  }
  function countUp(el) {
    const raw = el.textContent;
    const m = raw.match(/\d+/);
    if (!G || !m) return;
    const target = +m[0], obj = { v: 0 };
    G.to(obj, { v: target, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: function () { el.textContent = raw.replace(/\d+/, Math.round(obj.v)); } });
  }
  function bindReveals(root) {
    const els = $$('.reveal:not(.is-visible)', root);
    if (!G || !window.ScrollTrigger) { els.forEach(function (e) { e.classList.add('is-visible'); }); return; }
    // ScrollTrigger decides *when*; a CSS transition does the motion (staggered via delay),
    // so reveals finish even if animation frames are throttled.
    window.ScrollTrigger.batch(els, {
      start: 'top 88%', once: true,
      onEnter: function (batch) {
        batch.forEach(function (b, i) {
          b.style.transitionDelay = (i * 80) + 'ms';
          b.classList.add('is-visible');
          setTimeout(function () { b.style.transitionDelay = ''; }, 800 + i * 80); // keep later hover transitions snappy
        });
      }
    });
  }
  // Stagger a set of freshly rendered cards in.
  function staggerIn(els, opts) {
    if (!G || !els.length) return;
    G.fromTo(els, { opacity: 0, y: 22, scale: .98 }, Object.assign({ opacity: 1, y: 0, scale: 1, duration: .55, ease: 'power3.out', stagger: .06, clearProps: 'transform,opacity' }, opts || {}));
  }
  function pageIntro() {
    const head = $('.page-head, .hero-copy');
    if (!G) return;
    const h1 = $('h1', head || document);
    if (h1) revealHeadline(h1, .05);
    const bits = $$('[data-intro]');
    if (bits.length) G.from(bits, { opacity: 0, y: 18, duration: .7, ease: 'power3.out', stagger: .07, delay: .2, clearProps: 'transform,opacity' });
  }

  // Header: shrink on scroll, reading progress, sliding nav indicator.
  function headerFX() {
    const header = $('.site-header');
    const bar = $('.scroll-progress i');
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        const y = window.scrollY;
        header.classList.toggle('is-scrolled', y > 8);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const nav = $('#main-nav'), ind = $('.nav-indicator', nav);
    function moveTo(a, instant) {
      if (!a) { ind.style.opacity = '0'; return; }
      const nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
      ind.style.opacity = '1';
      ind.style.width = r.width + 'px';
      ind.style.transform = 'translateX(' + (r.left - nr.left + nav.scrollLeft) + 'px)';
      ind.classList.toggle('no-anim', !!instant);
    }
    const current = $('a[aria-current="page"]', nav);
    requestAnimationFrame(function () { moveTo(current, true); });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveTo(a); });
      a.addEventListener('focus', function () { moveTo(a); });
    });
    nav.addEventListener('mouseleave', function () { moveTo(current); });
    window.addEventListener('resize', function () { moveTo(current, true); });
    document.fonts && document.fonts.ready.then(function () { moveTo(current, true); });
  }

  // Page transitions: CSS cross-document View Transitions where supported,
  // otherwise a short JS fade-out before navigating (exit faster than enter).
  function pageTransitions() {
    const nativeVT = 'onpagereveal' in window;
    if (nativeVT || reduce) return;
    document.addEventListener('click', function (e) {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || !/\.html$|\/$/.test(url.pathname)) return;
      e.preventDefault();
      document.documentElement.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 200);
    });
    window.addEventListener('pageshow', function () { document.documentElement.classList.remove('is-leaving'); });
  }

  // Magnetic pull on primary hero CTAs (pointer only).
  function magnetic(els) {
    if (!G || !window.matchMedia('(pointer: fine)').matches) return;
    els.forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        const r = el.getBoundingClientRect();
        G.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', function () { G.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1, .4)' }); });
    });
  }

  // Confetti burst for "published" / "you're in" moments.
  function confetti(originEl) {
    if (reduce) return;
    const c = document.createElement('canvas');
    c.className = 'confetti';
    document.body.appendChild(c);
    const dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
    const r = originEl ? originEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    const colors = ['#C8F031', '#0E7A45', '#EA580C', '#34C77B', '#FBBF24'];
    const parts = [];
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 7;
      parts.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[i % colors.length], life: 0 });
    }
    let frame = 0;
    (function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(function (p) {
        p.vy += .22; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - p.life / 90);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (++frame < 95) requestAnimationFrame(tick); else c.remove();
    })();
  }

  /* ---------------- theme ---------------- */
  function isDark() {
    const set = document.documentElement.getAttribute('data-theme');
    if (set) return set === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function syncThemeBtn() { const b = $('#theme-toggle'); if (b) b.setAttribute('aria-pressed', String(isDark())); }
  function toggleTheme(btn) {
    const next = isDark() ? 'light' : 'dark';
    const apply = function () {
      document.documentElement.setAttribute('data-theme', next);
      store('local', 'mm-theme', next);
      syncThemeBtn();
    };
    // Circular reveal from the toggle button (same-document View Transition).
    if (document.startViewTransition && !reduce) {
      const r = btn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.documentElement.classList.add('theme-vt');
      const vt = document.startViewTransition(apply);
      vt.ready.then(function () {
        document.documentElement.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () {});
      vt.finished.finally(function () { document.documentElement.classList.remove('theme-vt'); });
    } else apply();
    toast(t(next === 'dark' ? 'theme.dark' : 'theme.light'), next === 'dark' ? 'moon' : 'sun');
  }

  /* ---------------- language ---------------- */
  const renderers = [];
  function onRender(fn) { renderers.push(fn); }
  function setLang(lang) {
    I.lang = lang;
    store('local', 'mm-lang', lang);
    $$('.lang-switch button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    I.apply();
    renderers.forEach(function (fn) { fn('lang'); });
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    const cur = $('#main-nav a[aria-current="page"]');
    if (cur) cur.dispatchEvent(new Event('mouseenter'));
    $('#main-nav').dispatchEvent(new Event('mouseleave'));
  }

  /* ---------------- boot ---------------- */
  function boot() {
    document.documentElement.classList.add('js');
    if (G) document.documentElement.classList.add('motion');
    window.MM_LAYOUT.footer();
    I.apply();
    $$('.lang-switch button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
    const tb = $('#theme-toggle');
    tb.addEventListener('click', function () { toggleTheme(tb); });
    syncThemeBtn();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeBtn);
    headerFX();
    pageTransitions();
  }
  // Called by each page module after it has rendered its content.
  function ready() {
    renderers.forEach(function (fn) { fn('init'); });
    pageIntro();
    bindReveals();
    $$('[data-count]').forEach(countUp);
    magnetic($$('[data-magnetic]'));
  }

  boot();

  return {
    I: I, D: D, t: t, pick: pick, $: $, $$: $$, esc: esc, icon: icon, store: store, params: params,
    G: G, reduce: reduce, HOST: HOST, JOINER: JOINER,
    sameDay: sameDay, fmtDay: fmtDay, fmtTime: fmtTime, fmtWhen: fmtWhen, fmtVnd: fmtVnd, fmtCost: fmtCost,
    skillCode: skillCode, skillRange: skillRange, formatName: formatName, openSlots: openSlots, km: km, titleOf: titleOf,
    matches: matches, byId: byId, addCreated: addCreated, joinStatus: joinStatus,
    scoreFor: scoreFor, suggestions: suggestions, cardHTML: cardHTML,
    pinIcon: pinIcon, createMap: createMap,
    toast: toast, confetti: confetti, splitWords: splitWords, revealHeadline: revealHeadline,
    bindReveals: bindReveals, staggerIn: staggerIn, magnetic: magnetic,
    onRender: onRender, ready: ready
  };
})();
