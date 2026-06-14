// ── VISUAL EFFECTS ENGINE ──────────────────────────────────────
// Futuristic & clean — no gimmicks, no jank.
// Effects: cursor ambient glow · card spotlight · hero parallax
//          section line draws · stat cell warmth

(function () {
  'use strict';

  // Bail out early if user prefers reduced motion
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── INJECT STYLES ─────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    /* ── Cursor ambient glow overlay ── */
    #kf-glow {
      pointer-events: none;
      position: fixed;
      inset: 0;
      z-index: 0;
      opacity: 0;
      transition: opacity 1.2s ease;
      mix-blend-mode: normal;
    }

    /* ── Card spotlight ── */
    .project-card,
    .design-card,
    .skill-cell {
      position: relative;
      overflow: hidden;
    }
    .project-card::after,
    .design-card::after,
    .skill-cell::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        350px circle at var(--mx, -999px) var(--my, -999px),
        rgba(255,255,255,0.05) 0%,
        transparent 70%
      );
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.5s;
      z-index: 2;
    }
    .project-card:hover::after,
    .design-card:hover::after,
    .skill-cell:hover::after { opacity: 1; }

    /* ── Stat cell inner glow ── */
    .stat-cell {
      position: relative;
      overflow: hidden;
    }
    .stat-cell::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        220px circle at var(--mx, 50%) var(--my, 50%),
        rgba(212, 136, 12, 0.07) 0%,
        transparent 70%
      );
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.4s;
    }
    .stat-cell:hover::after { opacity: 1; }

    /* ── Section label line draw ── */
    .section-label {
      display: inline-block;
      position: relative;
    }
    .section-label::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 0;
      width: 0;
      height: 1px;
      background: var(--amber);
      transition: width 0.9s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .section-label.kf-line-drawn::after {
      width: 100%;
    }

    /* ── Project card border glow on hover ── */
    .project-card {
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .project-card:hover {
      border-color: rgba(212, 136, 12, 0.3) !important;
      box-shadow: 0 0 0 1px rgba(212, 136, 12, 0.12),
                  0 20px 60px rgba(0, 0, 0, 0.35);
    }

    /* ── Page hero grain texture (depth) ── */
    .home-hero-wrap::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      background-size: 200px 200px;
      mix-blend-mode: overlay;
      z-index: 1;
    }

    /* ── Reduced motion overrides ── */
    @media (prefers-reduced-motion: reduce) {
      #kf-glow { display: none !important; }
      .project-card::after,
      .design-card::after,
      .skill-cell::after,
      .stat-cell::after { display: none; }
      .section-label::after { transition: none; }
    }
  `;
  document.head.appendChild(css);

  if (reduced) return;

  // ── 1. CURSOR AMBIENT GLOW ────────────────────────────────────
  // A very faint radial gradient that follows the cursor —
  // makes the page feel like it has a physical light source.
  const glowEl = document.createElement('div');
  glowEl.id = 'kf-glow';
  document.body.prepend(glowEl);

  let mx = innerWidth / 2, my = innerHeight / 2, rafGlow = false;

  function paintGlow() {
    // Read the current amber from CSS (respects colorblind mode swap)
    const amber = getComputedStyle(document.documentElement)
      .getPropertyValue('--amber').trim() || '#D4880C';
    glowEl.style.background =
      `radial-gradient(700px circle at ${mx}px ${my}px, ${hexToRgba(amber, 0.05)} 0%, transparent 65%)`;
    rafGlow = false;
  }

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!rafGlow) { rafGlow = true; requestAnimationFrame(paintGlow); }
  }, { passive: true });

  // Fade in once the cursor moves
  document.addEventListener('mousemove', () => {
    glowEl.style.opacity = '1';
  }, { once: true, passive: true });

  // ── 2. CARD SPOTLIGHT ─────────────────────────────────────────
  // A sharper localised glow inside each card that tracks the cursor.
  function addSpotlight(selector) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      }, { passive: true });
      el.addEventListener('mouseleave', () => {
        el.style.setProperty('--mx', '-999px');
        el.style.setProperty('--my', '-999px');
      });
    });
  }

  addSpotlight('.project-card');
  addSpotlight('.skill-cell');
  addSpotlight('.stat-cell');

  // Re-run for design cards that render dynamically
  const designGrid = document.getElementById('designGrid');
  if (designGrid) {
    new MutationObserver(() => addSpotlight('.design-card'))
      .observe(designGrid, { childList: true });
  }

  // ── 3. HERO PARALLAX ─────────────────────────────────────────
  // The Jeep photo scrolls at 0.25× page speed — gives depth
  // without making text hard to read.
  const heroWrap = document.querySelector('.home-hero-wrap');
  if (heroWrap) {
    window.addEventListener('scroll', () => {
      heroWrap.style.backgroundPositionY =
        `calc(center + ${window.scrollY * 0.25}px)`;
    }, { passive: true });
  }

  // ── 4. SECTION LABEL LINE DRAWS ──────────────────────────────
  // A thin amber underline draws left-to-right when a section
  // label scrolls into view.
  const lineObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('kf-line-drawn');
        lineObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.section-label, .page-label').forEach(el => {
    lineObs.observe(el);
  });

  // ── UTIL ──────────────────────────────────────────────────────
  function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

})();
