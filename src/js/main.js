/* DAVYCAS International — interactions.
   Le contenu reste lisible sans JavaScript ; ce script ajoute : menu mobile, sous-menus,
   diaporama du héros, apparitions au défilement, compteurs, galerie et envoi du formulaire.
   Toute animation s'arrête avec prefers-reduced-motion. */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 1240px)');
  const cssMs = (name, fallback) => { const v = getComputedStyle(root).getPropertyValue(name).trim(); return v ? (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000) : fallback; };

  /* ---------- Menu mobile ---------- */
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('menu');
  const outside = () => [document.querySelector('main'), document.querySelector('.site-footer'), document.querySelector('.donate-bar')].filter(Boolean);
  const setMenu = (open, focusBack) => {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    const label = toggle.querySelector('.menu-toggle__label');
    label.textContent = open ? label.dataset.close : label.dataset.open;
    outside().forEach((el) => { el.inert = open; });
    if (open) menu.querySelector('a, button')?.focus();
    else if (focusBack) toggle.focus();
  };
  if (toggle && menu) {
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    wide.addEventListener('change', () => setMenu(false));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  }

  /* ---------- Sous-menus (Interventions, Nos produits) ---------- */
  const subToggles = [...document.querySelectorAll('.site-nav__toggle')];
  const closeSubs = (except) => subToggles.forEach((b) => { if (b !== except) b.setAttribute('aria-expanded', 'false'); });
  subToggles.forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = b.getAttribute('aria-expanded') !== 'true';
      closeSubs(b);
      b.setAttribute('aria-expanded', String(open));
    });
    b.parentElement.addEventListener('focusout', (e) => { if (wide.matches && !b.parentElement.contains(e.relatedTarget)) b.setAttribute('aria-expanded', 'false'); });
  });
  document.addEventListener('click', (e) => { if (wide.matches && !e.target.closest('.has-sub')) closeSubs(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openSub = subToggles.find((b) => b.getAttribute('aria-expanded') === 'true');
    if (openSub) { openSub.setAttribute('aria-expanded', 'false'); openSub.focus(); return; }
    if (body.classList.contains('menu-open')) setMenu(false, true);
  });

  /* ---------- En-tête : fond translucide dès qu'on défile ---------- */
  const header = document.querySelector('[data-header]');
  const onHeader = () => header?.classList.toggle('is-solid', window.scrollY > 24);
  onHeader();
  window.addEventListener('scroll', onHeader, { passive: true });

  /* ---------- Barre de don mobile : masquée sur le héros et le pied de page ---------- */
  const bar = document.querySelector('.donate-bar');
  const watched = [document.querySelector('.hero, .page-hero, .simple-hero'), document.querySelector('.site-footer')].filter(Boolean);
  if (bar && watched.length) {
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
      bar.classList.toggle('is-hidden', visible.size > 0);
    });
    watched.forEach((el) => io.observe(el));
  }

  /* ---------- Apparitions au défilement ---------- */
  const revealIO = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

  /* ---------- Héros : diaporama, barres cliquables, pause ---------- */
  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const slides = [...hero.querySelectorAll('[data-slide]')];
    const bars = [...hero.querySelectorAll('[data-bar]')];
    const pause = hero.querySelector('[data-pause]');
    const DURATION = cssMs('--duration-slide', 7000);
    let index = 0; let playing = !reduce.matches; let userPaused = false; let start = performance.now(); let elapsed = 0;
    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((s, i) => { const on = i === index; s.classList.toggle('is-active', on); s.inert = !on; });
      bars.forEach((b, i) => { b.setAttribute('aria-current', i === index ? 'true' : 'false'); b.style.setProperty('--p', i < index ? 1 : 0); });
      elapsed = 0; start = performance.now();
    };
    const setPlaying = (on) => {
      if (on && !playing) start = performance.now();
      if (!on && playing) elapsed += performance.now() - start;
      playing = on;
      pause.setAttribute('aria-label', on ? pause.dataset.labelPause : pause.dataset.labelPlay);
      hero.classList.toggle('is-paused', !on);
    };
    const tick = (now) => {
      if (playing && !document.hidden) {
        const p = Math.min(1, (elapsed + now - start) / DURATION);
        bars[index].style.setProperty('--p', p);
        if (p >= 1) show(index + 1);
      }
      requestAnimationFrame(tick);
    };
    bars.forEach((b, i) => b.addEventListener('click', () => show(i)));
    pause.addEventListener('click', () => { userPaused = playing; setPlaying(!playing); });
    hero.addEventListener('focusin', (e) => { if (e.target.closest('[data-slide]')) setPlaying(false); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start = performance.now() - elapsed; });
    reduce.addEventListener('change', () => setPlaying(!reduce.matches && !userPaused));
    show(0);
    setPlaying(!reduce.matches);
    requestAnimationFrame(tick);
  }

  /* ---------- Compteurs ---------- */
  const countIO = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    countIO.unobserve(en.target);
    const el = en.target; const target = Number(el.dataset.count);
    if (reduce.matches || !Number.isFinite(target)) return;
    const prefix = el.dataset.prefix || ''; const suffix = el.dataset.suffix || '';
    const t0 = performance.now(); const dur = cssMs('--duration-reveal', 900) * 1.6;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((c) => countIO.observe(c));

  /* ---------- Galeries horizontales : boutons précédent / suivant ---------- */
  document.querySelectorAll('[data-gallery]').forEach((g) => {
    const track = g.querySelector('.gallery__track');
    const prev = g.querySelector('[data-prev]'); const next = g.querySelector('[data-next]');
    const update = () => {
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    const step = () => (track.querySelector('.gallery__item')?.offsetWidth || 300) + 16;
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduce.matches ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduce.matches ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Formulaire de contact ---------- */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    form.noValidate = true;
    const status = form.querySelector('[data-form-status]');
    const msg = (k) => form.dataset[k];
    const started = performance.now();
    const params = new URLSearchParams(location.search);
    const objet = form.querySelector('#objet');
    if (objet && params.get('objet') && [...objet.options].some((o) => o.value === params.get('objet'))) objet.value = params.get('objet');
    if (params.get('envoi') === 'ok') { status.className = 'form-status form-status--ok'; status.textContent = msg('ok'); }
    if (params.get('envoi') === 'erreur') { status.className = 'form-status form-status--error'; status.textContent = msg('error'); }
    const validate = (field) => {
      const err = document.getElementById(`${field.id}-error`);
      let m = '';
      if (field.type === 'checkbox') { if (field.required && !field.checked) m = msg('consent'); }
      else if (field.validity.valueMissing) m = msg('required');
      else if (field.validity.typeMismatch) m = msg('email');
      else if (field.validity.tooShort) m = msg('short');
      field.setAttribute('aria-invalid', m ? 'true' : 'false');
      if (err) err.textContent = m;
      return !m;
    };
    const fields = [...form.querySelectorAll('input, select, textarea')].filter((f) => f.id && !f.closest('.hp'));
    fields.forEach((f) => f.addEventListener('blur', () => validate(f)));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status'; status.textContent = '';
      if (!fields.map(validate).every(Boolean)) { fields.find((f) => f.getAttribute('aria-invalid') === 'true')?.focus(); return; }
      const btn = form.querySelector('[type="submit"]');
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = msg('sending');
      const data = new FormData(form);
      data.set('duree', String(Math.round((performance.now() - started) / 1000)));
      try {
        const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) throw new Error(json.error || '');
        form.reset();
        status.className = 'form-status form-status--ok'; status.textContent = msg('ok');
      } catch (err) {
        status.className = 'form-status form-status--error';
        status.textContent = msg('error') + (err.message ? ` (${err.message})` : '');
      } finally {
        btn.disabled = false; btn.textContent = label; status.focus();
      }
    });
  }
})();

/* ---------- Filtres de la page Projets ---------- */
(() => {
  const group = document.querySelector('[data-filters]');
  const list = document.querySelector('[data-filter-list]');
  if (!group || !list) return;
  const status = document.querySelector('[data-filter-status]');
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    group.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const f = btn.dataset.filter;
    let n = 0;
    list.querySelectorAll(':scope > li').forEach((li) => {
      const show = f === 'all' || li.dataset.tags.split(' ').includes(f);
      li.hidden = !show;
      if (show) n += 1;
    });
    if (status) status.textContent = `${n} ${document.documentElement.lang === 'en' ? 'projects' : 'projets'}`;
  });
})();
