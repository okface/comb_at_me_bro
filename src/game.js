// Phase B1 game logic — multi-wave runner with idle/active phases.
// Single-file for now; will split into game/ submodules in Phase B2+.

import {
  HIVE, HORNET, SPIDER, BEAR, BEEKEEPER, STRIKER,
  ECONOMY, ROLES, ROLE_ORDER,
  MODIFIERS, BOONS, BOON_WAVES,
  generateWave, TOTAL_WAVES,
} from './data.js?v=__VERSION__';

// Look up the per-attacker config so we don't repeat type checks everywhere.
function getAttackerCfg(type) {
  switch (type) {
    case 'hornet':    return HORNET;
    case 'spider':    return SPIDER;
    case 'bear':      return BEAR;
    case 'beekeeper': return BEEKEEPER;
    default:          return HORNET;
  }
}

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
    // run modifier (Hive Condition)
    modifier: null,         // populated by setModifier; null => baseline
    // mid-run boons (collected via picker after BOON_WAVES)
    boons: [],
    pendingBoonPick: false,
    // tap-to-prioritize: strikers home this attacker until it dies
    priorityTarget: null,
  };
}

// Tap an attacker to mark it as priority — strikers will focus it.
// Returns true if a target within range was found.
export function setPriorityTarget(state, x, y, tapRadius = 60) {
  let best = null, bestD = tapRadius;
  for (const a of state.attackers) {
    if (a.deathT != null) continue;
    const d = Math.hypot(a.x - x, a.y - y);
    if (d < bestD) { bestD = d; best = a; }
  }
  state.priorityTarget = best;
  return best !== null;
}

// ----------------------------------------------------------------------------
// getEff(state) — merge modifier + boon effects into a single object.
// Multiplicative keys (suffix "Mul") multiply; everything else adds.
// roleCostMul is per-role nested {key: mul}.
// ----------------------------------------------------------------------------
export function getEff(state) {
  const merged = {};
  const sources = [];
  if (state.modifier?.effects) sources.push(state.modifier.effects);
  for (const b of (state.boons || [])) sources.push(b.effects);
  for (const src of sources) {
    for (const k in src) {
      if (k === 'roleCostMul') {
        merged[k] = merged[k] || {};
        for (const r in src[k]) {
          merged[k][r] = (merged[k][r] ?? 1) * src[k][r];
        }
      } else if (k.endsWith('Mul')) {
        merged[k] = (merged[k] ?? 1) * src[k];
      } else {
        merged[k] = (merged[k] || 0) + src[k];
      }
    }
  }
  return merged;
}

