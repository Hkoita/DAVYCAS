/* Maquettes de direction artistique — héros DAVYCAS
   Diaporama de 4 messages : barres de progression cliquables, bouton pause,
   titres mot par mot, arrêt complet avec prefers-reduced-motion.
   Sans JavaScript : la première diapositive reste affichée, lisible. */
(() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  document.documentElement.classList.add('js');

  const slides = [...hero.querySelectorAll('[data-slide]')];
  const bars = [...hero.querySelectorAll('[data-bar]')];
  const pause = hero.querySelector('[data-pause]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 7000;
  let index = 0;
  let playing = !reduce.matches;
  let start = performance.now();
  let elapsed = 0;
  let raf = 0;

  // Découpe chaque titre en mots pour l'apparition mot par mot
  hero.querySelectorAll('[data-words]').forEach((title) => {
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
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(title);
    title.querySelectorAll('.w').forEach((w, i) => w.style.setProperty('--i', i));
  });

  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((s, i) => {
      const on = i === index;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
      s.inert = !on;
    });
    bars.forEach((b, i) => {
      b.setAttribute('aria-current', i === index ? 'true' : 'false');
      b.style.setProperty('--p', i < index ? 1 : 0);
    });
    elapsed = 0;
    start = performance.now();
  };

  const tick = (now) => {
    if (playing) {
      const p = Math.min(1, (elapsed + now - start) / DURATION);
      bars[index].style.setProperty('--p', p);
      if (p >= 1) show(index + 1);
    }
    raf = requestAnimationFrame(tick);
  };

  const setPlaying = (on) => {
    if (on && !playing) start = performance.now();
    if (!on && playing) elapsed += performance.now() - start;
    playing = on;
    pause.setAttribute('aria-pressed', String(!on));
    pause.setAttribute('aria-label', on ? 'Mettre le diaporama en pause' : 'Relancer le diaporama');
    hero.classList.toggle('is-paused', !on);
  };

  bars.forEach((b, i) => b.addEventListener('click', () => { show(i); }));
  pause.addEventListener('click', () => setPlaying(!playing));
  hero.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });
  reduce.addEventListener('change', () => setPlaying(!reduce.matches));

  show(0);
  setPlaying(playing);
  if (reduce.matches) setPlaying(false);
  raf = requestAnimationFrame(tick);

  // Pour les captures : ?slide=N fige une diapositive
  const q = new URLSearchParams(location.search).get('slide');
  if (q !== null) { show(Number(q)); setPlaying(false); }
})();
