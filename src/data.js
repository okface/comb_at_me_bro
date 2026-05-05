// Comb At Me Bro — Phase A data.
// Hardcoded constants for the skeleton. Will split into data/ subdir
// (roles, attackers, waves, boons) starting Phase B.

// Full palette from Claude Design v2 (cb/style.jsx). Locked.
export const PALETTE = {
  paper:        '#F5EBD6',
  paperDark:    '#E8DCBF',
  paperShade:   '#D4C5A0',
  sage:         '#C8D89A',
  sageDeep:     '#A8BE7A',
  sageDark:     '#7E9658',
  honey:        '#F2C24A',
  honeyDeep:    '#E8A24A',
  honeyLight:   '#F7DDA0',
  honeyDark:    '#B66B1E',
  rust:         '#8A3A1C',
  rustDark:     '#5E2410',
  ink:          '#3A2818',
  inkSoft:      '#6B5A45',
  white:        '#FBF6E8',
  redInk:       '#A8351E',
  jelly:        '#E8B8E0',
  jellyDeep:    '#9E5BA0',
  smokeGrey:    '#A8A097',
  spiderPurple: '#5B3D5E',
  webWhite:     '#EFE8D8',
  // legacy aliases used by older code
  paper2:       '#E8DCBF',
  honeyHi:      '#F7DDA0',
  rustDarkAlt:  '#3a1a0e',
};

export const HIVE = {
  startHP: 100,
  radius: 46,
  // damage taken per second while an attacker is touching the entrance
  contactDPS: 6,
};

export const HORNET = {
  hp: 4,
  speed: 50,         // px / sec — bumped from 38 for snappier early waves
  radius: 11,
  contactRange: 56,
  contactDPS: 6,
};

export const SPIDER = {
  hp: 9,
  speed: 22,         // ~60% hornet speed
  radius: 13,
  contactRange: 56,
  contactDPS: 8,
  // Spiders eat striker particles in close range — punishes "rush at it"
  // strategies and rewards Architects (walls) once those land.
  biteRange: 36,
  biteCooldown: 0.55,
};

export const BEAR = {
  hp: 32,
  speed: 18,         // slowest, but unstoppable
  radius: 26,
  contactRange: 70,
  contactDPS: 14,    // hits the hive much harder
  guardDmgMul: 0.4,  // guards barely scratch a bear
};

export const BEEKEEPER = {
  hp: 70,
  speed: 16,
  radius: 24,
  contactRange: 70,
  contactDPS: 8,
  guardDmgMul: 0.7,
  // Smoke AoE: strikers entering the cloud die instantly. Rotates the
  // tactical question from "stack DPS" to "wait for the gap."
  smokeRange: 95,
  smokeOnInterval: 6.0,  // seconds between smoke clouds
  smokeDuration: 3.5,
};

export const STRIKER = {
  swarmCount: 5,           // strikers per volley
  cooldown: 1.6,           // seconds between volleys
  speed: 130,              // px / sec base; each bee gets a per-particle multiplier
  damagePerHit: 1,
  hitRadius: 14,
  particleSize: 3.5,
  spreadRadius: 18,
  // Swarm character — each bee gets a phase, wobble amp/freq, and speed
  // multiplier so the cloud feels alive instead of moving as a rigid block.
  wobbleAmpRange: [22, 60],   // px/sec perpendicular oscillation amplitude
  wobbleFreqRange: [4, 10],   // radians/sec
  speedMulRange: [0.78, 1.22],
};

// Procedural wave generator. Pacing favors density over duration —
// early waves should never feel like dead air.
//   Wave 1: 6 hornets in 16s
//   Wave 3: 10 hornets + 1 spider in 21s
//   Wave 6: 15 hornets + 4 spiders + 1 bear in 27s
//   Wave 9: 21 hornets + 7 spiders + 2 bears in 34s
//   Wave 10: boss (beekeeper + hornet/spider escorts)
export function generateWave(n) {
  if (n === 10) {
    return {
      spawns: [
        { type: 'beekeeper', t: 1 },
        { type: 'hornet', t: 4 },
        { type: 'hornet', t: 7 },
        { type: 'hornet', t: 11 },
        { type: 'hornet', t: 15 },
        { type: 'spider', t: 19 },
        { type: 'hornet', t: 23 },
        { type: 'hornet', t: 27 },
      ],
      duration: 42,
    };
  }

  const hornetCount = 5 + Math.floor(n * 1.8);
  const spiderCount = n >= 3 ? n - 2 : 0;     // intro at wave 3 (was 4)
  const bearCount = (n >= 6 && n <= 9) ? (n === 9 ? 2 : 1) : 0;  // intro wave 6 (was 7)
  const duration = 14 + n * 2.2;
  const spawns = [];

  const hornetStep = duration / Math.max(1, hornetCount);
  for (let i = 0; i < hornetCount; i++) {
    const jitter = i % 2 === 0 ? 0 : 0.45;
    spawns.push({ type: 'hornet', t: 0.4 + hornetStep * i + jitter });
  }
  if (spiderCount > 0) {
    const spiderStep = (duration * 0.65) / Math.max(1, spiderCount);
    const spiderStart = duration * 0.30;
    for (let i = 0; i < spiderCount; i++) {
      spawns.push({ type: 'spider', t: spiderStart + spiderStep * i });
    }
  }
  if (bearCount > 0) {
    const bearStep = (duration * 0.55) / Math.max(1, bearCount);
    const bearStart = duration * 0.40;
    for (let i = 0; i < bearCount; i++) {
      spawns.push({ type: 'bear', t: bearStart + bearStep * i });
    }
  }
  spawns.sort((a, b) => a.t - b.t);
  return { spawns, duration };
}

