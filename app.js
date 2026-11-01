(() => {
  const $ = (s) => document.querySelector(s);
  const el = (tag, props = {}, kids = []) => {
    const n = Object.assign(document.createElement(tag), props);
    kids.forEach((k) => n.append(k));
    return n;
  };

  function renderHeader(site) {
    $('#site-name').textContent = site.name;
    $('#site-role').textContent = site.role;
    document.title = site.name;
    const nav = $('#site-nav');
    nav.replaceChildren(...site.nav.map((n) => {
      const a = el('a', { href: n.href, textContent: n.label });
      if (/^https?:/.test(n.href)) { a.target = '_blank'; a.rel = 'noopener'; }
      return a;
    }));
  }

  const LOCK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Z"/></svg>';
  function lockBadge(project) {
    const b = el('span', { className: 'lock' });
    b.innerHTML = LOCK_ICON;
    b.append(el('span', { textContent: project.lockLabel === 'soon' ? 'Coming soon' : 'Under NDA' }));
    return b;
  }

  function carousel(project) {
    const slides = project.slides;
    const track = el('div', { className: 'track' });
    let index = 0, x0 = null, swiped = false;

    const settle = (s) => {
      const im = s.querySelector('img');
      im.classList.remove('settle'); void im.offsetWidth; im.classList.add('settle');
    };
    const go = (i, animate = true) => {
      const prev = index;
      index = (i + slides.length) % slides.length;
      if (animate && index !== prev) settle(track.children[index]);
      const n = slides.length, half = Math.floor(n / 2);
      track.querySelectorAll('.slide').forEach((s, k) => {
        const o = ((k - index + n + half) % n) - half;
        const jump = s.dataset.o !== undefined && Math.abs(o - Number(s.dataset.o)) > 1;
        if (jump) s.style.transition = 'none'; // wrapping slide: reposition without sweeping across the card
        s.dataset.o = o;
        s.style.setProperty('--o', o);
        if (jump) { void s.offsetWidth; s.style.transition = ''; }
        s.dataset.far = String(Math.abs(o) > 1);
        s.setAttribute('aria-current', String(k === index));
        s.setAttribute('aria-label', k === index ? `Next image of ${project.name}` : `Show image ${k + 1} of ${slides.length}`);
      });
    };

    slides.forEach((src, k) => {
      const b = el('button', { type: 'button', className: 'slide' }, [
        el('img', { src, alt: project.locked ? '' : `${project.name} — image ${k + 1}`, draggable: false, decoding: 'async' }),
        ...(project.locked ? [lockBadge(project)] : []),
      ]);
      // clicking the active card advances; clicking a peeking card jumps to it
      b.addEventListener('click', () => {
        if (swiped) { swiped = false; return; }
        go(k === index ? index + 1 : k);
      });
      track.append(b);
    });

    const stage = el('div', { className: 'stage' }, [track]);
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { go(index + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(index - 1); e.preventDefault(); }
    });

    // swipe
    stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; swiped = false; });
    stage.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) { swiped = true; go(index + (dx < 0 ? 1 : -1)); }
    });

    if (slides.length) go(0, false);
    return stage;
  }

  // grey line: one word per line, cycling every 2s with a blur-fade swap
  function rotator(text, d) {
    const words = text.split('\n').map((w) => w.trim()).filter(Boolean);
    const box = el('span', { className: 'hero-line hero-muted hero-rotor reveal' });
    box.style.setProperty('--d', d + 'ms');
    const spans = words.map((w, i) => el('span', { className: 'hero-word' + (i ? '' : ' on'), textContent: w }));
    box.append(...spans);
    if (spans.length > 1) {
      // reserve the widest word so nothing shifts
      const sizer = el('span', { className: 'hero-sizer', textContent: words.reduce((a, b) => (b.length > a.length ? b : a)), ariaHidden: 'true' });
      box.append(sizer);
      let i = 0;
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setInterval(() => {
          spans[i].classList.remove('on');
          i = (i + 1) % spans.length;
          spans[i].classList.add('on');
        }, 2000);
      }
    }
    return box;
  }

  function renderHero(hero, about) {
    if (!hero || !(hero.headline || hero.highlight)) return null;
    const line = (cls, text, d) => { const n = el(cls === 'sub' ? 'p' : 'span', { className: `hero-${cls} reveal`, textContent: text }); n.style.setProperty('--d', d + 'ms'); return n; };
    const h1 = el('h1', { className: 'hero-title' }, [
      ...(hero.headline ? [line('line', hero.headline, 0)] : []),
      ...(hero.highlight ? [rotator(hero.highlight, 120)] : []),
    ]);
    const text = el('div', { className: 'hero-text' }, [h1, ...(hero.sub ? [line('sub', hero.sub, 280)] : [])]);
    // no custom hero photo → the halftone portrait drawn in code (instant, no download)
    const media = hero.image ? el('img', { src: hero.image, alt: 'Portrait', decoding: 'async', draggable: false })
      : window.makePortrait ? window.makePortrait()
      : (about && about.image) ? el('img', { src: about.image, alt: 'Portrait', decoding: 'async', draggable: false }) : null;
    const photo = media ? el('figure', { className: 'hero-photo reveal' }, [media]) : null;
    if (photo) photo.style.setProperty('--d', '200ms');
    return el('section', { className: 'hero' + (photo ? ' has-photo' : ''), id: 'hero' }, photo ? [text, photo] : [text]);
  }

  function renderProjects(projects, hero, about) {
    const heroEl = renderHero(hero, about);
    $('#projects').replaceChildren(...(heroEl ? [heroEl] : []), ...projects.map((p) => {
      const logo = p.logo ? el('img', { src: p.logo, alt: p.name }) : el('span', { className: 'name', textContent: p.name });
      const tagline = el('p', { className: 'tagline', textContent: p.tagline });
      const stage = carousel(p);
      const head = el('div', { className: 'project-head' }, [logo, tagline]);
      [[logo, 0], [tagline, 90], [stage, 180]].forEach(([n, d]) => { n.classList.add('reveal'); n.style.setProperty('--d', d + 'ms'); });
      return el('section', { className: 'project' + (p.locked ? ' locked' : ''), id: p.id, ariaLabel: p.name }, [head, stage]);
    }));
    observeReveals();
  }

  // play the reveal whenever a project (re)enters the viewport, reset when it has left
  function observeReveals() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const items = en.target.querySelectorAll('.reveal');
        if (en.isIntersecting && en.intersectionRatio >= 0.3) {
          items.forEach((n) => n.classList.add('in'));
          const active = en.target.querySelector('.slide[aria-current="true"] img');
          if (active && !en.target.dataset.seen) { en.target.dataset.seen = '1'; active.classList.add('settle'); }
        } else if (!en.isIntersecting) {
          items.forEach((n) => n.classList.remove('in'));
          delete en.target.dataset.seen;
        }
      });
    }, { threshold: [0, 0.3] });
    document.querySelectorAll('.hero, .project').forEach((p) => io.observe(p));
  }

  // Snap: one scroll gesture steps exactly one project, animated.
  function enableSnap() {
    const TOP = 160; // logo row y in the design
    const stops = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      return [...document.querySelectorAll('.hero, .project')]
        .map((s) => (s.classList.contains('hero') ? 0 : Math.min(Math.max(0, s.offsetTop - TOP), max)))
        .filter((y, i, a) => a.indexOf(y) === i);
    };
    const nearest = (ys, y) => ys.reduce((b, v, i) => (Math.abs(v - y) < Math.abs(ys[b] - y) ? i : b), 0);
    // rAF tween so the step is animated and identical in every browser
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DUR = 750, ease = (t) => 1 - Math.pow(1 - t, 4); // easeOutQuart
    let anim = 0, animating = false;
    const scrollToY = (to) => {
      cancelAnimationFrame(anim);
      const from = scrollY, t0 = performance.now();
      if (reduce || Math.abs(to - from) < 1) { window.scrollTo(0, to); return; }
      animating = true;
      const tick = (now) => {
        const p = Math.min((now - t0) / DUR, 1);
        window.scrollTo(0, from + (to - from) * ease(p));
        if (p < 1) anim = requestAnimationFrame(tick); else animating = false;
      };
      anim = requestAnimationFrame(tick);
    };
    let target = null;
    const jump = (dir) => {
      const ys = stops(), i = nearest(ys, animating && target !== null ? target : scrollY);
      const j = Math.min(Math.max(i + dir, 0), ys.length - 1);
      target = ys[j];
      scrollToY(target);
    };

    const heroOffset = () => (document.querySelector('.hero') ? 1 : 0);

    // dock: jump to a project by index and report which one is current
    const dockApi = {
      goTo: (i) => { const ys = stops(); i += heroOffset(); if (ys[i] !== undefined) { target = ys[i]; scrollToY(target); } },
      current: () => { const ys = stops(); return nearest(ys, animating && target !== null ? target : scrollY) - heroOffset(); },
    };

    // wheel / trackpad: one step per gesture; ignore the inertia tail until the input goes quiet
    let locked = false, quiet, lastMag = 0, lockedAt = 0;
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // pinch zoom / horizontal
      e.preventDefault();
      const mag = Math.abs(e.deltaY), now = performance.now();
      // a fresh, harder swipe during the tail of the last one counts as a new gesture
      if (locked && now - lockedAt > 350 && mag > lastMag * 1.6 && mag > 30) locked = false;
      lastMag = mag;
      if (!locked && !animating && mag > 2) { locked = true; lockedAt = now; jump(Math.sign(e.deltaY)); }
      clearTimeout(quiet);
      quiet = setTimeout(() => { locked = false; lastMag = 0; }, 140);
    }, { passive: false });

    // keyboard
    addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
      const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      if (down || up) { e.preventDefault(); jump(down ? 1 : -1); }
    });

    // touch: a vertical swipe steps one project
    let ty = null, tx = null;
    addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
    addEventListener('touchend', (e) => {
      if (ty === null) return;
      const dy = ty - e.changedTouches[0].clientY, dx = tx - e.changedTouches[0].clientX; ty = null;
      if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.2) jump(Math.sign(dy));
    }, { passive: true });
    addEventListener('touchmove', (e) => { if (e.cancelable && ty !== null && Math.abs(ty - e.touches[0].clientY) > Math.abs(tx - e.touches[0].clientX)) e.preventDefault(); }, { passive: false });

    // anything else (scrollbar drag, find-in-page): glide to the nearest project once it stops
    let t;
    addEventListener('scroll', () => {
      clearTimeout(t);
      if (animating) return;
      t = setTimeout(() => {
        const ys = stops(), y = ys[nearest(ys, scrollY)];
        if (Math.abs(y - scrollY) > 1) scrollToY(y);
      }, 150);
    }, { passive: true });
    return dockApi;
  }

  function renderDock(projects, api) {
    const dock = $('#dock');
    const btns = projects.map((p, i) => {
      const b = el('button', { type: 'button', className: 'dock-item', ariaLabel: `Go to ${p.name}` }, [
        p.logo ? el('img', { src: p.logo, alt: '' }) : el('span', { textContent: p.name }),
      ]);
      b.addEventListener('click', () => api.goTo(i));
      return b;
    });
    dock.querySelectorAll('.dock-item').forEach((n) => n.remove());
    dock.append(...btns);
    dock.classList.toggle('hidden', projects.length < 2);
    let last = -1;
    const sync = () => {
      const c = api.current();
      if (c === last) return;
      last = c;
      btns.forEach((b, i) => b.setAttribute('aria-current', String(i === c)));
    };
    sync();
    addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    requestAnimationFrame(() => dock.classList.add('in'));
    // phones: logos slide on their own as a looping marquee (clones fill the loop)
    const mq = matchMedia('(max-width: 600px)');
    const clones = [];
    projects.forEach((p, i) => {
      for (let k = 0; k < 2; k++) {
        const c = btns[i].cloneNode(true);
        c.classList.add('dock-clone');
        c.setAttribute('aria-hidden', 'true');
        c.tabIndex = -1;
        c.addEventListener('click', () => api.goTo(i));
        clones.push(c);
      }
    });
    dock.append(...clones);
    let pos = 0, hold = 0, running = false;
    const setW = () => { const c = dock.querySelector('.dock-clone'); return c ? c.offsetLeft - btns[0].offsetLeft : 0; };
    const hush = () => { hold = performance.now() + 2000; };
    ['touchstart', 'pointerdown', 'wheel'].forEach((t) => dock.addEventListener(t, hush, { passive: true }));
    const tick = () => {
      if (!mq.matches) { running = false; return; }
      const w = setW();
      if (w > 0 && dock.classList.contains('on-hero')) {
        if (performance.now() < hold) pos = dock.scrollLeft;
        else {
          pos += 0.45;
          if (pos >= w) pos -= w;
          dock.scrollLeft = pos;
        }
        if (dock.scrollLeft < 1 && performance.now() < hold) { pos = w; dock.scrollLeft = w; }
      }
      requestAnimationFrame(tick);
    };
    const start = () => { if (mq.matches && !running && !matchMedia('(prefers-reduced-motion: reduce)').matches) { running = true; requestAnimationFrame(tick); } };
    mq.addEventListener('change', () => { dock.scrollLeft = 0; pos = 0; start(); });
    start();
    // on phones the dock only shows while the hero is on screen
    const hero = $('#hero');
    if (hero) {
      dock.classList.add('has-hero', 'on-hero');
      new IntersectionObserver(([e]) => dock.classList.toggle('on-hero', e.isIntersecting), { threshold: 0.35 }).observe(hero);
    }
  }

  // progressive blur backdrops for the fixed header and dock
  function addProgressiveBlur(host, edge) {
    const wrap = el('div', { className: 'pblur ' + edge, ariaHidden: 'true' });
    for (let k = 0; k < 6; k++) wrap.append(document.createElement('i'));
    host.prepend(wrap);
  }
  addProgressiveBlur($('.top'), 'top');
  addProgressiveBlur($('#dock'), 'bottom');
  // the dock scrolls sideways on narrow screens; keep its blur backdrop pinned
  $('#dock').addEventListener('scroll', (e) => {
    const pb = e.currentTarget.querySelector('.pblur');
    if (pb) pb.style.transform = `translateX(${e.currentTarget.scrollLeft}px)`;
  }, { passive: true });

  fetch('/content.json', { cache: 'no-store' })
    .then((r) => r.json())
    .then((c) => { renderHeader(c.site); renderProjects(c.projects, c.hero, c.about);
      renderDock(c.projects, enableSnap());
      requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('.top .reveal').forEach((n) => n.classList.add('in')))); })
    .catch(() => { $('#projects').textContent = 'Could not load projects.'; });
})();
