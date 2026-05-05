// Phase B1 game logic — multi-wave runner with idle/active phases.
// Single-file for now; will split into game/ submodules in Phase B2+.

import {
  HIVE, HORNET, SPIDER, BEAR, BEEKEEPER, STRIKER,
  ECONOMY, ROLES, ROLE_ORDER,
  MODIFIERS, BOONS, BOON_WAVES, SYNERGIES, isSynergyActive,
  ABILITIES, ABILITY_ORDER,
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
  for (const k of ROLE_ORDER) roles[k] = { rank: 0, spec: null };
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
    // screen shake intensity (decays each frame)
    shakeAmount: 0,
    // synergy ids that have already announced this run
    announcedSynergies: [],
    // monotonic volley counter for synergies that key off it (Drone Frenzy)
    volleyCount: 0,
    // Wax armor layer — Honeycomb Vault spec absorbs damage before HP
    waxHP: 0,
    // Per-wave kill counter (Royal Reserve / Honey Geyser)
    killsThisWave: 0,
    // Queen's Decree — track upgrades this wave (first free)
    upgradesThisWave: 0,
    // Active abilities — cooldown timer + active buff state per ability
    abilityCooldowns: { rally_hum: 0 },
    rallyEndsAt: 0,
  };
}

export function hasSpec(state, roleKey, specId) {
  return state.roles[roleKey].spec === specId;
}

// ----------------------------------------------------------------------------
// Active abilities
// ----------------------------------------------------------------------------
export function getAvailableAbilities(state) {
  return ABILITY_ORDER.filter(id => ABILITIES[id].available(state));
}

export function getAbilityCost(state, id) {
  const ab = ABILITIES[id];
  return {
    honey: ab.getHoneyCost ? ab.getHoneyCost(state) : (ab.honeyCost || 0),
    larvae: ab.getLarvaeCost ? ab.getLarvaeCost(state) : (ab.larvaeCost || 0),
    cooldown: ab.getCooldown ? ab.getCooldown(state) : (ab.cooldown || 0),
  };
}

export function canUseAbility(state, id) {
  if (state.phase !== 'active') return false;
  const ab = ABILITIES[id];
  if (!ab || !ab.available(state)) return false;
  if ((state.abilityCooldowns[id] ?? 0) > 0.05) return false;
  const cost = getAbilityCost(state, id);
  if (state.honey < cost.honey) return false;
  if (state.larvae < cost.larvae) return false;
  return true;
}

export function useAbility(state, id) {
  if (!canUseAbility(state, id)) return false;
  const cost = getAbilityCost(state, id);
  state.honey -= cost.honey;
  state.larvae -= cost.larvae;
  state.abilityCooldowns[id] = cost.cooldown;
  applyAbilityEffect(state, id);
  return true;
}

function applyAbilityEffect(state, id) {
  const ab = ABILITIES[id];
  if (id === 'rally_hum') {
    const dur = ab.getDuration(state);
    state.rallyEndsAt = state.elapsed + dur;
    // big visual punch — honey ripple from the hive + flash
    state.fx.push({
      kind: 'ability-burst',
      x: state.hive.x, y: state.hive.y,
      r0: state.hive.radius * 1.05,
      r1: state.hive.radius * 4,
      t: 0, life: 0.6,
    });
    state.fx.push({
      kind: 'reward', text: 'RALLY HUM',
      x: state.hive.x, y: state.hive.y - state.hive.radius - 40,
      t: 0, life: 1.4,
    });
  }
}

export function isRallyActive(state) {
  return state.rallyEndsAt > state.elapsed;
}

