// ── THEME ENGINE ─────────────────────────────────────────────
// Interpolates CSS variables between 5 preset stops (0=black → 100=white)
// Preference saved to localStorage

const THEMES = [
  { // 0 — near black
    bg:'#0E1014', bg2:'#14161C', bg3:'#1A1C22',
    border:'#222530', border2:'#2E3240',
    fg:'#EEEAE4', fgMuted:'#8A8A84', fgDim:'#38383E',
    nav:'rgba(14,16,20,0.94)'
  },
  { // 25 — dark grey (default)
    bg:'#22242A', bg2:'#2A2C34', bg3:'#32353E',
    border:'#3C404C', border2:'#4C5060',
    fg:'#EEEAE4', fgMuted:'#8A8A84', fgDim:'#4A4A52',
    nav:'rgba(34,36,42,0.92)'
  },
  { // 50 — warm light
    bg:'#D4D2CC', bg2:'#CCC9C3', bg3:'#C4C1BB',
    border:'#B4B2AC', border2:'#A4A29C',
    fg:'#1A1A1E', fgMuted:'#686864', fgDim:'#CECCC6',
    nav:'rgba(212,210,204,0.94)'
  },
  { // 75 — light
    bg:'#E8E6E0', bg2:'#DEDAD4', bg3:'#D4D0CA',
    border:'#C0BDB8', border2:'#A8A5A0',
    fg:'#1A1A1E', fgMuted:'#686864', fgDim:'#C4C2BC',
    nav:'rgba(232,230,224,0.94)'
  },
  { // 100 — near white
    bg:'#F5F4F0', bg2:'#EEECE8', bg3:'#E6E4E0',
    border:'#D4D2CE', border2:'#BFBDB8',
    fg:'#0E1014', fgMuted:'#5A5A54', fgDim:'#CECCCA',
    nav:'rgba(245,244,240,0.96)'
  }
];

