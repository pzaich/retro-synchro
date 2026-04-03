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

function randomName(rng: () => number): string {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]!;
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]!;
  return `${first} ${last}`;
}

function randomStat(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function createStarterTeam(teamName: string): TeamData {
  const rng = Math.random;
  const swimmers: SwimmerData[] = [];

  // 8 active swimmers with stats 2-5
  for (let i = 0; i < TEAM_SIZE; i++) {
    swimmers.push(
      createSwimmer(randomName(rng), {
        artistry: randomStat(rng, 2, 5),
        athleticism: randomStat(rng, 2, 5),
        endurance: randomStat(rng, 2, 5),
      })
    );
  }

  // 2 alternates with slightly lower stats 1-4
  for (let i = 0; i < ALTERNATE_COUNT; i++) {
    swimmers.push(
      createSwimmer(randomName(rng), {
        artistry: randomStat(rng, 1, 4),
        athleticism: randomStat(rng, 1, 4),
        endurance: randomStat(rng, 1, 4),
      }, true)
    );
  }

  return { name: teamName, swimmers };
}
