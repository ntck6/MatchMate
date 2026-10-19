/* Find games: filters, MATCH-A suggestions, List / Map views (List by default).
   URL params: ?sport=badminton|football &when=today|week &view=map &focus=<id> &route=<id> */
(function () {
  'use strict';
  const MM = window.MM, G = MM.G, $ = MM.$, $$ = MM.$$, t = MM.t, esc = MM.esc, icon = MM.icon;
  const JOINER = MM.JOINER;

  const state = {
    sport: ['badminton', 'football'].indexOf(MM.params.get('sport')) !== -1 ? MM.params.get('sport') : 'all',
    when: ['today', 'week'].indexOf(MM.params.get('when')) !== -1 ? MM.params.get('when') : 'any',
    selectedId: MM.params.get('focus') || null,
    view: MM.params.get('view') === 'map' || MM.params.get('focus') || MM.params.get('route') ? 'map' : 'list'
  };

  function filtered() {
    const now = new Date(), weekEnd = new Date();
    weekEnd.setDate(now.getDate() + 7);
    return MM.matches().filter(function (m) {
      if (state.sport !== 'all' && m.sport !== state.sport) return false;
      if (m.end < now) return false;
      if (state.when === 'today' && !MM.sameDay(m.start, now)) return false;
      if (state.when === 'week' && m.start > weekEnd) return false;
      return true;
    }).sort(function (a, b) {
      const fa = MM.openSlots(a) === 0, fb = MM.openSlots(b) === 0;
      if (fa !== fb) return fa ? 1 : -1;
      return a.start - b.start;
    });
  }

  /* ---------- list ---------- */
  let lastCount = null;
  function tweenCount(n) {
    const el = $('#feed-count');
    if (!G || lastCount == null) { el.textContent = t('feed.count', { n: n }); lastCount = n; return; }
    const o = { v: lastCount };
    G.to(o, { v: n, duration: .5, ease: 'power2.out', onUpdate: function () { el.textContent = t('feed.count', { n: Math.round(o.v) }); } });
    lastCount = n;
  }

  function renderList(animate) {
    const list = filtered();
    tweenCount(list.length);
    const cards = $('#feed-cards');
    cards.innerHTML = list.length
      ? list.map(function (m) { return MM.cardHTML(m, { mapButton: true, selected: state.selectedId === m.id }); }).join('')
      : '<div class="empty">' + icon('search', 'icon-lg') + '<p>' + esc(t('feed.empty')) + '</p><a class="btn btn-primary btn-sm" href="create.html">' + esc(t('feed.empty.cta')) + '</a></div>';

    const top = MM.suggestions(list, 3);
    $('#foryou-row').innerHTML = top.length
      ? top.map(function (x) { return MM.cardHTML(x.m, { score: x.s.score, reasons: x.s.reasons, mapButton: true, selected: state.selectedId === x.m.id }); }).join('')
      : '<p class="small foryou-empty">' + esc(t('feed.empty')) + '</p>';

    if (animate) {
      MM.staggerIn($$('#foryou-row .mcard'));
      MM.staggerIn($$('#feed-cards .mcard'), { delay: .08 });
    }
    renderMarkers(animate);
  }

  // Filtering out: quick fade, then the new set staggers in.
  function refilter() {
    const cards = $$('#feed-cards .mcard, #foryou-row .mcard');
    if (!G || !cards.length) { renderList(true); return; }
    G.to(cards, { opacity: 0, y: -10, duration: .16, stagger: .015, ease: 'power2.in', overwrite: true, onComplete: function () { renderList(true); } });
  }

  function syncChips() {
    $$('#view-toggle button').forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view, true); });
  });
  $$('#sport-filter .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sport === state.sport)); });
    const url = new URL(location.href);
    if (state.sport === 'all') url.searchParams.delete('sport'); else url.searchParams.set('sport', state.sport);
    history.replaceState(null, '', url);
  }

  /* ---------- map ---------- */
  let map = null, markerLayer = null, routeLayer = null;
  const markers = {};

  function popupHTML(m) {
    const full = MM.openSlots(m) === 0;
    return '<div class="popup">' +
      '<span class="tag tag-' + m.sport + '">' + esc(t('sport.' + m.sport)) + ' · ' + esc(MM.formatName(m.sport, m.format)) + '</span>' +
      '<p class="popup-title">' + esc(MM.titleOf(m)) + '</p>' +
      '<p class="popup-meta">' + esc(MM.fmtWhen(m)) + '<br>' + esc(m.venue) + ' · ' + esc(MM.skillRange(m)) + '<br><strong>' + esc(full ? t('card.full') : t('card.open', { n: MM.openSlots(m) })) + '</strong></p>' +
      (full ? '<span class="btn btn-primary" aria-disabled="true">' + esc(t('card.full')) + '</span>'
            : '<a class="btn btn-primary" href="join.html?id=' + encodeURIComponent(m.id) + '">' + esc(t('card.join')) + '</a>') +
      '</div>';
  }

  function initMap() {
    const fb = $('#feed-map-fallback');
    if (!window.L) { fb.textContent = t('feed.map.error'); return; }
    map = MM.createMap('feed-map', [10.785, 106.69], 12);
    map.eachLayer(function (l) { if (l.once) l.once('tileerror', function () { fb.textContent = t('feed.map.error'); }); });
    window.L.circle([JOINER.home.lat, JOINER.home.lng], { radius: JOINER.radiusKm * 1000, color: '#2563EB', weight: 1.5, fillOpacity: .06, dashArray: '6 6', className: 'home-radius' }).addTo(map);
    window.L.marker([JOINER.home.lat, JOINER.home.lng], {
      icon: window.L.divIcon({ className: '', html: '<span class="pin pin-home"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }), keyboard: false
    }).bindTooltip(t('feed.map.home')).addTo(map);
    markerLayer = window.L.layerGroup().addTo(map);
    routeLayer = window.L.layerGroup().addTo(map);
  }

  function renderMarkers(drop) {
    if (!map) return;
    markerLayer.clearLayers();
    Object.keys(markers).forEach(function (k) { delete markers[k]; });
    const list = filtered();
    list.forEach(function (m, i) {
      const mk = window.L.marker([m.lat, m.lng], { icon: MM.pinIcon(m, { drop: drop && !MM.reduce, delay: i * 60, active: state.selectedId === m.id }), title: MM.titleOf(m), riseOnHover: true })
        .bindPopup(popupHTML(m))
        .on('click', function () { select(m.id, false); });
      mk.addTo(markerLayer);
      markers[m.id] = mk;
    });
    if (state.view === 'map') fitAll(list);
  }

  function fitAll(list) {
    const pts = (list || filtered()).map(function (m) { return [m.lat, m.lng]; });
    pts.push([JOINER.home.lat, JOINER.home.lng]);
    if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14, animate: false });
  }

  function select(id, fly) {
    state.selectedId = id;
    $$('.mcard.is-selected').forEach(function (c) { c.classList.remove('is-selected'); });
    $$('[data-card="' + id + '"]').forEach(function (c) { c.classList.add('is-selected'); });
    const m = MM.byId(id);
    if (!map || !m) return;
    Object.keys(markers).forEach(function (k) { const mm = MM.byId(k); if (mm) markers[k].setIcon(MM.pinIcon(mm, { active: k === id })); });
    if (fly) {
      map.flyTo([m.lat, m.lng], 15, { duration: MM.reduce ? 0 : .9 });
      if (markers[id]) setTimeout(function () { markers[id].openPopup(); }, MM.reduce ? 0 : 950);
    }
  }

  function showOnMap(id) {
    setView('map', true, true);
    const frame = $('.feed-map .map-frame');
    const r = frame.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight) frame.scrollIntoView({ behavior: MM.reduce ? 'auto' : 'smooth', block: 'center' });
    setTimeout(function () { select(id, true); }, 120);
  }

  /* ---------- List / Map toggle ---------- */
  function setView(v, animate, keepBounds) {
    const changed = state.view !== v;
    state.view = v;
    $('#feed-layout').setAttribute('data-view', v);
    $('#view-toggle').setAttribute('data-active', v);
    $$('#view-toggle button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === v)); });
    const url = new URL(location.href);
    if (v === 'map') url.searchParams.set('view', 'map'); else url.searchParams.delete('view');
    url.searchParams.delete('focus'); url.searchParams.delete('route');
    history.replaceState(null, '', url);

    if (v === 'map' && map) {
      map.invalidateSize();
      if (!keepBounds) fitAll();
      if (changed && animate) renderMarkers(true);
    }
    if (!changed || !animate || !G) return;
    if (v === 'map') {
      G.fromTo('.feed-map .map-frame', { opacity: 0, scale: .97, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: .5, ease: 'power3.out', clearProps: 'transform,opacity' });
    } else {
      G.from('.foryou', { opacity: 0, y: 16, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
      MM.staggerIn($$('#foryou-row .mcard'), { delay: .05 });
      MM.staggerIn($$('#feed-cards .mcard'), { delay: .12, stagger: .04 });
    }
  }

  function drawRoute(m) {
    if (!map || !m) return;
    routeLayer.clearLayers();
    const from = [JOINER.home.lat, JOINER.home.lng], to = [m.lat, m.lng];
    const mid = [(from[0] + to[0]) / 2 + 0.004, (from[1] + to[1]) / 2 - 0.004];
    window.L.polyline([from, mid, to], { color: '#0E7A45', weight: 5, opacity: .9, lineCap: 'round', className: 'route-line' }).addTo(routeLayer);
    map.fitBounds([from, to], { padding: [70, 70] });
    MM.toast(t('feed.route', { km: (MM.km(JOINER.home, m) * 1.25).toFixed(1) }), 'nav');
  }

  /* ---------- events ---------- */
  $$('#sport-filter .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      if (state.sport === b.dataset.sport) return;
      state.sport = b.dataset.sport;
      syncChips();
      refilter();
    });
  });
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action="show-map"]');
    if (el) showOnMap(el.dataset.id);
  });

  MM.onRender(function (why) {
    renderList(why === 'init');
    if (why === 'lang' && map) map.eachLayer(function (l) { if (l.getTooltip && l.getTooltip()) l.setTooltipContent(t('feed.map.home')); });
  });

  initMap();
  syncChips();
  setView(state.view, false, !!(MM.params.get('focus') || MM.params.get('route')));
  MM.ready();

  const focus = MM.params.get('focus'), route = MM.params.get('route');
  if (focus && MM.byId(focus)) setTimeout(function () { showOnMap(focus); }, 500);
  if (route && MM.byId(route)) setTimeout(function () { showOnMap(route); setTimeout(function () { drawRoute(MM.byId(route)); }, 1000); }, 500);
})();
