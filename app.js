/* =========================
   3D Particle Tunnel Canvas
   ========================= */
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d', { alpha: false });

let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
const DPR = window.devicePixelRatio || 1;
canvas.width = w * DPR;
canvas.height = h * DPR;
ctx.scale(DPR, DPR);

const perspective = 500;
const particleCount = Math.min(1800, Math.floor((w * h) / 900));
const depth = 1600;
const particles = [];
let hueBase = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--accent-hue')) || 260;

function makeParticle() {
  return {
    x: (Math.random() - 0.5) * w * 2,
    y: (Math.random() - 0.5) * h * 2,
    z: Math.random() * depth,
    r: Math.random() * 2 + 0.2,
    speed: Math.random() * 4 + 2
  };
}
for (let i = 0; i < particleCount; i++) particles.push(makeParticle());

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = w * DPR;
  canvas.height = h * DPR;
  ctx.scale(DPR, DPR);
}
window.addEventListener('resize', resize);

let lastTime = performance.now();
let tick = 0;
function animate(now) {
  const dt = Math.min(60, now - lastTime);
  lastTime = now;
  tick += dt;

  ctx.fillStyle = 'rgba(10,14,22,0.42)';
  ctx.fillRect(0, 0, w, h);

  const centerX = w / 2;
  const centerY = h / 2;
  const rotation = Math.sin(tick * 0.00007) * 0.4;

  ctx.save();
  ctx.translate(centerX, centerY);

  for (let p of particles) {
    p.z -= p.speed * (dt / 16);
    if (p.z <= 0) {
      Object.assign(p, makeParticle(), { z: depth });
    }
    const scale = perspective / p.z;
    const x = (p.x * Math.cos(rotation) - p.y * Math.sin(rotation)) * scale;
    const y = (p.x * Math.sin(rotation) + p.y * Math.cos(rotation)) * scale;

    if (x < -centerX - 100 || x > centerX + 100 || y < -centerY - 100 || y > centerY + 100) continue;

    const alpha = Math.min(1, (1 - p.z / depth) * 1.3);
    const size = p.r * scale * 1.2;

    ctx.beginPath();
    ctx.fillStyle = `hsla(${(hueBase + (p.z / depth) * 120) % 360} 90% 60% / ${alpha})`;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

/* =========================
   Scroll Reveal
   ========================= */
const reveals = [...document.querySelectorAll('.reveal')];
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  })
}, { threshold: 0.25 });

reveals.forEach(el => io.observe(el));

/* =========================
   Tilt Effect (Vanilla)
   ========================= */
const tiltCards = document.querySelectorAll('.tilt');
tiltCards.forEach(card => {
  let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
  let rafId;

  function update() {
    currentX += (targetX - currentX) * 0.15;
    currentY += (targetY - currentY) * 0.15;
    card.style.transform = `perspective(900px) rotateX(${currentY}deg) rotateY(${currentX}deg) translateY(-2px)`;
    rafId = requestAnimationFrame(update);
  }
  function handle(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    targetX = (x - 0.5) * 16;
    targetY = (-(y - 0.5)) * 16;
  }
  function reset() {
    targetX = 0;
    targetY = 0;
  }
  card.addEventListener('pointermove', handle);
  card.addEventListener('pointerleave', reset);
  card.addEventListener('pointerdown', () => card.style.transition = 'transform .25s');
  card.addEventListener('pointerup', () => card.style.transition = '');
  update();
});

/* ================
   Accent Cycling
   ================ */
let lastHueUpdate = 0;
function updateHue(ts) {
  if (ts - lastHueUpdate > 80) {
    hueBase = (hueBase + 0.4) % 360;
    document.documentElement.style.setProperty('--accent-hue', hueBase.toFixed(1));
    lastHueUpdate = ts;
  }
  requestAnimationFrame(updateHue);
}
requestAnimationFrame(updateHue);

/* ================
   Theme Toggle
   ================ */
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const storedTheme = localStorage.getItem('theme');
if (storedTheme) root.dataset.theme = storedTheme;
else root.dataset.theme = 'dark';

themeToggle.addEventListener('click', () => {
  const current = root.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
});

/* ================
   Year Auto
   ================ */
document.getElementById('year').textContent = new Date().getFullYear();

/* ================
   Accessibility improvements
   - Space/Enter on project cards triggers focus "flip" style (optional).
   ================ */
tiltCards.forEach(card => {
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.classList.toggle('active');
    }
  })
});

/* Optional: reduce motion respect */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Lower particle count / disable tilt animation
  particles.length = Math.min(400, particles.length);
  tiltCards.forEach(c => c.style.transition = 'none');
}
