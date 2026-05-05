// Phase B1.5 renderer — canvas port of Claude Design v2 specs.
//
// Strategy: extract shapes (ellipses, paths, colors) from the SVG/JSX bundle
// and reproduce them as canvas drawing calls. We can't run feTurbulence at
// runtime cheaply, so the "wobbly hand-drawn" feel comes from:
//   - exact palette match
//   - layered fills + stroke pairs
//   - subtle breathing / flutter animations driven by elapsed time
//   - paper-card framed UI with soft drop shadows
//
// Design references (in handoff bundle):
//   project/cb/style.jsx, hive.jsx, bees.jsx, enemies.jsx, anim.jsx, vfx.jsx

import { PALETTE, ROLE_ORDER } from './data.js?v=__VERSION__';

// ----------------------------------------------------------------------------
// Wobbly hand-drawn helpers — fake the picture-book wobble without SVG turbulence
// ----------------------------------------------------------------------------
function wobblyEllipsePath(ctx, cx, cy, rx, ry, seed = 0, amplitude = 0.85, segments = 36) {
  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const noise = (Math.sin(t * 5 + seed) * 0.55 +
                   Math.cos(t * 8.7 + seed * 1.4) * 0.35 +
                   Math.sin(t * 13.1 + seed * 2.7) * 0.20) * amplitude;
    const x = cx + Math.cos(t) * (rx + noise);
    const y = cy + Math.sin(t) * (ry + noise);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function strokeWobblyDouble(ctx, drawFn) {
  // Two passes — main stroke + lighter offset stroke for hand-drawn doubled-line feel
  drawFn();
  ctx.stroke();
  ctx.save();
  ctx.translate(0.6, -0.6);
  ctx.globalAlpha *= 0.4;
  drawFn();
  ctx.stroke();
  ctx.restore();
}

// Cached paper-texture sage tile and hex-comb fill pattern
let _paperTile = null;
function getPaperTile() {
  if (_paperTile) return _paperTile;
  const c = document.createElement('canvas');
  c.width = 96; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = PALETTE.sage;
  x.fillRect(0, 0, 96, 96);
  // sparse darker speckles
  x.fillStyle = PALETTE.sageDeep;
  for (let i = 0; i < 70; i++) {
    const px = Math.floor(Math.random() * 96);
    const py = Math.floor(Math.random() * 96);
    x.globalAlpha = 0.18 + Math.random() * 0.22;
    x.fillRect(px, py, 1, 1);
  }
  // a few faint micro-strokes
  x.globalAlpha = 0.18;
  x.strokeStyle = PALETTE.sageDark;
  x.lineWidth = 0.6;
  for (let i = 0; i < 14; i++) {
    const px = Math.random() * 96;
    const py = Math.random() * 96;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + 2 + Math.random() * 3, py - 1 - Math.random() * 2);
    x.stroke();
  }
  _paperTile = c;
  return _paperTile;
}

let _hexCombTile = null;
function getHexCombTile() {
  if (_hexCombTile) return _hexCombTile;
  // 28×24 hex grid tile (pointy-top hexagons)
  const tw = 28, th = 24;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const x = c.getContext('2d');
  x.fillStyle = PALETTE.honey;
  x.fillRect(0, 0, tw, th);
  // ink hex outlines
  x.strokeStyle = PALETTE.honeyDark;
  x.lineWidth = 1;
  x.globalAlpha = 0.55;
  drawHex(x, tw / 2, th / 2, 9);
  drawHex(x, 0,        0,         9);
  drawHex(x, tw,       0,         9);
  drawHex(x, 0,        th,        9);
  drawHex(x, tw,       th,        9);
  // center dot per cell for subtle depth
  x.fillStyle = PALETTE.honeyDeep;
  x.globalAlpha = 0.35;
  x.fillRect(tw/2 - 1, th/2 - 1, 2, 2);
  _hexCombTile = c;
  return _hexCombTile;
}

// ============================================================================
// Public entry
// ============================================================================
export function render(ctx, state) {
  // screen shake — wraps the entire frame
  ctx.save();
  if (state.shakeAmount > 0.4) {
    const sx = (Math.random() - 0.5) * state.shakeAmount;
    const sy = (Math.random() - 0.5) * state.shakeAmount;
    ctx.translate(sx, sy);
  }
  drawField(ctx, state);
  drawWildflowers(ctx, state);
  drawHiveAccessories(ctx, state);
  if (state.phase === 'idle') drawDefensivePerimeter(ctx, state);
  drawAttackers(ctx, state);
  drawHive(ctx, state);
  drawColonyBees(ctx, state);
  drawSwarmParticles(ctx, state);
  if (state.priorityTarget && state.priorityTarget.deathT == null) {
    drawPriorityReticle(ctx, state.priorityTarget, state.elapsed);
  }
  drawFx(ctx, state);
  drawHiveHP(ctx, state.hive, state);
  drawBanner(ctx, state);
  ctx.restore();
}

