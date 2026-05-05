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
  startHP: 80,
  radius: 64,         // bigger to support proper detail (was 46)
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
  swarmCount: 3,           // base — was 5; now you really want rank-1
  cooldown: 1.8,           // a touch slower at base
  speed: 130,
  damagePerHit: 1,
  hitRadius: 14,
  particleSize: 3.5,
  spreadRadius: 18,
  wobbleAmpRange: [22, 60],
  wobbleFreqRange: [4, 10],
  speedMulRange: [0.78, 1.22],
  // Meteor Volley spec — every Nth volley
  meteorEveryN: 4,
  meteorDmgMul: 5,
  meteorAoE: 64,
  meteorSpeedMul: 0.5,
  // Echo Sting spec
  echoChance: 0.18,
  echoDmgMul: 0.5,
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

// Summary used by the next-wave preview card between waves.
// Returns { counts: { hornet, spider, bear, beekeeper }, duration }.
export function summarizeWave(n) {
  if (n < 1 || n > TOTAL_WAVES) return null;
  const wave = generateWave(n);
  const counts = {};
  for (const s of wave.spawns) counts[s.type] = (counts[s.type] || 0) + 1;
  return { counts, duration: wave.duration };
}

// ============================================================
// Phase B2 — economy + role investment
// ============================================================
export const ECONOMY = {
  startHoney: 45,
  startLarvae: 2,
  waveClearHoney: 22,
  waveClearLarvae: 2,
  waveClearHPRegen: 4,         // tightened from 10 — chip damage now hurts
  waveClearHPRegenArchitect: 5,
  honeyStorageCap: 220,
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
    costs:       [30, 65, 110],
    larvaeCosts: [ 0,  0,   8],   // rank 3 demands larvae
    maxRank: 3,
    specs: [
      {
        id: 'royal_reserve',
        name: 'Royal Reserve',
        description: 'Foragers stop ticking. Wave clears pay 1 honey per kill, per Forager rank.',
        // implemented in game.js (custom logic)
      },
      {
        id: 'pollen_storm',
        name: 'Pollen Storm',
        description: 'Foragers earn +50% honey. Each wave clear pays +1 larva per Forager rank.',
      },
    ],
  },
  nurse: {
    name: 'Nurse',
    glyph: '🐝',
    description: 'Raises the bee cap and brings new larvae each wave.',
    perRankLarvaePerWave: 1,
    perRankPopCap: 2,
    costs:       [25, 55, 95],
    larvaeCosts: [ 0,  0,  6],
    maxRank: 3,
    specs: [
      {
        id: 'royal_diet',
        name: 'Royal Diet',
        description: 'Bee cap +50%. Larvae per wave drop to zero — feast or famine.',
      },
      {
        id: 'larval_surge',
        name: 'Larval Surge',
        description: '+3 extra larvae per wave clear. Bee cap −1.',
      },
    ],
  },
  guard: {
    name: 'Guard',
    glyph: '🛡',
    description: 'Stings any intruder that reaches the hive door.',
    perRankContactDPS: 1.5,
    costs:       [40, 75, 130],
    larvaeCosts: [ 0,  0,   8],
    maxRank: 3,
    specs: [
      {
        id: 'sticky_resin',
        name: 'Sticky Resin',
        description: 'Intruders at the door slow 60% and drop +3 honey on death. Guard damage −25%.',
      },
      {
        id: 'thorn_mantle',
        name: 'Thorn Mantle',
        description: 'A 3 dmg/sec aura covers the hive. The hive door no longer takes contact damage.',
      },
    ],
  },
  striker: {
    name: 'Striker',
    glyph: '⚔',
    description: 'Sends larger swarms at your target. Limited by bee cap.',
    perRankSwarmBonus: 2,
    costs:       [30, 65, 110],
    larvaeCosts: [ 0,  0,   8],
    maxRank: 3,
    specs: [
      {
        id: 'meteor_volley',
        name: 'Meteor Volley',
        description: 'Every 4th volley becomes a single huge particle: 5× damage, splash on impact.',
      },
      {
        id: 'echo_sting',
        name: 'Echo Sting',
        description: 'Striker hits have an 18% chance to fire a free echo at the same target.',
      },
    ],
  },
  architect: {
    name: 'Architect',
    glyph: '⬡',
    description: 'Thickens the comb. More HP, more honey held.',
    perRankHiveHP: 25,
    perRankStorage: 80,
    costs:       [50, 100, 170],
    larvaeCosts: [ 0,   0,  10],
    maxRank: 3,
    specs: [
      {
        id: 'honeycomb_vault',
        name: 'Honeycomb Vault',
        description: 'Honey gained while at cap turns 5:1 into wax armor. Wax soaks damage before HP.',
      },
      {
        id: 'resonant_comb',
        name: 'Resonant Comb',
        description: 'Wave-clear regen ×3. The wave starts with a slow pulse on every intruder. Max HP −20.',
      },
    ],
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
  // ── Proc / chance-to-fire ──
  {
    id: 'echo_buzz',
    name: 'Echo Buzz',
    summary: '12% chance for a striker volley to fire a second time',
    flavor: 'The hive remembers every command.',
    effects: { volleyEchoChance: 0.12 },
  },
  {
    id: 'sister_sting',
    name: 'Sister Sting',
    summary: 'Striker hits stack a −1 armor mark on the target (max 5)',
    flavor: 'Every sting reminds the next one where to land.',
    effects: { sisterStingMaxStacks: 5, sisterStingPerStack: 1 },
  },
  // ── Conditional / build-defining ──
  {
    id: 'honey_geyser',
    name: 'Honey Geyser',
    summary: 'Striker damage doubles on every 3rd wave (3, 6, 9)',
    flavor: 'Save the rage. Spend it on the moments that matter.',
    effects: { honeyGeyserWaveMod: 3, honeyGeyserDmgMul: 2 },
  },
  {
    id: 'drone_kamikaze',
    name: 'Drone Kamikaze',
    summary: 'When the bee cap is full, strikers deal +60% damage',
    flavor: 'A full hive has no spare bees — every sting must matter.',
    effects: { droneKamikazeAtCapDmgMul: 1.6 },
  },
  {
    id: 'queens_decree',
    name: "Queen's Decree",
    summary: 'The first role you upgrade each wave costs 0 honey. Subsequent ones cost +20%.',
    flavor: 'The first command of the day is free. The rest must be earned.',
    effects: { queensDecreeFirstFree: true, queensDecreeRestMul: 1.2 },
  },
  {
    id: 'larval_tithe',
    name: 'Larval Tithe',
    summary: 'When you spend larvae on a specialization, refund 25 honey',
    flavor: 'Wax remembers what was given.',
    effects: { larvalTitheRefund: 25 },
  },
  // ── Old reliables (kept) ──
  {
    id: 'steel_resolve',
    name: 'Steel Resolve',
    summary: '+40 max hive HP',
    flavor: 'Hold the line.',
    effects: { hiveStartHPBonus: 40 },
  },
  {
    id: 'brood_provisions',
    name: 'Brood Provisions',
    summary: '+2 larvae per wave cleared',
    flavor: 'There will always be enough for the next sting.',
    effects: { waveLarvaeBonus: 2 },
  },
  {
    id: 'eager_volley',
    name: 'Eager Volley',
    summary: 'Strikers fire volleys 20% faster',
    flavor: 'Less waiting. More stinging.',
    effects: { strikerCooldownMul: 0.8 },
  },
  {
    id: 'foragers_blessing',
    name: "Forager's Blessing",
    summary: 'Foragers produce +50% honey',
    flavor: 'The pollen sings in golden tongues.',
    effects: { foragerHoneyMul: 1.5 },
  },
];

