import { RoutineData } from '../entities/Routine';
import { SwimmerData } from '../entities/Swimmer';
import { ElementData } from '../entities/Element';
import { fatigueCostFor, computeFatigueCapacity } from './ScoringEngine';

export interface ValidationResult {
  totalDifficulty: number;
  avgTeamStat: number;
  difficultyRating: 'easy' | 'moderate' | 'hard' | 'risky';
  elementRisks: Map<string, number>; // elementId -> risk factor (0-1, where 1 = very risky)
  estimatedScore: { low: number; high: number };
  fatigueLoad: number;     // total accumulated fatigue cost of the routine
  fatigueCapacity: number; // team's fatigue budget
}

/**
 * Calculates how risky a routine is for the given team.
 * Compares element difficulty against swimmer stats to determine
 * likelihood of mistakes.
 */
export function validateRoutine(
  routine: RoutineData,
  swimmers: SwimmerData[],
  elementLookup: Map<string, ElementData>,
): ValidationResult {
  const activeSwimmers = swimmers.filter(s => !s.isAlternate);

  // Average team stats
  const avgArtistry = avg(activeSwimmers.map(s => s.stats.artistry));
  const avgAthleticism = avg(activeSwimmers.map(s => s.stats.athleticism));
  const avgEndurance = avg(activeSwimmers.map(s => s.stats.endurance));
  const avgTeamStat = (avgArtistry + avgAthleticism + avgEndurance) / 3;

  let totalDifficulty = 0;
  const elementRisks = new Map<string, number>();

  const fatigueCapacity = computeFatigueCapacity(swimmers);
  let accumulatedFatigue = 0;

  for (const slot of routine.slots) {
    const element = elementLookup.get(slot.elementId);
    if (!element) continue;

    totalDifficulty += element.difficulty;

    // Risk = how far the element difficulty exceeds team ability, amplified by
    // accumulated fatigue from prior tier-weighted element costs.
    const fatiguePct = accumulatedFatigue / fatigueCapacity;
    const effectiveDifficulty = element.difficulty * (1 + fatiguePct * 0.5);

    const abilityScore = (avgAthleticism * 0.5 + avgArtistry * 0.3 + avgEndurance * 0.2);
    const difficultyThreshold = abilityScore * 0.4;
    const risk = Math.max(0, Math.min(1, (effectiveDifficulty - difficultyThreshold) / 2));

    elementRisks.set(slot.elementId, risk);
    accumulatedFatigue += fatigueCostFor(element.tier);
  }

  // Difficulty rating
  const diffPerStat = totalDifficulty / Math.max(avgTeamStat, 1);
  let difficultyRating: ValidationResult['difficultyRating'];
  if (diffPerStat < 1.5) difficultyRating = 'easy';
  else if (diffPerStat < 3) difficultyRating = 'moderate';
  else if (diffPerStat < 5) difficultyRating = 'hard';
  else difficultyRating = 'risky';

  // Estimated score range (rough)
  const baseScore = totalDifficulty * 2;
  const avgRisk = routine.slots.length > 0
    ? Array.from(elementRisks.values()).reduce((a, b) => a + b, 0) / routine.slots.length
    : 0;
  const executionMultiplier = Math.max(0.3, 1 - avgRisk * 0.7);

  return {
    totalDifficulty: Math.round(totalDifficulty * 10) / 10,
    avgTeamStat: Math.round(avgTeamStat * 10) / 10,
    difficultyRating,
    elementRisks,
    estimatedScore: {
      low: Math.round(baseScore * executionMultiplier * 0.7 * 10) / 10,
      high: Math.round(baseScore * Math.min(1, executionMultiplier * 1.2) * 10) / 10,
    },
    fatigueLoad: Math.round(accumulatedFatigue * 10) / 10,
    fatigueCapacity: Math.round(fatigueCapacity * 10) / 10,
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