// Reticle on tap-prioritized target — dashed ring + 4 corner ticks
function drawPriorityReticle(ctx, target, elapsed) {
  ctx.save();
  ctx.translate(target.x, target.y);
  // gentle pulse
  const pulse = 1 + 0.1 * Math.sin(elapsed * 6);
  ctx.strokeStyle = PALETTE.redInk;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  // outer dashed circle
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, 22 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // 4 corner ticks
  const r1 = 18 * pulse, r2 = 27 * pulse;
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================================
// Layer 1 — field / grass / tufts
// ============================================================================
function drawField(ctx, state) {
  // tile a paper-textured sage background
  const tile = getPaperTile();
  const pat = ctx.createPattern(tile, 'repeat');
  ctx.fillStyle = pat || PALETTE.sage;
  ctx.fillRect(0, 0, state.width, state.height);
  drawGrassTufts(ctx, state.width, state.height);
  drawGrassPath(ctx, state.width, state.height);
}

// A meandering ink trail leading up to the hive — gives the field intent
function drawGrassPath(ctx, w, h) {
  const cx = w / 2;
  const baseY = h - 130;
  ctx.save();
  ctx.strokeStyle = PALETTE.sageDark;
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.35;
  ctx.setLineDash([4, 7]);
  ctx.beginPath();
  ctx.moveTo(cx, 30);
  ctx.bezierCurveTo(cx + 60, h * 0.35, cx - 50, h * 0.55, cx, baseY - 80);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

const TUFTS = [
  { x: 0.12, y: 0.18 }, { x: 0.86, y: 0.10 },
  { x: 0.30, y: 0.42 }, { x: 0.72, y: 0.58 },
  { x: 0.18, y: 0.66 }, { x: 0.92, y: 0.78 },
  { x: 0.05, y: 0.85 }, { x: 0.55, y: 0.30 },
  { x: 0.40, y: 0.74 }, { x: 0.80, y: 0.40 },
  { x: 0.62, y: 0.20 }, { x: 0.25, y: 0.52 },
  { x: 0.95, y: 0.32 }, { x: 0.08, y: 0.50 },
];

function drawGrassTufts(ctx, w, h) {
  // soft sage shadow blobs
  ctx.fillStyle = PALETTE.sageDeep;
  for (const t of TUFTS) {
    const x = t.x * w, y = t.y * h;
    ctx.beginPath();
    ctx.ellipse(x, y, 9, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // tiny darker blade strokes for life
  ctx.strokeStyle = PALETTE.sageDark;
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  for (const t of TUFTS) {
    const x = t.x * w, y = t.y * h;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 2);
    ctx.quadraticCurveTo(x - 4, y - 2, x - 2, y - 4);
    ctx.moveTo(x + 1, y + 2);
    ctx.quadraticCurveTo(x + 1, y - 3, x + 3, y - 5);
    ctx.stroke();
  }
}

// ============================================================================
// Layer 2 — defensive perimeter (idle phase only)
// ============================================================================
function drawDefensivePerimeter(ctx, state) {
  const { hive } = state;
  ctx.save();
  ctx.strokeStyle = PALETTE.inkSoft;
  ctx.globalAlpha = 0.35;
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(hive.x, hive.y + 6, hive.radius * 2.4, hive.radius * 1.6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// Layer 3 — attackers
// ============================================================================
function drawAttackers(ctx, state) {
  // Smoke clouds are drawn before sprites so bees fade *into* the cloud,
  // and an unfortunate visual order doesn't overlay sprites on top of smoke.
  for (const a of state.attackers) {
    if (a.type === 'beekeeper' && a.deathT == null && a.smokeOnFor > 0) {
      drawSmokeAoE(ctx, a, state.elapsed);
    }
  }
  for (const a of state.attackers) {
    if (a.type === 'hornet')         drawHornet(ctx, a, state.elapsed);
    else if (a.type === 'spider')    drawSpider(ctx, a, state.elapsed);
    else if (a.type === 'bear')      drawBear(ctx, a, state.elapsed);
    else if (a.type === 'beekeeper') drawBeekeeper(ctx, a, state.elapsed);
  }
}

// Hornet — port of cb/enemies.jsx Hornet:
// rust ellipse body + dark stripe paths + triangular head + stinger + 2 wings
function drawHornet(ctx, a, elapsed) {
  ctx.save();
  ctx.translate(a.x, a.y);

  // death anim: curl + fade (cb-curl + cb-puff hybrid)
  if (a.deathT != null) {
    const k = Math.min(1, a.deathT / 0.6);
    ctx.globalAlpha = 1 - k;
    ctx.scale(1 - k * 0.45, 1 - k * 0.45);
    ctx.rotate(k * 0.7);
  }

  // shadow blob
  ctx.fillStyle = PALETTE.ink;
  ctx.globalAlpha *= 0.20;
  ctx.beginPath();
  ctx.ellipse(0, 11, 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = a.deathT != null ? 1 - Math.min(1, a.deathT / 0.6) : 1;

  // wings — fluttering ellipses behind body (cb-flutter, scaleY 1↔0.55 every 0.18s)
  const flutter = 0.55 + 0.45 * Math.abs(Math.sin(elapsed * 18 + a.flutterPhase));
  ctx.fillStyle = PALETTE.white;
  ctx.globalAlpha = 0.78 * (a.deathT == null ? 1 : 1 - a.deathT / 0.6);
  drawEllipse(ctx, -5, -3, 6, 4 * flutter, -0.35);
  drawEllipse(ctx,  5, -3, 6, 4 * flutter,  0.35);
  ctx.globalAlpha = a.deathT != null ? 1 - Math.min(1, a.deathT / 0.6) : 1;

  // body (rust)
  ctx.fillStyle = PALETTE.rust;
  drawEllipse(ctx, 0, 0, 11, 7);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
  ctx.stroke();

  // dark stripes (rustDark) — 2 vertical wobble paths
  ctx.strokeStyle = PALETTE.rustDark;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, -5.5);
  ctx.quadraticCurveTo(-3.5, 0, -3, 5.5);
  ctx.moveTo(3, -5.5);
  ctx.quadraticCurveTo(3.5, 0, 3, 5.5);
  ctx.stroke();

  // head — small darker circle in front (down direction since hornets point at hive)
  ctx.fillStyle = PALETTE.rustDark;
  drawEllipse(ctx, 0, 8, 4.8, 4);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 8, 4.8, 4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // stinger triangle on tail
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.moveTo(-2, -7);
  ctx.lineTo(2, -7);
  ctx.lineTo(0, -11);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Spider — port of cb/enemies.jsx: purple oval body, 8 scuttling legs,
// 4 red eyes, gentle scuttle wobble.
function drawSpider(ctx, a, elapsed) {
  ctx.save();
  ctx.translate(a.x, a.y);

  if (a.deathT != null) {
    const k = Math.min(1, a.deathT / 0.6);
    ctx.globalAlpha = 1 - k;
    ctx.scale(1 - k * 0.5, 1 - k * 0.5);
    ctx.rotate(k * -0.6);
  } else {
    // scuttle wobble: small horizontal jiggle + rotation
    const sc = Math.sin(elapsed * 14 + a.legPhase) * 0.06;
    ctx.rotate(sc);
  }

  // shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.20)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 14, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 8 legs — curved bezier strokes radiating from body, two each side at 4 angles
  ctx.strokeStyle = PALETTE.spiderPurple;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  const legPhase = elapsed * 16 + a.legPhase;
  const legAngles = [
    [-1.0, -0.6],
    [-0.6, -0.2],
    [ 0.6,  0.2],
    [ 1.0,  0.6],
  ];
  for (let side = -1; side <= 1; side += 2) {
    let i = 0;
    for (const [a1, a2] of legAngles) {
      const sw = side * (Math.sin(legPhase + i++) * 0.6 + 1);
      ctx.beginPath();
      ctx.moveTo(side * 5, -1);
      ctx.quadraticCurveTo(side * 11, a1 * 8 + sw, side * 14, a2 * 10 + sw);
      ctx.stroke();
    }
  }

  // body — purple oval
  ctx.fillStyle = PALETTE.spiderPurple;
  drawEllipse(ctx, 0, 0, 9, 11);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.stroke();

  // head segment (smaller, in front toward hive direction = +y)
  ctx.fillStyle = PALETTE.rustDark;
  drawEllipse(ctx, 0, 9, 5, 5);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 9, 5, 5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 4 red eyes
  ctx.fillStyle = PALETTE.redInk;
  drawEllipse(ctx, -2.5, 9.5, 0.9, 0.9);
  drawEllipse(ctx,  2.5, 9.5, 0.9, 0.9);
  drawEllipse(ctx, -1.5, 11, 0.7, 0.7);
  drawEllipse(ctx,  1.5, 11, 0.7, 0.7);

  // bite proximity hint — a faint web glow when biting (alive only)
  if (a.deathT == null && a.biteCD != null && a.biteCD < 0.15) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = PALETTE.webWhite;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Bear — boss-tier, ~52px diameter. Honey-dark body, rust spots, simple face.
function drawBear(ctx, a, elapsed) {
  ctx.save();
  ctx.translate(a.x, a.y);

  if (a.deathT != null) {
    const k = Math.min(1, a.deathT / 0.6);
    ctx.globalAlpha = 1 - k;
    ctx.scale(1 - k * 0.4, 1 - k * 0.4);
    ctx.rotate(k * 0.7);
  } else {
    // cb-bob-s (slow, big amplitude)
    const bob = Math.sin(elapsed * 1.8 + a.bobPhase) * 1.6;
    ctx.translate(0, bob);
  }

  // shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.30)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 28, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // body — big honey-dark oval
  ctx.fillStyle = PALETTE.honeyDark;
  drawEllipse(ctx, 0, 0, 24, 20);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 20, 0, 0, Math.PI * 2);
  ctx.stroke();

  // spots
  ctx.fillStyle = PALETTE.rustDark;
  drawEllipse(ctx, -10, -6, 4, 3);
  drawEllipse(ctx, 10, -3, 4, 3);
  drawEllipse(ctx, -4, 8, 3.5, 2.5);
  drawEllipse(ctx, 13, 8, 3.5, 2.5);

  // paws (front)
  ctx.fillStyle = PALETTE.honeyDark;
  drawEllipse(ctx, -16, 14, 7, 5);
  drawEllipse(ctx,  16, 14, 7, 5);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(-16, 14, 7, 5, 0, 0, Math.PI * 2);
  ctx.ellipse( 16, 14, 7, 5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // head — slightly smaller in front (down direction)
  ctx.fillStyle = PALETTE.honeyDark;
  drawEllipse(ctx, 0, 16, 11, 9);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 16, 11, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ears — two small ovals at top of head
  ctx.fillStyle = PALETTE.honeyDark;
  drawEllipse(ctx, -7, 9, 3, 3);
  drawEllipse(ctx,  7, 9, 3, 3);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.ellipse(-7, 9, 3, 3, 0, 0, Math.PI * 2);
  ctx.ellipse( 7, 9, 3, 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // eyes
  ctx.fillStyle = PALETTE.ink;
  drawEllipse(ctx, -3, 14, 1.3, 1.3);
  drawEllipse(ctx,  3, 14, 1.3, 1.3);

  // nose
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.moveTo(-1.5, 18);
  ctx.lineTo(1.5, 18);
  ctx.lineTo(0, 20);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Smoke AoE — wobbly grey cloud beneath the beekeeper, 95px radius
function drawSmokeAoE(ctx, a, elapsed) {
  const r = 95;
  ctx.save();
  ctx.translate(a.x, a.y);
  // wobble: 3 layered ellipses with phase offsets and softening alpha
  const layers = [
    { off: 0,           alpha: 0.55, rad: r * 1.0, freq: 0.9 },
    { off: 0.5 * Math.PI, alpha: 0.40, rad: r * 0.85, freq: 1.4 },
    { off: 1.0 * Math.PI, alpha: 0.30, rad: r * 0.7, freq: 2.1 },
  ];
  for (const L of layers) {
    const wobble = Math.sin(elapsed * L.freq + L.off) * 4;
    ctx.fillStyle = PALETTE.smokeGrey;
    ctx.globalAlpha = L.alpha;
    ctx.beginPath();
    ctx.ellipse(0, 0, L.rad + wobble, L.rad * 0.85 + wobble, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // ink edge for hand-drawn feel
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// Beekeeper — human boss, top-down. Paper body, paper veiled head, smoker arm.
function drawBeekeeper(ctx, a, elapsed) {
  ctx.save();
  ctx.translate(a.x, a.y);

  if (a.deathT != null) {
    const k = Math.min(1, a.deathT / 0.6);
    ctx.globalAlpha = 1 - k;
    ctx.scale(1 - k * 0.5, 1 - k * 0.5);
    ctx.rotate(k * 0.4);
  } else {
    const bob = Math.sin(elapsed * 1.4 + a.bobPhase) * 1.0;
    ctx.translate(0, bob);
  }

  // shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 24, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs (two small paper rectangles)
  ctx.fillStyle = PALETTE.paper;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.4;
  ctx.fillRect(-8, 8, 5, 14);
  ctx.strokeRect(-8, 8, 5, 14);
  ctx.fillRect(3, 8, 5, 14);
  ctx.strokeRect(3, 8, 5, 14);

  // body — paper rounded rectangle (drawn as two-pass)
  ctx.fillStyle = PALETTE.paper;
  drawEllipse(ctx, 0, 0, 14, 14);
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 14, 0, 0, Math.PI * 2);
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // smoker — small rectangle at left side, with handle dot
  ctx.fillStyle = PALETTE.honeyDark;
  ctx.fillRect(-22, -2, 8, 11);
  ctx.strokeRect(-22, -2, 8, 11);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(-21, -5, 6, 4);
  // smoker stem to body
  ctx.strokeStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.lineTo(-10, 4);
  ctx.stroke();

  // head/hat — paper circle slightly forward
  ctx.fillStyle = PALETTE.paper;
  drawEllipse(ctx, 0, 14, 10, 10);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 14, 10, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  // veil grid pattern on head
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 0.6;
  for (let i = -8; i <= 8; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i, 14 - 8);
    ctx.lineTo(i, 14 + 8);
    ctx.stroke();
  }
  for (let j = -8; j <= 8; j += 3) {
    ctx.beginPath();
    ctx.moveTo(-8, 14 + j);
    ctx.lineTo(8, 14 + j);
    ctx.stroke();
  }

  // smoke puff coming out of smoker top — small idle puffs
  if (a.smokeOnFor > 0 || a.deathT != null) {
    // active smoke — bigger puffs
    const puffSize = a.smokeOnFor > 0 ? 6 : 3;
    const wob = Math.sin(elapsed * 5) * 2;
    ctx.fillStyle = PALETTE.smokeGrey;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(-18, -8 + wob, puffSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-21, -14 + wob, puffSize - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ============================================================================
// Layer 4 — the hive
// ============================================================================
function drawHive(ctx, state) {
  const { hive } = state;
  const breath = 1 + 0.025 * Math.sin(hive.breathPhase * (Math.PI * 2 / 3));
  const r = hive.radius * breath;

  // shadow blob
  ctx.fillStyle = 'rgba(58, 40, 24, 0.30)';
  ctx.beginPath();
  ctx.ellipse(hive.x, hive.y + r * 0.92, r * 1.15, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  const hpRatio = hive.hp / hive.maxHP;

  ctx.save();
  ctx.translate(hive.x, hive.y);

  // ─── BODY: honey-glow base (rich gradient) ───
  const grad = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r * 1.05);
  grad.addColorStop(0, PALETTE.honeyLight);
  grad.addColorStop(0.45, PALETTE.honey);
  grad.addColorStop(0.85, PALETTE.honeyDeep);
  grad.addColorStop(1, PALETTE.honeyDark);
  ctx.fillStyle = grad;
  wobblyEllipsePath(ctx, 0, 2, r * 0.98, r * 0.88, 11.7, 1.1);
  ctx.fill();

  // ─── HEX COMB CELLS — proper visible honeycomb tiling ───
  ctx.save();
  // clip to body shape so cells stay inside
  wobblyEllipsePath(ctx, 0, 2, r * 0.94, r * 0.84, 11.7, 0.8);
  ctx.clip();
  drawCombGrid(ctx, r);
  ctx.restore();

  // ─── DRIPS — six wax drips around the perimeter ───
  ctx.fillStyle = PALETTE.honey;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.6;
  drawDrip(ctx, -r * 0.65,  r * 0.45, -r * 0.55,  r * 0.92);
  drawDrip(ctx, -r * 0.20,  r * 0.78, -r * 0.10,  r * 1.05);
  drawDrip(ctx,  r * 0.20,  r * 0.78,  r * 0.30,  r * 1.00);
  drawDrip(ctx,  r * 0.65,  r * 0.45,  r * 0.55,  r * 0.92);
  // smaller frozen drips on top
  drawDrip(ctx, -r * 0.78,  r * 0.05, -r * 0.74,  r * 0.30);
  drawDrip(ctx,  r * 0.78,  r * 0.05,  r * 0.74,  r * 0.30);

  // ─── INK OUTLINE — wobbly double pass ───
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  strokeWobblyDouble(ctx, () => {
    wobblyEllipsePath(ctx, 0, 2, r * 0.98, r * 0.88, 11.7, 1.1);
  });

  // ─── ENTRANCE — dark hole with rust gradient inner ───
  ctx.fillStyle = PALETTE.ink;
  drawEllipse(ctx, 0, r * 0.55, r * 0.20, r * 0.11);
  const eGrad = ctx.createRadialGradient(0, r * 0.55, 0, 0, r * 0.55, r * 0.18);
  eGrad.addColorStop(0, PALETTE.rustDark);
  eGrad.addColorStop(1, PALETTE.ink);
  ctx.fillStyle = eGrad;
  drawEllipse(ctx, 0, r * 0.52, r * 0.15, r * 0.08);

  // ─── DAMAGE: cracks at <50% HP ───
  if (hpRatio < 0.5) {
    ctx.strokeStyle = hpRatio < 0.25 ? PALETTE.redInk : PALETTE.ink;
    ctx.lineWidth = hpRatio < 0.25 ? 2.2 : 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.40, -r * 0.40);
    ctx.lineTo(-r * 0.12, -r * 0.10);
    ctx.lineTo(-r * 0.30,  r * 0.20);
    ctx.moveTo( r * 0.45, -r * 0.30);
    ctx.lineTo( r * 0.20,  r * 0.05);
    ctx.lineTo( r * 0.30,  r * 0.30);
    ctx.moveTo( r * 0.10, -r * 0.65);
    ctx.lineTo( r * 0.18, -r * 0.30);
    ctx.stroke();
  }
  // critical: red pulse outline + flicker
  if (hpRatio < 0.25) {
    const pulseAlpha = 0.45 + 0.55 * Math.abs(Math.sin(hive.breathPhase * 4.5));
    ctx.save();
    ctx.globalAlpha = pulseAlpha;
    ctx.strokeStyle = PALETTE.redInk;
    ctx.lineWidth = 3;
    wobblyEllipsePath(ctx, 0, 2, r * 1.04, r * 0.94, 11.7, 0.8);
    ctx.stroke();
    ctx.restore();
  }

  // ─── QUEEN HINT — tiny yellow dot at the entrance ───
  if (hpRatio > 0.05) {
    ctx.fillStyle = PALETTE.honey;
    drawEllipse(ctx, 0, r * 0.50, 1.6, 1.6);
  }

  ctx.restore();
}

// Hex comb cells inside the hive body. Pointy-top hex grid, multiple cells
// with subtle alternating tones so the body reads as actual comb.
function drawCombGrid(ctx, r) {
  const cellR = r * 0.13;
  const dx = cellR * Math.sqrt(3); // horizontal spacing for pointy-top
  const dy = cellR * 1.5;
  const yMin = -r * 0.85, yMax = r * 0.7;
  const xMin = -r * 0.95, xMax = r * 0.95;
  let row = 0;
  for (let y = yMin; y <= yMax; y += dy) {
    const offset = (row % 2) * (dx / 2);
    for (let x = xMin; x <= xMax; x += dx) {
      const cx = x + offset;
      const cy = y;
      // subtle tone variation
      const tone = (row + Math.round(cx)) % 3;
      ctx.fillStyle = tone === 0 ? PALETTE.honey
                    : tone === 1 ? PALETTE.honeyLight
                    :              PALETTE.honeyDeep;
      ctx.globalAlpha = 0.55;
      drawHex(ctx, cx, cy, cellR * 0.9);
      // ink stroke
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = PALETTE.honeyDark;
      ctx.lineWidth = 0.8;
      drawHexStroke(ctx, cx, cy, cellR * 0.9);
    }
    row += 1;
  }
  ctx.globalAlpha = 1;
}

function drawHexStroke(ctx, cx, cy, size) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const x = cx + Math.cos(a) * size;
    const y = cy + Math.sin(a) * size;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

// ============================================================================
// Wildflowers — static decorative flowers scattered in the lower field
// ============================================================================
const FLOWER_POSITIONS = [
  { x: 0.10, y: 0.74, c: 'jelly' },   { x: 0.22, y: 0.88, c: 'honey' },
  { x: 0.34, y: 0.80, c: 'redInk' },  { x: 0.46, y: 0.93, c: 'jelly' },
  { x: 0.62, y: 0.86, c: 'honey' },   { x: 0.74, y: 0.79, c: 'redInk' },
  { x: 0.86, y: 0.92, c: 'jelly' },   { x: 0.92, y: 0.78, c: 'honey' },
  { x: 0.06, y: 0.92, c: 'honey' },   { x: 0.55, y: 0.74, c: 'redInk' },
];
function drawWildflowers(ctx, state) {
  const { width: w, height: h } = state;
  for (const f of FLOWER_POSITIONS) {
    const x = f.x * w;
    const y = f.y * h;
    drawFlower(ctx, x, y, PALETTE[f.c]);
  }
}
function drawFlower(ctx, x, y, petalColor) {
  // 5 petals + center + tiny stem
  ctx.save();
  ctx.translate(x, y);
  // stem
  ctx.strokeStyle = PALETTE.sageDark;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 5);
  ctx.stroke();
  // 5 petals
  ctx.fillStyle = petalColor;
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const px = Math.cos(a) * 2.6;
    const py = Math.sin(a) * 2.6;
    ctx.beginPath();
    ctx.ellipse(px, py, 1.7, 2.2, a, 0, Math.PI * 2);
    ctx.fill();
  }
  // ink outline halo
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const px = Math.cos(a) * 2.6;
    const py = Math.sin(a) * 2.6;
    ctx.beginPath();
    ctx.ellipse(px, py, 1.7, 2.2, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  // center
  ctx.fillStyle = PALETTE.honeyDark;
  ctx.beginPath();
  ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ============================================================================
// Hive accessories — propolis stones and small surface details around the hive base
// ============================================================================
function drawHiveAccessories(ctx, state) {
  const { hive } = state;
  // four small wax stones around the hive base
  const stones = [
    { x: -hive.radius * 1.45, y: hive.radius * 0.85, w: 14, h: 7 },
    { x: -hive.radius * 0.7, y: hive.radius * 1.08, w: 10, h: 5 },
    { x:  hive.radius * 0.7, y: hive.radius * 1.05, w: 12, h: 6 },
    { x:  hive.radius * 1.45, y: hive.radius * 0.85, w: 14, h: 7 },
  ];
  for (const s of stones) {
    ctx.save();
    ctx.translate(hive.x + s.x, hive.y + s.y);
    // shadow
    ctx.fillStyle = 'rgba(58, 40, 24, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, s.h * 0.6, s.w, s.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    ctx.fillStyle = PALETTE.honeyDark;
    ctx.beginPath();
    ctx.ellipse(0, 0, s.w, s.h, 0, 0, Math.PI * 2);
    ctx.fill();
    // ink outline
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // top highlight
    ctx.fillStyle = PALETTE.honeyLight;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.ellipse(-s.w * 0.3, -s.h * 0.4, s.w * 0.5, s.h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================================
// Colony bees — visible role-typed bees around the hive (one per role rank)
// ============================================================================
function drawColonyBees(ctx, state) {
  const { hive } = state;
  // collect all rank-units to draw, in role order
  const units = [];
  for (const key of ROLE_ORDER) {
    const rank = state.roles[key].rank;
    for (let i = 0; i < rank; i++) units.push(key);
  }
  if (units.length === 0) return;
  // arrange them around the hive in an arc above and around the entrance
  const baseR = hive.radius * 1.18;
  const t = hive.breathPhase;
  const total = units.length;
  for (let i = 0; i < total; i++) {
    // angle distribution: spread units across an arc 200° (top + sides),
    // leaving the bottom open for the entrance + path
    const startAngle = -Math.PI * 0.95;
    const endAngle = -Math.PI * 0.05;
    const a = total === 1
      ? -Math.PI * 0.5
      : startAngle + ((endAngle - startAngle) * i) / (total - 1);
    // gentle bob per unit, phase-staggered
    const bob = Math.sin(t * 1.4 + i * 0.7) * 1.6;
    const r = baseR + Math.cos(t * 0.9 + i) * 1.2;
    const x = hive.x + Math.cos(a) * r;
    const y = hive.y + Math.sin(a) * r + bob;
    drawColonyBee(ctx, x, y, units[i], t * 18 + i);
  }
}

// One colony bee, role-typed. Drawn at ~18px scale so it's clearly visible.
function drawColonyBee(ctx, x, y, role, fluttPhase) {
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.20)';
  ctx.beginPath();
  ctx.ellipse(0, 5, 6, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // wings
  const flutter = 0.55 + 0.45 * Math.abs(Math.sin(fluttPhase));
  ctx.fillStyle = PALETTE.white;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.ellipse(-2.5, -2, 3.2, 2.0 * flutter, -0.4, 0, Math.PI * 2);
  ctx.ellipse( 2.5, -2, 3.2, 2.0 * flutter,  0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // body color by role
  const bodyColor = (() => {
    switch (role) {
      case 'forager':   return PALETTE.honey;
      case 'nurse':     return PALETTE.honeyLight;
      case 'guard':     return PALETTE.honeyDeep;
      case 'striker':   return PALETTE.honey;
      case 'architect': return PALETTE.honeyDeep;
      default:          return PALETTE.honey;
    }
  })();
  // body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.2, 3.0, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.0;
  ctx.stroke();
  // stripes (vary by role)
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = role === 'guard' ? 1.4 : 0.9;
  ctx.beginPath();
  ctx.moveTo(0, -2.6); ctx.lineTo(0, 2.6);
  if (role === 'guard') {
    ctx.moveTo(-1.4, -2.4); ctx.lineTo(-1.4, 2.4);
    ctx.moveTo( 1.4, -2.4); ctx.lineTo( 1.4, 2.4);
  }
  ctx.stroke();
  // role accents
  if (role === 'forager') {
    ctx.fillStyle = PALETTE.rust;
    ctx.beginPath(); ctx.arc(-3.5, 1.5, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 3.5, 1.5, 0.9, 0, Math.PI * 2); ctx.fill();
  } else if (role === 'nurse') {
    // larva bundle below
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.ellipse(0, 3.4, 2.0, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  } else if (role === 'striker') {
    // motion lines behind
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 0.7;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(-5, -1); ctx.lineTo(-7, -1);
    ctx.moveTo(-5,  1); ctx.lineTo(-7,  1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // stinger
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.moveTo(0, 3.0); ctx.lineTo(-0.7, 4.5); ctx.lineTo(0.7, 4.5);
    ctx.closePath(); ctx.fill();
  } else if (role === 'architect') {
    // wax flake
    ctx.fillStyle = PALETTE.honeyLight;
    drawHex(ctx, 0, 4.2, 1.6);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 0.6;
    drawHexStroke(ctx, 0, 4.2, 1.6);
  } else if (role === 'guard') {
    // big stinger
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.moveTo(0, 3.2); ctx.lineTo(-1.0, 5.0); ctx.lineTo(1.0, 5.0);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawDrip(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2 + 4, (y1 + y2) / 2, x2, y2);
  ctx.quadraticCurveTo(x2 + 6, y2 + 4, x1 + 4, y1 + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawHex(ctx, cx, cy, size) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const x = cx + Math.cos(a) * size;
    const y = cy + Math.sin(a) * size;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// 4 orbiting idle bees (cb-spin variants, 8s–11.5s, phase-staggered)
function drawOrbitingBees(ctx, hive) {
  const r = hive.radius * 1.25;
  const t = hive.breathPhase;
  const phases = [
    { speed: 0.78, offset: 0,            ry: 0.62 },
    { speed: 0.54, offset: Math.PI * 0.5, ry: 0.55 },
    { speed: 0.65, offset: Math.PI,       ry: 0.70 },
    { speed: 0.72, offset: Math.PI * 1.5, ry: 0.58 },
  ];
  for (const p of phases) {
    const a = t * p.speed + p.offset;
    const x = hive.x + Math.cos(a) * r;
    const y = hive.y + Math.sin(a) * r * p.ry;
    drawTinyBee(ctx, x, y, t * 18 + p.offset);
  }
}

// Tiny bee — used both for idle orbiters and striker swarm particles.
// Three layers: shadow + wings + body + stripe accent.
function drawTinyBee(ctx, x, y, fluttPhase) {
  ctx.save();
  ctx.translate(x, y);

  // wings (white, fluttering)
  const flutter = 0.55 + 0.45 * Math.abs(Math.sin(fluttPhase));
  ctx.fillStyle = PALETTE.white;
  ctx.globalAlpha = 0.85;
  drawEllipse(ctx, -2, -1.5, 2.4, 1.6 * flutter, -0.4);
  drawEllipse(ctx,  2, -1.5, 2.4, 1.6 * flutter,  0.4);
  ctx.globalAlpha = 1;

  // body
  ctx.fillStyle = PALETTE.honey;
  drawEllipse(ctx, 0, 0, 3.2, 2.2);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.2, 2.2, 0, 0, Math.PI * 2);
  ctx.stroke();

  // stripe
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(0, -1.8);
  ctx.lineTo(0, 1.8);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// Layer 5 — striker swarm particles (now small bees, not solid dots)
// ============================================================================
function drawSwarmParticles(ctx, state) {
  for (const s of state.swarms) {
    if (!s.alive) continue;
    const phase = (s.x + s.y) * 0.05 + state.elapsed * 22;
    if (s.meteor)      drawMeteorParticle(ctx, s, state.elapsed);
    else if (s.echo)   drawEchoParticle(ctx, s, phase);
    else               drawTinyBee(ctx, s.x, s.y, phase);
  }
}

// Meteor — big honey-rust ball with halo
function drawMeteorParticle(ctx, s, elapsed) {
  ctx.save();
  ctx.translate(s.x, s.y);
  // halo
  const haloR = 14 + Math.sin(elapsed * 8) * 1.5;
  ctx.fillStyle = 'rgba(232, 162, 74, 0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.fill();
  // body
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 9);
  grad.addColorStop(0, '#FBE0A0');
  grad.addColorStop(0.6, '#F2C24A');
  grad.addColorStop(1, '#8A3A1C');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3A2818';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

// Echo — small fast honey particle with motion-trail dot
function drawEchoParticle(ctx, s, phase) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.fillStyle = 'rgba(247, 221, 160, 0.6)';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F2C24A';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3A2818';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// Layer 6 — VFX (hits, death puffs, spawn warnings)
// ============================================================================
function drawFx(ctx, state) {
  for (const f of state.fx) {
    const k = f.t / f.life;
    if (f.kind === 'hit')             drawFxHitStars(ctx, f, k);
    else if (f.kind === 'puff')        drawFxPuff(ctx, f, k);
    else if (f.kind === 'spawn-warn')  drawFxSpawnWarn(ctx, f, k, state);
    else if (f.kind === 'reward')      drawFxReward(ctx, f, k);
    else if (f.kind === 'tap-ripple')  drawFxTapRipple(ctx, f, k);
    else if (f.kind === 'synergy')     drawFxSynergy(ctx, f, k);
    else if (f.kind === 'ability-burst') drawFxAbilityBurst(ctx, f, k);
  }
}

// Big ability-cast ring expanding from the hive
function drawFxAbilityBurst(ctx, f, k) {
  const r = f.r0 + (f.r1 - f.r0) * k;
  const alpha = (1 - k) * 0.85;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.globalAlpha = alpha;
  // outer honey ring
  ctx.strokeStyle = PALETTE.honey;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  // inner deep ring
  ctx.globalAlpha = alpha * 0.6;
  ctx.strokeStyle = PALETTE.honeyDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.stroke();
  // sparkle dots on the ring
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PALETTE.honeyLight;
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 / 12) * i + k * 1.5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Synergy toast — eyebrow + name + description, slides in like a banner
function drawFxSynergy(ctx, f, k) {
  let alpha = 1;
  let slideY = 0;
  if (k < 0.15) {
    const e = k / 0.15;
    alpha = e; slideY = -30 * (1 - e);
  } else if (k > 0.82) {
    const e = (1 - k) / 0.18;
    alpha = e; slideY = 20 * (1 - e);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(f.x, f.y + slideY);

  // measure
  ctx.font = '700 16px Georgia, "Fraunces", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const nameWidth = ctx.measureText(f.name).width;
  ctx.font = '500 11px Georgia, "Fraunces", serif';
  const descWidth = ctx.measureText(f.desc).width;
  const w = Math.max(nameWidth, descWidth) + 32;
  const h = 60;

  // shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.30)';
  ctx.fillRect(-w/2 + 3, -h/2 + 4, w, h);
  // card
  ctx.fillStyle = PALETTE.honeyLight;
  ctx.fillRect(-w/2, -h/2, w, h);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w/2, -h/2, w, h);
  // eyebrow
  ctx.fillStyle = PALETTE.honeyDark;
  ctx.font = '700 9px ui-monospace, monospace';
  ctx.fillText('SYNERGY', 0, -h/2 + 12);
  // name
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '700 16px Georgia, "Fraunces", serif';
  ctx.fillText(f.name, 0, -2);
  // description
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '500 11px Georgia, "Fraunces", serif';
  ctx.fillText(f.desc, 0, h/2 - 12);

  ctx.restore();
}

function drawFxTapRipple(ctx, f, k) {
  const r = 8 + k * 30;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = f.hit ? PALETTE.redInk : PALETTE.honey;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Floating reward text: rises ~50px while fading in then out (cb-rise)
function drawFxReward(ctx, f, k) {
  const alpha = k < 0.18 ? k / 0.18 : k > 0.75 ? (1 - k) / 0.25 : 1;
  const rise = -k * 56;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(f.x, f.y + rise);
  ctx.font = '700 18px Georgia, "Fraunces", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // soft paper card behind
  const m = ctx.measureText(f.text);
  const w = m.width + 22;
  const h = 28;
  ctx.fillStyle = 'rgba(58, 40, 24, 0.18)';
  ctx.fillRect(-w/2 + 2, -h/2 + 2, w, h);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(-w/2, -h/2, w, h);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w/2, -h/2, w, h);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(f.text, 0, 0);
  ctx.restore();
}

function drawFxHitStars(ctx, f, k) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.globalAlpha = 1 - k;
  ctx.strokeStyle = PALETTE.redInk;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  const r = 4 + k * 12;
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + k * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * (r + 5), Math.sin(a) * (r + 5));
    ctx.stroke();
  }
  // central impact dot
  ctx.fillStyle = PALETTE.redInk;
  ctx.globalAlpha = (1 - k) * 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, 3 * (1 - k), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFxPuff(ctx, f, k) {
  // cb-puff — scale 0.4 → 2.2, opacity bell-curve
  const scale = 0.4 + k * 1.8;
  const alpha = k < 0.2 ? k * 4.5 : (1 - k) * 1.2;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.globalAlpha = Math.min(0.7, alpha);
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Per-spawn warning: small downward chevron + brief red wash near top.
// Replaces the constant background pulse that the user found flashy.
function drawFxSpawnWarn(ctx, f, k, state) {
  const alpha = k < 0.25 ? k * 4 : (1 - k) * 1.3;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(0.85, alpha));

  // small red wash columnally beneath the chevron
  const grad = ctx.createLinearGradient(0, 0, 0, 60);
  grad.addColorStop(0, 'rgba(168, 53, 30, 0.45)');
  grad.addColorStop(1, 'rgba(168, 53, 30, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(f.x - 24, 0, 48, 60);

  // chevron ▼
  ctx.strokeStyle = PALETTE.redInk;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(f.x - 7, 6);
  ctx.lineTo(f.x,    14);
  ctx.lineTo(f.x + 7, 6);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// Layer 7 — HP bar (paper card pill)
// ============================================================================
function drawHiveHP(ctx, hive, state) {
  const w = 110, h = 10;
  const x = hive.x - w / 2;
  const y = hive.y - hive.radius - 22;
  ctx.fillStyle = 'rgba(58, 40, 24, 0.18)';
  ctx.fillRect(x - 3, y - 2, w + 6, h + 5);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  // HP fill
  const pct = Math.max(0, hive.hp / hive.maxHP);
  ctx.fillStyle = pct > 0.5 ? PALETTE.honey
                : pct > 0.25 ? PALETTE.honeyDeep
                : PALETTE.redInk;
  ctx.fillRect(x, y, w * pct, h);
  // segment lines
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 0.7;
  ctx.globalAlpha = 0.45;
  for (let i = 1; i < 5; i++) {
    const sx = x + (w / 5) * i;
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx, y + h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Wax HP overlay (Honeycomb Vault) — sits above HP bar as paper-light shell
  if (state && state.waxHP > 0) {
    const waxW = Math.min(w * 1.05, w * (state.waxHP / 60));
    const waxY = y - 7;
    ctx.fillStyle = PALETTE.paperShade;
    ctx.fillRect(x - 2, waxY - 1, waxW + 4, 6);
    ctx.fillStyle = PALETTE.honeyLight;
    ctx.fillRect(x, waxY, waxW, 4);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 0.7;
    ctx.strokeRect(x - 2, waxY - 1, waxW + 4, 6);
  }
}

// ============================================================================
// Layer 8 — wave banner (paper card sweep)
// ============================================================================
function drawBanner(ctx, state) {
  if (!state.banner) return;
  const { text, kind, t, life } = state.banner;
  const k = t / life;

  let alpha = 1;
  let slideX = 0;
  if (k < 0.18) {
    const e = k / 0.18;
    alpha = e;
    slideX = -160 * (1 - e);
  } else if (k > 0.82) {
    const e = (1 - k) / 0.18;
    alpha = e;
    slideX = 120 * (1 - e);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(slideX, 0);

  const cx = state.width / 2;
  const cy = state.height * 0.36;

  ctx.font = '700 22px Georgia, "Fraunces", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const m = ctx.measureText(text);
  const padX = 24, padY = 16;
  const w = m.width + padX * 2;
  const h = 24 + padY * 2;

  const bg =
    kind === 'lose' ? PALETTE.rust :
    kind === 'win'  ? PALETTE.honey :
    kind === 'wave-clear' ? PALETTE.honeyLight :
    PALETTE.paper;
  const fg = kind === 'lose' ? PALETTE.paper : PALETTE.ink;

  // soft drop shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.25)';
  ctx.fillRect(cx - w/2 + 3, cy - h/2 + 5, w, h);

  // paper card
  ctx.fillStyle = bg;
  ctx.fillRect(cx - w/2, cy - h/2, w, h);
  // doubled stroke for hand-drawn feel
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(cx - w/2, cy - h/2, w, h);
  ctx.lineWidth = 0.9;
  ctx.strokeRect(cx - w/2 - 2, cy - h/2 - 2, w + 4, h + 4);

  ctx.fillStyle = fg;
  ctx.fillText(text, cx, cy + 1);

  ctx.restore();
}

// ============================================================================
// Tiny helpers
// ============================================================================
function drawEllipse(ctx, cx, cy, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}
