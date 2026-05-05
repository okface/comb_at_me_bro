// Comb At Me Bro — Phase A entry. Wires canvas + loop + HUD + restart.

import { createState, resizeState, updateState } from './game.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = {
  wave: document.getElementById('wave-label'),
  hp: document.getElementById('hp-label'),
  status: document.getElementById('status'),
};
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub = document.getElementById('overlay-sub');
const overlayBtn = document.getElementById('overlay-btn');

let state = null;
let dpr = 1;

function fitCanvas() {
  // logical size = CSS pixel size of the canvas; backing store scaled by DPR.
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (state) resizeState(state, w, h);
  return { w, h };
}

function start() {
  hideOverlay();
  const { w, h } = fitCanvas();
  state = createState(w, h);
  hud.status.textContent = 'PHASE A · defend the hive';
}

function tickHUD() {
  hud.hp.textContent = `HP ${Math.ceil(state.hive.hp)}`;
  hud.wave.textContent = `WAVE 1 / 1`;
  if (state.status === 'lost') {
    showOverlay('The hive has fallen', 'A hornet broke through. Try again?', 'Restart');
  } else if (state.status === 'won') {
    showOverlay('Wave cleared', 'Phase A skeleton works. More to come.', 'Play again');
  }
}

function showOverlay(title, sub, btn) {
  if (!overlay.classList.contains('hidden')) return;
  overlayTitle.textContent = title;
  overlaySub.textContent = sub;
  overlayBtn.textContent = btn;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // clamp big jumps (tab switch)
  last = now;
  if (state) {
    updateState(state, dt);
    render(ctx, state);
    tickHUD();
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => fitCanvas());
overlayBtn.addEventListener('click', start);

// Visibility pause: skip dt accumulation while hidden (prevents big jumps).
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) last = performance.now();
});

start();
requestAnimationFrame(frame);