// Add honey. Overflow is consumed by:
//   1. Honeycomb Vault spec (Architect): 5 honey → 1 wax HP (cap +150)
//   2. Sun-Soaked Comb synergy (Architect 3 + Forager 3): 5 honey → 1 hive HP
function addHoney(state, amount) {
  if (amount <= 0) return;
  const total = state.honey + amount;
  if (total <= state.honeyCap) {
    state.honey = total;
    return;
  }
  let overflow = total - state.honeyCap;
  state.honey = state.honeyCap;
  // Honeycomb Vault: convert overflow to wax HP first (more direct than synergy heal)
  if (hasSpec(state, 'architect', 'honeycomb_vault')) {
    const waxCap = 150;
    const room = Math.max(0, waxCap - state.waxHP);
    if (room > 0) {
      const waxGained = Math.min(room, overflow / 5);
      state.waxHP += waxGained;
      overflow -= waxGained * 5;
      if (waxGained >= 0.5) {
        state.fx.push({
          kind: 'reward', text: `+${waxGained.toFixed(0)}🛡 wax`,
          x: state.width / 2, y: state.height * 0.55, t: 0, life: 1.4,
        });
      }
    }
  }
  // Sun-Soaked Comb synergy — only if there's still overflow left
  if (overflow > 0 && isSynergyActive(state, 'sun_soaked_comb')) {
    const syn = SYNERGIES.find(s => s.id === 'sun_soaked_comb');
    const hpGained = overflow / syn.overflowHPPer;
    const before = state.hive.hp;
    state.hive.hp = Math.min(state.hive.maxHP, state.hive.hp + hpGained);
    const actual = state.hive.hp - before;
    if (actual >= 0.5) {
      state.fx.push({
        kind: 'reward', text: `+${actual.toFixed(0)}♥ overflow`,
        x: state.width / 2, y: state.height * 0.62, t: 0, life: 1.4,
      });
    }
  }
}

// Centralized hive-damage path so wax armor (Honeycomb Vault) absorbs first.
function applyHiveDamage(state, amount) {
  if (amount <= 0) return;
  if (state.waxHP > 0) {
    const absorbed = Math.min(state.waxHP, amount);
    state.waxHP -= absorbed;
    amount -= absorbed;
  }
  if (amount > 0) state.hive.hp -= amount;
}

// Centralized attacker-death path. Triggers count + spec/boon hooks.
function onAttackerKilled(state, a) {
  if (a.deathT != null) return;
  a.deathT = 0;
  state.killsThisWave += 1;
  state.fx.push({ kind: 'puff', x: a.x, y: a.y, t: 0, life: 0.55 });
  // Sticky Resin spec — kills at the door drop +3 honey
  if (hasSpec(state, 'guard', 'sticky_resin')) {
    addHoney(state, 3);
  }
}

// Check every synergy; emit a one-time toast for any newly active.
function checkSynergyActivations(state) {
  for (const syn of SYNERGIES) {
    if (syn.isActive(state) && !state.announcedSynergies.includes(syn.id)) {
      state.announcedSynergies.push(syn.id);
      state.fx.push({
        kind: 'synergy',
        name: syn.name,
        desc: syn.description,
        t: 0, life: 3.6,
        x: state.width / 2, y: state.height * 0.32,
      });
    }
  }
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
  checkSynergyActivations(state);
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
  state.killsThisWave = 0;
  state.upgradesThisWave = 0;
  state.phase = 'active';
  showBanner(state, `WAVE ${state.wave} / ${state.totalWaves}`, 1.8, 'wave-start');
  // Resonant Comb spec: pulse-slows all incoming intruders for 1.5s
  if (hasSpec(state, 'architect', 'resonant_comb')) {
    state.resonantPulseEnds = state.elapsed + 1.5;
    state.fx.push({
      kind: 'tap-ripple',
      x: state.hive.x, y: state.hive.y - state.hive.radius,
      t: 0, life: 0.9, hit: true,
    });
  }
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
  state.shakeAmount = 0;
  state.announcedSynergies = [];
  state.volleyCount = 0;
  state.waxHP = 0;
  state.killsThisWave = 0;
  state.upgradesThisWave = 0;
  state.rallyEndsAt = 0;
  for (const k of Object.keys(state.abilityCooldowns)) state.abilityCooldowns[k] = 0;
  for (const k of ROLE_ORDER) {
    state.roles[k].rank = 0;
    state.roles[k].spec = null;
  }
}

