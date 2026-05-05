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

// Phase A wave: 8 hornets, staggered. Survive to win.
export const WAVE_A = {
  duration: 30, // seconds; informational
  spawns: [
    { type: 'hornet', t: 0.5 },
    { type: 'hornet', t: 3.5 },
    { type: 'hornet', t: 6.0 },
    { type: 'hornet', t: 9.0 },
    { type: 'hornet', t: 12.0 },
    { type: 'hornet', t: 15.5 },
    { type: 'hornet', t: 19.0 },
    { type: 'hornet', t: 23.0 },
  ],
};
