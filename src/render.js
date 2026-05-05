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

import { PALETTE } from './data.js?v=__VERSION__';

// ============================================================================
// Public entry
// ============================================================================
export function render(ctx, state) {
  drawField(ctx, state);
  if (state.phase === 'idle') drawDefensivePerimeter(ctx, state);
  drawAttackers(ctx, state);
  drawHive(ctx, state);
  drawSwarmParticles(ctx, state);
  if (state.priorityTarget && state.priorityTarget.deathT == null) {
    drawPriorityReticle(ctx, state.priorityTarget, state.elapsed);
  }
  drawFx(ctx, state);
  drawHiveHP(ctx, state.hive);
  drawBanner(ctx, state);
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
  ctx.fillStyle = PALETTE.sage;
  ctx.fillRect(0, 0, state.width, state.height);
  drawGrassTufts(ctx, state.width, state.height);
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
  // breathing pulse — cb-breathe, 3s ease-in-out, scale 1 ↔ 1.03
  const breath = 1 + 0.03 * Math.sin(hive.breathPhase * (Math.PI * 2 / 3));
  const r = hive.radius * breath;

  // soft drop shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.22)';
  ctx.beginPath();
  ctx.ellipse(hive.x, hive.y + r * 0.85, r * 1.05, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // damage state — comb cracks at <50% HP
  const hpRatio = hive.hp / hive.maxHP;

  ctx.save();
  ctx.translate(hive.x, hive.y);

  // honey-glow gradient body (radial: honeyLight center → honey → honeyDark edge)
  const grad = ctx.createRadialGradient(0, -r * 0.2, 0, 0, 0, r);
  grad.addColorStop(0, PALETTE.honeyLight);
  grad.addColorStop(0.6, PALETTE.honey);
  grad.addColorStop(1, PALETTE.honeyDark);

  // wobbly nest blob — slightly asymmetric ellipse
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 2, r * 0.98, r * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  // ink outline (double-stroke for hand-drawn doubled-line feel)
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 2, r * 0.98, r * 0.88, 0, 0, Math.PI * 2);
  ctx.stroke();

  // honey drips from sides (small curved fills with ink stroke)
  ctx.fillStyle = PALETTE.honey;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.6;
  drawDrip(ctx, -r * 0.55, r * 0.55, -r * 0.45, r * 0.85);
  drawDrip(ctx,  r * 0.55, r * 0.55,  r * 0.45, r * 0.85);

  // hex comb hints inside (honeyDeep, 0.55 alpha, 7 small hexagons)
  ctx.fillStyle = PALETTE.honeyDark;
  ctx.globalAlpha = 0.55;
  drawHex(ctx, -r * 0.30, -r * 0.20, r * 0.13);
  drawHex(ctx,  r * 0.05, -r * 0.20, r * 0.13);
  drawHex(ctx,  r * 0.40, -r * 0.05, r * 0.13);
  drawHex(ctx, -r * 0.40,  r * 0.05, r * 0.12);
  drawHex(ctx, -r * 0.10,  r * 0.05, r * 0.13);
  drawHex(ctx,  r * 0.20,  r * 0.20, r * 0.12);
  drawHex(ctx, -r * 0.25,  r * 0.30, r * 0.11);
  ctx.globalAlpha = 1;

  // entrance — small dark ink ellipse with rust-dark inner
  ctx.fillStyle = PALETTE.ink;
  drawEllipse(ctx, 0, r * 0.55, r * 0.18, r * 0.10);
  ctx.fillStyle = PALETTE.rustDark;
  drawEllipse(ctx, 0, r * 0.50, r * 0.13, r * 0.07);

  // damage cracks at <50% HP
  if (hpRatio < 0.5) {
    ctx.strokeStyle = hpRatio < 0.25 ? PALETTE.redInk : PALETTE.ink;
    ctx.lineWidth = hpRatio < 0.25 ? 2.2 : 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.4);
    ctx.lineTo(-r * 0.1, -r * 0.05);
    ctx.lineTo(-r * 0.25, r * 0.2);
    ctx.moveTo(r * 0.4, -r * 0.2);
    ctx.lineTo(r * 0.15, r * 0.1);
    ctx.moveTo(r * 0.05, -r * 0.55);
    ctx.lineTo(r * 0.2, -r * 0.2);
    ctx.stroke();
  }

  // critical pulse outline at <25%
  if (hpRatio < 0.25) {
    const pulseAlpha = 0.45 + 0.55 * Math.abs(Math.sin(hive.breathPhase * 4.5));
    ctx.save();
    ctx.globalAlpha = pulseAlpha;
    ctx.strokeStyle = PALETTE.redInk;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 2, r * 1.02, r * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  // 4 idle bees orbiting — only when not in combat (no live attackers)
  const liveCount = state.attackers.filter(a => a.deathT == null).length;
  if (liveCount === 0) drawOrbitingBees(ctx, hive);
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
    drawTinyBee(ctx, s.x, s.y, phase);
  }
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
  }
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
function drawHiveHP(ctx, hive) {
  const w = 110, h = 10;
  const x = hive.x - w / 2;
  const y = hive.y - hive.radius - 22;
  // soft drop shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.18)';
  ctx.fillRect(x - 3, y - 2, w + 6, h + 5);
  // paper card
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  // fill
  const pct = Math.max(0, hive.hp / hive.maxHP);
  ctx.fillStyle = pct > 0.5 ? PALETTE.honey
                : pct > 0.25 ? PALETTE.honeyDeep
                : PALETTE.redInk;
  ctx.fillRect(x, y, w * pct, h);
  // segment lines (honeycomb feel)
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