function relativeLuminance(hex) {
  const [r,g,b] = hexToRgb(hex).map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

function lerpHex(a, b, t) {
  const [r1,g1,b1] = hexToRgb(a);
  const [r2,g2,b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2-r1)*t);
  const g = Math.round(g1 + (g2-g1)*t);
  const bl = Math.round(b1 + (b2-b1)*t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
}

function lerpNav(a, b, t) {
  // interpolate the alpha values of rgba nav strings
  const parseNav = s => {
    const m = s.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
    return m ? [+m[1],+m[2],+m[3],+m[4]] : [0,0,0,0.92];
  };
  const [r1,g1,b1,a1] = parseNav(a);
  const [r2,g2,b2,a2] = parseNav(b);
  return `rgba(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)},${(a1+(a2-a1)*t).toFixed(2)})`;
}

function applyTheme(value) { // value 0–100
  const stops = [0, 25, 50, 75, 100];
  // Find which two stops we're between
  let lo = 0, hi = 1;
  for (let i = 0; i < stops.length - 1; i++) {
    if (value >= stops[i] && value <= stops[i+1]) { lo = i; hi = i+1; break; }
  }
  const t = (value - stops[lo]) / (stops[hi] - stops[lo]);
  const A = THEMES[lo], B = THEMES[hi];

  const r = document.documentElement;

  // Background — always lerp smoothly
  const bg = lerpHex(A.bg, B.bg, t);
  r.style.setProperty('--bg',       bg);
  r.style.setProperty('--bg-2',     lerpHex(A.bg2,     B.bg2,     t));
  r.style.setProperty('--bg-3',     lerpHex(A.bg3,     B.bg3,     t));
  r.style.setProperty('--border',   lerpHex(A.border,  B.border,  t));
  r.style.setProperty('--border-2', lerpHex(A.border2, B.border2, t));

  // Foreground — snap based on bg luminance to avoid unreadable mid-grey zone
  if (relativeLuminance(bg) > 0.18) {
    // Light bg → dark text
    r.style.setProperty('--fg',       '#1A1A1E');
    r.style.setProperty('--fg-muted', '#686864');
    r.style.setProperty('--fg-dim',   '#CECCC6');
  } else {
    // Dark bg → light text
    r.style.setProperty('--fg',       '#EEEAE4');
    r.style.setProperty('--fg-muted', '#8A8A84');
    r.style.setProperty('--fg-dim',   '#4A4A52');
  }

  // Update nav blur colour
  const navBg = lerpNav(A.nav, B.nav, t);
  const styleTag = document.getElementById('theme-nav-style') || (() => {
    const s = document.createElement('style');
    s.id = 'theme-nav-style';
    document.head.appendChild(s);
    return s;
  })();
  styleTag.textContent = `nav { background: ${navBg} !important; }`;
}

function initTheme() {
  const saved = parseInt(localStorage.getItem('kf-theme') || '25');
  applyTheme(saved);

  // Inject the slider panel into the nav
  const toggle = document.querySelector('.nav-toggle');
  if (!toggle) return;

  // Button
  const btn = document.createElement('button');
  btn.id = 'themeBtn';
  btn.setAttribute('aria-label', 'Theme');
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
  btn.style.cssText = 'background:none;border:none;color:var(--fg-muted);cursor:pointer;padding:0.4rem;display:flex;align-items:center;margin-right:0.5rem;transition:color 0.15s;';
  btn.addEventListener('mouseenter', () => btn.style.color = 'var(--fg)');
  btn.addEventListener('mouseleave', () => btn.style.color = 'var(--fg-muted)');
  toggle.parentNode.insertBefore(btn, toggle);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'themePanel';
  panel.style.cssText = `
    position:fixed; top:56px; right:1rem; z-index:500;
    background:var(--bg-2); border:1px solid var(--border);
    padding:1rem 1.25rem; width:220px;
    display:none; box-shadow:0 8px 24px rgba(0,0,0,0.3);
  `;
  const cbSaved = localStorage.getItem('kf-cb') === '1';
  panel.innerHTML = `
    <div style="font-family:var(--mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--fg-muted);margin-bottom:0.85rem;">Brightness</div>
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:var(--fg-muted);flex-shrink:0;"><circle cx="12" cy="12" r="5"/></svg>
      <input type="range" id="themeSlider" min="0" max="100" value="${saved}" style="flex:1;accent-color:var(--amber);cursor:pointer;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--fg-muted);flex-shrink:0;"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:0.85rem;gap:0.35rem;">
      ${[['Dark','0'],['Default','25'],['Mid','50'],['Light','75'],['White','100']].map(([label,val])=>`
        <button onclick="setThemePreset(${val})" style="flex:1;padding:0.3rem 0;font-size:10px;font-family:var(--mono);background:var(--bg-3);border:1px solid var(--border);color:var(--fg-muted);cursor:pointer;transition:border-color 0.15s;" onmouseenter="this.style.borderColor='var(--amber)'" onmouseleave="this.style.borderColor='var(--border)'">${label}</button>
      `).join('')}
    </div>
    <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);">
      <div style="font-family:var(--mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--fg-muted);margin-bottom:0.6rem;">Accessibility</div>
      <button id="cbToggle" onclick="toggleColorblind()" style="width:100%;padding:0.35rem 0;font-size:10px;font-family:var(--mono);background:${cbSaved?'var(--cb-blue,#3A7FD4)':'var(--bg-3)'};border:1px solid ${cbSaved?'var(--cb-blue,#3A7FD4)':'var(--border)'};color:${cbSaved?'#fff':'var(--fg-muted)'};cursor:pointer;transition:all 0.15s;letter-spacing:0.1em;">
        ${cbSaved ? '✓ COLORBLIND MODE ON' : 'COLORBLIND MODE'}
      </button>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('themeSlider').addEventListener('input', e => {
    const v = parseInt(e.target.value);
    applyTheme(v);
    localStorage.setItem('kf-theme', v);
  });

  btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== btn) panel.style.display = 'none';
  });
}

window.setThemePreset = function(val) {
  document.getElementById('themeSlider').value = val;
  applyTheme(val);
  localStorage.setItem('kf-theme', val);
};

// ── COLORBLIND MODE ──────────────────────────────────────────
// Swaps amber (hard for red-green colorblind) → blue (#3A7FD4)
// which is distinguishable across deuteranopia, protanopia & tritanopia.
function applyColorblindMode(enabled) {
  const r = document.documentElement;
  if (enabled) {
    r.style.setProperty('--amber',    '#3A7FD4');
    r.style.setProperty('--amber-hi', '#5A9AEF');
    r.style.setProperty('--cb-blue',  '#3A7FD4');
  } else {
    r.style.removeProperty('--amber');
    r.style.removeProperty('--amber-hi');
  }
}

window.toggleColorblind = function() {
  const enabled = localStorage.getItem('kf-cb') !== '1';
  localStorage.setItem('kf-cb', enabled ? '1' : '0');
  applyColorblindMode(enabled);
  // Update button appearance
  const btn = document.getElementById('cbToggle');
  if (btn) {
    btn.textContent = enabled ? '✓ COLORBLIND MODE ON' : 'COLORBLIND MODE';
    btn.style.background  = enabled ? 'var(--amber)' : 'var(--bg-3)';
    btn.style.borderColor = enabled ? 'var(--amber)' : 'var(--border)';
    btn.style.color       = enabled ? '#fff' : 'var(--fg-muted)';
  }
};

// Run as early as possible to avoid flash
if (document.readyState === 'loading') {
  const v = parseInt(localStorage.getItem('kf-theme') || '25');
  applyTheme(v);
  if (localStorage.getItem('kf-cb') === '1') applyColorblindMode(true);
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  if (localStorage.getItem('kf-cb') === '1') applyColorblindMode(true);
  initTheme();
}
