(() => {
  const $ = (s) => document.querySelector(s);
  const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);

  // progressive blur behind the fixed header (same as the home page)
  const wrap = el('div', { className: 'pblur top', ariaHidden: 'true' });
  for (let k = 0; k < 6; k++) wrap.append(document.createElement('i'));
  $('.top').prepend(wrap);


  // Google Analytics (GA4): loads only on the live site, and only when a measurement ID is set in the CMS
  function loadAnalytics(id) {
    if (!/^G-[A-Z0-9]{4,20}$/.test(id || '') || /^(localhost|127\.|\[::1\])/.test(location.hostname)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', id);
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.append(s);
  }

  fetch('/content.json', { cache: 'no-store' }).then((r) => r.json()).then(({ site, about }) => {
    loadAnalytics(site.analyticsId);
    $('#site-name').textContent = site.name;
    document.title = `About — ${site.name}`;
    $('#site-nav').replaceChildren(...site.nav.map((n) => {
      const a = el('a', { href: n.href.startsWith('#') ? '/' + n.href : n.href, textContent: n.label }); // #anchors live on the home page
      if (/^https?:/.test(n.href)) { a.target = '_blank'; a.rel = 'noopener'; }
      if (n.href === location.pathname) a.setAttribute('aria-current', 'page');
      return a;
    }));

    const photo = $('#about-photo');
    photo.append(about.image ? el('img', { src: about.image, alt: site.name }) : el('span', { textContent: site.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2) }));

    // [label](https://url) in the bio becomes a link (http/https only); everything else stays plain text
    const rich = (p, t) => {
      const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      let last = 0, m;
      while ((m = re.exec(t))) {
        if (m.index > last) p.append(t.slice(last, m.index));
        p.append(el('a', { href: m[2], textContent: m[1], target: '_blank', rel: 'noopener' }));
        last = re.lastIndex;
      }
      if (last < t.length) p.append(t.slice(last));
    };

    const paras = about.bio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    $('#about-bio').replaceChildren(...paras.map((t, i) => {
      const p = el('p', { className: (i === 0 ? 'about-lead' : 'about-body') + ' reveal' });
      rich(p, t);
      p.style.setProperty('--d', 200 + i * 110 + 'ms');
      return p;
    }));

    const mail = $('#about-email');
    if (about.email) { mail.href = 'mailto:' + about.email; mail.textContent = about.email; mail.classList.remove('hidden'); }

    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll('.reveal').forEach((n) => n.classList.add('in'))));
  });
})();
