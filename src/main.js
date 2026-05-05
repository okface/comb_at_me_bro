// Comb At Me Bro — Phase B1 entry. Wires canvas + loop + HUD + Ready button.

import { createState, resizeState, updateState, startNextWave, restartRun } from './game.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = {
  wave: document.getElementById('wave-label'),
  hp: document.getElementById('hp-label'),
  status: document.getElementById('status'),
  ready: document.getElementById('ready-btn'),
};
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub = document.getElementById('overlay-sub');
const overlayBtn = document.getElementById('overlay-btn');

let state = null;
let dpr = 1;
let lastPhase = null;

function fitCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (state) resizeState(state, w, h);
  return { w, h };
}

function init() {
  const { w, h } = fitCanvas();
  state = createState(w, h);
  hideOverlay();
  syncHUD(true);
}

function syncHUD(force = false) {
  if (!state) return;
  if (!force && state.phase === lastPhase) {
    // still update dynamic numbers
    hud.hp.textContent = `HP ${Math.ceil(state.hive.hp)}`;
    hud.wave.textContent = state.wave === 0
      ? `WAVE 0 / ${state.totalWaves}`
      : `WAVE ${state.wave} / ${state.totalWaves}`;
    return;
  }
  lastPhase = state.phase;

  hud.hp.textContent = `HP ${Math.ceil(state.hive.hp)}`;
  hud.wave.textContent = state.wave === 0
    ? `WAVE 0 / ${state.totalWaves}`
    : `WAVE ${state.wave} / ${state.totalWaves}`;

  switch (state.phase) {
    case 'idle':
      if (state.wave === 0) {
        hud.status.textContent = 'tap READY to start';
      } else {
        hud.status.textContent = `wave ${state.wave} cleared · next?`;
      }
      hud.ready.classList.remove('hidden');
      hideOverlay();
      break;
    case 'active':
      hud.status.textContent = `wave ${state.wave} in progress`;
      hud.ready.classList.add('hidden');
      hideOverlay();
      break;
    case 'won':
      hud.status.textContent = 'queen victorious';
      hud.ready.classList.add('hidden');
      // small delay so the in-canvas banner is visible first
      setTimeout(() => showOverlay(
        'Queen Victorious',
        `You held the hive across ${state.totalWaves} waves.`,
        'New Run'
      ), 1200);
      break;
    case 'lost':
      hud.status.textContent = 'the hive has fallen';
      hud.ready.classList.add('hidden');
      setTimeout(() => showOverlay(
        'The Hive Has Fallen',
        `You held to wave ${state.wave} of ${state.totalWaves}.`,
        'Try Again'
      ), 1200);
      break;
  }
}

function showOverlay(title, sub, btn) {
  if (!overlay.classList.contains('hidden')) return;
  overlayTitle.textContent = title;
  overlaySub.textContent = sub;
  overlayBtn.textContent = btn;
  overlay.classList.remove('hidden');
}

function hideOverlay() { overlay.classList.add('hidden'); }

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state) {
    updateState(state, dt);
    render(ctx, state);
    syncHUD();
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => fitCanvas());

hud.ready.addEventListener('click', () => {
  startNextWave(state);
  syncHUD(true);
});

overlayBtn.addEventListener('click', () => {
  restartRun(state);
  syncHUD(true);
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) last = performance.now();
});

init();
requestAnimationFrame(frame);
