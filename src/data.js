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
  speed: 38,         // px / sec
  radius: 11,
  contactRange: 56,  // touches the hive when this close
};

export const SPIDER = {
  hp: 9,
  speed: 22,         // ~60% hornet speed
  radius: 13,
  contactRange: 56,
  // Spiders eat striker particles in close range — punishes "rush at it"
  // strategies and rewards Architects (walls) once those land.
  biteRange: 36,
  biteCooldown: 0.55, // seconds between bites — limits crowd-eat
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

// Procedural wave generator with attacker variety.
// Hornets ramp continuously. Spiders intro at wave 4, scale up later.
//   Wave 1: 5 hornets / 21s              (teaching loop)
//   Wave 3: 9 hornets / 27s
//   Wave 4: 10 hornets + 1 spider / 30s  (spider intro)
//   Wave 7: 14 hornets + 3 spiders / 39s
//   Wave 10: 18 hornets + 6 spiders / 48s
//
// Spawn timing is deterministic; spiders are interleaved at fixed offsets.
export function generateWave(n) {
  const hornetCount = 4 + Math.floor(n * 1.6);
  const spiderCount = n >= 4 ? n - 3 : 0;  // 1 at wave 4, 6 at wave 9, 7 at wave 10
  const duration = 18 + n * 3;
  const spawns = [];

  // hornets — evenly distributed across the wave
  const hornetStep = duration / Math.max(1, hornetCount);
  for (let i = 0; i < hornetCount; i++) {
    const jitter = i % 2 === 0 ? 0 : 0.6;
    spawns.push({ type: 'hornet', t: 1 + hornetStep * i + jitter });
  }
  // spiders — scattered across the back half so they arrive late
  if (spiderCount > 0) {
    const spiderStep = (duration * 0.65) / Math.max(1, spiderCount);
    const spiderStart = duration * 0.30;
    for (let i = 0; i < spiderCount; i++) {
      spawns.push({ type: 'spider', t: spiderStart + spiderStep * i });
    }
  }
  // sort by time so the spawn loop reads them in order
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
  honeyStorageCap: 250,  // raised by Architects (B2.4)
};

// Role definitions. Rank 0 = baseline (no investment).
// Each rank in `costs` is the honey price to advance from that rank to the
// next. costs[0] = price to buy rank 1, costs[1] = rank 1→2, etc.
export const ROLES = {
  forager: {
    name: 'Forager',
    glyph: '🍯',
    description: 'Generates honey per second during waves.',
    perRankHoneyPerSec: 0.6,
    costs: [30, 65, 110],
    maxRank: 3,
  },
  nurse: {
    name: 'Nurse',
    glyph: '🐝',
    description: 'Produces extra larvae each wave clear.',
    perRankLarvaePerWave: 1,
    costs: [25, 55, 95],
    maxRank: 3,
  },
  guard: {
    name: 'Guard',
    glyph: '🛡',
    description: 'Damages intruders reaching the hive entrance.',
    perRankContactDPS: 1.5,
    costs: [40, 75, 130],
    maxRank: 3,
  },
  striker: {
    name: 'Striker',
    glyph: '⚔',
    description: 'Larger swarm volleys.',
    perRankSwarmBonus: 2,
    costs: [30, 65, 110],
    maxRank: 3,
  },
  architect: {
    name: 'Architect',
    glyph: '⬡',
    description: 'Reinforces hive HP and honey storage.',
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
    summary: '+0.5 base 🍯/s · Strikers cost +35%',
    flavor: 'Wildflowers cover the fields. Honey flows freely — but stinging out is costly.',
    pushes: 'greed / late-aggro',
    effects: {
      foragerBaseHoneyPerSec: 0.5,
      roleCostMul: { striker: 1.35 },
    },
  },
  {
    id: 'steel_comb',
    name: 'Steel Comb',
    summary: '+35 max HP · Foragers −25%',
    flavor: 'Old queens built thick walls. The wax is strong but the flowers wilt.',
    pushes: 'turtle / fortress',
    effects: {
      hiveStartHPBonus: 35,
      foragerHoneyMul: 0.75,
    },
  },
  {
    id: 'eager_stingers',
    name: 'Eager Stingers',
    summary: 'Strikers +1 bonus bee/rank · Architects cost +50%',
    flavor: 'Your bees are restless. They strike hard but can\'t sit still to build.',
    pushes: 'aggro / swarm',
    effects: {
      strikerPerRankBonus: 1,
      roleCostMul: { architect: 1.5 },
    },
  },
  {
    id: 'patient_queen',
    name: 'Patient Queen',
    summary: 'All role costs −18% · +1 hornet per wave',
    flavor: 'You wait. You build. You will outlast them, even if more come.',
    pushes: 'balanced / wide',
    effects: {
      allRoleCostMul: 0.82,
      extraHornetsPerWave: 1,
    },
  },
  {
    id: 'royal_drought',
    name: 'Royal Drought',
    summary: 'Wave rewards +50% 🍯 · honey cap halved',
    flavor: 'Lean times. Each clear pays well, but you can\'t hoard.',
    pushes: 'rhythm / spend-it-all',
    effects: {
      waveHoneyMul: 1.5,
      honeyCapMul: 0.5,
    },
  },
  {
    id: 'lucky_larvae',
    name: 'Lucky Larvae',
    summary: '+1 larva per wave · every hornet has +1 HP',
    flavor: 'The brood is robust. So are the intruders.',
    pushes: 'larvae-economy',
    effects: {
      waveLarvaeBonus: 1,
      hornetHPBonus: 1,
    },
  },
];