// ----------------------------------------------------------------------------
// Role helpers (computed from current ranks)
// ----------------------------------------------------------------------------
// Honey cost (after modifiers, boons, Queen's Decree adjustments)
export function getRoleNextCost(state, key) {
  const role = ROLES[key];
  const cur = state.roles[key].rank;
  if (cur >= role.maxRank) return null;
  let cost = role.costs[cur];
  const eff = getEff(state);
  const perRole = eff.roleCostMul?.[key] ?? 1;
  const allMul = eff.allRoleCostMul ?? 1;
  cost = cost * perRole * allMul;
  // Queen's Decree boon: first upgrade each wave is free, rest +20%
  if (eff.queensDecreeFirstFree) {
    if (state.upgradesThisWave === 0) cost = 0;
    else cost = cost * (eff.queensDecreeRestMul ?? 1.2);
  }
  return Math.max(0, Math.round(cost));
}

export function getRoleNextLarvaeCost(state, key) {
  const role = ROLES[key];
  const cur = state.roles[key].rank;
  if (cur >= role.maxRank) return 0;
  return (role.larvaeCosts && role.larvaeCosts[cur]) || 0;
}

export function canInvest(state, key) {
  const cost = getRoleNextCost(state, key);
  if (cost == null) return false;
  if (state.honey < cost) return false;
  const lcost = getRoleNextLarvaeCost(state, key);
  return state.larvae >= lcost;
}

// Rank ups for ranks 1, 2 — straightforward.
// Rank 3 needs the player to choose a specialization, so
// we expose investRole as the one-shot entry point that *either* ranks
// up or returns a flag asking for a spec pick.
export function investRole(state, key) {
  if (!canInvest(state, key)) return false;
  const role = ROLES[key];
  const cur = state.roles[key].rank;
  // moving into rank 3 = spec choice required first, callers must use
  // chooseSpecAndRankUp(). For safety, we just refuse here.
  if (cur + 1 === role.maxRank && role.specs && role.specs.length) {
    return false;
  }
  payInvestmentCost(state, key);
  state.roles[key].rank += 1;
  applyRoleEffectsToHive(state);
  checkSynergyActivations(state);
  return true;
}

export function chooseSpecAndRankUp(state, key, specId) {
  if (!canInvest(state, key)) return false;
  const role = ROLES[key];
  const cur = state.roles[key].rank;
  if (cur + 1 !== role.maxRank) return false;
  const spec = role.specs?.find(s => s.id === specId);
  if (!spec) return false;
  payInvestmentCost(state, key);
  state.roles[key].rank += 1;
  state.roles[key].spec = specId;
  applyRoleEffectsToHive(state);
  checkSynergyActivations(state);
  return true;
}

function payInvestmentCost(state, key) {
  const honey = getRoleNextCost(state, key);
  const larvae = getRoleNextLarvaeCost(state, key);
  state.honey -= honey;
  state.larvae -= larvae;
  state.upgradesThisWave += 1;
  // Larval Tithe boon: spending larvae refunds honey
  const eff = getEff(state);
  if (larvae > 0 && eff.larvalTitheRefund) {
    state.honey = Math.min(state.honeyCap, state.honey + eff.larvalTitheRefund);
    state.fx.push({
      kind: 'reward', text: `+${eff.larvalTitheRefund}🍯  tithe`,
      x: state.width / 2, y: state.height * 0.55, t: 0, life: 1.6,
    });
  }
}

