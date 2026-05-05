// Phase A renderer — placeholder shapes in the locked palette.
// All wobble/animation here is procedural; baked PNG sprites land in Phase E.

import { PALETTE, HIVE, STRIKER } from './data.js';

export function render(ctx, state) {
  const { width, height, hive } = state;

  // grass background — soft sage with a couple of darker tufts for life
  ctx.fillStyle = PALETTE.sage;
  ctx.fillRect(0, 0, width, height);
  drawGrassTufts(ctx, width, height);

  // wave incoming wash — pulse near top edge while attackers exist
  const liveAttackers = state.attackers.filter(a => a.deathT == null).length;
  if (liveAttackers > 0) {
    const pulse = 0.18 + 0.12 * Math.sin(state.elapsed * 4);
    const grad = ctx.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, `rgba(138, 58, 28, ${pulse})`);
    grad.addColorStop(1, 'rgba(138, 58, 28, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, 80);
  }

  // attackers
  for (const a of state.attackers) drawHornet(ctx, a, state.elapsed);

  // hive
  drawHive(ctx, hive);

  // swarm particles
  for (const s of state.swarms) drawSwarmParticle(ctx, s);

  // FX
  for (const f of state.fx) drawFx(ctx, f);

  // hive HP bar (above hive, paper card)
  drawHiveHP(ctx, hive);

  // status banner during loss/win — bigger overlay handled in DOM
}

function drawGrassTufts(ctx, w, h) {
  ctx.fillStyle = PALETTE.sageDark;
  // deterministic tufts so they don't strobe
  const tufts = TUFTS;
  for (const t of tufts) {
    const x = t.x * w;
    const y = t.y * h;
    ctx.beginPath();
    ctx.ellipse(x, y, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
const TUFTS = [
  { x: 0.12, y: 0.18 }, { x: 0.86, y: 0.10 },
  { x: 0.30, y: 0.42 }, { x: 0.72, y: 0.58 },
  { x: 0.18, y: 0.66 }, { x: 0.92, y: 0.78 },
  { x: 0.05, y: 0.85 }, { x: 0.55, y: 0.30 },
  { x: 0.40, y: 0.74 }, { x: 0.80, y: 0.40 },
];

function drawHive(ctx, hive) {
  // breathing pulse: scale 1 ± 3%
  const breath = 1 + 0.03 * Math.sin(hive.breathPhase * 1.6);
  const r = hive.radius * breath;

  // shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.22)';
  ctx.beginPath();
  ctx.ellipse(hive.x, hive.y + r * 0.85, r * 1.05, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // wobbly nest blob — multi-layer ovals with paper edge
  ctx.save();
  ctx.translate(hive.x, hive.y);

  // dark base ring
  ctx.fillStyle = PALETTE.honeyDeep;
  ctx.beginPath();
  ctx.ellipse(0, 4, r * 1.02, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();

  // honey body
  ctx.fillStyle = PALETTE.honey;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.96, r * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();

  // ink outline (wobbly via two slightly offset strokes)
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.96, r * 0.86, 0, 0, Math.PI * 2);
  ctx.stroke();

  // hexagon hints inside
  ctx.fillStyle = PALETTE.honeyDeep;
  ctx.globalAlpha = 0.55;
  drawHex(ctx, -10, -10, 7);
  drawHex(ctx,  10, -10, 7);
  drawHex(ctx,   0,   3, 7);
  drawHex(ctx, -14,   8, 6);
  drawHex(ctx,  14,   8, 6);
  ctx.globalAlpha = 1;

  // entrance
  ctx.fillStyle = PALETTE.rustDark;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.55, r * 0.16, r * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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

function drawHornet(ctx, a, elapsed) {
  ctx.save();
  ctx.translate(a.x, a.y);

  if (a.deathT != null) {
    // fade + curl
    const k = a.deathT / 0.6;
    ctx.globalAlpha = 1 - k;
    ctx.scale(1 - k * 0.4, 1 - k * 0.4);
  } else {
    // wing-buzz wobble
    const buzz = Math.sin(elapsed * 28 + a.x * 0.1) * 0.6;
    ctx.translate(0, buzz);
  }

  // shadow
  ctx.fillStyle = 'rgba(58, 40, 24, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 9, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // body — rust diamond with stripes
  ctx.fillStyle = PALETTE.rust;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // dark stripes
  ctx.fillStyle = PALETTE.rustDark;
  ctx.fillRect(-2, -5, 1.5, 10);
  ctx.fillRect( 2, -5, 1.5, 10);

  // wings
  ctx.fillStyle = 'rgba(245, 235, 214, 0.7)';
  ctx.beginPath();
  ctx.ellipse(-4, -2, 5, 3, -0.4, 0, Math.PI * 2);
  ctx.ellipse( 4, -2, 5, 3,  0.4, 0, Math.PI * 2);
  ctx.fill();

  // outline
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawSwarmParticle(ctx, s) {
  ctx.fillStyle = PALETTE.honey;
  ctx.beginPath();
  ctx.arc(s.x, s.y, STRIKER.particleSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawFx(ctx, f) {
  const k = f.t / f.life;
  if (f.kind === 'hit') {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    const r = 4 + k * 10;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4));
      ctx.stroke();
    }
    ctx.restore();
  } else if (f.kind === 'puff') {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalAlpha = (1 - k) * 0.6;
    ctx.fillStyle = PALETTE.ink;
    const r = 6 + k * 14;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawHiveHP(ctx, hive) {
  const w = 90, h = 8;
  const x = hive.x - w / 2;
  const y = hive.y - hive.radius - 16;
  // paper card
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  // fill
  const pct = Math.max(0, hive.hp / hive.maxHP);
  ctx.fillStyle = pct > 0.5 ? PALETTE.honey : pct > 0.25 ? PALETTE.honeyDeep : PALETTE.rust;
  ctx.fillRect(x, y, w * pct, h);
}
