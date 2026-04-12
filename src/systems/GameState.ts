import { TeamData, createStarterTeam } from '../entities/Team';
import { RoutineData } from '../entities/Routine';

export interface SeasonMatch {
  name: string;
  tier: number;
  type: 'regular' | 'nationals' | 'olympics';
}

export interface GameStateData {
  saveVersion: number;
  team: TeamData;
  routines: RoutineData[];
  unlockedElementIds: string[];
  coachLevel: number;
  coachXp: number;
  seasonIndex: number;
  seasonNumber: number;
  competitionsWon: number;
  country: string;
  seasonMatches: SeasonMatch[];
  nationalsWon: number;
  olympicMedals: { gold: number; silver: number; bronze: number };
}

export class GameState {
  private static instance: GameState | null = null;
  private data: GameStateData | null = null;

  static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  initNew(teamName: string, country: string): GameStateData {
    this.data = {
      saveVersion: 1,
      team: createStarterTeam(teamName),
      routines: [],
      unlockedElementIds: [],
      coachLevel: 1,
      coachXp: 0,
      seasonIndex: 0,
      seasonNumber: 1,
      competitionsWon: 0,
      country,
      seasonMatches: generateSeasonMatches(1),
      nationalsWon: 0,
      olympicMedals: { gold: 0, silver: 0, bronze: 0 },
    };
    return this.data;
  }

  load(data: GameStateData): void {
    this.data = data;
  }

  get(): GameStateData {
    if (!this.data) {
      throw new Error('GameState not initialized. Call initNew() or load() first.');
    }
    return this.data;
  }

  hasData(): boolean {
    return this.data !== null;
  }
}

// ── Season generation ───────────────────────────────────

const REGULAR_MEETS_T1 = [
  'Local Splash Meet', 'Community Cup', 'Neighborhood Invitational',
  'Club Showdown', 'Rookie Showcase', 'Friendship Meet',
  'Junior Open', 'City Warm-Up', 'Aquatic Festival',
];
const REGULAR_MEETS_T2 = [
  'City League', 'City Championship', 'County Qualifier',
  'County Finals', 'Metro Invitational', 'District Cup',
  'Silver Wave Classic', 'Dolphin Trophy', 'Regional Prelim',
];
const REGULAR_MEETS_T3 = [
  'State Open', 'State Championship', 'Regional Qualifier',
  'Regional Championship', 'Gold Coast Invitational', 'Elite Series',
  'Champions League Round', 'Grand Prix Qualifier', 'Continental Prelim',
];
const REGULAR_MEETS_T4 = [
  'National Open', 'National Semifinal', 'Grand Prix Finals',
  'International Invitational', 'World Series Qualifier', 'Continental Cup',
  'Masters Invitational', 'All-Star Showcase',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function generateSeasonMatches(seasonNumber: number): SeasonMatch[] {
  const matches: SeasonMatch[] = [];
  const usedNames = new Set<string>();

  function addUnique(pool: string[], tier: number, type: SeasonMatch['type'] = 'regular'): void {
    let name: string;
    let attempts = 0;
    do {
      name = pickRandom(pool);
      attempts++;
    } while (usedNames.has(name) && attempts < 20);
    if (usedNames.has(name)) name = `${name} ${romanNumeral(seasonNumber)}`;
    usedNames.add(name);
    matches.push({ name, tier, type });
  }

  // Tier 1: 3-4 easy meets
  const t1Count = 3 + (seasonNumber <= 2 ? 1 : 0);
  for (let i = 0; i < t1Count; i++) addUnique(REGULAR_MEETS_T1, 1);

  // Tier 2: 3-4 medium meets
  const t2Count = 3 + (seasonNumber % 2 === 0 ? 1 : 0);
  for (let i = 0; i < t2Count; i++) addUnique(REGULAR_MEETS_T2, 2);

  // Tier 3: 3 hard meets
  for (let i = 0; i < 3; i++) addUnique(REGULAR_MEETS_T3, 3);

  // Nationals (every season)
  matches.push({ name: 'NATIONAL CHAMPIONSHIP', tier: 4, type: 'nationals' });

  // Tier 4: 2 elite meets
  for (let i = 0; i < 2; i++) addUnique(REGULAR_MEETS_T4, 4);

  // Olympics every 4th season (starting season 4)
  if (seasonNumber >= 4 && seasonNumber % 4 === 0) {
    matches.push({ name: 'OLYMPIC GAMES', tier: 5, type: 'olympics' });
  }

  // World Championship in non-Olympic even seasons
  if (seasonNumber >= 2 && seasonNumber % 2 === 0 && seasonNumber % 4 !== 0) {
    matches.push({ name: 'WORLD CHAMPIONSHIP', tier: 5, type: 'regular' });
  }

  return matches;
}

function romanNumeral(n: number): string {
  const numerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return numerals[n] ?? `${n}`;
}
