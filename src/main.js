// Comb At Me Bro — Phase B1 entry. Wires canvas + loop + HUD + Ready button.

import {
  createState, resizeState, updateState,
  startNextWave, restartRun,
  investRole, getRoleNextCost, getRoleNextLarvaeCost,
  chooseSpecAndRankUp, canInvest,
  setModifier, pickModifierOptions,
  applyBoon, pickBoonOptions,
  setPriorityTarget,
  getAvailableAbilities, getAbilityCost, canUseAbility, useAbility, isRallyActive,
} from './game.js?v=__VERSION__';
import { render } from './render.js?v=__VERSION__';
import { ROLES, ROLE_ORDER, ABILITIES } from './data.js?v=__VERSION__';

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
const abilityBar = document.getElementById('ability-bar');
const abilityButtons = {}; // id -> { el, glyph, cost, cd }

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

// ============================================================================
// Ability bar — bottom-of-screen tap-to-cast strip during combat
// ============================================================================
function updateAbilityBar() {
  if (state.phase !== 'active') {
    abilityBar.classList.add('hidden');
    return;
  }
  const ids = getAvailableAbilities(state);
  if (ids.length === 0) {
    abilityBar.classList.add('hidden');
    return;
  }
  abilityBar.classList.remove('hidden');
  // build buttons that don't yet exist
  for (const id of ids) {
    if (!abilityButtons[id]) buildAbilityButton(id);
  }
  // remove buttons whose ability is no longer available (rare)
  for (const existingId of Object.keys(abilityButtons)) {
    if (!ids.includes(existingId)) {
      abilityButtons[existingId].el.remove();
      delete abilityButtons[existingId];
    }
  }
  // refresh state per button
  for (const id of ids) {
    refreshAbilityButton(id);
  }
}

function buildAbilityButton(id) {
  const ab = ABILITIES[id];
  const btn = document.createElement('button');
  btn.className = 'ability-btn';
  btn.innerHTML = `
    <span class="ab-glyph">${ab.glyph}</span>
    <span class="ab-cost"></span>
    <span class="ab-name">${ab.name}</span>
    <div class="ab-cd ready"></div>
  `;
  btn.addEventListener('click', () => {
    if (useAbility(state, id)) {
      flashPill(hud.honeyPill);
    }
  });
  abilityBar.appendChild(btn);
  abilityButtons[id] = {
    el: btn,
    glyph: btn.querySelector('.ab-glyph'),
    cost: btn.querySelector('.ab-cost'),
    cd: btn.querySelector('.ab-cd'),
  };
}

function refreshAbilityButton(id) {
  const slot = abilityButtons[id];
  if (!slot) return;
  const cost = getAbilityCost(state, id);
  const costStr = [
    cost.honey > 0 ? `${cost.honey}🍯` : '',
    cost.larvae > 0 ? `${cost.larvae}🐝` : '',
  ].filter(Boolean).join(' ');
  slot.cost.textContent = costStr || '—';
  const cd = state.abilityCooldowns[id] ?? 0;
  if (cd > 0.05) {
    slot.cd.classList.remove('ready');
    slot.cd.textContent = cd.toFixed(1);
  } else {
    slot.cd.classList.add('ready');
    slot.cd.textContent = '';
  }
  const can = canUseAbility(state, id);
  slot.el.disabled = !can;
  slot.el.classList.toggle('unaffordable',
    !can && cd <= 0.05 && (state.honey < cost.honey || state.larvae < cost.larvae));
  // glow when this ability's effect is active
  const glowing = id === 'rally_hum' && isRallyActive(state);
  slot.el.classList.toggle('glowing', glowing);
}

