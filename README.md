# GREYLINE PROTOCOL

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/tronolllanj-creator/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/tronolllanj-creator/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

---

## What It Is

**GREYLINE PROTOCOL** is an original top-down 2D canvas stealth game. Infiltrate five floors of a corporate tower, dodge guard and camera vision cones, blink past laser grids, manage your exposure meter, grab data cores, hack terminals, and reach the exit unseen. No external libraries, no build step, no network — pure static ES modules.

The exposure meter is the game's tensest mechanic — fill it and you're hunted.

## How It Plays

- **5 Floors**: THE FOYER → RECORDS HALL → SERVER VAULT → EXECUTIVE WING → ROOFTOP
- **Vision Cones**: Guards patrol with 235 px range, 33° half-angle cones. Cameras sweep fixed positions with 265 px range, 28° half-angle cones.
- **Lasers**: Blinking beams (on half the period). Touching a live beam adds +30 exposure and alerts the nearest guard.
- **Exposure Meter**: 0–100. Rises when seen (55/s standing, 30/s sneaking, 70/s in camera cones; closer = faster). Shadow zones multiply detection by 0.4. Hidden for 1.5 s decays exposure at 18/s. At 100 → **LOCKDOWN** (6 s: all guards chase, cameras lock on).
- **Coins**: 3 per level. Click to throw; guards within 240 px investigate for 4 s.
- **Sneak**: Hold Shift to move at 88 px/s (vs 175 px/s) and reduce detection rate.
- **Dash**: Space bursts 540 px/s for 0.14 s (1.8 s cooldown). Noisy: +12 exposure if any guard/camera sees you during the dash.
- **Loot**: Data cores (instant grab), terminals (hold E 2.5 s), vault cores (hold E 3.0 s). Moving or being shoved cancels the channel.
- **Exit**: Opens when quota met. Reaching it clears the level.

## Controls

| Action | Key / Input |
|--------|-------------|
| Move | WASD / Arrow Keys |
| Sneak | Hold **Shift** |
| Dash | **Space** |
| Interact / Grab / Hack | **E** |
| Throw Coin | **Mouse Click** (world position) |
| Pause | **P** / **Esc** |
| Confirm / Start / Restart | **Enter** / **Click** |
| Restart (end screens) | **R** |
| Mute | **M** |

## Rules

1. **Line of Sight**: Blocked by walls (rectangles). Guards and cameras only detect if the thief is in their cone *and* LOS is clear.
2. **Detection Rates**:
   - Standing in guard cone: 55/s × (1 − dist/range × 0.5)
   - Sneaking in guard cone: 30/s × same falloff
   - In camera cone: 70/s × same falloff
   - In shadow zone: ×0.4 multiplier
3. **Hidden State**: Unseen for 1.5 s → exposure decays 18/s.
4. **LOCKDOWN** (exposure ≥ 100): 6 s, all guards chase, cameras lock onto thief, exposure holds at 100 then decays.
5. **Guard Touch**:
   - Exposure ≥ 50 → **CAUGHT** (game over)
   - Exposure < 50 → shove back +25 exposure, guard pauses 1 s
6. **Laser Touch**: +30 exposure, alerts nearest guard to beam location.
7. **Channeling**: Terminals (2.5 s), vault cores (3.0 s). Moving or shoved cancels.
8. **Level Clear**: Quota met + reach exit → +500 × level, time bonus, ghost bonus if exposure never exceeded 50.
9. **Win**: Clear level 5 → victory screen with score breakdown.

## Loot Values

| Loot Type | Base Score |
|-----------|------------|
| Data Core | 250 |
| Terminal | 500 |
| Vault Core | 1000 |
| Level Clear | 500 × level |
| Time Bonus | (parTime − elapsed) × 10 (min 0) |
| Ghost Bonus | +1000 (exposure never > 50 during level) |

Best score persisted in `localStorage` (try/catch).

## Run Instructions

```bash
# Serve the static files (any static server)
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080` (or your server port). The game loads `main.js` as an ES module — no build step required.

### Screenshot Staging (for CI / preview)

Append `?shot=NAME&seed=N` to the URL:

| Shot | Description |
|------|-------------|
| `start` | Title screen with 8 s attract mode behind |
| `play` | Level 1 mid-infiltration: thief mid-room, 2 guards + 1 camera cones, 2 loot, exposure 30 |
| `alert` | Level 3 mid-chase: thief in guard cone, exposure 80, guard chasing, lasers visible |
| `end` | Level 5 staged: thief in guard cone, exposure 95, weak autopilot until caught or 60 s |

The page sets `window.__shotReady = true` when staged, or `window.__shotError` on error.

---

*GREYLINE PROTOCOL — Original stealth game for make.fun best-stealth-game-20261121-1759*
*Repository: tronolllanj-creator/best-stealth-game-20261121-1759*