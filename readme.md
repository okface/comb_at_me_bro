# Comb At Me Bro

A top-down portrait-orientation tower-defense / colony-management mobile web game. You play the queen bee, defending one wild-nest hive across ten escalating waves. Allocate honey across five worker-bee roles to balance economy, defense, and offense. Each run starts under a different **Hive Condition** (run modifier) and rewards two **boons** along the way, so no two runs play the same.

**Live build:** <https://okface.github.io/comb_at_me_bro/>
*(auto-deploys on push to `main` via `.github/workflows/pages.yml` — every deploy gets a unique cache-bust version)*

---

## Run locally

No build step. ES modules require an HTTP server (file:// won't work).

```bash
python -m http.server 8765
# then open http://localhost:8765/
```

---

## Status

The game is fully playable end-to-end with one map, ten waves, four enemy types, five investable roles, six Hive Conditions, ten boons, and a boss finale.

| Phase | Scope | Status |
|---|---|---|
| **A — Skeleton** | Canvas + game loop + hive + hornets + striker swarm + HP + win/lose | ✅ done |
| **B1 — Multi-wave** | Wave runner, ready button, banners, restart loop | ✅ done |
| **B2.1 — Currency** | Honey + larvae state, HUD pills, wave-clear rewards | ✅ done |
| **B2.2 — Roles panel** | 5 investable roles (rank 1-3), spend honey, role effects | ✅ done |
| **B2.3 — Hive Conditions** | 6 run modifiers picked at run start | ✅ done |
| **B2.4 — Spiders + 10 waves** | Second attacker type, longer run | ✅ done |
| **B2.5 — Boons + pop cap** | 10 mid-run boons, Striker–Nurse cap link | ✅ done |
| **B2.6 — Bears + Beekeeper** | Bear minibosses (waves 6-9), Beekeeper boss with smoke at wave 10 | ✅ done |
| **B2.7 — Tap to prioritize** | Active player input — tap an enemy to focus strikers | ✅ done |
| **B2.8 — Pacing + game feel** | Faster early waves, screen shake, wave-clear HP regen | ✅ done |
| **B2.9 — Text + tutorial** | UX text pass, How-To-Play panel on title | ✅ done |
| **C — Polish & meta** | Hidden synergies, royal jelly, rank 4-5 unlocks, run summary, Royal Memory persistence | next |
| **D — Real art** | Drop in Claude Design assets, animations, audio | future |

---

## Design — locked

| | |
|---|---|
| Platform | Phone web, GitHub Pages, portrait orientation |
| Tech | Vanilla HTML5 canvas + JS, ES modules, no build step |
| Run shape | Single map, **10 waves** (~12-15 min for a clean run) |
| Wave pacing | Discrete rounds, "READY" button between waves |
| Unit model | Abstract population counts — no per-bee placement |
| Map shape | Open field above the hive; attackers home toward hive |
| Currencies | **Honey** (continuous, foragers, spent on roles) + **Larvae** (per-wave, accumulates) |
| Run modifier | One of six **Hive Conditions** picked at run start |
| In-run boons | One of three picked after waves 3 and 6 |
| Damage model | Hive HP; attackers reaching the door deal DoT |
| Active input | Tap any enemy during combat to focus strikers on it |
| Win condition | Survive wave 10 (Beekeeper boss with smoke AoE) |
| Visual style | Style B · Hand-Drawn / Wild Nest (Claude Design v1) |
| Palette | sage, honey, rust, ink, paper — full 20-token palette in `data.js` |

---

## Bee roles

| Role | Function | Per rank |
|---|---|---|
| **Forager** 🍯 | Gathers honey through the wave | +0.6 honey/sec |
| **Nurse** 🐝 | Raises bee cap, brings new larvae | +2 to swarm cap, +1 larva/wave |
| **Guard** 🛡 | Stings any intruder at the hive door | +1.5 damage/sec at door |
| **Striker** ⚔ | Sends larger swarms (capped by bee population) | +2 bees per volley |
| **Architect** ⬡ | Thickens the comb | +25 HP, +80 honey storage |

3 ranks each (rank 4-5 with royal jelly = Phase C).

**Striker–Nurse interaction:** Striker swarm size is capped by `7 + (Nurse rank × 2)`. Pure-Striker spam without Nurses caps out at 7 bees per volley — investing in both scales offense.

## Attackers

| Enemy | Role | Counter |
|---|---|---|
| **Hornet** | Fast aerial melee, 4 HP | Strikers / Guards |
| **Spider** | Slow ground, **eats striker particles in close range** | Burst damage / tap-priority before they bite |
| **Bear** *(waves 6-9)* | 32 HP boss, slow but unstoppable, ignores Guards effectively | Sustained Striker DPS |
| **Beekeeper** *(wave 10 boss)* | 70 HP, periodically deploys smoke AoE that **kills strikers entering it** | Burst between smoke phases |

Wave 10 = Beekeeper + 5 hornet escorts + 1 spider. Win the wave, hold the dawn.

## Hive Conditions (run modifiers — pick 1 of 3 at start)

- **Plentiful Bloom** — +0.5 honey/sec base · Strikers cost +35% honey
- **Steel Comb** — +35 max hive HP · Foragers earn 25% less honey
- **Eager Stingers** — Strikers fire +1 extra bee per rank · Architects cost +50% honey
- **Patient Queen** — All role upgrades cost 18% less · +1 hornet appears each wave
- **Royal Drought** — Waves pay +50% honey · honey storage halved
- **Lucky Larvae** — +1 larva per wave · every hornet has +1 HP

## Boons (mid-run pickups — pick 1 of 3 after waves 3 and 6)

- **Brutal Stinger** — Strikers deal +30% damage
- **Forager's Blessing** — Foragers produce +60% honey
- **Steel Resolve** — +50 max hive HP · −1 larva per wave
- **Royal Diet** — +3 larvae per wave cleared
- **Architect's Cunning** — +45 max hive HP · +120 honey storage
- **Swarm Tactics** — Strikers fly 25% faster
- **Bee-Eater's Tactic** — Strikers deal +70% damage to spiders
- **Hive Mind** — All role upgrades cost 15% less honey
- **Old Wax** — +8 honey at the start of every wave
- **Eager Volley** — Strikers fire volleys 20% faster

All effects stack across modifier + multiple boons via the `getEff(state)` merger in `src/game.js`.

---

## Architecture

```
/
├── index.html              # canvas + DOM HUD + overlays (title, pickers, panel)
├── style.css               # mobile-first portrait, locked palette
├── src/
│   ├── main.js             # entry, game loop, HUD wiring, picker/panel UI
│   ├── data.js             # palette, role/enemy/structure constants, modifier + boon pools, wave generator
│   ├── game.js             # state, update step, role-effect helpers, getEff merger, attacker behaviors
│   └── render.js           # canvas drawing — hive, attackers (hornet/spider/bear/beekeeper), swarm, FX, HUD chrome
├── .github/workflows/
│   └── pages.yml           # auto-deploy on push to main, with __VERSION__ cache-bust
└── readme.md
```

---

## Idea shelf (deferred)

- **Hidden synergies** — Sun-Soaked Comb (Architect+Forager → overflow → temp HP), Drone Frenzy (Nurse+Striker overflow → free kamikaze), Murder Hallway (Guard+Architect)
- **Royal jelly** as a third currency, gating rank 4-5 unlocks
- **Rank-4 unique abilities** — e.g. Striker rank 4: "Hive Mind Targeting" (one-target focus burst); Forager rank 4: "Nectar Routes" (kill-on-hit honey drops); etc.
- **Meta-progression** — "Royal Memory" earned per run, spent only on **new options** (Hades-style sideways unlocks, never numerical buffs)
- **More enemies** in reserve from Claude Design v2: Wasp Swarm, Ants, Bird, Dragonfly, Skunk, Rival Queen, Mites
- **More structures** in reserve: Comb Tower, Watchtower, Honey Vat, Stinger Turret, Pheromone Marker, Brood Chamber, Wax Fence, Royal Chamber
- **Audio**, **Heat-style replay modifiers**, **Daily seeded conditions**

## Claude Design

- **v1 done** — three-style comparison, Style B (Hand-Drawn / Wild Nest) selected
- **v2 done** — full expansion in `comb_at_me_bro-handoff/`: gameplay screens, 7 bee roles, 11 enemies, 10 structures, animation suite, 11 UI screens
- Current build uses procedural canvas placeholders following the v2 visual specs (palette, shapes, layouts). Real PNG/SVG assets land in **Phase D**.
