import { TeamData, createStarterTeam } from '../entities/Team';
import { RoutineData } from '../entities/Routine';

export interface GameStateData {
  saveVersion: number;
  team: TeamData;
  routines: RoutineData[];
  unlockedElementIds: string[];
  coachLevel: number;
  coachXp: number;
  seasonIndex: number;
  competitionsWon: number;
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

  initNew(teamName: string): GameStateData {
    this.data = {
      saveVersion: 1,
      team: createStarterTeam(teamName),
      routines: [],
      unlockedElementIds: [], // populated by ProgressionSystem based on coach level
      coachLevel: 1,
      coachXp: 0,
      seasonIndex: 0,
      competitionsWon: 0,
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
