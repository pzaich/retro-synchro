import { RoutineData } from '../entities/Routine';
import { SwimmerData } from '../entities/Swimmer';
import { ElementData } from '../entities/Element';

export interface ElementScore {
  elementId: string;
  elementName: string;
  difficulty: number;
  execution: number;       // 0-10
  artistry: number;        // 0-10
  synchronization: number; // 0-10
  total: number;
  success: 'clean' | 'partial' | 'fail';
}

export interface JudgeScores {
  judgeId: number;
  execution: number;
  artistry: number;
  difficulty: number;
  synchronization: number;
  total: number;
}

export interface CompetitionResult {
  elementScores: ElementScore[];
  judgeScores: JudgeScores[];
  finalScore: number;
  totalDifficulty: number;
  xpEarned: number;
}

/**
 * Scores a full routine performance.
 * Compares element difficulty against swimmer stats to determine
 * execution quality with randomized outcomes.
 */
export function scoreRoutine(
  routine: RoutineData,
  swimmers: SwimmerData[],
  elementLookup: Map<string, ElementData>,
): CompetitionResult {
  const activeSwimmers = swimmers.filter(s => !s.isAlternate);
  const avgArtistry = avg(activeSwimmers.map(s => s.stats.artistry));
  const avgAthleticism = avg(activeSwimmers.map(s => s.stats.athleticism));
  const avgEndurance = avg(activeSwimmers.map(s => s.stats.endurance));

  const elementScores: ElementScore[] = [];
  let totalDifficulty = 0;
  const usedCategories = new Set<string>();

  for (let i = 0; i < routine.slots.length; i++) {
    const slot = routine.slots[i]!;
    const element = elementLookup.get(slot.elementId);
    if (!element) continue;

    totalDifficulty += element.difficulty;

    // Fatigue: endurance matters more for later elements
    const fatiguePct = i / Math.max(routine.slots.length - 1, 1);
    const fatigueMultiplier = 1 - fatiguePct * (1 - avgEndurance / 12); // up to ~17% penalty at end

    // Execution check: athleticism vs difficulty
    const abilityRatio = (avgAthleticism * 1.2) / Math.max(element.difficulty, 0.1);
    const baseExecution = Math.min(10, abilityRatio * 3.5) * fatigueMultiplier;
    const executionRoll = baseExecution + (Math.random() - 0.5) * 2.5;
    const execution = clamp(executionRoll, 0, 10);

    // Artistry: based on artistry stat + variety bonus
    const varietyBonus = usedCategories.has(element.category) ? 0 : 0.8;
    usedCategories.add(element.category);
    const artistryBase = avgArtistry * 0.85 + varietyBonus;
    const artistry = clamp(artistryBase + (Math.random() - 0.5) * 1.5, 0, 10);

    // Synchronization: based on endurance + team consistency
    const syncBase = (avgEndurance * 0.7 + avgArtistry * 0.3) * fatigueMultiplier;
    const synchronization = clamp(syncBase + (Math.random() - 0.5) * 1.5, 0, 10);

    // Success classification
    let success: ElementScore['success'];
    if (execution >= 7) success = 'clean';
    else if (execution >= 4) success = 'partial';
    else success = 'fail';

    // Total element score: weighted sum * difficulty multiplier
    const total = ((execution * 0.4 + artistry * 0.3 + synchronization * 0.3) * element.difficulty) / 2;

    elementScores.push({
      elementId: element.id,
      elementName: element.name,
      difficulty: element.difficulty,
      execution: round1(execution),
      artistry: round1(artistry),
      synchronization: round1(synchronization),
      total: round1(total),
      success,
    });
  }

  // Judge panel: 5 judges with slight random bias
  const avgExecution = avg(elementScores.map(s => s.execution));
  const avgArt = avg(elementScores.map(s => s.artistry));
  const avgSync = avg(elementScores.map(s => s.synchronization));

  const judgeScores: JudgeScores[] = [];
  for (let j = 0; j < 5; j++) {
    const bias = (Math.random() - 0.5) * 0.6; // +/- 0.3
    const exec = clamp(avgExecution + bias + (Math.random() - 0.5) * 0.4, 0, 10);
    const art = clamp(avgArt + bias + (Math.random() - 0.5) * 0.4, 0, 10);
    const diff = round1(totalDifficulty);
    const sync = clamp(avgSync + bias + (Math.random() - 0.5) * 0.4, 0, 10);
    const total = round1((exec + art + sync) / 3 * (totalDifficulty / Math.max(routine.slots.length, 1)));

    judgeScores.push({
      judgeId: j + 1,
      execution: round1(exec),
      artistry: round1(art),
      difficulty: diff,
      synchronization: round1(sync),
      total: round1(total),
    });
  }

  // Final score: drop highest and lowest judge totals, average remaining 3
  const sortedTotals = judgeScores.map(j => j.total).sort((a, b) => a - b);
  const trimmedTotals = sortedTotals.slice(1, -1); // drop first and last
  const finalScore = round1(avg(trimmedTotals));

  // XP earned: based on final score and difficulty
  const xpEarned = Math.round(finalScore * 10 + totalDifficulty * 5);

  return {
    elementScores,
    judgeScores,
    finalScore,
    totalDifficulty: round1(totalDifficulty),
    xpEarned,
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}
