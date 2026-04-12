import { GameState, GameStateData } from './GameState';
import { SAVE_KEY, SAVE_VERSION } from '../config';

interface SaveFile {
  version: number;
  slot: number;
  timestamp: number;
  data: GameStateData;
}

interface SaveIndex {
  slots: (SaveFile | null)[];
}

export class SaveManager {
  private static activeSlot = 0;

  static setSlot(slot: number): void {
    this.activeSlot = slot;
  }

  static getSlot(): number {
    return this.activeSlot;
  }

  static newGame(teamName = 'Aqua Stars', country = 'USA'): GameStateData {
    const state = GameState.getInstance();
    const data = state.initNew(teamName, country);
    this.save();
    return data;
  }

  static save(): void {
    const state = GameState.getInstance();
    if (!state.hasData()) return;

    const index = this.loadIndex();
    const saveFile: SaveFile = {
      version: SAVE_VERSION,
      slot: this.activeSlot,
      timestamp: Date.now(),
      data: state.get(),
    };
    index.slots[this.activeSlot] = saveFile;
    localStorage.setItem(SAVE_KEY, JSON.stringify(index));
  }

  static load(slot?: number): GameStateData | null {
    const targetSlot = slot ?? this.activeSlot;
    const index = this.loadIndex();
    const saveFile = index.slots[targetSlot];
    if (!saveFile) return null;

    // Migrate if needed
    const data = this.migrate(saveFile);
    GameState.getInstance().load(data);
    this.activeSlot = targetSlot;
    return data;
  }

  static hasSave(slot?: number): boolean {
    const index = this.loadIndex();
    if (slot !== undefined) {
      return index.slots[slot] !== null && index.slots[slot] !== undefined;
    }
    return index.slots.some((s) => s !== null);
  }

  static getSlotInfo(): { slot: number; timestamp: number; teamName: string }[] {
    const index = this.loadIndex();
    return index.slots
      .map((s, i) =>
        s ? { slot: i, timestamp: s.timestamp, teamName: s.data.team.name } : null
      )
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }

  static deleteSave(slot: number): void {
    const index = this.loadIndex();
    index.slots[slot] = null;
    localStorage.setItem(SAVE_KEY, JSON.stringify(index));
  }

  static exportSave(): string {
    return localStorage.getItem(SAVE_KEY) ?? '{}';
  }

  static importSave(json: string): boolean {
    try {
      const parsed = JSON.parse(json) as SaveIndex;
      if (parsed.slots) {
        localStorage.setItem(SAVE_KEY, json);
        return true;
      }
    } catch {
      // invalid JSON
    }
    return false;
  }

  private static loadIndex(): SaveIndex {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return { slots: [null, null, null] };
    }
    try {
      const parsed = JSON.parse(raw) as SaveIndex;
      // Ensure 3 slots
      while (parsed.slots.length < 3) parsed.slots.push(null);
      return parsed;
    } catch {
      return { slots: [null, null, null] };
    }
  }

  private static migrate(saveFile: SaveFile): GameStateData {
    // Future: add migration logic per version
    // if (saveFile.version < 2) { ... }
    return saveFile.data;
  }
}