// Architects raise the hive's max HP and honey cap. Re-apply any time
// architect rank changes (or on wave start) to keep these in sync.
function applyRoleEffectsToHive(state) {
  const eff = getEff(state);
  const archRank = state.roles.architect.rank;
  const hpBonusFromEff = eff.hiveStartHPBonus || 0;
  let newMaxHP = HIVE.startHP + hpBonusFromEff + archRank * ROLES.architect.perRankHiveHP;
  // Resonant Comb spec: -20 max HP (offset by 3× regen)
  if (hasSpec(state, 'architect', 'resonant_comb')) newMaxHP -= 20;
  let baseCap = ECONOMY.honeyStorageCap * (eff.honeyCapMul ?? 1) + (eff.honeyCapBonus || 0);
  // Royal Reserve spec: storage cap doubled (huge stockpile rewards)
  if (hasSpec(state, 'forager', 'royal_reserve')) baseCap *= 2;
  const newCap = baseCap + archRank * ROLES.architect.perRankStorage;
  const hpDelta = newMaxHP - state.hive.maxHP;
  state.hive.maxHP = Math.max(20, newMaxHP);
  state.hive.hp = Math.min(state.hive.maxHP, state.hive.hp + Math.max(0, hpDelta));
  state.honeyCap = newCap;
  if (state.honey > state.honeyCap) state.honey = state.honeyCap;
}

export function getEffectiveSwarmCount(state) {
  const eff = getEff(state);
  const perRankBonus = ROLES.striker.perRankSwarmBonus + (eff.strikerPerRankBonus || 0);
  const fromStriker = STRIKER.swarmCount + state.roles.striker.rank * perRankBonus;
  return Math.min(fromStriker, getStrikerPopCap(state));
}

export function getStrikerPopCap(state) {
  let cap = 7 + state.roles.nurse.rank * 2;
  // Royal Diet spec: +50% population cap
  if (hasSpec(state, 'nurse', 'royal_diet')) cap = Math.floor(cap * 1.5);
  // Larval Surge spec: -1 cap (sacrifice for larvae)
  if (hasSpec(state, 'nurse', 'larval_surge')) cap -= 1;
  return Math.max(1, cap);
}

export function isAtPopCap(state) {
  // (effective swarm count == pop cap means strikers are saturated)
  const eff = getEff(state);
  const perRankBonus = ROLES.striker.perRankSwarmBonus + (eff.strikerPerRankBonus || 0);
  const fromStriker = STRIKER.swarmCount + state.roles.striker.rank * perRankBonus;
  return fromStriker >= getStrikerPopCap(state);
}

export function getEffectiveStrikerSpeed(state) {
  let mul = (getEff(state).strikerSpeedMul ?? 1);
  if (isRallyActive(state)) mul *= ABILITIES.rally_hum.getMoveSpeedMul(state);
  return STRIKER.speed * mul;
}

export function getEffectiveStrikerCooldown(state) {
  let mul = (getEff(state).strikerCooldownMul ?? 1);
  if (isRallyActive(state)) mul *= ABILITIES.rally_hum.getAttackSpeedMul(state);
  return STRIKER.cooldown * mul;
}

export function getEffectiveStrikerDamage(state, target) {
  const eff = getEff(state);
  let base = STRIKER.damagePerHit * (eff.strikerDmgMul ?? 1);
  if (target?.type === 'spider') base *= (eff.spiderDmgMul ?? 1);
  // Honey Geyser boon: ×2 damage on every Nth wave (3, 6, 9)
  if (eff.honeyGeyserWaveMod && state.wave % eff.honeyGeyserWaveMod === 0) {
    base *= (eff.honeyGeyserDmgMul ?? 1);
  }
  // Drone Kamikaze boon: at population cap, +60% damage
  if (eff.droneKamikazeAtCapDmgMul && isAtPopCap(state)) {
    base *= eff.droneKamikazeAtCapDmgMul;
  }
  // Sister Sting boon: stack-based armor mark on target
  if (eff.sisterStingMaxStacks && target) {
    const stacks = target.armorMark || 0;
    base += (eff.sisterStingPerStack || 1) * stacks;
  }
  return base;
}

