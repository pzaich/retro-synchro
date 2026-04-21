# Claude guidance

## Scoring system

Before modifying anything in `src/systems/ScoringEngine.ts`, `src/systems/RoutineValidator.ts`, `src/systems/OpponentGenerator.ts`, or anything that consumes their outputs (final score, element scores, XP distribution, opponent generation), **read `docs/scoring-system.md`** first — it documents the formulas, constants, and known quirks.

After making changes to any of those files, **update `docs/scoring-system.md`** in the same commit so the doc stays in sync. If a formula, constant, or threshold changes, update the corresponding row in the "Key constants / magic numbers" table.
