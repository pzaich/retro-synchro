import { SwimmerData, SwimmerStats, xpForLevel } from '../entities/Swimmer';
import { GameStateData } from './GameState';
import { MAX_SWIMMER_STAT, MAX_COACH_LEVEL } from '../config';

export interface LevelUpEvent {
  swimmerId: string;
  swimmerName: string;
  newLevel: number;
  statIncreased: keyof SwimmerStats;
  statNewValue: number;
}

export interface CoachLevelUpEvent {
  newLevel: number;
  newTierUnlocked: number;
}

export interface ProgressionResult {
  swimmerLevelUps: LevelUpEvent[];
  coachLevelUp: CoachLevelUpEvent | null;
  newUnlockedElementIds: string[];
}

/** Maps coach level to max element tier accessible */
export function coachLevelToTier(coachLevel: number): number {
  if (coachLevel <= 1) return 1;
  if (coachLevel <= 3) return 2;
  if (coachLevel <= 5) return 3;
  if (coachLevel <= 7) return 4;
  return 5;
}

/** XP required for next coach level */
export function coachXpForLevel(level: number): number {
  return Math.floor(200 * Math.pow(1.6, level - 1));
}

/**
 * Processes progression after a competition.
 * Call this after XP has been added to swimmers and coach.
 */
export function processProgression(state: GameStateData): ProgressionResult {
  const swimmerLevelUps: LevelUpEvent[] = [];
  let coachLevelUp: CoachLevelUpEvent | null = null;

  // Process swimmer level-ups
  for (const swimmer of state.team.swimmers) {
    const levelUp = checkSwimmerLevelUp(swimmer);
    if (levelUp) {
      swimmerLevelUps.push(levelUp);
    }
  }

  // Process coach level-up
  const coachXpNeeded = coachXpForLevel(state.coachLevel);
  if (state.coachXp >= coachXpNeeded && state.coachLevel < MAX_COACH_LEVEL) {
    state.coachXp -= coachXpNeeded;
    state.coachLevel++;
    const newTier = coachLevelToTier(state.coachLevel);
    const oldTier = coachLevelToTier(state.coachLevel - 1);
    if (newTier > oldTier) {
      coachLevelUp = { newLevel: state.coachLevel, newTierUnlocked: newTier };
    } else {
      coachLevelUp = { newLevel: state.coachLevel, newTierUnlocked: 0 };
    }
  }

  return {
    swimmerLevelUps,
    coachLevelUp,
    newUnlockedElementIds: [], // populated by caller if needed
  };
}

function checkSwimmerLevelUp(swimmer: SwimmerData): LevelUpEvent | null {
  const xpNeeded = xpForLevel(swimmer.level);
  if (swimmer.xp < xpNeeded) return null;

  swimmer.xp -= xpNeeded;
  swimmer.level++;

  // Auto-allocate: increase lowest stat (with some randomness)
  const stat = pickStatToIncrease(swimmer.stats);
  swimmer.stats[stat] = Math.min(MAX_SWIMMER_STAT, swimmer.stats[stat] + 1);

  return {
    swimmerId: swimmer.id,
    swimmerName: swimmer.name,
    newLevel: swimmer.level,
    statIncreased: stat,
    statNewValue: swimmer.stats[stat],
  };
}

function pickStatToIncrease(stats: SwimmerStats): keyof SwimmerStats {
  const statNames: (keyof SwimmerStats)[] = ['artistry', 'athleticism', 'endurance'];

  // 70% chance: increase lowest stat. 30% chance: random stat.
  if (Math.random() < 0.7) {
    statNames.sort((a, b) => stats[a] - stats[b]);
    return statNames[0]!;
  }
  return statNames[Math.floor(Math.random() * statNames.length)]!;
}
