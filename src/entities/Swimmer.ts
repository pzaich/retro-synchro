export interface SwimmerStats {
  artistry: number;    // 1-10: execution quality, expression
  athleticism: number; // 1-10: difficulty ceiling, power
  endurance: number;   // 1-10: stamina, consistency in later elements
}

export interface SwimmerData {
  id: string;
  name: string;
  stats: SwimmerStats;
  level: number;
  xp: number;
  isAlternate: boolean;
}

let nextId = 1;

export function createSwimmer(name: string, stats: SwimmerStats, isAlternate = false): SwimmerData {
  return {
    id: `swimmer-${nextId++}`,
    name,
    stats,
    level: 1,
    xp: 0,
    isAlternate,
  };
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