export function getForagerHoneyPerSec(state) {
  const eff = getEff(state);
  // Royal Reserve spec: foragers don't tick during waves
  if (hasSpec(state, 'forager', 'royal_reserve')) return 0;
  const fromRank = state.roles.forager.rank * ROLES.forager.perRankHoneyPerSec;
  const baseFromEff = eff.foragerBaseHoneyPerSec || 0;
  let mul = eff.foragerHoneyMul ?? 1;
  // Pollen Storm spec: +50% honey production base, but 25% diverts to larvae
  if (hasSpec(state, 'forager', 'pollen_storm')) mul *= 1.5;
  return (fromRank + baseFromEff) * mul;
}

export function getNurseLarvaeBonus(state) {
  let bonus = state.roles.nurse.rank * ROLES.nurse.perRankLarvaePerWave;
  // Royal Diet spec: nurses produce zero larvae per wave
  if (hasSpec(state, 'nurse', 'royal_diet')) return 0;
  if (hasSpec(state, 'nurse', 'larval_surge')) bonus += 3;
  return bonus;
}

export function getGuardContactDPS(state) {
  let base = state.roles.guard.rank * ROLES.guard.perRankContactDPS;
  // Sticky Resin: Guard damage -25% (honey-trap trade)
  if (hasSpec(state, 'guard', 'sticky_resin')) base *= 0.75;
  // Murder Hallway synergy: +50%
  if (isSynergyActive(state, 'murder_hallway')) {
    const syn = SYNERGIES.find(s => s.id === 'murder_hallway');
    base *= syn.guardDmgMul;
  }
  return base;
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

  // shake decays toward zero every frame
  if (state.shakeAmount > 0) {
    state.shakeAmount = Math.max(0, state.shakeAmount - dt * 14);
  }

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

  // --- ability cooldowns tick down (active phase only)
  for (const id of ABILITY_ORDER) {
    if (state.abilityCooldowns[id] > 0) {
      state.abilityCooldowns[id] = Math.max(0, state.abilityCooldowns[id] - dt);
    }
  }

  // --- foragers tick honey (capped at storage; overflow may heal via synergy)
  const honeyTick = getForagerHoneyPerSec(state) * dt;
  if (honeyTick > 0) addHoney(state, honeyTick);

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

  // --- attackers home toward hive; guards/spec specials trigger here
  const guardDPS = getGuardContactDPS(state);
  const thornAura = hasSpec(state, 'guard', 'thorn_mantle');
  const stickyResin = hasSpec(state, 'guard', 'sticky_resin');
  const resonantSlowing = state.resonantPulseEnds && state.elapsed < state.resonantPulseEnds;
  for (const a of state.attackers) {
    if (a.deathT != null) { a.deathT += dt; continue; }
    const cfg = getAttackerCfg(a.type);
    const dx = state.hive.x - a.x;
    const dy = state.hive.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    // tick down sticky-resin slow timer if active
    if (a.slowT != null) {
      a.slowT -= dt;
      if (a.slowT <= 0) a.slowT = null;
    }
    // resonant pulse at wave start slows everyone
    let speedMul = 1;
    if (a.slowT != null && a.slowT > 0) speedMul *= 0.4;     // sticky resin slow
    if (resonantSlowing) speedMul *= 0.5;                     // resonant comb pulse
    if (d > cfg.contactRange) {
      a.x += (dx / d) * cfg.speed * speedMul * dt;
      a.y += (dy / d) * cfg.speed * speedMul * dt;
    } else {
      // Thorn Mantle: hive does NOT take contact damage at all
      if (!thornAura) {
        const dpsTaken = (cfg.contactDPS ?? HIVE.contactDPS);
        applyHiveDamage(state, dpsTaken * dt);
        state.shakeAmount = Math.min(8, state.shakeAmount + dpsTaken * dt * 0.45);
      }
      // Sticky Resin: apply slow timer on first contact
      if (stickyResin && a.slowT == null) a.slowT = 2.0;
      if (guardDPS > 0) {
        a.hp -= guardDPS * (cfg.guardDmgMul ?? 1) * dt;
        if (a.hp <= 0 && a.deathT == null) onAttackerKilled(state, a);
      }
      if (state.hive.hp <= 0 && state.phase !== 'lost') {
        state.hive.hp = 0;
        state.phase = 'lost';
        showBanner(state, 'HIVE FALLEN', 4, 'lose');
        return;
      }
    }
  }

  // --- Thorn Mantle aura damage in 80px around hive
  if (thornAura) {
    const auraRange = 80;
    const auraDPS = 3;
    for (const a of state.attackers) {
      if (a.deathT != null) continue;
      const dd = Math.hypot(a.x - state.hive.x, a.y - state.hive.y);
      if (dd < auraRange + (getAttackerCfg(a.type).radius || 0)) {
        a.hp -= auraDPS * (getAttackerCfg(a.type).guardDmgMul ?? 1) * dt;
        if (a.hp <= 0 && a.deathT == null) onAttackerKilled(state, a);
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
      a.biteCD = 0.18;
    }
  }

  // Honeycomb Vault: passive wax HP top-up if forager generates honey
  // (already handled by addHoney → vault path)
  // Resonant Comb post-pulse cleanup
  if (state.resonantPulseEnds && state.elapsed >= state.resonantPulseEnds) {
    state.resonantPulseEnds = 0;
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
  const eff = getEff(state);
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
    const perpX = -dirY * s.flip, perpY = dirX * s.flip;
    const closeFactor = Math.min(1, Math.max(0, (d - STRIKER.hitRadius) / 110));
    const wobbleV = Math.cos(state.elapsed * s.wobbleFreq + s.phase)
                  * s.wobbleAmp * closeFactor;
    // Meteor Volley spec: meteor particles travel slower
    const speedMul = s.meteor ? STRIKER.meteorSpeedMul : 1;
    const baseSpeed = getEffectiveStrikerSpeed(state) * s.speedMul * speedMul;
    s.x += (dirX * baseSpeed + perpX * wobbleV) * dt;
    s.y += (dirY * baseSpeed + perpY * wobbleV) * dt;
    if (d < (s.meteor ? STRIKER.hitRadius * 2 : STRIKER.hitRadius)) {
      let damage = getEffectiveStrikerDamage(state, s.target);
      if (s.meteor) damage *= STRIKER.meteorDmgMul;
      if (s.echo) damage *= STRIKER.echoDmgMul;
      s.target.hp -= damage;
      s.alive = false;
      state.fx.push({ kind: 'hit', x: s.target.x, y: s.target.y, t: 0, life: 0.32 });
      // Sister Sting boon: stack armor mark on target
      if (eff.sisterStingMaxStacks) {
        s.target.armorMark = Math.min(eff.sisterStingMaxStacks, (s.target.armorMark || 0) + 1);
        s.target.armorMarkExpiresAt = state.elapsed + 3.0;
      }
      // Meteor Volley splash: damage other attackers in AoE
      if (s.meteor) {
        for (const other of state.attackers) {
          if (other === s.target || other.deathT != null) continue;
          const dd = Math.hypot(other.x - s.target.x, other.y - s.target.y);
          if (dd < STRIKER.meteorAoE) {
            other.hp -= damage * 0.5;
            state.fx.push({ kind: 'hit', x: other.x, y: other.y, t: 0, life: 0.28 });
            if (other.hp <= 0 && other.deathT == null) onAttackerKilled(state, other);
          }
        }
        state.fx.push({ kind: 'puff', x: s.target.x, y: s.target.y, t: 0, life: 0.7 });
      }
      // Echo Sting spec: 18% chance to fire a free echo at the same target
      if (!s.echo && hasSpec(state, 'striker', 'echo_sting') &&
          Math.random() < STRIKER.echoChance && s.target.deathT == null) {
        spawnEchoParticle(state, s.x, s.y, s.target);
      }
      if (s.target.hp <= 0 && s.target.deathT == null) onAttackerKilled(state, s.target);
    }
  }
  // Sister Sting decay
  if (eff.sisterStingMaxStacks) {
    for (const a of state.attackers) {
      if (a.armorMark && a.armorMarkExpiresAt < state.elapsed) {
        a.armorMark = 0;
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
    // wave-clear reward (modifier + boons + spec hooks)
    const eff = getEff(state);
    let honeyReward = ECONOMY.waveClearHoney * (eff.waveHoneyMul ?? 1) + (eff.waveHoneyBonus || 0);
    let larvaeReward = ECONOMY.waveClearLarvae + getNurseLarvaeBonus(state) + (eff.waveLarvaeBonus || 0);
    // Royal Reserve spec: +(rank) honey per kill on top of base
    if (hasSpec(state, 'forager', 'royal_reserve')) {
      honeyReward += state.killsThisWave * state.roles.forager.rank;
    }
    // Pollen Storm spec: +1 larva per Forager rank on every wave clear
    if (hasSpec(state, 'forager', 'pollen_storm')) {
      larvaeReward += state.roles.forager.rank;
    }
    honeyReward = Math.max(0, Math.round(honeyReward));
    larvaeReward = Math.max(0, larvaeReward);
    addHoney(state, honeyReward);
    state.larvae += larvaeReward;
    // hive HP regen — Resonant Comb spec triples it
    const archRank = state.roles.architect.rank;
    let hpRegen = ECONOMY.waveClearHPRegen + archRank * ECONOMY.waveClearHPRegenArchitect;
    if (hasSpec(state, 'architect', 'resonant_comb')) hpRegen *= 3;
    state.hive.hp = Math.min(state.hive.maxHP, state.hive.hp + hpRegen);
    state.fx.push({
      kind: 'reward',
      text: `+${honeyReward}🍯  +${larvaeReward}🐝  +${Math.round(hpRegen)}♥`,
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
  state.volleyCount += 1;
  let swarmCount = getEffectiveSwarmCount(state);
  // Meteor Volley spec: every 4th volley is replaced with a single huge particle
  const isMeteor = hasSpec(state, 'striker', 'meteor_volley') &&
                   state.volleyCount % STRIKER.meteorEveryN === 0;
  if (isMeteor) {
    spawnMeteorParticle(state, cx, cy, target);
    return;
  }
  // Drone Frenzy synergy: every Nth volley is supersized
  if (isSynergyActive(state, 'drone_frenzy')) {
    const syn = SYNERGIES.find(s => s.id === 'drone_frenzy');
    if (state.volleyCount % syn.everyN === 0) {
      swarmCount = Math.ceil(swarmCount * syn.bonusMul);
      state.fx.push({
        kind: 'tap-ripple',
        x: state.hive.x, y: state.hive.y - state.hive.radius * 0.3,
        t: 0, life: 0.45, hit: true,
      });
    }
  }
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
  // Echo Buzz boon: 12% chance the volley fires twice (same target if alive)
  const eff = getEff(state);
  if (eff.volleyEchoChance && Math.random() < eff.volleyEchoChance &&
      target && target.deathT == null) {
    setTimeout(() => {
      if (state.phase === 'active' && target.deathT == null) {
        // re-launch as a normal volley toward the same target
        launchSwarm(state, target);
      }
    }, 280);
  }
}

function spawnMeteorParticle(state, cx, cy, target) {
  state.swarms.push({
    x: cx, y: cy,
    target,
    alive: true,
    meteor: true,
    phase: 0, wobbleAmp: 8, wobbleFreq: 3,
    speedMul: 1, flip: 1,
  });
  state.fx.push({
    kind: 'tap-ripple',
    x: cx, y: cy, t: 0, life: 0.6, hit: true,
  });
}

function spawnEchoParticle(state, x, y, target) {
  if (!target || target.deathT != null) return;
  state.swarms.push({
    x, y,
    target,
    alive: true,
    echo: true,
    phase: 0, wobbleAmp: 4, wobbleFreq: 8,
    speedMul: 1.3, flip: Math.random() < 0.5 ? 1 : -1,
  });
}
