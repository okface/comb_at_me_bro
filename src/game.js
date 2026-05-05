// Phase B1 game logic — multi-wave runner with idle/active phases.
// Single-file for now; will split into game/ submodules in Phase B2+.

import { HIVE, HORNET, STRIKER, ECONOMY, ROLES, ROLE_ORDER, generateWave, TOTAL_WAVES } from './data.js?v=__VERSION__';

export function createState(width, height) {
  const roles = {};
  for (const k of ROLE_ORDER) roles[k] = { rank: 0 };
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
    // economy
    honey: ECONOMY.startHoney,
    larvae: ECONOMY.startLarvae,
    honeyCap: ECONOMY.honeyStorageCap,
    roles,                  // { striker: {rank: 0}, ... }
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
  state.hive.maxHP = HIVE.startHP;
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
  state.honey = ECONOMY.startHoney;
  state.larvae = ECONOMY.startLarvae;
  state.honeyCap = ECONOMY.honeyStorageCap;
  for (const k of ROLE_ORDER) state.roles[k].rank = 0;
}

// ----------------------------------------------------------------------------
// Role helpers (computed from current ranks)
// ----------------------------------------------------------------------------
export function getRoleNextCost(state, key) {
  const role = ROLES[key];
  const cur = state.roles[key].rank;
  if (cur >= role.maxRank) return null;
  return role.costs[cur];
}

export function canInvest(state, key) {
  const cost = getRoleNextCost(state, key);
  return cost != null && state.honey >= cost;
}

export function investRole(state, key) {
  if (!canInvest(state, key)) return false;
  const cost = getRoleNextCost(state, key);
  state.honey -= cost;
  state.roles[key].rank += 1;
  applyRoleEffectsToHive(state);
  return true;
}

// Architects raise the hive's max HP and honey cap. Re-apply any time
// architect rank changes (or on wave start) to keep these in sync.
function applyRoleEffectsToHive(state) {
  const archRank = state.roles.architect.rank;
  const newMaxHP = HIVE.startHP + archRank * ROLES.architect.perRankHiveHP;
  const newCap = ECONOMY.honeyStorageCap + archRank * ROLES.architect.perRankStorage;
  // when max HP grows, give the player the bonus immediately
  const hpDelta = newMaxHP - state.hive.maxHP;
  state.hive.maxHP = newMaxHP;
  state.hive.hp = Math.min(state.hive.maxHP, state.hive.hp + Math.max(0, hpDelta));
  state.honeyCap = newCap;
  if (state.honey > state.honeyCap) state.honey = state.honeyCap;
}

export function getEffectiveSwarmCount(state) {
  return STRIKER.swarmCount + state.roles.striker.rank * ROLES.striker.perRankSwarmBonus;
}

export function getForagerHoneyPerSec(state) {
  return state.roles.forager.rank * ROLES.forager.perRankHoneyPerSec;
}

export function getNurseLarvaeBonus(state) {
  return state.roles.nurse.rank * ROLES.nurse.perRankLarvaePerWave;
}

export function getGuardContactDPS(state) {
  return state.roles.guard.rank * ROLES.guard.perRankContactDPS;
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

  // --- foragers tick honey (capped at storage)
  const honeyTick = getForagerHoneyPerSec(state) * dt;
  if (honeyTick > 0) {
    state.honey = Math.min(state.honeyCap, state.honey + honeyTick);
  }

  // --- spawn from current wave script
  const wave = state.currentWave;
  while (
    wave && state.spawnIdx < wave.spawns.length &&
    wave.spawns[state.spawnIdx].t <= state.elapsed
  ) {
    const s = wave.spawns[state.spawnIdx++];
    if (s.type === 'hornet') spawnHornet(state);
  }

  // --- attackers home toward hive; guards damage anything in contact
  const guardDPS = getGuardContactDPS(state);
  for (const a of state.attackers) {
    if (a.deathT != null) { a.deathT += dt; continue; }
    const dx = state.hive.x - a.x;
    const dy = state.hive.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > HORNET.contactRange) {
      a.x += (dx / d) * HORNET.speed * dt;
      a.y += (dy / d) * HORNET.speed * dt;
    } else {
      // attacker reached the hive — both sides take damage
      state.hive.hp -= HIVE.contactDPS * dt;
      if (guardDPS > 0) {
        a.hp -= guardDPS * dt;
        if (a.hp <= 0 && a.deathT == null) {
          a.deathT = 0;
          state.fx.push({ kind: 'puff', x: a.x, y: a.y, t: 0, life: 0.55 });
        }
      }
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

  // --- swarm particles fly to target with per-bee wobble + speed variance
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
    const dirX = dx / d, dirY = dy / d;
    // perpendicular for sideways wobble
    const perpX = -dirY * s.flip, perpY = dirX * s.flip;
    // tighten the wobble as the bee closes in on the target
    // (full wobble at >120px out, none at hit range — strike feels decisive)
    const closeFactor = Math.min(1, Math.max(0, (d - STRIKER.hitRadius) / 110));
    const wobbleV = Math.cos(state.elapsed * s.wobbleFreq + s.phase)
                  * s.wobbleAmp * closeFactor;
    const baseSpeed = STRIKER.speed * s.speedMul;
    s.x += (dirX * baseSpeed + perpX * wobbleV) * dt;
    s.y += (dirY * baseSpeed + perpY * wobbleV) * dt;
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
    // wave-clear reward
    const honeyReward = ECONOMY.waveClearHoney;
    const larvaeReward = ECONOMY.waveClearLarvae + getNurseLarvaeBonus(state);
    state.honey = Math.min(state.honeyCap, state.honey + honeyReward);
    state.larvae += larvaeReward;
    state.fx.push({
      kind: 'reward', text: `+${honeyReward}🍯  +${larvaeReward}🐝`,
      x: state.width / 2, y: state.height * 0.5, t: 0, life: 2.0,
    });
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
    flutterPhase: Math.random() * Math.PI * 2, // wing buzz offset
  });
  // brief spawn warning chevron at the top edge instead of a constant
  // background pulse — addresses the "flashing dark gradient" complaint.
  state.fx.push({ kind: 'spawn-warn', x, y: 18, t: 0, life: 0.9 });
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
  const [waMin, waMax] = STRIKER.wobbleAmpRange;
  const [wfMin, wfMax] = STRIKER.wobbleFreqRange;
  const [smMin, smMax] = STRIKER.speedMulRange;
  const swarmCount = getEffectiveSwarmCount(state);
  for (let i = 0; i < swarmCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * STRIKER.spreadRadius;
    state.swarms.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      target,
      alive: true,
      // per-bee swarm character
      phase:     Math.random() * Math.PI * 2,
      wobbleAmp: waMin + Math.random() * (waMax - waMin),
      wobbleFreq: wfMin + Math.random() * (wfMax - wfMin),
      speedMul:  smMin + Math.random() * (smMax - smMin),
      // perpendicular flip so half wobble left-first and half right-first
      flip: Math.random() < 0.5 ? 1 : -1,
    });
  }
}
