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

// Phase B1: procedural wave generator. Replaces hardcoded WAVE_A.
// Wave n gets (3 + 2n) hornets over (18 + 3n) seconds.
//   1 →  5 hornets in 21s    2 →  7 hornets in 24s
//   3 →  9 hornets in 27s    4 → 11 hornets in 30s
//   5 → 13 hornets in 33s
// Spacing is deterministic with a small alternating jitter.
export function generateWave(n) {
  const count = 3 + n * 2;
  const duration = 18 + n * 3;
  const step = duration / count;
  const spawns = [];
  for (let i = 0; i < count; i++) {
    const jitter = i % 2 === 0 ? 0 : 0.7;
    spawns.push({ type: 'hornet', t: 1 + step * i + jitter });
  }
  return { spawns, duration };
}

export const TOTAL_WAVES = 5; // B1 ships 5; full 30 lands in Phase C.

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
