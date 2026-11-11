/* Wesley's Ambacht — gedeelde interactie en motion (GSAP + ScrollTrigger) */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]beweging=uit/.test(location.search);
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const anim = !reduce && hasGsap;
  if (!anim) root.classList.remove('anim');
  if (anim) gsap.registerPlugin(ScrollTrigger);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- openingstijden: di t/m za 10:00-18:00 (Europe/Amsterdam) ---------- */
  const dagen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  function amsterdam() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { dag: d, min: (+p.hour % 24) * 60 + +p.minute, datum: `${p.year}-${p.month}-${p.day}` };
  }
  function openStatus() {
    const { dag, min } = amsterdam();
    const open = d => d >= 2 && d <= 6;
    if (open(dag) && min >= 600 && min < 1080) return { open: true, tekst: 'Nu open · tot 18:00' };
    if (open(dag) && min < 600) return { open: false, tekst: 'Vandaag open vanaf 10:00' };
    let n = 1; while (!open((dag + n) % 7)) n++;
    return { open: false, tekst: `Gesloten · open ${n === 1 ? 'morgen' : dagen[(dag + n) % 7]} 10:00` };
  }
  $$('.status').forEach(el => {
    const s = openStatus();
    el.classList.toggle('is-open', s.open);
    $('span', el).textContent = s.tekst;
  });

  /* ---------- tijdelijke melding (alleen zichtbaar binnen de periode) ---------- */
  const melding = $('.melding');
  if (melding) {
    const { datum } = amsterdam();
    if (datum >= melding.dataset.van && datum <= melding.dataset.tot) {
      melding.hidden = false;
      root.style.setProperty('--melding-h', melding.offsetHeight + 'px');
    }
  }

  /* ---------- navigatie ---------- */
  const nav = $('.nav');
  const menu = $('#menu');
  const toggle = $('.nav__toggle');
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-weg', y > lastY + 4 && y > 260 ? true : y < lastY - 4 ? false : nav.classList.contains('is-weg'));
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.textContent = open ? 'Sluiten' : 'Menu';
    nav.classList.remove('is-weg');
    if (open) $('a', menu).focus(); else toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });
  $$('a', menu).forEach(a => a.addEventListener('click', () => { if (a.getAttribute('href').startsWith('#')) setMenu(false); }));

  /* ---------- gloed die de cursor volgt (knoppen, pakketten) ---------- */
  $$('.knop, .pakket').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  /* ---------- sticky storytelling: actieve bron wisselt het beeld ---------- */
  const bronnen = $('[data-bronnen]');
  if (bronnen) {
    const beelden = $$('.bronnen__beeld', bronnen);
    const stappen = $$('.bron', bronnen);
    const zet = i => beelden.forEach((b, n) => b.classList.toggle('is-actief', n === i));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) zet(stappen.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
      stappen.forEach(s => io.observe(s));
    }
  }

  /* ---------- vonken (canvas) ---------- */
  function embers(canvas, opt = {}) {
    const ctx = canvas.getContext('2d');
    const total = opt.count || (innerWidth < 700 ? 26 : 64);
    const P = [];
    let w = 0, h = 0, dpr = 1, last = 0, raf = 0, visible = false, intensity = opt.intensity ?? 1, ptr = null;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(p, init) {
      p.x = Math.random() * w; p.y = init ? Math.random() * h : h + 8;
      p.r = .7 + Math.random() * 2.1; p.vy = -(20 + Math.random() * 46); p.vx = (Math.random() - .5) * 14;
      p.life = init ? Math.random() * 4 : 0; p.max = 4 + Math.random() * 6; p.ph = Math.random() * 6.28; p.hue = 16 + Math.random() * 30;
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((t - last) / 1000 || .016, .05); last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const n = Math.round(total * clamp(intensity, .12, 1));
      for (let i = 0; i < n; i++) {
        const p = P[i];
        p.life += dt;
        p.vx += (Math.sin(p.life * 1.7 + p.ph) * 9) * dt;
        if (ptr) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy);
          if (d < 170 && d > 1) { const f = 1 - d / 170; p.vx += dx / d * 150 * f * dt; p.vy -= 110 * f * dt; }
        }
        p.vx *= .985;
        p.x += p.vx * dt; p.y += p.vy * dt * (.55 + intensity * .9);
        if (p.life > p.max || p.y < -10) { spawn(p, false); continue; }
        const a = Math.sin(Math.PI * p.life / p.max);
        ctx.fillStyle = `hsla(${p.hue},100%,58%,${a * .9})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        ctx.fillStyle = `hsla(${p.hue},100%,50%,${a * .12})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4.5, 0, 6.283); ctx.fill();
      }
    }
    function start() { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    size();
    for (let i = 0; i < total; i++) { const p = {}; spawn(p, true); P.push(p); }
    addEventListener('resize', size);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    const host = canvas.parentElement;
    if (matchMedia('(hover:hover)').matches) {
      host.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); ptr = { x: e.clientX - r.left, y: e.clientY - r.top }; });
      host.addEventListener('pointerleave', () => { ptr = null; });
    }
    return { setIntensity: v => { intensity = v; } };
  }
  const vonken = {};
  if (!reduce) $$('canvas.embers').forEach(c => { vonken[c.dataset.naam || 'hero'] = embers(c, { count: c.dataset.count ? +c.dataset.count : undefined, intensity: c.dataset.intensity ? +c.dataset.intensity : 1 }); });
  else $$('canvas.embers').forEach(c => c.remove());

  /* ---------- GSAP: reveals, kopregels, maskers, parallax ---------- */
  if (anim) {
    const splits = [];
    function splitWords(el) {
      const walk = node => {
        [...node.childNodes].forEach(n => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(t => {
              if (!t) return;
              if (/^\s+$/.test(t)) { frag.append(' '); return; }
              const o = document.createElement('span'); o.className = 'woord';
              const i = document.createElement('span'); i.textContent = t; o.append(i); frag.append(o);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
        });
      };
      walk(el);
      return $$('.woord > span', el);
    }
    $$('[data-split]').forEach(el => {
      const aria = el.textContent.trim().replace(/\s+/g, ' ');
      el.setAttribute('aria-label', aria);
      const words = splitWords(el);
      gsap.set(words, { yPercent: 112 });
      el.classList.add('is-split');
      $$('.woord', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
      splits.push(el);
      const delay = parseFloat(el.dataset.delay || 0);
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.fromTo(words, { yPercent: 112 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: .06, delay }) });
    });

    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 92%', once: true,
      onEnter: b => gsap.fromTo(b, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: .95, ease: 'power3.out', stagger: .09, overwrite: true })
    });

    $$('[data-maskeer]').forEach(el => {
      const img = $('img', el);
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => {
          gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power4.inOut' });
          if (img && !el.hasAttribute('data-parallax')) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'power3.out' });
        }
      });
    });

    $$('[data-parallax]').forEach(el => {
      const amt = parseFloat(el.dataset.parallax) || .1;
      const img = $('img', el);
      if (img) gsap.set(img, { scale: 1 + amt * 2.2 });
      gsap.fromTo(img || el, { yPercent: -amt * 100 }, { yPercent: amt * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    const heroBg = $('.hero__bg');
    if (heroBg) {
      const img = $('img', heroBg);
      gsap.fromTo(img, { scale: 1.22 }, { scale: 1.04, duration: 2.8, ease: 'power2.out' });
      gsap.to(heroBg, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: heroBg.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
    }
    gsap.from(nav, { yPercent: -100, opacity: 0, duration: 1, ease: 'power3.out', delay: .3, clearProps: 'transform,opacity' });

    const lijn = $('.stappen__lijn');
    if (lijn) {
      const vert = matchMedia('(max-width:760px)').matches;
      gsap.to(lijn, { [vert ? 'scaleY' : 'scaleX']: 1, ease: 'none', scrollTrigger: { trigger: '.stappen', start: 'top 78%', end: 'bottom 62%', scrub: .4 } });
    }

    /* ---------- signatuur: "Het vuur gaat aan" ---------- */
    const sc = $('.vuur');
    if (sc) {
      const warm = $('.vuur__warm', sc), rand = $('.vuur__rand', sc), a = $('.vuur__tekst .a', sc), b = $('.vuur__tekst .b', sc);
      const meter = $('.vuur__meter i', sc), lab = $('.vuur__label span', sc), glow = vonken.vuur;
      const o = { p: 0 };
      let W, H, max, cx, cy;
      const meet = () => { W = sc.clientWidth; H = sc.clientHeight; cx = W * .5; cy = H * .62; max = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)); };
      meet(); addEventListener('resize', meet);
      function zet(p) {
        const q = clamp((p - .12) / .7), r = max * Math.pow(q, 1.25);
        warm.style.clipPath = `circle(${r}px at 50% 62%)`;
        rand.style.width = rand.style.height = 2 * r + 'px';
        rand.style.opacity = q <= 0 ? 0 : (1 - Math.pow(q, 3)).toFixed(3);
        if (glow) glow.setIntensity(.15 + p * .85);
        const t = p > .5 ? 'Het vuur' : 'De kade';
        if (lab.textContent !== t) lab.textContent = t;
      }
      zet(0);
      gsap.timeline({ scrollTrigger: { trigger: sc, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.7), pin: true, scrub: .7, anticipatePin: 1, invalidateOnRefresh: true } })
        .to(o, { p: 1, ease: 'none', duration: 1, onUpdate: () => zet(o.p) }, 0)
        .to(meter, { scaleX: 1, ease: 'none', duration: 1 }, 0)
        .to(a, { opacity: 0, y: -40, duration: .22, ease: 'power2.in' }, .38)
        .fromTo(b, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .28, ease: 'power2.out' }, .62);
    }

    /* ---------- rijen met cursor-voorbeeld ---------- */
    const rijen = $('.rijen');
    if (rijen && matchMedia('(hover:hover) and (min-width:861px)').matches) {
      const vb = document.createElement('div'); vb.className = 'voorbeeld'; vb.setAttribute('aria-hidden', 'true');
      const imgs = $$('.rij', rijen).map(r => { const i = document.createElement('img'); i.src = r.dataset.img; i.alt = ''; vb.append(i); return i; });
      document.body.append(vb);
      const mx = gsap.quickTo(vb, 'x', { duration: .5, ease: 'power3' }), my = gsap.quickTo(vb, 'y', { duration: .5, ease: 'power3' });
      const rot = gsap.quickTo(vb, 'rotation', { duration: .6, ease: 'power3' });
      let px = 0;
      rijen.addEventListener('pointermove', e => { mx(e.clientX + 40); my(e.clientY - vb.offsetHeight / 2); rot(clamp((e.clientX - px) * .15, -8, 8)); px = e.clientX; });
      $$('.rij', rijen).forEach((r, i) => {
        r.addEventListener('pointerenter', () => { imgs.forEach((m, n) => m.classList.toggle('is-actief', n === i)); gsap.to(vb, { opacity: 1, duration: .3 }); });
      });
      rijen.addEventListener('pointerleave', () => gsap.to(vb, { opacity: 0, duration: .3 }));
    }

    addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ---------- contactformulier: mailto en WhatsApp, niets wordt opgeslagen ---------- */
  const form = $('#aanvraag');
  if (form) {
    const overzicht = $('#overzicht');
    const velden = ['naam', 'telefoon', 'email', 'datum', 'onderwerp', 'personen', 'bericht'];
    const label = { naam: 'Naam', telefoon: 'Telefoon', email: 'E-mail', datum: 'Datum of gelegenheid', onderwerp: 'Waar wil je mee beginnen?', personen: 'Aantal personen', bericht: 'Bericht' };
    const val = n => form.elements[n].value.trim();
    const txt = n => n === 'onderwerp' ? form.elements.onderwerp.selectedOptions[0].text : val(n);
    const fout = (n, t) => { const f = form.elements[n]; f.setAttribute('aria-invalid', !!t); $('#fout-' + n).textContent = t || ''; };
    const params = new URLSearchParams(location.search);
    if (params.get('onderwerp')) { const s = form.elements.onderwerp; [...s.options].forEach(o => { if (o.value === params.get('onderwerp')) s.value = o.value; }); }
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      fout('naam', val('naam') ? '' : 'Vul je naam in.'); if (!val('naam')) ok = false;
      const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'));
      const telOk = val('telefoon').replace(/\D/g, '').length >= 8;
      fout('telefoon', ''); fout('email', '');
      if (!mailOk && !telOk) { fout('telefoon', 'Laat een telefoonnummer of e-mailadres achter.'); fout('email', val('email') ? 'Dit e-mailadres lijkt niet te kloppen.' : ''); ok = false; }
      else if (val('email') && !mailOk) { fout('email', 'Dit e-mailadres lijkt niet te kloppen.'); ok = false; }
      fout('onderwerp', val('onderwerp') ? '' : 'Kies een optie.'); if (!val('onderwerp')) ok = false;
      if (!ok) { const eerste = form.querySelector('[aria-invalid="true"]'); if (eerste) eerste.focus(); return; }
      const regels = velden.filter(n => val(n)).map(n => `${label[n]}: ${txt(n)}`);
      const tekst = `Hallo Wesley's Ambacht,\n\nIk wil graag een offerte aanvragen.\n\n${regels.join('\n')}`;
      const dl = $('#overzicht-lijst'); dl.textContent = '';
      velden.filter(n => val(n)).forEach(n => { const dt = document.createElement('dt'); dt.textContent = label[n]; const dd = document.createElement('dd'); dd.textContent = txt(n); dl.append(dt, dd); });
      $('#stuur-mail').href = `mailto:info@ambachtswinkel.nl?subject=${encodeURIComponent('Offerte-aanvraag via de website')}&body=${encodeURIComponent(tekst)}`;
      $('#stuur-wa').href = `https://wa.me/31639581128?text=${encodeURIComponent(tekst)}`;
      form.hidden = true; overzicht.hidden = false; overzicht.focus();
      overzicht.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
    $('#wijzig').addEventListener('click', () => { overzicht.hidden = true; form.hidden = false; form.elements.naam.focus(); });
  }

  const jaar = $('#jaar'); if (jaar) jaar.textContent = new Date().getFullYear();
})();
