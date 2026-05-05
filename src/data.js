// Comb At Me Bro — Phase A data.
// Hardcoded constants for the skeleton. Will split into data/ subdir
// (roles, attackers, waves, boons) starting Phase B.

export const PALETTE = {
  paper:     '#f5ebd6',
  paper2:    '#e6dcc4',
  ink:       '#3a2818',
  inkSoft:   '#6b513a',
  sage:      '#c8d89a',
  sageDark:  '#b5c879',
  honey:     '#f2c24a',
  honeyDeep: '#b66b1e',
  honeyHi:   '#f3cb7e',
  rust:      '#8a3a1c',
  rustDark:  '#3a1a0e',
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
  // Phase A: a single fixed-size swarm volley each cooldown.
  swarmCount: 5,           // strikers per volley
  cooldown: 1.6,           // seconds between volleys
  speed: 130,              // px / sec
  damagePerHit: 1,
  hitRadius: 14,
  particleSize: 3.5,
  // jitter in launch position so swarms don't stack on a single pixel
  spreadRadius: 18,
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
