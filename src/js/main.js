/* DAVYCAS International — interactions du site.
   Principe : tout le contenu est lisible sans JavaScript ; ce script ajoute le menu mobile,
   le diaporama du héros, les animations (coupées si prefers-reduced-motion) et l'envoi du formulaire. */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const ms = (v) => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);

  /* ---------- Menu mobile ---------- */
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('menu');
  const closeMenu = (focusToggle) => {
    body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.menu-toggle__label').textContent = 'Menu';
    if (focusToggle) toggle.focus();
  };
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.menu-toggle__label').textContent = open ? 'Fermer' : 'Menu';
      if (open) menu.querySelector('a')?.focus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) closeMenu(true);
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(false); });
    window.matchMedia('(min-width: 1080px)').addEventListener('change', () => closeMenu(false));
  }

  /* ---------- En-tête : passe en plein après le héros ---------- */
  const header = document.querySelector('[data-header]');
  const firstHero = document.querySelector('.hero, .page-hero--photo');
  if (header && firstHero && (body.classList.contains('has-hero') || body.classList.contains('has-photo-hero'))) {
    body.classList.add('has-hero');
    const io = new IntersectionObserver(([entry]) => header.classList.toggle('is-solid', !entry.isIntersecting), { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` });
    io.observe(firstHero);
  }

  /* ---------- Barre de soutien mobile : masquée sur le pied de page ---------- */
  const donateBar = document.querySelector('.donate-bar');
  const footer = document.querySelector('.site-footer');
  if (donateBar && footer) {
    // Masquée tant que le héros (qui a ses propres boutons) ou le pied de page sont visibles
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      donateBar.classList.toggle('is-hidden', visible.size > 0);
    });
    io.observe(footer);
    if (firstHero) io.observe(firstHero);
  }

  /* ---------- Découpe en mots ---------- */
  const splitWords = (el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            frag.append(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains('w')) walk(child);
      });
    };
    walk(el);
    el.querySelectorAll('.w').forEach((w, i) => w.style.setProperty('--i', i));
  };
  document.querySelectorAll('[data-words], .lightup').forEach(splitWords);

  /* ---------- Apparitions (titres mot par mot, images qui se dévoilent) ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-words], [data-reveal]').forEach((el) => {
    if (el.closest('.hero')) return;
    revealIO.observe(el);
  });

  /* ---------- Héros : diaporama avec barres cliquables et pause ---------- */
  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const slides = [...hero.querySelectorAll('[data-slide]')];
    const bars = [...hero.querySelectorAll('[data-bar]')];
    const pause = hero.querySelector('[data-pause]');
    const DURATION = ms(cssVar('--duration-slide') || '7000ms');
    let index = 0; let playing = !reduce.matches; let start = performance.now(); let elapsed = 0;

    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((s, i) => {
        const on = i === index;
        s.classList.toggle('is-active', on);
        s.inert = !on;
        if (on) s.querySelector('[data-words]')?.classList.add('is-in');
      });
      bars.forEach((b, i) => {
        b.setAttribute('aria-current', i === index ? 'true' : 'false');
        b.style.setProperty('--p', i < index ? 1 : 0);
      });
      elapsed = 0; start = performance.now();
    };
    const setPlaying = (on) => {
      if (on && !playing) start = performance.now();
      if (!on && playing) elapsed += performance.now() - start;
      playing = on;
      pause.setAttribute('aria-label', on ? 'Mettre le diaporama en pause' : 'Lancer le diaporama');
      hero.classList.toggle('is-paused', !on);
    };
    const tick = (now) => {
      if (playing) {
        const p = Math.min(1, (elapsed + now - start) / DURATION);
        bars[index].style.setProperty('--p', p);
        if (p >= 1) show(index + 1);
      }
      requestAnimationFrame(tick);
    };
    bars.forEach((b, i) => b.addEventListener('click', () => show(i)));
    pause.addEventListener('click', () => setPlaying(!playing));
    hero.addEventListener('focusin', (e) => { if (e.target.closest('[data-slide]')) setPlaying(false); });
    reduce.addEventListener('change', () => setPlaying(!reduce.matches));
    show(0);
    setPlaying(playing);
    if (reduce.matches) setPlaying(false);
    requestAnimationFrame(tick);
  }

  /* ---------- Mots qui s'allument au défilement ---------- */
  const lights = [...document.querySelectorAll('.lightup')];
  /* ---------- Parallaxe légère ---------- */
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  /* ---------- Galerie épinglée à défilement horizontal ---------- */
  const galleries = [...document.querySelectorAll('[data-hscroll]')];
  const wide = window.matchMedia('(min-width: 1080px)');
  const setupGalleries = () => {
    galleries.forEach((g) => {
      const track = g.querySelector('.hscroll__track');
      const pinned = wide.matches && !reduce.matches;
      g.classList.toggle('is-pinned', pinned);
      track.style.transform = '';
      if (pinned) {
        const distance = track.scrollWidth - window.innerWidth;
        g.style.setProperty('--hscroll-height', `${window.innerHeight + Math.max(0, distance)}px`); // hauteur = défilement horizontal à parcourir
        g.dataset.distance = String(Math.max(0, distance));
      }
    });
  };
  setupGalleries();
  window.addEventListener('resize', setupGalleries);
  wide.addEventListener('change', setupGalleries);

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const vh = window.innerHeight;
    lights.forEach((el) => {
      const words = el.querySelectorAll('.w');
      if (reduce.matches) { words.forEach((w) => w.classList.add('is-lit')); return; }
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    });
    if (!reduce.matches) {
      parallax.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        const img = el.querySelector('img');
        if (img) img.style.transform = `translate3d(0, ${(p * -6).toFixed(2)}%, 0) scale(1.12)`;
      });
    }
    galleries.forEach((g) => {
      if (!g.classList.contains('is-pinned')) return;
      const r = g.getBoundingClientRect();
      const total = g.offsetHeight - vh;
      const p = Math.min(1, Math.max(0, -r.top / (total || 1)));
      g.querySelector('.hscroll__track').style.transform = `translate3d(${-p * Number(g.dataset.distance || 0)}px, 0, 0)`;
    });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Compteurs ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const target = Number(el.dataset.count);
      if (reduce.matches || !Number.isFinite(target)) return;
      const suffix = el.dataset.suffix || '';
      const t0 = performance.now();
      const dur = ms(cssVar('--duration-reveal') || '1100ms') * 1.4;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('fr-FR') + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => countIO.observe(c));

  /* ---------- Formulaire de contact ---------- */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const status = form.querySelector('[data-form-status]');
    const time = form.querySelector('[data-form-time]');
    if (time) time.value = String(Date.now());
    const params = new URLSearchParams(location.search);
    const objet = form.querySelector('#objet');
    if (objet && params.get('objet') && [...objet.options].some((o) => o.value === params.get('objet'))) objet.value = params.get('objet');
    if (params.get('envoi') === 'ok') { status.classList.add('form-status--ok'); status.textContent = 'Merci, votre message a bien été envoyé.'; }
    if (params.get('envoi') === 'erreur') { status.classList.add('form-status--error'); status.textContent = `Le message n’a pas pu être envoyé. Écrivez-nous directement à ${form.dataset.fallback}.`; }
    const messages = {
      valueMissing: 'Ce champ est obligatoire.',
      typeMismatch: 'Indiquez une adresse e-mail valide, par exemple nom@domaine.org.',
      tooShort: 'Votre message est un peu court : 20 caractères au minimum.',
    };
    const validate = (field) => {
      const err = form.querySelector(`#${field.id}-error`);
      let msg = '';
      for (const k of Object.keys(messages)) if (field.validity[k]) { msg = messages[k]; break; }
      if (field.type === 'checkbox' && !field.checked && field.required) msg = 'Merci d’accepter le traitement de vos données pour que nous puissions vous répondre.';
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    };
    form.querySelectorAll('input, textarea, select').forEach((f) => {
      if (!f.id || f.closest('.hp')) return;
      f.addEventListener('blur', () => validate(f));
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status'; status.textContent = '';
      const fields = [...form.querySelectorAll('input, textarea, select')].filter((f) => f.id && !f.closest('.hp'));
      const ok = fields.map(validate).every(Boolean);
      if (!ok) { fields.find((f) => f.getAttribute('aria-invalid') === 'true')?.focus(); return; }
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true; btn.textContent = 'Envoi en cours…';
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Erreur');
        form.reset();
        status.classList.add('form-status--ok');
        status.textContent = 'Merci, votre message a bien été envoyé. Nous vous répondrons dès que possible.';
      } catch (err) {
        status.classList.add('form-status--error');
        status.textContent = `Le message n’a pas pu être envoyé. Écrivez-nous directement à ${form.dataset.fallback}.`;
      } finally {
        btn.disabled = false; btn.textContent = 'Envoyer le message';
        status.focus();
      }
    });
  }
})();
