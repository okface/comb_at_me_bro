// Comb At Me Bro — Phase B1 entry. Wires canvas + loop + HUD + Ready button.

import {
  createState, resizeState, updateState,
  startNextWave, restartRun,
  investRole, getRoleNextCost,
  setModifier, pickModifierOptions,
  applyBoon, pickBoonOptions,
} from './game.js?v=__VERSION__';
import { render } from './render.js?v=__VERSION__';
import { ROLES, ROLE_ORDER } from './data.js?v=__VERSION__';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = {
  wave: document.getElementById('wave-label'),
  hp: document.getElementById('hp-label'),
  status: document.getElementById('status'),
  ready: document.getElementById('ready-btn'),
  honeyAmount: document.getElementById('honey-amount'),
  honeyCap: document.getElementById('honey-cap'),
  honeyPill: document.getElementById('honey-pill'),
  larvaeAmount: document.getElementById('larvae-amount'),
  larvaePill: document.getElementById('larvae-pill'),
};
let prevHoneyDisplay = null;
let prevLarvaeDisplay = null;
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySub = document.getElementById('overlay-sub');
const overlayBtn = document.getElementById('overlay-btn');
const titleScreen = document.getElementById('title-screen');
const titlePlay = document.getElementById('title-play');
const rolesBtn = document.getElementById('roles-btn');
const rolesPanel = document.getElementById('roles-panel');
const rolesList = document.getElementById('roles-list');
const rolesDone = document.getElementById('roles-done');
const panelHoney = document.getElementById('panel-honey');
const modifierPicker = document.getElementById('modifier-picker');
const modifierOptions = document.getElementById('modifier-options');
const modifierTag = document.getElementById('modifier-tag');
const boonPicker = document.getElementById('boon-picker');
const boonOptions = document.getElementById('boon-options');
let boonPickerScheduled = false;

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

function updateCurrencyDisplay() {
  const honeyDisp = Math.floor(state.honey);
  const larvaeDisp = state.larvae;
  if (honeyDisp !== prevHoneyDisplay) {
    hud.honeyAmount.textContent = honeyDisp;
    if (prevHoneyDisplay != null && honeyDisp > prevHoneyDisplay + 4) {
      // flash on noticeable gain (filters out the every-frame forager tick)
      flashPill(hud.honeyPill);
    }
    prevHoneyDisplay = honeyDisp;
  }
  if (larvaeDisp !== prevLarvaeDisplay) {
    hud.larvaeAmount.textContent = larvaeDisp;
    if (prevLarvaeDisplay != null && larvaeDisp > prevLarvaeDisplay) {
      flashPill(hud.larvaePill);
    }
    prevLarvaeDisplay = larvaeDisp;
  }
  hud.honeyCap.textContent = state.honeyCap;
}

function flashPill(el) {
  el.classList.remove('flash');
  void el.offsetWidth; // restart animation
  el.classList.add('flash');
}

function syncHUD(force = false) {
  if (!state) return;
  // currency + HP + wave update every frame (cheap)
  updateCurrencyDisplay();
  hud.hp.textContent = `HP ${Math.ceil(state.hive.hp)} / ${state.hive.maxHP}`;
  hud.wave.textContent = state.wave === 0
    ? `WAVE 0 / ${state.totalWaves}`
    : `WAVE ${state.wave} / ${state.totalWaves}`;
  // modifier tag
  if (state.modifier) {
    modifierTag.textContent = state.modifier.name;
    modifierTag.style.display = 'inline-block';
  } else {
    modifierTag.style.display = 'none';
  }
  if (!force && state.phase === lastPhase) return;
  lastPhase = state.phase;

  switch (state.phase) {
    case 'idle':
      if (state.wave === 0) {
        hud.status.textContent = 'tap READY to start';
      } else {
        hud.status.textContent = `wave ${state.wave} cleared · next?`;
      }
      hud.ready.classList.remove('hidden');
      rolesBtn.classList.remove('hidden');
      hideOverlay();
      // pending boon pick from a recently-cleared trigger wave?
      if (state.pendingBoonPick && !boonPickerScheduled && boonPicker.classList.contains('hidden')) {
        boonPickerScheduled = true;
        setTimeout(() => {
          boonPickerScheduled = false;
          if (state.pendingBoonPick) showBoonPicker();
        }, 1100);
      }
      break;
    case 'active':
      hud.status.textContent = `wave ${state.wave} in progress`;
      hud.ready.classList.add('hidden');
      rolesBtn.classList.add('hidden');
      hideRolesPanel();
      hideOverlay();
      break;
    case 'won':
      hud.status.textContent = 'queen victorious';
      hud.ready.classList.add('hidden');
      rolesBtn.classList.add('hidden');
      hideRolesPanel();
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
      rolesBtn.classList.add('hidden');
      hideRolesPanel();
      setTimeout(() => showOverlay(
        'The Hive Has Fallen',
        `You held to wave ${state.wave} of ${state.totalWaves}.`,
        'Try Again'
      ), 1200);
      break;
  }
}

