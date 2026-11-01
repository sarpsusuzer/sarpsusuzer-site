(() => {
  const $ = (s) => document.querySelector(s);
  const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);

  // progressive blur behind the fixed header (same as the home page)
  const wrap = el('div', { className: 'pblur top', ariaHidden: 'true' });
  for (let k = 0; k < 6; k++) wrap.append(document.createElement('i'));
  $('.top').prepend(wrap);

  fetch('/content.json', { cache: 'no-store' }).then((r) => r.json()).then(({ site, about }) => {
    $('#site-name').textContent = site.name;
    $('#site-role').textContent = site.role;
    document.title = `About — ${site.name}`;
    $('#site-nav').replaceChildren(...site.nav.map((n) => {
      const a = el('a', { href: n.href, textContent: n.label });
      if (/^https?:/.test(n.href)) { a.target = '_blank'; a.rel = 'noopener'; }
      if (n.href === location.pathname) a.setAttribute('aria-current', 'page');
      return a;
    }));

    const photo = $('#about-photo');
    photo.append(about.image ? el('img', { src: about.image, alt: site.name }) : el('span', { textContent: site.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2) }));

    const paras = about.bio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    $('#about-bio').replaceChildren(...paras.map((t, i) => {
      const p = el('p', { className: (i === 0 ? 'about-lead' : 'about-body') + ' reveal', textContent: t });
      p.style.setProperty('--d', 200 + i * 110 + 'ms');
      return p;
    }));

    const mail = $('#about-email');
    if (about.email) { mail.href = 'mailto:' + about.email; mail.textContent = about.email; mail.classList.remove('hidden'); }

    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll('.reveal').forEach((n) => n.classList.add('in'))));
  });
})();
