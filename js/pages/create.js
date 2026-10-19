/* Host a game: 4-step form with live preview. Published games persist (localStorage)
   so they appear on the feed and can be opened on the join page. */
(function () {
  'use strict';
  const MM = window.MM, G = MM.G, D = MM.D, $ = MM.$, $$ = MM.$$, t = MM.t, esc = MM.esc, icon = MM.icon, pick = MM.pick;
  const HOST = MM.HOST;

  const form = $('#create-form');
  const F = form.elements; // form.title would hit the element's title attribute
  const state = { step: 1, lastCreated: null };
  let pinMap = null, pinMarker = null;
  const pin = { lat: D.RECENT_COURTS[0].lat, lng: D.RECENT_COURTS[0].lng };

  function fillFormat() {
    const sport = F.sport.value, sel = $('#f-format'), prev = sel.value;
    sel.innerHTML = D.FORMATS[sport].map(function (f) { return '<option value="' + f.id + '">' + esc(pick(f)) + '</option>'; }).join('');
    sel.value = D.FORMATS[sport].some(function (f) { return f.id === prev; }) ? prev : (sport === 'badminton' ? 'doubles' : 'f7');
  }
  function fillSkills() {
    const sport = F.sport.value;
    const opts = D.SKILLS[sport].map(function (s, i) { return '<option value="' + i + '">' + esc(s.code + ' · ' + pick(s)) + '</option>'; }).join('');
    const minSel = $('#f-smin'), maxSel = $('#f-smax');
    const pMin = minSel.value, pMax = maxSel.value, pSport = minSel.dataset.sport;
    minSel.innerHTML = opts; maxSel.innerHTML = opts;
    if (pSport === sport && pMin !== '') { minSel.value = pMin; maxSel.value = pMax; }
    else if (sport === 'badminton') { minSel.value = '4'; maxSel.value = '7'; }
    else { minSel.value = '1'; maxSel.value = '2'; }
    minSel.dataset.sport = sport;
  }
  function fillDurations() {
    const sel = $('#f-dur'), prev = sel.value || '120';
    sel.innerHTML = [60, 90, 120, 150, 180].map(function (n) { return '<option value="' + n + '">' + esc(t('create.min', { n: n })) + '</option>'; }).join('');
    sel.value = prev;
  }
  function fillRecent() {
    $('#recent-courts').innerHTML = D.RECENT_COURTS.map(function (c, i) {
      return '<button type="button" class="chip" data-court="' + i + '" aria-pressed="false">' + icon('pin', 'icon-sm') + esc(c.name) + '</button>';
    }).join('');
  }
  function setDefaultDate() {
    const d = D.atOffset(2, 19, 0), pad = function (n) { return String(n).padStart(2, '0'); }, today = new Date();
    F.date.value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    F.date.min = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
  }

  function readForm() {
    const date = F.date.value, time = F.time.value || '19:00';
    let start = null;
    if (date) { const p = date.split('-'), q = time.split(':'); start = new Date(+p[0], +p[1] - 1, +p[2], +q[0], +q[1]); }
    const base = start || D.atOffset(2, 19, 0);
    return {
      id: 'new-' + Date.now(), sport: F.sport.value, format: F.format.value,
      title: F.title.value.trim() || t('create.titlePh'), rawTitle: F.title.value.trim(),
      start: base, end: new Date(base.getTime() + (+F.dur.value || 120) * 60000), hasDate: !!start,
      venue: F.venue.value.trim() || '—', rawVenue: F.venue.value.trim(), address: F.address.value.trim(),
      lat: pin.lat, lng: pin.lng,
      total: +F.total.value || 0, filled: +F.filled.value || 0,
      skillMin: +F.skillMin.value, skillMax: +F.skillMax.value,
      cost: Math.max(0, +F.cost.value || 0), rawCost: +F.cost.value, costUnit: F.costUnit.value,
      joinMode: F.joinMode.value, host: HOST.displayName, hostId: HOST.id, notes: F.notes.value.trim()
    };
  }

  let pulseT = 0;
  function renderPreview(pulse) {
    const m = readForm();
    $('#create-preview').innerHTML = MM.cardHTML(m, { noActions: true });
    $('#open-slots').innerHTML = icon('users', 'icon-sm') + '<span>' + esc(t('create.openSlots', { n: Math.max(0, m.total - m.filled) })) + '</span>';
    $('#skill-track').innerHTML = D.SKILLS[m.sport].map(function (_, i) { return '<span class="' + (i >= m.skillMin && i <= m.skillMax ? 'on' : '') + '"></span>'; }).join('');
    $('#pin-coords').textContent = pin.lat.toFixed(5) + ', ' + pin.lng.toFixed(5);
    if (pulse && G) {
      clearTimeout(pulseT);
      pulseT = setTimeout(function () {
        G.fromTo('#create-preview .mcard', { boxShadow: '0 0 0 0 rgba(200,240,49,.9)' }, { boxShadow: '0 0 0 10px rgba(200,240,49,0)', duration: .7, ease: 'power2.out', clearProps: 'boxShadow' });
      }, 120);
    }
  }

  function setError(id, inputs, msg) {
    const el = $('#' + id);
    (inputs || []).forEach(function (inp) { if (inp) inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); });
    if (msg) {
      el.textContent = msg; el.hidden = false; el.setAttribute('role', 'alert');
      if (G) G.fromTo(inputs[0], { x: -6 }, { x: 0, duration: .45, ease: 'elastic.out(1.2, .3)' });
    } else { el.textContent = ''; el.hidden = true; }
  }
  function validateStep(n) {
    const m = readForm();
    let firstBad = null;
    function check(cond, errId, inputs, key) { setError(errId, inputs, cond ? '' : t(key)); if (!cond && !firstBad) firstBad = inputs[0]; }
    if (n === 1) check(!!m.rawTitle, 'f-title-err', [F.title], 'create.err.title');
    if (n === 2) { check(m.hasDate && m.start > new Date(), 'f-date-err', [F.date], 'create.err.date'); check(!!m.rawVenue, 'f-venue-err', [F.venue], 'create.err.venue'); }
    if (n === 3) { check(m.filled >= 1 && m.filled < m.total, 'f-slots-err', [F.filled, F.total], 'create.err.slots'); check(m.skillMin <= m.skillMax, 'f-skill-err', [F.skillMin, F.skillMax], 'create.err.skill'); }
    if (n === 4) check(m.rawCost >= 0, 'f-cost-err', [F.cost], 'create.err.cost');
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  // Direction-aware step change: forward slides in from the right, back from the left.
  function goStep(n, dir) {
    const prev = state.step;
    state.step = n;
    const show = function () {
      $$('.step', form).forEach(function (s) { s.hidden = +s.dataset.step !== n; });
      if (G && dir) G.fromTo('.step[data-step="' + n + '"]', { x: dir * 36, opacity: 0 }, { x: 0, opacity: 1, duration: .42, ease: 'power3.out', clearProps: 'transform,opacity' });
      if (n === 2) initPinMap();
    };
    if (G && dir && prev !== n) {
      G.to('.step[data-step="' + prev + '"]', { x: -dir * 24, opacity: 0, duration: .16, ease: 'power2.in', onComplete: show });
    } else show();
    $$('#stepper li').forEach(function (li) {
      const k = +li.dataset.step;
      li.classList.toggle('is-done', k < n);
      li.classList.toggle('is-current', k === n);
      if (k === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('.stepper').style.setProperty('--progress', (n - 1) / 3);
    $('#step-count').textContent = t('create.step', { n: n }) + ' · ' + t('create.s' + n);
    $('#create-back').disabled = n === 1;
    $('#create-next-label').textContent = n === 4 ? t('create.publish') : t('create.next');
  }

  function pinDivIcon() {
    return window.L.divIcon({ className: '', html: '<span class="pin pin-' + F.sport.value + '"><svg aria-hidden="true"><use href="#i-pin"/></svg></span>', iconSize: [40, 40], iconAnchor: [20, 40] });
  }
  function initPinMap() {
    if (!window.L) return;
    if (pinMap) { setTimeout(function () { pinMap.invalidateSize(); }, 30); return; }
    pinMap = MM.createMap('pin-map', [pin.lat, pin.lng], 15);
    pinMarker = window.L.marker([pin.lat, pin.lng], { draggable: true, icon: pinDivIcon() }).addTo(pinMap);
    const moved = function (ll) { pin.lat = ll.lat; pin.lng = ll.lng; renderPreview(true); };
    pinMarker.on('dragend', function () { moved(pinMarker.getLatLng()); });
    pinMap.on('click', function (e) { pinMarker.setLatLng(e.latlng); moved(e.latlng); });
    setTimeout(function () { pinMap.invalidateSize(); }, 30);
  }
  function useCourt(i) {
    const c = D.RECENT_COURTS[i];
    F.venue.value = c.name; F.address.value = c.address;
    pin.lat = c.lat; pin.lng = c.lng;
    if (pinMarker) { pinMarker.setLatLng([c.lat, c.lng]); pinMap.flyTo([c.lat, c.lng], 16, { duration: MM.reduce ? 0 : .6 }); }
    $$('#recent-courts .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.court === i)); });
    setError('f-venue-err', [F.venue], '');
    renderPreview(true);
  }

  function publish() {
    const m = readForm();
    const created = Object.assign({}, m, { title: m.rawTitle, isNew: true });
    delete created.rawTitle; delete created.rawVenue; delete created.rawCost; delete created.hasDate;
    MM.addCreated(created);
    state.lastCreated = created.id;
    MM.confetti($('#create-next'));
    const done = $('#create-done');
    const swap = function () {
      form.hidden = true; $('#stepper').hidden = true; $('#step-count').hidden = true;
      done.hidden = false; done.focus();
      if (G) {
        G.from(done.children, { y: 16, opacity: 0, stagger: .08, duration: .5, ease: 'power3.out', clearProps: 'transform,opacity' });
        G.fromTo('.done-badge', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: .7, ease: 'back.out(2.2)' });
      }
    };
    if (G) G.to([form, '#stepper', '#step-count'], { opacity: 0, y: -12, duration: .25, ease: 'power2.in', onComplete: function () { swap(); G.set([form, '#stepper', '#step-count'], { clearProps: 'opacity,transform' }); } });
    else swap();
    $('#done-map').setAttribute('href', 'feed.html?focus=' + encodeURIComponent(created.id));
    MM.toast(t('create.toast', { title: created.title }), 'check');
  }

  function resetCreate() {
    form.reset();
    F.time.value = '19:00';
    setDefaultDate();
    form.hidden = false; $('#stepper').hidden = false; $('#step-count').hidden = false; $('#create-done').hidden = true;
    fillFormat(); fillSkills();
    pin.lat = D.RECENT_COURTS[0].lat; pin.lng = D.RECENT_COURTS[0].lng;
    $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
    $$('.error', form).forEach(function (el) { el.hidden = true; });
    state.step = 1;
    goStep(1, -1);
    renderPreview();
    F.title.focus();
  }

  /* ---------- events ---------- */
  form.addEventListener('input', function () { renderPreview(true); });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'sport') { fillFormat(); fillSkills(); if (pinMarker) pinMarker.setIcon(pinDivIcon()); }
    renderPreview(true);
  });
  form.addEventListener('focusout', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') validateStep(state.step); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const n = state.step;
    if (!validateStep(n)) return;
    if (n < 4) {
      goStep(n + 1, 1);
      setTimeout(function () { const first = $('.step[data-step="' + (n + 1) + '"] input, .step[data-step="' + (n + 1) + '"] select', form); if (first) first.focus({ preventScroll: true }); }, 220);
    } else publish();
  });
  $('#create-back').addEventListener('click', function () { if (state.step > 1) goStep(state.step - 1, -1); });
  $('#recent-courts').addEventListener('click', function (e) { const b = e.target.closest('[data-court]'); if (b) useCourt(+b.dataset.court); });
  form.addEventListener('click', function (e) {
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'), btn = inc || dec;
    if (!btn) return;
    const inp = $('#' + (btn.dataset.inc || btn.dataset.dec));
    inp.value = Math.min(+inp.max, Math.max(+inp.min, (+inp.value || 0) + (inc ? 1 : -1)));
    if (G) G.fromTo(inp, { scale: 1.12 }, { scale: 1, duration: .35, ease: 'back.out(3)' });
    renderPreview(true);
  });
  // "See it on the map" becomes a real link to the feed page
  const doneMap = $('#done-map');
  const link = document.createElement('a');
  link.id = 'done-map'; link.className = doneMap.className; link.innerHTML = doneMap.innerHTML; link.href = 'feed.html';
  doneMap.replaceWith(link);
  $('#done-again').addEventListener('click', resetCreate);

  MM.onRender(function () {
    fillFormat(); fillSkills(); fillDurations();
    $('#step-count').textContent = t('create.step', { n: state.step }) + ' · ' + t('create.s' + state.step);
    $('#create-next-label').textContent = state.step === 4 ? t('create.publish') : t('create.next');
    renderPreview();
  });

  fillRecent();
  setDefaultDate();
  goStep(1);
  MM.ready();
})();