// ============================================================================
// Roles panel
// ============================================================================
function describeNextEffect(key, currentRank) {
  const role = ROLES[key];
  switch (key) {
    case 'forager': {
      const nextTotal = (currentRank + 1) * role.perRankHoneyPerSec;
      return `+${role.perRankHoneyPerSec.toFixed(1)} 🍯/s during waves (→ ${nextTotal.toFixed(1)}/s total)`;
    }
    case 'nurse':
      return `+${role.perRankLarvaePerWave} larva per wave clear`;
    case 'guard':
      return `+${role.perRankContactDPS} dmg/s to attackers at the hive`;
    case 'striker':
      return `+${role.perRankSwarmBonus} bees per swarm volley`;
    case 'architect':
      return `+${role.perRankHiveHP} max HP, +${role.perRankStorage} honey storage`;
    default:
      return '+1 rank';
  }
}

function showRolesPanel() {
  renderRolesPanel();
  rolesPanel.classList.remove('hidden');
}

function hideRolesPanel() {
  rolesPanel.classList.add('hidden');
}

function renderRolesPanel() {
  rolesList.innerHTML = '';
  panelHoney.textContent = Math.floor(state.honey);

  for (const key of ROLE_ORDER) {
    const role = ROLES[key];
    const cur = state.roles[key].rank;
    const cost = getRoleNextCost(state, key);
    const isMax = cost == null;
    const canBuy = !isMax && state.honey >= cost;

    const card = document.createElement('div');
    card.className = 'role-card' + (isMax ? ' maxed' : '');

    const dotsHtml = Array.from({ length: role.maxRank }, (_, i) =>
      `<span class="dot${i < cur ? ' filled' : ''}"></span>`
    ).join('');

    card.innerHTML = `
      <span class="role-glyph">${role.glyph}</span>
      <div>
        <div class="role-head">
          <span>${role.name.toUpperCase()}</span>
          <span class="role-rank-dots">${dotsHtml}</span>
        </div>
        <p class="role-desc">${role.description}</p>
        ${isMax
          ? `<div class="role-next"><span class="role-next-text"><b>Maxed.</b></span><button class="role-btn" disabled>MAX</button></div>`
          : `<div class="role-next">
               <span class="role-next-text">Next: <b>${describeNextEffect(key, cur)}</b></span>
             </div>
             <div class="role-next">
               <span class="role-cost ${canBuy ? '' : 'unaffordable'}">${cost} 🍯</span>
               <button class="role-btn" data-key="${key}" ${canBuy ? '' : 'disabled'}>INVEST</button>
             </div>`}
      </div>
    `;
    rolesList.appendChild(card);
  }

  // wire INVEST clicks
  for (const btn of rolesList.querySelectorAll('.role-btn[data-key]')) {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (investRole(state, key)) {
        flashPill(hud.honeyPill);
        renderRolesPanel(); // refresh costs / availability
      }
    });
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

titlePlay.addEventListener('click', () => {
  titleScreen.classList.add('hidden');
  showModifierPicker();
});

function showModifierPicker() {
  modifierOptions.innerHTML = '';
  const opts = pickModifierOptions(3);
  for (const m of opts) {
    const card = document.createElement('div');
    card.className = 'modifier-card';
    card.dataset.modId = m.id;
    card.innerHTML = `
      <h3 class="mod-name">${m.name}</h3>
      <p class="mod-summary">${m.summary}</p>
      <p class="mod-flavor">"${m.flavor}"</p>
      <p class="mod-pushes">Pushes ${m.pushes}</p>
    `;
    card.addEventListener('click', () => {
      setModifier(state, m.id);
      modifierPicker.classList.add('hidden');
      syncHUD(true);
    });
    modifierOptions.appendChild(card);
  }
  modifierPicker.classList.remove('hidden');
}

function showBoonPicker() {
  boonOptions.innerHTML = '';
  const opts = pickBoonOptions(state, 3);
  if (opts.length === 0) {
    // No boons left to offer (somehow). Skip and continue.
    state.pendingBoonPick = false;
    syncHUD(true);
    return;
  }
  for (const b of opts) {
    const card = document.createElement('div');
    card.className = 'modifier-card boon-card';
    card.dataset.boonId = b.id;
    card.innerHTML = `
      <h3 class="mod-name">${b.name}</h3>
      <p class="mod-summary">${b.summary}</p>
      <p class="mod-flavor">"${b.flavor}"</p>
      <p class="mod-pushes">${b.archetype}</p>
    `;
    card.addEventListener('click', () => {
      if (applyBoon(state, b.id)) {
        boonPicker.classList.add('hidden');
        syncHUD(true);
      }
    });
    boonOptions.appendChild(card);
  }
  boonPicker.classList.remove('hidden');
}

rolesBtn.addEventListener('click', showRolesPanel);
rolesDone.addEventListener('click', hideRolesPanel);
rolesPanel.addEventListener('click', (e) => {
  if (e.target === rolesPanel) hideRolesPanel();
});

overlayBtn.addEventListener('click', () => {
  restartRun(state);
  syncHUD(true);
  showModifierPicker();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) last = performance.now();
});

init();
requestAnimationFrame(frame);
