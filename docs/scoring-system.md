# Scoring System

Two related modules drive routine scoring:

- **`src/systems/ScoringEngine.ts`** — runs during a competition to produce the actual scores
- **`src/systems/RoutineValidator.ts`** — pre-calculates an estimated score range and per-element risk for the routine editor UI

`src/systems/OpponentGenerator.ts` also uses the same `ScoringEngine` to lock in the opponent's score at generation time.

## Inputs

- A `RoutineData` (ordered list of element slots, each pointing at an element id)
- The full swimmer roster — the engine filters to `!isAlternate` before scoring
- An `elementLookup: Map<string, ElementData>` providing `difficulty` + `category`

Team baselines are computed once as plain averages of active swimmers' stats: `avgArtistry`, `avgAthleticism`, `avgEndurance`.

## Fatigue model

Fatigue is a running budget, not a slot-index function. Each element spends fatigue from a team-wide capacity; harder tiers cost more.

**Tier cost lookup** (`TIER_FATIGUE_COST` in `ScoringEngine.ts`):

| Tier | Cost |
|---|---|
| 1 | 1 |
| 2 | 2.5 |
| 3 | 5 |
| 4 | 8 |

**Capacity** (`computeFatigueCapacity`): `12 + avgLevel * 1.5 + avgEndurance * 1.5`. Grows as swimmers level up; endurance still matters.

Both `ScoringEngine` and `RoutineValidator` walk the routine in order, track `accumulatedFatigue`, and compute `fatiguePct = accumulated / capacity` *before* adding the current element's cost — so the first element is always fresh.

## Per-element scoring (ScoringEngine)

Iterated over slots in order.

| Field | Formula |
|---|---|
| `fatiguePct` | `accumulatedFatigue / fatigueCapacity` (pre-element) |
| `fatigueMultiplier` | `max(0.35, 1 - fatiguePct * 0.35)` — smooth penalty that bottoms out at 0.35 |
| `execution` | `clamp(min(10, (avgAthleticism * 1.4 / max(difficulty, 0.1)) * 2.5 + 1.8) * fatigueMultiplier + noise(±1.1), 0, 10)` |
| `artistry` | `clamp(avgArtistry * 0.8 + varietyBonus + 0.8 + noise(±0.8), 0, 10)` where `varietyBonus = 0.8` if this element's category hasn't been used yet in the routine, else `0` |
| `synchronization` | `clamp((avgEndurance * 0.7 + avgArtistry * 0.25 + 1.0) * fatigueMultiplier + noise(±0.8), 0, 10)` |
| `success` | `clean` if `execution >= 7`, `partial` if `>= 4`, otherwise `fail`. Drives the `CompetitionScene` animation branch (splash size, wobble, category-specific effects) |
| `total` | `(execution * 0.4 + artistry * 0.3 + synchronization * 0.3) * difficulty / 2` |

After scoring, `accumulatedFatigue += TIER_FATIGUE_COST[element.tier]`.

All random noise uses `Math.random()` — the same routine scores differently each run.

## Judge panel

Five judges. Each judge observes the per-element averages (execution / artistry / synchronization across all slots) with two layers of noise:

- Per-judge `bias` = `(Math.random() - 0.5) * 0.6` (±0.3), applied to all three categories for that judge
- Per-category noise = `±0.2`

Judge total: `(exec + art + sync) / 3 * (totalDifficulty / max(slots.length, 1))`.

## Final score

Drop the highest and lowest judge totals; average the remaining three. Rounded to one decimal.

## XP earned

`xpEarned = round(finalScore * 10 + totalDifficulty * 5)`. Distributed to swimmers + coach by `ProgressionSystem`.

## RoutineValidator (editor preview only)

Deterministic — no `Math.random()`. Used in the routine editor to show a difficulty rating and estimated score range.

Per-element risk (0-1):

- `fatiguePct = accumulatedFatigue / fatigueCapacity` (same model as `ScoringEngine`)
- `effectiveDifficulty = difficulty * (1 + fatiguePct * 0.5)` — up to 50% harder when fully fatigued
- `abilityScore = avgAthleticism * 0.5 + avgArtistry * 0.3 + avgEndurance * 0.2`
- `difficultyThreshold = abilityScore * 0.4`
- `risk = clamp((effectiveDifficulty - difficultyThreshold) / 2, 0, 1)`