// Waves that grant a boon pick (after the wave clears)
export const BOON_WAVES = [3, 6];

// ============================================================
// Active abilities — player-triggered effects during combat.
// Per fun-audit feedback: ONE ability, deeply scaled with role investments,
// is the fix for "agency collapse" during waves. More abilities can layer on
// later, but only after we confirm this loop feels good.
// ============================================================
export const ABILITIES = {
  rally_hum: {
    id: 'rally_hum',
    name: 'Rally Hum',
    glyph: '✦',
    description: 'For a few seconds, your strikers fire and fly faster.',
    available: () => true,

    // Honey cost — falls with Forager investment (20 → 14 at rank 3).
    // Per fun-audit: scarcity creates decisions; pushed up from 15 baseline.
    getHoneyCost: (state) => Math.max(10, 20 - (state.roles?.forager?.rank ?? 0) * 2),
    // Cooldown — falls with Forager investment (12s → 9s at rank 3).
    // Pushed up from 8s baseline so "press on cooldown" stops being optimal.
    getCooldown: (state) => Math.max(7, 12 - (state.roles?.forager?.rank ?? 0) * 1),
    // Effect duration — grows with Striker investment (4s → 5.5s at rank 3)
    getDuration: (state) => 4 + (state.roles?.striker?.rank ?? 0) * 0.5,
    // Attack-speed multiplier on the striker cooldown (0.7 → 0.55 at striker rank 3)
    getAttackSpeedMul: (state) => 0.7 - (state.roles?.striker?.rank ?? 0) * 0.05,
    // Movement-speed multiplier on striker particles
    getMoveSpeedMul: (state) => 1.15 + (state.roles?.striker?.rank ?? 0) * 0.05,
  },
};

export const ABILITY_ORDER = ['rally_hum'];

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