// ----------------------------------------------------------------------------
// Modifier helpers
// ----------------------------------------------------------------------------
export function pickModifierOptions(count = 3) {
  // Return a random subset of MODIFIERS — used by main.js for the picker.
  const pool = [...MODIFIERS];
  const out = [];
  while (out.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export function setModifier(state, modId) {
  state.modifier = MODIFIERS.find(m => m.id === modId) || null;
  // apply HP and storage cap deltas immediately
  applyModifierStartingValues(state);
  applyRoleEffectsToHive(state);
}

function applyModifierStartingValues(state) {
  // re-apply with combined effects (modifier alone at this point;
  // boons aren't picked yet but the helper handles either case)
  const eff = getEff(state);
  const hpBonus = eff.hiveStartHPBonus || 0;
  state.hive.maxHP = HIVE.startHP + hpBonus;
  state.hive.hp = state.hive.maxHP;
  state.honeyCap = ECONOMY.honeyStorageCap * (eff.honeyCapMul ?? 1) + (eff.honeyCapBonus || 0);
}

// ----------------------------------------------------------------------------
// Boons
// ----------------------------------------------------------------------------
export function pickBoonOptions(state, count = 3) {
  // exclude boons the player already has so re-rolls don't repeat
  const taken = new Set((state.boons || []).map(b => b.id));
  const pool = BOONS.filter(b => !taken.has(b.id));
  const out = [];
  while (out.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export function applyBoon(state, boonId) {
  const boon = BOONS.find(b => b.id === boonId);
  if (!boon) return false;
  if (state.boons.some(b => b.id === boonId)) return false;
  state.boons.push(boon);
  state.pendingBoonPick = false;
  // re-derive hive maxHP / honey cap (in case boon affects them)
  applyRoleEffectsToHive(state);
  return true;
}

export function startNextWave(state) {
  if (state.phase !== 'idle') return;
  state.wave += 1;
  state.currentWave = generateWave(state.wave);
  // modifier: add extra hornets to this wave, distributed near the end
  const extra = state.modifier?.effects?.extraHornetsPerWave || 0;
  if (extra > 0) {
    const baseDur = state.currentWave.spawns.length > 0
      ? state.currentWave.spawns[state.currentWave.spawns.length - 1].t
      : 20;
    for (let i = 0; i < extra; i++) {
      state.currentWave.spawns.push({ type: 'hornet', t: baseDur + 1.5 + i * 1.2 });
    }
  }
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
  state.modifier = null;
  state.boons = [];
  state.pendingBoonPick = false;
  state.priorityTarget = null;
  for (const k of ROLE_ORDER) state.roles[k].rank = 0;
}

// ----------------------------------------------------------------------------
// Role helpers (computed from current ranks)
// ----------------------------------------------------------------------------
export function getRoleNextCost(state, key) {
  const role = ROLES[key];
  const cur = state.roles[key].rank;
  if (cur >= role.maxRank) return null;
  const cost = role.costs[cur];
  const eff = getEff(state);
  const perRole = eff.roleCostMul?.[key] ?? 1;
  const allMul = eff.allRoleCostMul ?? 1;
  return Math.max(1, Math.round(cost * perRole * allMul));
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
  const eff = getEff(state);
  const archRank = state.roles.architect.rank;
  const hpBonusFromEff = eff.hiveStartHPBonus || 0;
  const newMaxHP = HIVE.startHP + hpBonusFromEff + archRank * ROLES.architect.perRankHiveHP;
  const baseCap = ECONOMY.honeyStorageCap * (eff.honeyCapMul ?? 1) + (eff.honeyCapBonus || 0);
  const newCap = baseCap + archRank * ROLES.architect.perRankStorage;
  const hpDelta = newMaxHP - state.hive.maxHP;
  state.hive.maxHP = newMaxHP;
  state.hive.hp = Math.min(state.hive.maxHP, state.hive.hp + Math.max(0, hpDelta));
  state.honeyCap = newCap;
  if (state.honey > state.honeyCap) state.honey = state.honeyCap;
}

export function getEffectiveSwarmCount(state) {
  const eff = getEff(state);
  const perRankBonus = ROLES.striker.perRankSwarmBonus + (eff.strikerPerRankBonus || 0);
  const fromStriker = STRIKER.swarmCount + state.roles.striker.rank * perRankBonus;
  // Population cap from Nurses — forces a wide build to scale offense.
  // Cap base 7 lets Striker rank 1 work without Nurses; rank 2+ benefits
  // strongly from Nurse investment. (rank 0 nurse → cap 7; +2 per nurse rank)
  const popCap = 7 + state.roles.nurse.rank * 2;
  return Math.min(fromStriker, popCap);
}

export function getStrikerPopCap(state) {
  return 7 + state.roles.nurse.rank * 2;
}

export function getEffectiveStrikerSpeed(state) {
  return STRIKER.speed * (getEff(state).strikerSpeedMul ?? 1);
}

export function getEffectiveStrikerCooldown(state) {
  return STRIKER.cooldown * (getEff(state).strikerCooldownMul ?? 1);
}

export function getEffectiveStrikerDamage(state, target) {
  const eff = getEff(state);
  const base = STRIKER.damagePerHit * (eff.strikerDmgMul ?? 1);
  if (target?.type === 'spider') return base * (eff.spiderDmgMul ?? 1);
  return base;
}

export function getForagerHoneyPerSec(state) {
  const eff = getEff(state);
  const fromRank = state.roles.forager.rank * ROLES.forager.perRankHoneyPerSec;
  const baseFromEff = eff.foragerBaseHoneyPerSec || 0;
  const mul = eff.foragerHoneyMul ?? 1;
  return (fromRank + baseFromEff) * mul;
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
    if (s.type === 'hornet')         spawnHornet(state);
    else if (s.type === 'spider')     spawnSpider(state);
    else if (s.type === 'bear')       spawnBear(state);
    else if (s.type === 'beekeeper')  spawnBeekeeper(state);
  }

  // --- attackers home toward hive; guards damage anything in contact
  const guardDPS = getGuardContactDPS(state);
  for (const a of state.attackers) {
    if (a.deathT != null) { a.deathT += dt; continue; }
    const cfg = getAttackerCfg(a.type);
    const dx = state.hive.x - a.x;
    const dy = state.hive.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > cfg.contactRange) {
      a.x += (dx / d) * cfg.speed * dt;
      a.y += (dy / d) * cfg.speed * dt;
    } else {
      state.hive.hp -= (cfg.contactDPS ?? HIVE.contactDPS) * dt;
      if (guardDPS > 0) {
        a.hp -= guardDPS * (cfg.guardDmgMul ?? 1) * dt;
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

  // --- beekeeper smoke: emit a smoke cloud periodically; particles inside die
  for (const a of state.attackers) {
    if (a.type !== 'beekeeper' || a.deathT != null) continue;
    a.smokeTimer = (a.smokeTimer ?? 0) - dt;
    a.smokeOnFor = (a.smokeOnFor ?? 0) - dt;
    if (a.smokeTimer <= 0) {
      a.smokeOnFor = BEEKEEPER.smokeDuration;
      a.smokeTimer = BEEKEEPER.smokeOnInterval;
    }
    if (a.smokeOnFor > 0) {
      // kill swarm particles inside the smoke radius
      for (const s of state.swarms) {
        if (!s.alive) continue;
        const sd = Math.hypot(s.x - a.x, s.y - a.y);
        if (sd < BEEKEEPER.smokeRange) {
          s.alive = false;
          state.fx.push({ kind: 'puff', x: s.x, y: s.y, t: 0, life: 0.4 });
        }
      }
    }
  }

  // --- spider bites: each spider eats striker particles in close range
  for (const a of state.attackers) {
    if (a.type !== 'spider' || a.deathT != null) continue;
    a.biteCD = (a.biteCD ?? 0) - dt;
    if (a.biteCD > 0) continue;
    let target = null, bestD = SPIDER.biteRange;
    for (const s of state.swarms) {
      if (!s.alive) continue;
      const sd = Math.hypot(s.x - a.x, s.y - a.y);
      if (sd < bestD) { bestD = sd; target = s; }
    }
    if (target) {
      target.alive = false;
      state.fx.push({ kind: 'puff', x: target.x, y: target.y, t: 0, life: 0.4 });
      a.biteCD = SPIDER.biteCooldown;
    } else {
      a.biteCD = 0.18; // re-scan soon
    }
  }

  // --- striker volleys
  state.strikerCooldown -= dt;
  if (state.strikerCooldown <= 0) {
    const target = pickClosestLiveAttacker(state);
    if (target) {
      launchSwarm(state, target);
      state.strikerCooldown = getEffectiveStrikerCooldown(state);
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
    const baseSpeed = getEffectiveStrikerSpeed(state) * s.speedMul;
    s.x += (dirX * baseSpeed + perpX * wobbleV) * dt;
    s.y += (dirY * baseSpeed + perpY * wobbleV) * dt;
    if (d < STRIKER.hitRadius) {
      s.target.hp -= getEffectiveStrikerDamage(state, s.target);
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
    // wave-clear reward (modifier + boons)
    const eff = getEff(state);
    const honeyReward = Math.max(0, Math.round(
      ECONOMY.waveClearHoney * (eff.waveHoneyMul ?? 1) + (eff.waveHoneyBonus || 0)
    ));
    const larvaeReward = Math.max(0,
      ECONOMY.waveClearLarvae + getNurseLarvaeBonus(state) + (eff.waveLarvaeBonus || 0)
    );
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
      // mark a boon pick if this wave was on the boon-trigger list
      if (BOON_WAVES.includes(state.wave)) {
        state.pendingBoonPick = true;
      }
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
  const hpBonus = state.modifier?.effects?.hornetHPBonus || 0;
  state.attackers.push({
    type: 'hornet',
    x,
    y: -20,
    hp: HORNET.hp + hpBonus,
    deathT: null,
    flutterPhase: Math.random() * Math.PI * 2,
  });
  state.fx.push({ kind: 'spawn-warn', x, y: 18, t: 0, life: 0.9 });
}

function spawnSpider(state) {
  const margin = 50;
  const x = margin + Math.random() * (state.width - margin * 2);
  state.attackers.push({
    type: 'spider',
    x,
    y: -22,
    hp: SPIDER.hp,
    deathT: null,
    legPhase: Math.random() * Math.PI * 2,
    biteCD: SPIDER.biteCooldown * 0.5,
  });
  state.fx.push({ kind: 'spawn-warn', x, y: 18, t: 0, life: 0.9 });
}

function spawnBear(state) {
  const margin = 70; // bears are big
  const x = margin + Math.random() * (state.width - margin * 2);
  state.attackers.push({
    type: 'bear',
    x,
    y: -36,
    hp: BEAR.hp,
    deathT: null,
    bobPhase: Math.random() * Math.PI * 2,
  });
  // bigger, scarier spawn warning for bears
  state.fx.push({ kind: 'spawn-warn', x, y: 18, t: 0, life: 1.4 });
  state.fx.push({ kind: 'spawn-warn', x: x - 18, y: 22, t: 0, life: 1.4 });
  state.fx.push({ kind: 'spawn-warn', x: x + 18, y: 22, t: 0, life: 1.4 });
}

function spawnBeekeeper(state) {
  const margin = 70;
  const x = margin + Math.random() * (state.width - margin * 2);
  state.attackers.push({
    type: 'beekeeper',
    x,
    y: -38,
    hp: BEEKEEPER.hp,
    deathT: null,
    bobPhase: Math.random() * Math.PI * 2,
    smokeTimer: BEEKEEPER.smokeOnInterval * 0.5,  // first smoke a bit later
    smokeOnFor: 0,
  });
  state.fx.push({ kind: 'spawn-warn', x, y: 18, t: 0, life: 1.6 });
}

function pickClosestLiveAttacker(state, fromX, fromY) {
  // Priority target overrides default homing (active player input).
  if (state.priorityTarget && state.priorityTarget.deathT == null) {
    return state.priorityTarget;
  }
  // dead/cleared priority target — clear it so we don't keep checking
  if (state.priorityTarget && state.priorityTarget.deathT != null) {
    state.priorityTarget = null;
  }
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
