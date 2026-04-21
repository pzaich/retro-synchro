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

## Per-element scoring (ScoringEngine)

Iterated over slots in order. `i` is the slot index, starting at 0.

| Field | Formula |
|---|---|
| `fatiguePct` | `i / max(slots.length - 1, 1)` |
| `fatigueMultiplier` | `1 - fatiguePct * (1 - avgEndurance / 12)` (~17% penalty at end when endurance = 10) |
| `execution` | `clamp(min(10, (avgAthleticism * 1.4 / max(difficulty, 0.1)) * 2.5 + 1.8) * fatigueMultiplier + noise(±1.1), 0, 10)` |
| `artistry` | `clamp(avgArtistry * 0.8 + varietyBonus + 0.8 + noise(±0.8), 0, 10)` where `varietyBonus = 0.8` if this element's category hasn't been used yet in the routine, else `0` |
| `synchronization` | `clamp((avgEndurance * 0.7 + avgArtistry * 0.25 + 1.0) * fatigueMultiplier + noise(±0.8), 0, 10)` |
| `success` | `clean` if `execution >= 7`, `partial` if `>= 4`, otherwise `fail`. Drives the `CompetitionScene` animation branch (splash size, wobble, category-specific effects) |
| `total` | `(execution * 0.4 + artistry * 0.3 + synchronization * 0.3) * difficulty / 2` |

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

- `effectiveDifficulty = difficulty * (1 + (slotIndex / slots.length) * 0.3)` — up to 30% harder at end
- `abilityScore = avgAthleticism * 0.5 + avgArtistry * 0.3 + avgEndurance * 0.2`
- `difficultyThreshold = abilityScore * 0.4`
- `risk = clamp((effectiveDifficulty - difficultyThreshold) / 2, 0, 1)`

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

- Fatigue depends on slot ordering; reordering the same elements changes the result.
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
| Fatigue endurance divisor | `/ 12` | `ScoringEngine.scoreRoutine` |
| Judge panel size | 5 | `ScoringEngine.scoreRoutine` |
| Judge bias | ±0.3 | `ScoringEngine.scoreRoutine` |
| Per-category judge noise | ±0.2 | `ScoringEngine.scoreRoutine` |
| Success thresholds | 7 / 4 | `ScoringEngine.scoreRoutine` |
| XP multipliers | ×10 score, ×5 difficulty | `ScoringEngine.scoreRoutine` |
| Validator fatigue factor | +30% at end | `RoutineValidator.validateRoutine` |
| Validator ability weights | ath 0.5 / art 0.3 / end 0.2 | `RoutineValidator.validateRoutine` |