The result also exposes `fatigueLoad` (total accumulated cost) and `fatigueCapacity` for the editor UI.

Difficulty rating from `totalDifficulty / max(avgTeamStat, 1)`:

| Ratio | Rating |
|---|---|
| `< 1.5` | easy |
| `< 3` | moderate |
| `< 5` | hard |
| `>= 5` | risky |

Estimated score range:

- `baseScore = totalDifficulty * 2`
- `executionMultiplier = max(0.3, 1 - avgRisk * 0.7)`
- low = `baseScore * executionMultiplier * 0.7`
- high = `baseScore * min(1, executionMultiplier * 1.2)`

## Opponents

`OpponentGenerator` creates a team + routine with difficulty tuned to season progress and runs `ScoringEngine` immediately to freeze `preCalculatedScore`:

- `difficultyLevel = 3 + seasonIndex * 0.4 + competitionsWon * 0.15`
- Swimmer stats sampled from `[max(3, floor(level)), min(10, floor(level + 2))]`
- Element pool capped at tier `min(4, ceil(level / 2))` (formations excluded)
- Slot count: `clamp(3 + floor(level), 4, 8)`
- Style (`aggressive` / `safe` / `balanced`) biases element picks toward the hard or easy end of the sorted pool

The opponent is *not* rescored during playback — the frozen score is what the player faces.

## Known quirks

- Fatigue depends on slot ordering; front-loading tier-4 elements burns capacity early, making the back half of the routine score worse.
- First element always executes fresh (`fatiguePct = 0` before its own cost is added).
- A routine whose total tier cost exceeds `fatigueCapacity` doesn't fail outright — it just accrues `fatiguePct > 1` and pushes the penalty toward the 0.35 floor.
- Variety bonus rewards category diversity, not element-level diversity within a category (two "figure" elements still share the bonus after the first).
- Execution baseline uses only `avgAthleticism`; artistry/endurance don't raise the execution floor directly, only via side channels (endurance via fatigue; artistry via sync).
- Judge total uses `totalDifficulty / slots.length` as a difficulty multiplier, not the per-element difficulties individually — longer routines with the same total DD score the same as shorter ones on that axis.

## Key constants / magic numbers

Currently inlined in the source (no central config):

| Constant | Value | Location |
|---|---|---|
| Category weights in element total | exec 0.4 / art 0.3 / sync 0.3 | `ScoringEngine.scoreRoutine` |
| Element total divisor | `/ 2` | `ScoringEngine.scoreRoutine` |
| Execution noise | ±1.1 | `ScoringEngine.scoreRoutine` |
| Artistry / sync noise | ±0.8 | `ScoringEngine.scoreRoutine` |
| Variety bonus | 0.8 | `ScoringEngine.scoreRoutine` |
| Tier fatigue cost | 1 / 2.5 / 5 / 8 (tier 1-4) | `ScoringEngine.TIER_FATIGUE_COST` |
| Fatigue capacity | `12 + avgLevel * 1.5 + avgEndurance * 1.5` | `ScoringEngine.computeFatigueCapacity` |
| Fatigue penalty slope | `× 0.35`, floor `0.35` | `ScoringEngine.scoreRoutine` |
| Validator fatigue amplification | +50% at full fatigue | `RoutineValidator.validateRoutine` |
| Judge panel size | 5 | `ScoringEngine.scoreRoutine` |
| Judge bias | ±0.3 | `ScoringEngine.scoreRoutine` |
| Per-category judge noise | ±0.2 | `ScoringEngine.scoreRoutine` |
| Success thresholds | 7 / 4 | `ScoringEngine.scoreRoutine` |
| XP multipliers | ×10 score, ×5 difficulty | `ScoringEngine.scoreRoutine` |
| Validator ability weights | ath 0.5 / art 0.3 / end 0.2 | `RoutineValidator.validateRoutine` |
