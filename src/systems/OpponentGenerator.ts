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
  // Difficulty scaling: opponents are competitive from the start and grow with you
  const difficultyLevel = 3 + seasonIndex * 0.4 + competitionsWon * 0.15;
  const minStat = Math.max(3, Math.min(Math.floor(difficultyLevel), 9));
  const maxStat = Math.min(Math.floor(difficultyLevel + 2), 10);

  // Pick team name
  const teamName = TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)]!;

  // Generate swimmers with unique names
  const names = generateUniqueNames(TEAM_SIZE);
  const swimmers: SwimmerData[] = [];
  for (let i = 0; i < TEAM_SIZE; i++) {
    swimmers.push(createSwimmer(names[i]!, {
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
  const maxTier = Math.min(4, Math.ceil(difficultyLevel / 2));
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

function generateUniqueNames(count: number): string[] {
  const firsts = shuffle(FIRST_NAMES);
  const lasts = shuffle(LAST_NAMES);
  const names: string[] = [];
  const used = new Set<string>();

  for (let i = 0; names.length < count; i++) {
    const first = firsts[i % firsts.length]!;
    const last = lasts[i % lasts.length]!;
    const name = `${first} ${last}`;
    if (!used.has(name)) {
      used.add(name);
      names.push(name);
    }
  }
  return names;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function randStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
