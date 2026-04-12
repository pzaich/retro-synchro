import { SwimmerData, createSwimmer } from './Swimmer';
import { TEAM_SIZE, ALTERNATE_COUNT } from '../config';

export interface TeamData {
  name: string;
  swimmers: SwimmerData[];
}

const FIRST_NAMES = [
  'Emma', 'Sofia', 'Mia', 'Luna', 'Aria', 'Chloe', 'Lily', 'Zoe',
  'Nora', 'Ella', 'Ava', 'Isla', 'Maya', 'Ruby', 'Jade', 'Nina',
  'Sara', 'Lena', 'Yuki', 'Mei',
];

const LAST_NAMES = [
  'Chen', 'Rivera', 'Kim', 'Petrov', 'Silva', 'Tanaka', 'Müller',
  'Dubois', 'Santos', 'Park', 'Nakamura', 'Lopez', 'Andersen',
  'Yamamoto', 'Costa', 'Ivanova', 'Suzuki', 'Martinez', 'Lee', 'Wang',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
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

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createStarterTeam(teamName: string): TeamData {
  const total = TEAM_SIZE + ALTERNATE_COUNT;
  const names = generateUniqueNames(total);
  const swimmers: SwimmerData[] = [];

  // 8 active swimmers with stats 2-5 (decent but room to grow)
  for (let i = 0; i < TEAM_SIZE; i++) {
    swimmers.push(
      createSwimmer(names[i]!, {
        artistry: randomStat(2, 5),
        athleticism: randomStat(2, 5),
        endurance: randomStat(2, 5),
      })
    );
  }

  // 2 alternates with slightly lower stats 1-4
  for (let i = 0; i < ALTERNATE_COUNT; i++) {
    swimmers.push(
      createSwimmer(names[TEAM_SIZE + i]!, {
        artistry: randomStat(1, 4),
        athleticism: randomStat(1, 4),
        endurance: randomStat(1, 4),
      }, true)
    );
  }

  return { name: teamName, swimmers };
}
