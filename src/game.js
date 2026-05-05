// Phase A game logic — state, update step, spawning, collisions.
// Single-file for now; will split into game/ submodules in Phase B.

import { HIVE, HORNET, STRIKER, WAVE_A } from './data.js';

export function createState(width, height) {
  const hive = {
    x: width / 2,
    y: height - 130,
    hp: HIVE.startHP,
    maxHP: HIVE.startHP,
    radius: HIVE.radius,
    breathPhase: 0,
  };
  return {
    width, height,
    hive,
    attackers: [],     // { x, y, hp, type, deathT }
    swarms: [],        // { x, y, vx, vy, target, alive }
    fx: [],            // visual-only effects { kind, x, y, t, life }
    spawnIdx: 0,
    elapsed: 0,
    strikerCooldown: 0,
    status: 'running', // running | won | lost
  };
}

export function resizeState(state, width, height) {
  state.width = width;
  state.height = height;
  state.hive.x = width / 2;
  state.hive.y = height - 130;
}

export function updateState(state, dt) {
  if (state.status !== 'running') return;
  state.elapsed += dt;
  state.hive.breathPhase += dt;

  // --- spawn from wave script
  while (
    state.spawnIdx < WAVE_A.spawns.length &&
    WAVE_A.spawns[state.spawnIdx].t <= state.elapsed
  ) {
    const s = WAVE_A.spawns[state.spawnIdx++];
    if (s.type === 'hornet') spawnHornet(state);
  }

  // --- attackers home toward hive
  for (const a of state.attackers) {
    if (a.deathT != null) { a.deathT += dt; continue; }
    const dx = state.hive.x - a.x;
    const dy = state.hive.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > HORNET.contactRange) {
      a.x += (dx / d) * HORNET.speed * dt;
      a.y += (dy / d) * HORNET.speed * dt;
    } else {
      // touching the hive — apply DoT
      state.hive.hp -= HIVE.contactDPS * dt;
      if (state.hive.hp <= 0) {
        state.hive.hp = 0;
        state.status = 'lost';
      }
    }
  }

  // --- striker volleys
  state.strikerCooldown -= dt;
  if (state.strikerCooldown <= 0) {
    const target = pickClosestLiveAttacker(state);
    if (target) {
      launchSwarm(state, target);
      state.strikerCooldown = STRIKER.cooldown;
    } else {
      state.strikerCooldown = 0.4; // re-check often when idle
    }
  }

  // --- move swarm particles toward their target
  for (const s of state.swarms) {
    if (!s.alive) continue;
    const t = s.target;
    if (!t || t.deathT != null) {
      // retarget if original died mid-flight
      const next = pickClosestLiveAttacker(state, s.x, s.y);
      if (next) s.target = next;
      else { s.alive = false; continue; }
    }
    const dx = s.target.x - s.x;
    const dy = s.target.y - s.y;
    const d = Math.hypot(dx, dy) || 1;
    s.x += (dx / d) * STRIKER.speed * dt;
    s.y += (dy / d) * STRIKER.speed * dt;
    if (d < STRIKER.hitRadius) {
      // hit
      s.target.hp -= STRIKER.damagePerHit;
      s.alive = false;
      state.fx.push({ kind: 'hit', x: s.target.x, y: s.target.y, t: 0, life: 0.32 });
      if (s.target.hp <= 0 && s.target.deathT == null) {
        s.target.deathT = 0;
        state.fx.push({ kind: 'puff', x: s.target.x, y: s.target.y, t: 0, life: 0.55 });
      }
    }
  }

  // --- prune
  state.swarms = state.swarms.filter(s => s.alive);
  state.attackers = state.attackers.filter(a => a.deathT == null || a.deathT < 0.6);
  for (const f of state.fx) f.t += dt;
  state.fx = state.fx.filter(f => f.t < f.life);

  // --- win condition: all spawns done and no live attackers
  const allSpawned = state.spawnIdx >= WAVE_A.spawns.length;
  const liveCount = state.attackers.filter(a => a.deathT == null).length;
  if (allSpawned && liveCount === 0 && state.status === 'running') {
    state.status = 'won';
  }
}

function spawnHornet(state) {
  // spawn somewhere along the top edge, varied horizontally
  const margin = 40;
  const x = margin + Math.random() * (state.width - margin * 2);
  state.attackers.push({
    type: 'hornet',
    x,
    y: -20,
    hp: HORNET.hp,
    deathT: null,
  });
}

function pickClosestLiveAttacker(state, fromX, fromY) {
  const x = fromX ?? state.hive.x;
  const y = fromY ?? state.hive.y;
  let best = null;
  let bestD = Infinity;
  for (const a of state.attackers) {
    if (a.deathT != null) continue;
    const d = Math.hypot(a.x - x, a.y - y);
    if (d < bestD) { bestD = d; best = a; }
  }
  return best;
}

function launchSwarm(state, target) {
  // spawn STRIKER.swarmCount particles in a small disc near the hive
  const cx = state.hive.x;
  const cy = state.hive.y - state.hive.radius * 0.3;
  for (let i = 0; i < STRIKER.swarmCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * STRIKER.spreadRadius;
    state.swarms.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      target,
      alive: true,
    });
  }
}