function syncHUD(force = false) {
  if (!state) return;
  // currency + HP + wave update every frame (cheap)
  updateCurrencyDisplay();
  updateAbilityBar();
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
        hud.status.textContent = 'tap READY when the hive is set';
      } else {
        hud.status.textContent = `wave ${state.wave} held — ready for the next?`;
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
      hud.status.textContent = `wave ${state.wave} at the gates`;
      hud.ready.classList.add('hidden');
      rolesBtn.classList.add('hidden');
      hideRolesPanel();
      hideOverlay();
      break;
    case 'won':
      hud.status.textContent = 'the hive holds';
      hud.ready.classList.add('hidden');
      rolesBtn.classList.add('hidden');
      hideRolesPanel();
      // small delay so the in-canvas banner is visible first
      setTimeout(() => showOverlay(
        'Dawn Breaks',
        `You held the hive through all ${state.totalWaves} waves.`,
        'Another Dawn'
      ), 1200);
      break;
    case 'lost':
      hud.status.textContent = 'the hive has fallen';
      hud.ready.classList.add('hidden');
      rolesBtn.classList.add('hidden');
      hideRolesPanel();
      setTimeout(() => showOverlay(
        'The Hive Has Fallen',
        `You stood until wave ${state.wave} of ${state.totalWaves}.`,
        'Begin Again'
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
    case 'forager':
      return `+${role.perRankHoneyPerSec.toFixed(1)} 🍯/sec`;
    case 'nurse':
      return `+${role.perRankLarvaePerWave} larva per wave`;
    case 'guard':
      return `+${role.perRankContactDPS} damage/sec at the door`;
    case 'striker':
      return `+${role.perRankSwarmBonus} bees per volley`;
    case 'architect':
      return `+${role.perRankHiveHP} hive HP, +${role.perRankStorage} honey storage`;
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
    const honeyCost = getRoleNextCost(state, key);
    const larvaeCost = getRoleNextLarvaeCost(state, key);
    const isMax = honeyCost == null;
    const isSpecChoice = !isMax && (cur + 1 === role.maxRank) && role.specs?.length;
    const canBuy = !isMax && canInvest(state, key);

    const card = document.createElement('div');
    card.className = 'role-card' + (isMax ? ' maxed' : '');

    const dotsHtml = Array.from({ length: role.maxRank }, (_, i) =>
      `<span class="dot${i < cur ? ' filled' : ''}"></span>`
    ).join('');

    let bodyHTML = '';
    if (isMax) {
      // show which spec was chosen
      const chosenSpec = role.specs?.find(s => s.id === state.roles[key].spec);
      if (chosenSpec) {
        bodyHTML = `
          <div class="role-spec-locked">
            <span class="spec-locked-name">★ ${chosenSpec.name}</span>
            <p class="spec-locked-desc">${chosenSpec.description}</p>
          </div>`;
      } else {
        bodyHTML = `<div class="role-next"><span class="role-next-text"><b>Maxed.</b></span></div>`;
      }
    } else if (isSpecChoice) {
      // show 2 spec choice cards
      const costStr = `${honeyCost} 🍯${larvaeCost ? ` · ${larvaeCost} 🐝` : ''}`;
      bodyHTML = `
        <div class="role-next-text"><b>Choose a path</b> <span class="role-cost ${canBuy ? '' : 'unaffordable'}">${costStr}</span></div>
        <div class="spec-choices">
          ${role.specs.map(s => `
            <button class="spec-card" data-key="${key}" data-spec="${s.id}" ${canBuy ? '' : 'disabled'}>
              <span class="spec-name">${s.name}</span>
              <span class="spec-desc">${s.description}</span>
            </button>
          `).join('')}
        </div>
      `;
    } else {
      const costStr = `${honeyCost} 🍯${larvaeCost ? ` · ${larvaeCost} 🐝` : ''}`;
      bodyHTML = `
        <div class="role-next">
          <span class="role-next-text">Next: <b>${describeNextEffect(key, cur)}</b></span>
        </div>
        <div class="role-next">
          <span class="role-cost ${canBuy ? '' : 'unaffordable'}">${costStr}</span>
          <button class="role-btn" data-key="${key}" ${canBuy ? '' : 'disabled'}>INVEST</button>
        </div>
      `;
    }

    card.innerHTML = `
      <span class="role-glyph">${role.glyph}</span>
      <div>
        <div class="role-head">
          <span>${role.name.toUpperCase()}</span>
          <span class="role-rank-dots">${dotsHtml}</span>
        </div>
        <p class="role-desc">${role.description}</p>
        ${bodyHTML}
      </div>
    `;
    rolesList.appendChild(card);
  }

  // wire normal INVEST buttons
  for (const btn of rolesList.querySelectorAll('.role-btn[data-key]')) {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (investRole(state, key)) {
        flashPill(hud.honeyPill);
        renderRolesPanel();
      }
    });
  }
  // wire spec-choice buttons
  for (const btn of rolesList.querySelectorAll('.spec-card[data-spec]')) {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const specId = btn.dataset.spec;
      if (chooseSpecAndRankUp(state, key, specId)) {
        flashPill(hud.honeyPill);
        renderRolesPanel();
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

// ============================================================================
// Tap-to-prioritize: tapping the canvas during combat focuses your strikers
// on the nearest attacker (or clears if you tap empty space).
// ============================================================================
function handleCanvasTap(clientX, clientY) {
  if (!state || state.phase !== 'active') return;
  const rect = canvas.getBoundingClientRect();
  const cx = (clientX - rect.left) * (canvas.width / rect.width) / dpr;
  const cy = (clientY - rect.top)  * (canvas.height / rect.height) / dpr;
  const hit = setPriorityTarget(state, cx, cy);
  // visual feedback regardless of hit/miss
  state.fx.push({
    kind: 'tap-ripple', x: cx, y: cy,
    t: 0, life: hit ? 0.6 : 0.35,
    hit,
  });
}

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 0) return;
  e.preventDefault(); // suppress synthetic click + zoom
  const t = e.touches[0];
  handleCanvasTap(t.clientX, t.clientY);
}, { passive: false });

canvas.addEventListener('click', (e) => {
  handleCanvasTap(e.clientX, e.clientY);
});

init();
requestAnimationFrame(frame);