export const TOTAL_WAVES = 10; // B2.4 ships 10; final 30 with bear+beekeeper in Phase C.

// ============================================================
// Phase B2 — economy + role investment
// ============================================================
export const ECONOMY = {
  startHoney: 50,
  startLarvae: 3,
  // bonus granted on wave clear (before B2.5's mutually-exclusive locks)
  waveClearHoney: 25,
  waveClearLarvae: 2,
  waveClearHPRegen: 10,        // base HP healed when a wave clears
  waveClearHPRegenArchitect: 5, // additional HP healed per architect rank
  honeyStorageCap: 250,  // raised by Architects (B2.4)
};

// Role definitions. Rank 0 = baseline (no investment).
// Each rank in `costs` is the honey price to advance from that rank to the
// next. costs[0] = price to buy rank 1, costs[1] = rank 1→2, etc.
export const ROLES = {
  forager: {
    name: 'Forager',
    glyph: '🍯',
    description: 'Gathers honey through the wave.',
    perRankHoneyPerSec: 0.6,
    costs: [30, 65, 110],
    maxRank: 3,
  },
  nurse: {
    name: 'Nurse',
    glyph: '🐝',
    description: 'Raises the bee cap and brings new larvae each wave.',
    perRankLarvaePerWave: 1,
    perRankPopCap: 2,
    costs: [25, 55, 95],
    maxRank: 3,
  },
  guard: {
    name: 'Guard',
    glyph: '🛡',
    description: 'Stings any intruder that reaches the hive door.',
    perRankContactDPS: 1.5,
    costs: [40, 75, 130],
    maxRank: 3,
  },
  striker: {
    name: 'Striker',
    glyph: '⚔',
    description: 'Sends larger swarms at your target. Limited by bee cap.',
    perRankSwarmBonus: 2,
    costs: [30, 65, 110],
    maxRank: 3,
  },
  architect: {
    name: 'Architect',
    glyph: '⬡',
    description: 'Thickens the comb. More HP, more honey held.',
    perRankHiveHP: 25,
    perRankStorage: 80,
    costs: [50, 100, 170],
    maxRank: 3,
  },
};

export const ROLE_ORDER = ['striker', 'forager', 'nurse', 'guard', 'architect'];

// ============================================================
// Hive Conditions — run-start modifiers that bias every build.
// Player picks 1 of 3 (random subset) at the start of each run.
// Each effect knob is consulted by helpers in game.js.
// ============================================================
export const MODIFIERS = [
  {
    id: 'plentiful_bloom',
    name: 'Plentiful Bloom',
    summary: '+0.5 honey/sec base · Strikers cost +35% honey',
    flavor: 'Wildflowers cover the fields. Honey flows freely — but stinging out is costly.',
    effects: {
      foragerBaseHoneyPerSec: 0.5,
      roleCostMul: { striker: 1.35 },
    },
  },
  {
    id: 'steel_comb',
    name: 'Steel Comb',
    summary: '+35 max hive HP · Foragers earn 25% less honey',
    flavor: 'Old queens built thick walls. The wax holds, though the flowers wilt.',
    effects: {
      hiveStartHPBonus: 35,
      foragerHoneyMul: 0.75,
    },
  },
  {
    id: 'eager_stingers',
    name: 'Eager Stingers',
    summary: 'Strikers fire +1 extra bee per rank · Architects cost +50% honey',
    flavor: 'Your bees are restless. They strike hard but cannot sit still to build.',
    effects: {
      strikerPerRankBonus: 1,
      roleCostMul: { architect: 1.5 },
    },
  },
  {
    id: 'patient_queen',
    name: 'Patient Queen',
    summary: 'All role upgrades cost 18% less · +1 hornet appears each wave',
    flavor: 'You wait. You build. You outlast them — even as more come.',
    effects: {
      allRoleCostMul: 0.82,
      extraHornetsPerWave: 1,
    },
  },
  {
    id: 'royal_drought',
    name: 'Royal Drought',
    summary: 'Waves pay +50% honey · honey storage halved',
    flavor: 'Lean times. Each clear pays well, but the comb cannot hoard.',
    effects: {
      waveHoneyMul: 1.5,
      honeyCapMul: 0.5,
    },
  },
  {
    id: 'lucky_larvae',
    name: 'Lucky Larvae',
    summary: '+1 larva per wave · every hornet has +1 HP',
    flavor: 'The brood is robust. So is what comes for it.',
    effects: {
      waveLarvaeBonus: 1,
      hornetHPBonus: 1,
    },
  },
];

