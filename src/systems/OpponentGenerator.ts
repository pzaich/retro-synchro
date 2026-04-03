import { TeamData } from '../entities/Team';
import { SwimmerData, createSwimmer } from '../entities/Swimmer';
import { RoutineData } from '../entities/Routine';
import { ElementData } from '../entities/Element';
import { scoreRoutine, CompetitionResult } from './ScoringEngine';
import { TEAM_SIZE } from '../config';

export interface OpponentTeam {
  team: TeamData;
  routine: RoutineData;
  preCalculatedScore: number;
  style: 'aggressive' | 'safe' | 'balanced';
}

const TEAM_NAMES = [
  'Aqua Blaze', 'Neptune\'s Stars', 'Crystal Waves', 'Silver Fins',
  'Blue Dolphins', 'Golden Tide', 'Pearl Divers', 'Storm Surge',
  'Coral Queens', 'Sapphire Sync', 'Wave Riders', 'Ocean Gems',
  'Pacific Flow', 'Aurora Splash', 'Tidal Force', 'Starfish Elite',
];

const FIRST_NAMES = [
  'Ana', 'Eva', 'Li', 'Hana', 'Rosa', 'Ina', 'Kai', 'Sol',
  'Nia', 'Emi', 'Lea', 'Yui', 'Ada', 'Fia', 'Ren', 'Mai',
];

const LAST_NAMES = [
  'Kato', 'Ruiz', 'Lin', 'Berg', 'Voss', 'Neri', 'Holt', 'Sato',
  'Cruz', 'Ito', 'Dahl', 'Wen', 'Rey', 'Paz', 'Mori', 'Vega',
];

/**
 * Generates an opponent team with difficulty scaled to the player's season progress.
 */
export function generateOpponent(
  seasonIndex: number,
  competitionsWon: number,
  availableElements: ElementData[],
  elementLookup: Map<string, ElementData>,
): OpponentTeam {
  // Difficulty scaling: opponents get stronger as you progress
  const difficultyLevel = 1 + seasonIndex * 0.5 + competitionsWon * 0.15;
  const minStat = Math.min(Math.floor(difficultyLevel), 8);
  const maxStat = Math.min(Math.floor(difficultyLevel + 3), 10);

  // Pick team name
  const teamName = TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)]!;

  // Generate swimmers
  const swimmers: SwimmerData[] = [];
  for (let i = 0; i < TEAM_SIZE; i++) {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]!;
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]!;
    swimmers.push(createSwimmer(`${first} ${last}`, {
      artistry: randStat(minStat, maxStat),
      athleticism: randStat(minStat, maxStat),
      endurance: randStat(minStat, maxStat),
    }));
  }

  const team: TeamData = { name: teamName, swimmers };

  // Pick a style
  const styles: OpponentTeam['style'][] = ['aggressive', 'safe', 'balanced'];
  const style = styles[Math.floor(Math.random() * styles.length)]!;

  // Build a routine
  const routine = buildOpponentRoutine(style, availableElements, difficultyLevel);

  // Pre-calculate score
  const result: CompetitionResult = scoreRoutine(routine, swimmers, elementLookup);

  return {
    team,
    routine,
    preCalculatedScore: result.finalScore,
    style,
  };
}

function buildOpponentRoutine(
  style: OpponentTeam['style'],
  elements: ElementData[],
  difficultyLevel: number,
): RoutineData {
  // Filter elements by what's available at this difficulty
  const maxTier = Math.min(5, Math.ceil(difficultyLevel / 2));
  const eligible = elements.filter(e => e.tier <= maxTier && e.category !== 'formation');

  if (eligible.length === 0) {
    return { id: 'opponent-routine', name: 'Opponent Routine', slots: [] };
  }

  // Slot count: 4-8 depending on difficulty
  const slotCount = Math.min(8, Math.max(4, Math.floor(3 + difficultyLevel)));

  // Sort by difficulty
  const sorted = [...eligible].sort((a, b) => a.difficulty - b.difficulty);

  const slots = [];
  const formations = ['straight-line', 'circle', 'v-formation', 'diamond', 'diagonal-line'];

  for (let i = 0; i < slotCount; i++) {
    let pick: ElementData;
    if (style === 'aggressive') {
      // Prefer harder elements
      const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.6 + Math.random() * sorted.length * 0.4));
      pick = sorted[idx]!;
    } else if (style === 'safe') {
      // Prefer easier elements
      const idx = Math.floor(Math.random() * sorted.length * 0.5);
      pick = sorted[idx]!;
    } else {
      // Balanced: random
      pick = sorted[Math.floor(Math.random() * sorted.length)]!;
    }

    slots.push({
      elementId: pick.id,
      formationId: formations[Math.floor(Math.random() * formations.length)]!,
    });
  }

  return {
    id: 'opponent-routine',
    name: 'Opponent Routine',
    slots,
  };
}

function randStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
