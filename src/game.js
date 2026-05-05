// Phase B1 game logic — multi-wave runner with idle/active phases.
// Single-file for now; will split into game/ submodules in Phase B2+.

import { HIVE, HORNET, STRIKER, generateWave, TOTAL_WAVES } from './data.js?v=__VERSION__';

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
    attackers: [],
    swarms: [],
    fx: [],
    spawnIdx: 0,
    elapsed: 0,
    strikerCooldown: 0,
    phase: 'idle',         // 'idle' | 'active' | 'won' | 'lost'
    wave: 0,                // 0 before wave 1; increments on startNextWave
    totalWaves: TOTAL_WAVES,
    currentWave: null,      // populated by startNextWave
    banner: null,           // { text, kind, t, life }
  };
}

export function startNextWave(state) {
  if (state.phase !== 'idle') return;
  state.wave += 1;
  state.currentWave = generateWave(state.wave);
  state.spawnIdx = 0;
  state.elapsed = 0;
  state.strikerCooldown = 0;
  state.attackers = [];
  state.swarms = [];
  state.phase = 'active';
  showBanner(state, `WAVE ${state.wave} / ${state.totalWaves}`, 1.8, 'wave-start');
}

export function restartRun(state) {
  state.hive.hp = HIVE.startHP;
  state.attackers = [];
  state.swarms = [];
  state.fx = [];
  state.spawnIdx = 0;
  state.elapsed = 0;
  state.strikerCooldown = 0;
  state.phase = 'idle';
  state.wave = 0;
  state.currentWave = null;
  state.banner = null;
}

function showBanner(state, text, life, kind = 'wave-start') {
  state.banner = { text, kind, t: 0, life };
}

export function resizeState(state, width, height) {
  state.width = width;
  state.height = height;
  state.hive.x = width / 2;
  state.hive.y = height - 130;
}

export function updateState(state, dt) {
  state.hive.breathPhase += dt;

  // banner ticks regardless of phase
  if (state.banner) {
    state.banner.t += dt;
    if (state.banner.t >= state.banner.life) state.banner = null;
  }

  if (state.phase !== 'active') {
    // still let attackers' death timers and swarm fx finish out cleanly
    advanceLeftoverFx(state, dt);
    return;
  }

  state.elapsed += dt;

  // --- spawn from current wave script
  const wave = state.currentWave;
  while (
    wave && state.spawnIdx < wave.spawns.length &&
    wave.spawns[state.spawnIdx].t <= state.elapsed
  ) {
    const s = wave.spawns[state.spawnIdx++];
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
      state.hive.hp -= HIVE.contactDPS * dt;
      if (state.hive.hp <= 0) {
        state.hive.hp = 0;
        state.phase = 'lost';
        showBanner(state, 'HIVE FALLEN', 4, 'lose');
        return;
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
      state.strikerCooldown = 0.4;
    }
  }

  // --- swarm particles fly to target
  for (const s of state.swarms) {
    if (!s.alive) continue;
    if (!s.target || s.target.deathT != null) {
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

  // --- wave clear?
  const allSpawned = state.spawnIdx >= state.currentWave.spawns.length;
  const liveCount = state.attackers.filter(a => a.deathT == null).length;
  if (allSpawned && liveCount === 0) {
    if (state.wave >= state.totalWaves) {
      state.phase = 'won';
      showBanner(state, 'QUEEN VICTORIOUS', 5, 'win');
    } else {
      state.phase = 'idle';
      showBanner(state, `WAVE ${state.wave} CLEARED`, 2.2, 'wave-clear');
    }
  }
}

function advanceLeftoverFx(state, dt) {
  // animations during idle/won/lost: keep death curls and fx finishing.
  for (const a of state.attackers) {
    if (a.deathT != null) a.deathT += dt;
  }
  state.attackers = state.attackers.filter(a => a.deathT == null || a.deathT < 0.6);
  for (const f of state.fx) f.t += dt;
  state.fx = state.fx.filter(f => f.t < f.life);
}

function spawnHornet(state) {
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