// ============================================================
// Boons — Hades-style mid-run pickups. Player gets 1-of-3 after
// clearing certain waves (currently waves 3 and 6 of a 10-wave run).
// Each boon stacks with modifiers and other boons via getEff().
// ============================================================
export const BOONS = [
  {
    id: 'brutal_stinger',
    name: 'Brutal Stinger',
    summary: 'Strikers deal +30% damage',
    flavor: 'A blooded queen knows where to bury the first sting.',
    effects: { strikerDmgMul: 1.3 },
  },
  {
    id: 'foragers_blessing',
    name: "Forager's Blessing",
    summary: 'Foragers produce +60% honey',
    flavor: 'The pollen sings in golden tongues.',
    effects: { foragerHoneyMul: 1.6 },
  },
  {
    id: 'steel_resolve',
    name: 'Steel Resolve',
    summary: '+50 max hive HP · −1 larva per wave',
    flavor: 'Hold the line. Lose what you must.',
    effects: { hiveStartHPBonus: 50, waveLarvaeBonus: -1 },
  },
  {
    id: 'royal_diet',
    name: 'Royal Diet',
    summary: '+3 larvae per wave cleared',
    flavor: 'The queen feasts. The brood grows.',
    effects: { waveLarvaeBonus: 3 },
  },
  {
    id: 'architects_cunning',
    name: "Architect's Cunning",
    summary: '+45 max hive HP · +120 honey storage',
    flavor: 'Wax never lies. It only grows.',
    effects: { hiveStartHPBonus: 45, honeyCapBonus: 120 },
  },
  {
    id: 'swarm_tactics',
    name: 'Swarm Tactics',
    summary: 'Strikers fly 25% faster',
    flavor: 'Moving as one, they cannot be cornered.',
    effects: { strikerSpeedMul: 1.25 },
  },
  {
    id: 'bee_eaters_tactic',
    name: "Bee-Eater's Tactic",
    summary: 'Strikers deal +70% damage to spiders',
    flavor: 'Know your enemy. Bury its eyes.',
    effects: { spiderDmgMul: 1.7 },
  },
  {
    id: 'hive_mind',
    name: 'Hive Mind',
    summary: 'All role upgrades cost 15% less honey',
    flavor: 'The colony moves as one mind.',
    effects: { allRoleCostMul: 0.85 },
  },
  {
    id: 'old_wax',
    name: 'Old Wax',
    summary: '+8 honey at the start of every wave',
    flavor: 'Each clear leaves something behind. Pick it up.',
    effects: { waveHoneyBonus: 8 },
  },
  {
    id: 'eager_volley',
    name: 'Eager Volley',
    summary: 'Strikers fire volleys 20% faster',
    flavor: 'Less waiting. More stinging.',
    effects: { strikerCooldownMul: 0.8 },
  },
];

// Waves that grant a boon pick (after the wave clears)
export const BOON_WAVES = [3, 6];

// ============================================================
// Hidden synergies — auto-activate when role rank thresholds align.
// Each fires a one-time toast the first time it activates in a run,
// then quietly applies its effect from then on.
// ============================================================
export const SYNERGIES = [
  {
    id: 'sun_soaked_comb',
    name: 'Sun-Soaked Comb',
    description: 'Honey that would overflow heals the hive instead.',
    isActive: (state) =>
      state.roles.architect.rank >= 3 && state.roles.forager.rank >= 3,
    overflowHPPer: 5,  // 5 honey = 1 HP
  },
  {
    id: 'murder_hallway',
    name: 'Murder Hallway',
    description: 'Guards strike harder behind thick wax.',
    isActive: (state) =>
      state.roles.guard.rank >= 3 && state.roles.architect.rank >= 2,
    guardDmgMul: 1.5,
  },
  {
    id: 'drone_frenzy',
    name: 'Drone Frenzy',
    description: 'Every fourth volley fires extra bees.',
    isActive: (state) =>
      state.roles.striker.rank >= 2 &&
      state.roles.nurse.rank >= state.roles.striker.rank,
    everyN: 4,
    bonusMul: 1.5,
  },
];

export function isSynergyActive(state, id) {
  const syn = SYNERGIES.find(s => s.id === id);
  return syn ? syn.isActive(state) : false;
}
