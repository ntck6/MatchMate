/* MatchMate — shared page chrome.
   Loaded synchronously at the top of <body> so the icon sprite and header are in the
   DOM before first paint (no layout shift, no flash of untranslated nav). */
(function () {
  const I = window.MM_I18N;
  let lang = null;
  try { lang = localStorage.getItem('mm-lang'); } catch (e) { /* storage blocked */ }
  if (!lang) lang = (navigator.language || '').toLowerCase().indexOf('vi') === 0 ? 'vi' : 'en';
  I.lang = lang;
  document.documentElement.lang = I.lang;

  const t = I.t;
  const page = document.body.getAttribute('data-page') || 'home';

  const SPRITE = '' +
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></symbol>' +
    '<symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>' +
    '<symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol>' +
    '<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>' +
    '<symbol id="i-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>' +
    '<symbol id="i-hourglass" viewBox="0 0 24 24"><path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/></symbol>' +
    '<symbol id="i-lock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>' +
    '<symbol id="i-unlock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></symbol>' +
    '<symbol id="i-phone" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></symbol>' +
    '<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></symbol>' +
    '<symbol id="i-arrow-ur" viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></symbol>' +
    '<symbol id="i-chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>' +
    '<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>' +
    '<symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>' +
    '<symbol id="i-list" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></symbol>' +
    '<symbol id="i-map" viewBox="0 0 24 24"><path d="M14.1 6 9.9 4 3 7v13l6.9-3 4.2 2 6.9-3V3z"/><path d="M9.9 4v13M14.1 6v13"/></symbol>' +
    '<symbol id="i-nav" viewBox="0 0 24 24"><path d="m3 11 19-9-9 19-2-8-8-2z"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></symbol>' +
    '<symbol id="i-sparkles" viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></symbol>' +
    '<symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol>' +
    '<symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></symbol>' +
    '<symbol id="i-reset" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></symbol>' +
    '<symbol id="i-alert" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></symbol>' +
    '<symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></symbol>' +
    '<symbol id="i-bar" viewBox="0 0 24 24"><path d="M3 20h18M6 16v-4M10 16V8M14 16v-6M18 16V4"/></symbol>' +
    '<symbol id="i-home" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></symbol>' +
    '<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></symbol>' +
    '<symbol id="i-moon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></symbol>' +
    '<symbol id="i-shuttle" viewBox="0 0 24 24"><circle cx="6.5" cy="17.5" r="2.8"/><path d="M8.5 15.5 14 3.5l6.5 6.5-12 5.5"/><path d="M11 9.5l3.5 3.5M17.2 6.8 10.5 12"/></symbol>' +
    '<symbol id="i-ball" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m12 7 4.5 3.3-1.7 5.2H9.2L7.5 10.3z"/><path d="M12 2v5M21.5 9.5l-5 .8M18 20.5l-3.2-5M6 20.5l3.2-5M2.5 9.5l5 .8"/></symbol>' +
    '</defs></svg>';

  const NAV = [
    { id: 'home',   href: 'index.html',  key: 'nav.home' },
    { id: 'feed',   href: 'feed.html',   key: 'nav.feed' },
    { id: 'create', href: 'create.html', key: 'nav.create' },
    { id: 'join',   href: 'join.html',   key: 'nav.join' },
    { id: 'about',  href: 'about.html',  key: 'nav.personas' }
  ];

  const brand = '<a class="brand" href="index.html" aria-label="MatchMate">' +
    '<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><rect width="32" height="32" rx="9"/><path d="M8 22V10l8 7 8-7v12"/></svg></span>' +
    '<span class="brand-name">Match<span>Mate</span></span></a>';

  const links = NAV.map(function (n) {
    return '<a href="' + n.href + '" data-nav="' + n.id + '"' + (n.id === page ? ' aria-current="page"' : '') + ' data-i18n="' + n.key + '">' + t(n.key) + '</a>';
  }).join('');

  const header = '' +
    '<div class="scroll-progress" aria-hidden="true"><i></i></div>' +
    '<a class="skip-link" href="#main" data-i18n="a11y.skip">' + t('a11y.skip') + '</a>' +
    '<header class="site-header" id="top"><div class="container header-inner">' + brand +
      '<nav class="main-nav" id="main-nav" aria-label="Primary"><span class="nav-indicator" aria-hidden="true"></span>' + links + '</nav>' +
      '<div class="header-actions">' +
        '<div class="lang-switch" role="group" aria-label="' + t('lang.label') + '" data-i18n-attr="aria-label:lang.label">' +
          '<button type="button" data-lang="en" aria-pressed="' + (I.lang === 'en') + '">EN</button>' +
          '<button type="button" data-lang="vi" aria-pressed="' + (I.lang === 'vi') + '">VI</button>' +
        '</div>' +
        '<button type="button" class="icon-btn theme-btn" id="theme-toggle" aria-pressed="false" aria-label="' + t('theme.toggle') + '" title="' + t('theme.toggle') + '" data-i18n-attr="aria-label:theme.toggle;title:theme.toggle">' +
          '<svg class="icon icon-moon" aria-hidden="true"><use href="#i-moon"/></svg><svg class="icon icon-sun" aria-hidden="true"><use href="#i-sun"/></svg>' +
        '</button>' +
        '<a class="btn btn-ghost btn-sm" href="join.html" data-i18n="nav.signin">' + t('nav.signin') + '</a>' +
        '<a class="btn btn-primary btn-sm btn-shine" href="feed.html" data-i18n="nav.start">' + t('nav.start') + '</a>' +
      '</div>' +
    '</div></header>';

  document.currentScript.insertAdjacentHTML('afterend', SPRITE + header);

  window.MM_LAYOUT = {
    page: page,
    footer: function () {
      const main = document.getElementById('main');
      if (!main || document.querySelector('.site-footer')) return;
      main.insertAdjacentHTML('afterend',
        '<footer class="site-footer"><div class="container footer-inner">' +
          '<div class="footer-top">' + brand +
            '<nav class="footer-nav" aria-label="Footer">' + NAV.map(function (n) { return '<a href="' + n.href + '" data-i18n="' + n.key + '">' + t(n.key) + '</a>'; }).join('') + '</nav>' +
          '</div>' +
          '<p class="small"><svg class="icon icon-sm" aria-hidden="true"><use href="#i-shield"/></svg> <span data-i18n="footer.privacy">' + t('footer.privacy') + '</span></p>' +
          '<p class="small muted" data-i18n="footer.note">' + t('footer.note') + '</p>' +
        '</div></footer>');
    }
  };
})();
