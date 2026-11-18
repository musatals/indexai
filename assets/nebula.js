/* IndexAI Aether — original interactive cloud & particle nebula.
   Based on seeded canvas drawing, no third-party media, no tracking.
   Reduced-motion, battery/performance and visibility aware. */
const TWO_PI = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easing = (v, t, f) => v + (t - v) * f;
function randomSource(seed) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
function rgb(c, alpha) {
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + alpha + ')';
}
function lightPalette(dark) {
  return dark
    ? [[252, 197, 131], [225, 143, 110], [151, 190, 198], [220, 185, 223], [255, 239, 204]]
    : [[156, 93, 62], [188, 114, 77], [113, 137, 126], [167, 133, 164], [238, 193, 132]];
}
export function mountNebula(stage) {
  const canvas = stage && stage.querySelector('canvas');
  const hero = stage && stage.closest('.hero-nebula');
  const galaxyVisual = stage && stage.closest('.galaxy-visual');
  if (!canvas || !hero || !galaxyVisual) return () => {};
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return () => {};
  const toggle = hero.querySelector('.nebula-motion-toggle');
  const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lowPower = window.matchMedia('(pointer: coarse)').matches;
  let w = 0, h = 0, scale = 1, radius = 0;
  let dark = false, haze = null, dust = [];
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  let pressure = 0, burst = 0, visible = true, destroyed = false;
  let raf = 0, last = 0, frameTime = 0;
  // Orbit words around the central IA sun; keep the words upright and clickable.
  const orbit = galaxyVisual.querySelector('.visual-orbit');
  const orbitNodes = [...(orbit?.querySelectorAll('[data-orbit-index]') || [])];
  let orbitPhase = 0, orbitLast = 0, orbitInteracting = false;
  function positionOrbit() {
    if (!orbit || !orbitNodes.length) return;
    for (const node of orbitNodes) {
      const i = Number(node.dataset.orbitIndex);
      const angle = -Math.PI / 2 + i * TWO_PI / orbitNodes.length + orbitPhase;
      node.style.left = (50 + 38 * Math.cos(angle)).toFixed(3) + '%';
      node.style.top = (50 + 40 * Math.sin(angle)).toFixed(3) + '%';
    }
  }
  function orbitHoverStart() { orbitInteracting = true; }
  function orbitHoverEnd() { orbitInteracting = orbit?.contains(document.activeElement) || false; }
  function orbitFocusStart() { orbitInteracting = true; }
  function orbitFocusEnd() { orbitInteracting = orbit?.contains(document.activeElement) || false; }

  let userPaused = false;
  try { userPaused = sessionStorage.getItem('indexai-nebula-paused') === '1'; } catch (_) {}
  let motion = !reducedMedia.matches && !userPaused;
  const onScreen = new IntersectionObserver(entries => {
    visible = !!entries[0]?.isIntersecting;
    if (visible) requestFrame();
  }, { threshold: 0.01 });
  const rand = randomSource(794315);
  const palette = () => lightPalette(dark);
  const center = () => [w * .5, h * .5];
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  function particles() {
    const count = w < 680 ? 475 : w < 1024 ? 790 : 1320;
    const arms = 4;
    dust = [];
    for (let i = 0; i < count; i++) {
      const arm = i % arms;
      const r = Math.pow(rand(), .68) * 1.10;
      const a = (arm / arms) * TWO_PI + 5.15 * r + (rand() - .5) * (.19 + r * .51);
      dust.push({
        r, a, z: (rand() - .5) * .25, speed: .12 + rand() * .32,
        size: (rand() < .13 ? 1.35 : .45) + rand() * (w < 680 ? .65 : 1.25),
        phase: rand() * TWO_PI, kind: Math.floor(rand() * 5)
      });
    }
  }
  function drawHaze() {
    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(w));
    off.height = Math.max(1, Math.round(h));
    const hctx = off.getContext('2d');
    if (!hctx) return null;
    const [cx, cy] = center();
    const colors = palette();
    const rgen = randomSource(20261115);
    const layers = w < 680 ? 58 : 104;
    // Layered, soft, overlapping wisps—an abstract, volumetric cloud field.
    for (let i = 0; i < layers; i++) {
      const r = Math.pow(rgen(), .75);
      const arm = i % 4;
      const theta = arm * TWO_PI / 4 + r * 5.2 + (rgen() - .5) * .8;
      const x = cx + Math.cos(theta) * radius * r;
      const y = cy + Math.sin(theta) * radius * r * .65;
      const size = radius * (.10 + rgen() * .30);
      const color = colors[(i + arm) % colors.length];
      const opacity = dark ? .045 + rgen() * .085 : .032 + rgen() * .060;
      const g = hctx.createRadialGradient(x, y, size * .05, x, y, size);
      g.addColorStop(0, rgb(color, opacity));
      g.addColorStop(.42, rgb(color, opacity * .6));
      g.addColorStop(1, rgb(color, 0));
      hctx.fillStyle = g;
      hctx.beginPath();
      hctx.arc(x, y, size, 0, TWO_PI);
      hctx.fill();
    }
    // Bright, soft cloud core.
    const core = hctx.createRadialGradient(cx, cy, 2, cx, cy, radius * .82);
    const coreCol = dark ? [251, 190, 131] : [227, 171, 127];
    core.addColorStop(0, rgb(coreCol, dark ? .17 : .14));
    core.addColorStop(.26, rgb(coreCol, dark ? .085 : .065));
    core.addColorStop(1, rgb(coreCol, 0));
    hctx.fillStyle = core;
    hctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    return off;
  }
  function resize() {
    const bounds = stage.getBoundingClientRect();
    w = Math.max(1, bounds.width);
    h = Math.max(1, bounds.height);
    scale = Math.min(window.devicePixelRatio || 1, 1.4) * (lowPower ? .75 : .85);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    radius = Math.min(h * .72, w * (w < 700 ? .48 : .33));
    dark = isDark();
    particles();
    haze = drawHaze();
    positionOrbit();
    draw(performance.now());
  }
  function draw(ms) {
    if (destroyed || w < 2 || h < 2) return;
    ctx.clearRect(0, 0, w, h);
    const time = ms * .001;
    const colorList = palette();
    const [cx, cy] = center();
    const shiftX = pointerX * (w < 680 ? 11 : 24);
    const shiftY = pointerY * 14;
    const twist = motion ? Math.sin(time * .35) * .06 : 0;
    if (haze) {
      ctx.save();
      ctx.translate(cx + shiftX * .48, cy + shiftY * .48);
      ctx.rotate(twist + pointerX * .025);
      ctx.scale(1.02 + pressure * .027, 1.02 + pressure * .015);
      ctx.drawImage(haze, -cx, -cy, w, h);
      ctx.restore();
    }
    const ambient = dark ? .42 : .38;
    const spin = motion ? time * .15 : 0;
    // A gently turning field of stars suspended inside the cloud structure.
    ctx.save();
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      const angle = d.a + spin * d.speed + pointerX * .055 + pressure * .09 * (1 - d.r);
      const rr = radius * d.r * (1 + pressure * .042);
      const depth = 1 + d.z * .3;
      const x = cx + shiftX * (1 - d.r * .22) + Math.cos(angle) * rr * depth;
      const y = cy + shiftY * (1 - d.r * .22) + Math.sin(angle) * rr * .60 + d.z * 18;
      if (x < 0 || x > w || y < 0 || y > h) continue;
      const flicker = motion ? .68 + .30 * Math.sin(time * (1.05 + d.speed) + d.phase) : .82;
      const alpha = clamp((ambient + (1 - d.r) * .42) * flicker + (i % 29 === 0 ? .16 : 0), .12, .95);
      ctx.fillStyle = rgb(colorList[d.kind], alpha);
      const s = d.size * (1.06 - d.r * .24);
      if (s < 1.35) {
        ctx.fillRect(x, y, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, s * .50, 0, TWO_PI);
        ctx.fill();
      }
      if (i % 53 === 0) {
        ctx.fillStyle = rgb(colorList[d.kind], alpha * .085);
        ctx.beginPath();
        ctx.arc(x, y, s * 3.9, 0, TWO_PI);
        ctx.fill();
      }
    }
    ctx.restore();
    // The visitor can send a soft pulse through the nebula by clicking its empty space.
    if (burst > .01) {
      const rr = radius * (1.4 - burst) * .9;
      ctx.strokeStyle = rgb(colorList[0], burst * (dark ? .23 : .18));
      ctx.lineWidth = 1 + burst * 1.6;
      ctx.beginPath();
      ctx.ellipse(cx + shiftX, cy + shiftY, rr, rr * .62, pointerX * .12, 0, TWO_PI);
      ctx.stroke();
    }
  }
  function updatePauseButton() {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(!motion));
    toggle.querySelector('.nebula-toggle-icon').textContent = motion ? 'Ⅱ' : '▶';
    const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';
    const label = reducedMedia.matches
      ? (lang === 'fr' ? 'Mouvement réduit' : 'Reduced motion')
      : motion ? (lang === 'fr' ? 'Pause' : 'Pause') : (lang === 'fr' ? 'Animer' : 'Play');
    toggle.querySelector('.nebula-toggle-label').textContent = label;
    toggle.setAttribute('aria-label', reducedMedia.matches
      ? label
      : (motion ? (lang === 'fr' ? 'Mettre en pause les nuages' : 'Pause cloud animation')
                : (lang === 'fr' ? 'Relancer les nuages' : 'Resume cloud animation')));
    toggle.disabled = !!reducedMedia.matches;
  }
  function requestFrame() {
    if (destroyed || !visible || !motion || document.hidden || raf) return;
    raf = window.requestAnimationFrame(tick);
  }
  function tick(now) {
    raf = 0;
    if (destroyed || !visible || !motion || document.hidden) return;
    const delay = lowPower ? 1000 / 17 : 1000 / 28;
    if (now - frameTime >= delay) {
      if (orbitLast && !orbitInteracting) {
        orbitPhase = (orbitPhase + Math.min((now - orbitLast) / 1000, .12) * .052) % TWO_PI;
        positionOrbit();
      }
      orbitLast = now;
      pointerX = easing(pointerX, targetX, .07);
      pointerY = easing(pointerY, targetY, .07);
      pressure *= .93;
      burst *= .94;
      draw(now);
      frameTime = now;
    }
    requestFrame();
  }
  function pointermove(e) {
    const rect = stage.getBoundingClientRect();
    targetX = clamp((e.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    targetY = clamp((e.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
    pressure = clamp(pressure + .035, 0, 1);
    requestFrame();
  }
  function pointerleave() { targetX = 0; targetY = 0; }
  function pointerdown(e) {
    if (e.target.closest('a,button,input,select,textarea')) return;
    burst = 1; pressure = .9;
    if (!motion) draw(performance.now());
  }
  function onToggle(e) {
    e.stopPropagation();
    userPaused = !userPaused;
    try { sessionStorage.setItem('indexai-nebula-paused', userPaused ? '1' : '0'); } catch (_) {}
    motion = !reducedMedia.matches && !userPaused;
    if (motion) requestFrame();
    else {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      draw(performance.now());
    }
    updatePauseButton();
  }
  function onMotionChange() {
    motion = !reducedMedia.matches && !userPaused;
    updatePauseButton();
    if (motion) requestFrame();
    else {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      draw(performance.now());
    }
  }
  function onVisibility() { if (!document.hidden) requestFrame(); }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  if (observer) observer.observe(stage);
  else window.addEventListener('resize', resize, { passive: true });
  onScreen.observe(stage);
  if (orbit) {
    orbit.addEventListener('pointerenter', orbitHoverStart);
    orbit.addEventListener('pointerleave', orbitHoverEnd);
    orbit.addEventListener('focusin', orbitFocusStart);
    orbit.addEventListener('focusout', orbitFocusEnd);
  }
  galaxyVisual.addEventListener('pointermove', pointermove, { passive: true });
  galaxyVisual.addEventListener('pointerleave', pointerleave, { passive: true });
  galaxyVisual.addEventListener('pointerdown', pointerdown, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  if (reducedMedia.addEventListener) reducedMedia.addEventListener('change', onMotionChange);
  if (toggle) toggle.addEventListener('click', onToggle);
  resize();
  updatePauseButton();
  requestFrame();
  return () => {
    destroyed = true;
    if (raf) cancelAnimationFrame(raf);
    if (observer) observer.disconnect();
    else window.removeEventListener('resize', resize);
    onScreen.disconnect();
    if (orbit) {
      orbit.removeEventListener('pointerenter', orbitHoverStart);
      orbit.removeEventListener('pointerleave', orbitHoverEnd);
      orbit.removeEventListener('focusin', orbitFocusStart);
      orbit.removeEventListener('focusout', orbitFocusEnd);
    }
    galaxyVisual.removeEventListener('pointermove', pointermove);
    galaxyVisual.removeEventListener('pointerleave', pointerleave);
    galaxyVisual.removeEventListener('pointerdown', pointerdown);
    document.removeEventListener('visibilitychange', onVisibility);
    if (reducedMedia.removeEventListener) reducedMedia.removeEventListener('change', onMotionChange);
    if (toggle) toggle.removeEventListener('click', onToggle);
    canvas.width = canvas.height = 0;
  };
}
