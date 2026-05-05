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

// Procedural wave generator with attacker variety.
//   Wave 1-3: hornets only (teaching loop)
//   Wave 4: hornets + 1 spider (intro spiders)
//   Wave 7: hornets + spiders + 1 bear (intro bears)
//   Wave 8: hornets + spiders + 1 bear
//   Wave 9: hornets + spiders + 2 bears
//   Wave 10: BOSS — beekeeper with a few hornet escorts
export function generateWave(n) {
  // wave 10 is the boss — overrides default composition
  if (n === 10) {
    const spawns = [
      { type: 'beekeeper', t: 1 },
      { type: 'hornet', t: 5 },
      { type: 'hornet', t: 9 },
      { type: 'hornet', t: 14 },
      { type: 'hornet', t: 18 },
      { type: 'spider', t: 23 },
      { type: 'hornet', t: 28 },
    ];
    return { spawns, duration: 50 };
  }

  const hornetCount = 4 + Math.floor(n * 1.6);
  const spiderCount = n >= 4 ? n - 3 : 0;
  const bearCount = n === 7 ? 1 : n === 8 ? 1 : n === 9 ? 2 : 0;
  const duration = 18 + n * 3;
  const spawns = [];

  // hornets — evenly distributed
  const hornetStep = duration / Math.max(1, hornetCount);
  for (let i = 0; i < hornetCount; i++) {
    const jitter = i % 2 === 0 ? 0 : 0.6;
    spawns.push({ type: 'hornet', t: 1 + hornetStep * i + jitter });
  }
  // spiders — back half
  if (spiderCount > 0) {
    const spiderStep = (duration * 0.65) / Math.max(1, spiderCount);
    const spiderStart = duration * 0.30;
    for (let i = 0; i < spiderCount; i++) {
      spawns.push({ type: 'spider', t: spiderStart + spiderStep * i });
    }
  }
  // bears — single, dramatic, mid-wave
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
    description: 'Raises bee population cap (+2/rank) and grants larvae per wave.',
    perRankLarvaePerWave: 1,
    perRankPopCap: 2,
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
    description: 'Larger swarm volleys. Capped by bee population (Nurses).',
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
    archetype: 'aggro',
    effects: { strikerDmgMul: 1.3 },
  },
  {
    id: 'foragers_blessing',
    name: "Forager's Blessing",
    summary: '+60% honey/sec',
    flavor: 'The pollen sings in golden tongues.',
    archetype: 'greed',
    effects: { foragerHoneyMul: 1.6 },
  },
  {
    id: 'steel_resolve',
    name: 'Steel Resolve',
    summary: '+50 max HP · −1 larva per wave',
    flavor: 'Hold the line. Lose what you must.',
    archetype: 'turtle',
    effects: { hiveStartHPBonus: 50, waveLarvaeBonus: -1 },
  },
  {
    id: 'royal_diet',
    name: 'Royal Diet',
    summary: '+3 larvae per wave clear',
    flavor: 'The Queen feasts. The brood grows.',
    archetype: 'larvae-econ',
    effects: { waveLarvaeBonus: 3 },
  },
  {
    id: 'architects_cunning',
    name: "Architect's Cunning",
    summary: '+45 max HP · +120 honey storage',
    flavor: 'Wax never lies. It only grows.',
    archetype: 'turtle',
    effects: { hiveStartHPBonus: 45, honeyCapBonus: 120 },
  },
  {
    id: 'swarm_tactics',
    name: 'Swarm Tactics',
    summary: 'Strikers move 25% faster',
    flavor: 'When they move as one, they cannot be cornered.',
    archetype: 'aggro',
    effects: { strikerSpeedMul: 1.25 },
  },
  {
    id: 'bee_eaters_tactic',
    name: "Bee-Eater's Tactic",
    summary: 'Spiders take +70% striker damage',
    flavor: 'Know your enemy. Bury its eyes.',
    archetype: 'counter-spider',
    effects: { spiderDmgMul: 1.7 },
  },
  {
    id: 'hive_mind',
    name: 'Hive Mind',
    summary: 'All role costs −15%',
    flavor: 'The colony moves as one mind.',
    archetype: 'wide',
    effects: { allRoleCostMul: 0.85 },
  },
  {
    id: 'old_wax',
    name: 'Old Wax',
    summary: '+8 honey/wave (snowballs)',
    flavor: 'Each clear leaves something behind. Pick it up.',
    archetype: 'greed',
    effects: { waveHoneyBonus: 8 },
  },
  {
    id: 'eager_volley',
    name: 'Eager Volley',
    summary: 'Striker volleys fire 20% faster',
    flavor: 'Less waiting. More stinging.',
    archetype: 'aggro',
    effects: { strikerCooldownMul: 0.8 },
  },
];

// Waves that grant a boon pick (after the wave clears)
export const BOON_WAVES = [3, 6];
