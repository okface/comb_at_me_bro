# Comb At Me Bro

A top-down portrait-orientation tower-defense / colony-management mobile web game. You play the queen bee, defending a single hive across 30 escalating waves. Allocate limited larvae and honey across five worker-bee roles (Foragers, Nurses, Guards, Strikers, Architects) to balance economy, defense, and offense. Hades-style meta-progression unlocks new *options* (not stat boosts) so failed early runs still feel productive.

**Live build:** <https://okface.github.io/comb_at_me_bro/>
*(auto-deploys on push to `main` via `.github/workflows/pages.yml`)*

---

## Run locally

No build step. ES modules require an HTTP server (file:// won't work).

```bash
python -m http.server 8765
# then open http://localhost:8765/
```

---

## Status

**Phase A — Skeleton — DONE**
Hardcoded single wave with 8 hornets, one role (Strikers) auto-volleying, hive HP, win/lose overlay. Procedural placeholder shapes only — no real art yet.

### Roadmap

| Phase | Scope | Status |
|---|---|---|
| **A — Skeleton** | Canvas + game loop + hive + hornets + striker swarm + HP + win/lose | ✅ done |
| **B — Core loop** | Larvae + honey economy, between-wave shop UI, all 5 roles (ranks 1-3), 10 hardcoded waves | next |
| **C — Variety** | All 4 attacker types, role ranks 4-5, boon picker every 5 waves, full 30-wave arc + final boss | |
| **D — Meta** | Royal Memory persistence (localStorage), unlock screen between runs, starting-loadout selection | |
| **E — Polish** | Drop in Claude Design art, animations & VFX, Heat-style replay modifiers, audio (deferred) | |

---

## Design — locked

| | |
|---|---|
| Platform | Phone web, GitHub Pages, portrait orientation |
| Tech | Vanilla HTML5 canvas + JS, ES modules, no build step |
| Run shape | Single map, 30 waves, ~25 min for a clean run |
| Wave pacing | Discrete rounds, "Ready" button between waves |
| Unit model | Abstract population counts — no per-bee placement; combat shown as swarm-cloud animations |
| Map shape | Open field above the hive; attackers spawn at top edge and home toward the hive |
| Currencies | **Larvae** (per-wave) + **Honey** (continuous) + **Royal Jelly** (rare, late-game) |
| Meta-progression | Hades-style: each run earns **Royal Memory**; spent only on **new choices** — never stat boosts |
| In-run boons | Pick 1-of-3 random offering every ~5 waves |
| Damage model | Hive has HP; attackers reaching the entrance deal DoT |
| Win condition | Survive wave 30 (final boss = beekeeper raid). Post-win: Heat-style escalating modifiers |
| Visual style | **B · Hand-Drawn / Wild Nest** (from Claude Design v1) |
| Palette | sage `#C8D89A`, honey `#F2C24A` / `#E8A24A`, rust `#8A3A1C`, deep ink `#3A2818`, paper `#F5EBD6` |

---

## Bee roles (v0.1 ships 5; +2 in reserve)

| Role | Function | rank-4 unique | v0.1 |
|---|---|---|---|
| **Forager** | Generates honey/sec | Waggle Dance: honey aura buff | ✅ |
| **Nurse** | More larvae per wave | Royal Diet: next 3 larvae upgraded | ✅ |
| **Guard** | Short-range melee at hive entrance | Stinger Wall: auto-deploy on damage | ✅ |
| **Striker** | Long-range swarm attacker | Pheromone Trail: +50% next swarm speed | ✅ |
| **Architect** | Builds defensive structures | False Entrance: decoy trap | ✅ |
| Drone (male) | Comic relief; required to spawn Princess | | v0.2 |
| Princess | Late-game; founds a secondary hive | | v0.2 |

Plus the **Queen** as central HUD anchor.

## Attackers (v0.1 ships 4; +6 in reserve)

| Enemy | Behavior | Counter | v0.1 |
|---|---|---|---|
| **Hornet** | Fast aerial melee | Strikers / Guards | ✅ |
| **Spider** | Slow ground; webs Strikers | Architects / Guards | ✅ |
| **Bear** | Boss tier; ignores walls | Striker DPS | ✅ |
| **Beekeeper** | Human boss; smoke AoE | Burst rush | ✅ |
| Wasp swarm | Mini cluster, rival to your swarm | Striker DPS | v0.2 |
| Ants | Tiny low-HP, in groups of 8-12 | AoE, walls | v0.2 |
| Bird | Fast aerial, dives, ignores walls | Strikers | v0.2 |
| Dragonfly | Very fast assassin, picks off Strikers | Guards rush | v0.2 |
| Skunk | Spray AoE, disorients bees | Burst, distance | v0.2 |
| Rival Queen | Elite; summons her own bees | Sustained | v0.2 |
| Mites (bonus) | Non-combat parasite, infects larvae production | Cleaners (v0.2 role) | v0.2 |

## Structures (v0.1 ships 2; +8 in reserve)

| Structure | Function | v0.1 |
|---|---|---|
| **Propolis wall** | Basic defense block | ✅ |
| **False entrance decoy** | Lures and traps attackers | ✅ |
| Comb tower | Increases honey storage cap | v0.2 |
| Watchtower | Reveals next wave's composition | v0.2 |
| Honey vat | Bulbous storage, glows when full | v0.2 |
| Stinger turret | Autonomous Guard emplacement | v0.2 |
| Pheromone marker | Pulsing buff aura | v0.2 |
| Brood chamber | Increases per-wave larva count | v0.2 |
| Wax fence | Cheap weaker walls | v0.2 |
| Royal chamber | Princess unlock building | v0.2 |

---

## Wave arc (30 waves)

- **1–5** Hornets only — teaching loop
- **6–12** Spiders enter — force Architect investment
- **13–20** Bear minibosses — force Striker scaling
- **21–29** Mixed compositions, Beekeeper appearances
- **30** Beekeeper boss raid (win condition)

## Sample boons

- *Forager Blessing* — foragers +20% honey, can't fight
- *Brutal Stinger* — Strikers crit on first hit each wave
- *Steel Comb* — hive HP +30%, but larvae per wave −1
- *Swarm Tactics* — Strikers move 30% faster in groups of 3+
- *Architect's Cunning* — first wall built each wave is free
- *Royal Diet* — next 3 larvae mature instantly
- *Smoke Resistance* — bees in smoke at half effect
- *Hive Mind* — all roles get +1 effective rank for one wave

---

## Idea shelf (for later, if it fits)

These came up during brainstorm; not committed.

- **Waggle dance mechanic** — tap-and-drag a path your strikers follow this wave (active player input beyond "place tower")
- **Day/night cycle** — foragers only work in day, attackers stronger at night
- **Pheromone trails** — Architects paint paths that buff bees walking on them
- **Honey curing time** — raw nectar becomes honey over N seconds; spending too early loses efficiency
- **Drones-as-resource** — males accumulate, only spendable on Princess to found a new hive (their gimmick)
- **Weather modifiers** — rain slows foragers; wildflower bloom = forager bonus
- **Color-blind palette swap** — swap honey/rust to a more accessible pair
- **Cleaners role + Mite threat** — non-combat threat type as a v0.2 expansion

---

## Architecture (Phase A)

```
/
├── index.html              # canvas + DOM HUD overlay
├── style.css               # mobile-first portrait, locked palette
├── src/
│   ├── main.js             # entry, canvas resize/DPR, game loop, HUD wiring
│   ├── data.js             # palette, hive/hornet/striker constants, wave script
│   ├── game.js             # state, update step, spawning, swarm targeting, collisions
│   └── render.js           # placeholder shapes + procedural wobble (breathing hive, wing-buzz, hit-stars, ink-puff death, top-edge wave-warning pulse)
├── .github/workflows/
│   └── pages.yml           # auto-deploy on push to main
└── readme.md               # this file
```

Will split `src/` into `game/`, `render/`, `ui/`, `data/` subdirs starting Phase B.

---

## Claude Design

- **v1 done** — three-style comparison delivered, Style B (Hand-Drawn / Wild Nest) selected
- **v2 dispatched** — comprehensive expansion (full prompt embedded in the local plan file at `~/.claude/plans/okay-brainstorming-time-don-t-shimmying-dusk.md`): gameplay screens, 7 bee role variants, 10 enemies, 10 structures, animation suite, 11 UI screens, atmospheric variants

Real assets land in **Phase E**. Until then, all sprites are procedural placeholders in the locked palette.
