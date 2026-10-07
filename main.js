/* L3x · main.js — animación, navegación y transición de página en JS vanilla, sin dependencias. */
(() => {
  const root = document.documentElement;
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const curtain = document.querySelector('.curtain');
  const label = curtain && curtain.querySelector('.curtain-label');
  // Contenedores .reveal cuyos hijos entran escalonados (stagger) en vez de aparecer en bloque.
  const STAGGER = '.hero-copy,.narrow,.section-heading,.content-stack,.cta-grid,.service-grid,.feature-grid,.process-grid,.check-grid,.language-grid,.faq-list';
  const NAMES = { '': 'L3x', 'index.html': 'L3x', 'servicios.html': 'Servicios', 'proyectos.html': 'Proyectos', 'sobre-l3x.html': 'Sobre L3x', 'recursos.html': 'FAQ', 'contacto.html': 'Contacto' };

  /* 1 · Preparación: titulares por palabra (entrada enmascarada) y stagger */
  $$('h1,h2').forEach((h) => {
    const text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    h.textContent = '';
    text.split(/\s+/).forEach((word, i) => {
      const mask = document.createElement('span');
      const inner = document.createElement('span');
      mask.className = 'w';
      mask.setAttribute('aria-hidden', 'true');
      inner.style.setProperty('--i', i);
      inner.textContent = word;
      mask.append(inner);
      h.append(mask, ' ');
    });
  });
  $$('.reveal').filter((el) => el.matches(STAGGER)).forEach((el) => {
    el.dataset.stagger = '';
    [...el.children].forEach((child, i) => child.style.setProperty('--i', i));
  });

  /* 2 · Entrada de página y revelado al hacer scroll */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  }), { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  const start = () => {
    root.classList.add('is-ready');
    setTimeout(() => $$('.reveal').forEach((el) => io.observe(el)), reduce ? 0 : 400);
  };
  const intro = root.classList.contains('is-intro') && !reduce;
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const fonts = Promise.race([document.fonts && document.fonts.ready, new Promise((r) => setTimeout(r, 1000))]);
  // La pantalla de carga se retira cuando la página y las fuentes han cargado (mínimo 1,4 s; tope de seguridad 4,5 s).
  const gate = intro ? Promise.all([loaded, fonts, new Promise((r) => setTimeout(r, 1400))]) : fonts;
  Promise.race([gate, new Promise((r) => setTimeout(r, 4500))]).then(() => {
    const loader = document.querySelector('.loader');
    if (intro && loader) loader.classList.add('is-done');
    setTimeout(start, intro ? 450 : 60);
  });

  /* 3 · Navegación: estado sticky, menú móvil accesible */
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('main-menu');
  if (toggle && menu) {
    $$('li', menu).forEach((li, i) => li.style.setProperty('--i', i));
    var setMenu = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    matchMedia('(min-width: 861px)').addEventListener('change', (e) => e.matches && setMenu(false));
  }

  /* 4 · Scroll: cabecera compacta y parallax sutil (un único listener, throttled con rAF) */
  const hero = document.querySelector('.hero, .page-hero');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (hero && !reduce && y < innerHeight * 1.3) hero.style.setProperty('--sy', y);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* 5 · Foco de luz que sigue al puntero (solo dispositivos con ratón) */
  if (hero && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let frame = 0;
    hero.addEventListener('pointermove', (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', e.clientX - r.left + 'px');
        hero.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    });
  }

  /* 6 · Banda de servicios en bucle */
  const strip = document.querySelector('.signal-grid');
  if (strip && !reduce) {
    [...strip.children].forEach((c) => { const copy = c.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); strip.append(copy); });
    strip.classList.add('is-loop');
  }

  /* 7 · FAQ: apertura y cierre animados */
  $$('details').forEach((d) => {
    const sum = d.querySelector('summary');
    d.classList.toggle('is-open', d.open);
    sum.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      if (d.anim) return;
      const from = d.offsetHeight;
      const closing = d.open;
      if (!closing) d.open = true;
      d.classList.toggle('is-open', !closing);
      const to = closing ? sum.offsetHeight : d.scrollHeight;
      d.anim = d.animate({ height: [from + 'px', to + 'px'] }, { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' });
      d.anim.onfinish = () => { if (closing) d.open = false; d.anim = null; };
    });
  });

  /* 8 · Transición entre páginas: cortinilla que sube al salir y se retira al entrar */
  addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || !curtain || reduce || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.href === location.href || (url.pathname === location.pathname && url.hash)) return;
    e.preventDefault();
    if (typeof setMenu === 'function') setMenu(false);
    label.textContent = NAMES[url.pathname.split('/').pop()] || 'L3x';
    curtain.style.transition = 'none';
    curtain.style.transform = 'translateY(100%)';
    curtain.offsetHeight; // fuerza reflow para que la animación parta desde abajo
    curtain.style.transition = 'transform .65s cubic-bezier(.76,0,.24,1)';
    curtain.style.transform = 'translateY(0)';
    setTimeout(() => { location.href = url.href; }, 650);
  });
  addEventListener('pageshow', (e) => { if (e.persisted && curtain) { curtain.style.cssText = ''; root.classList.add('is-ready'); } });

  /* 9 · Modo claro / oscuro: el atributo inicial lo fija un script en <head> (sin parpadeo); aquí se gestiona el botón */
  const themeBtn = document.querySelector('.theme-toggle');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (mode) => {
    root.dataset.theme = mode;
    if (metaTheme) metaTheme.content = mode === 'light' ? '#ffffff' : '#070707';
    if (themeBtn) themeBtn.setAttribute('aria-label', mode === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
  };
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.classList.add('theme-anim');
    applyTheme(next);
    try { localStorage.setItem('l3x-theme', next); } catch (e) { /* almacenamiento no disponible */ }
    setTimeout(() => root.classList.remove('theme-anim'), 600);
  });
  addEventListener('storage', (e) => { if (e.key === 'l3x-theme') applyTheme(e.newValue === 'light' ? 'light' : 'dark'); });

  $$('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });
})();
