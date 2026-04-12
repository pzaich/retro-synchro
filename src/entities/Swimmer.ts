export interface SwimmerStats {
  artistry: number;    // 1-10: execution quality, expression
  athleticism: number; // 1-10: difficulty ceiling, power
  endurance: number;   // 1-10: stamina, consistency in later elements
}

export type Specialty = 'lifts' | 'spins' | 'figures' | 'sculls' | 'formations' | 'all-rounder';

export type Personality =
  | 'perfectionist'  // +artistry under pressure
  | 'powerhouse'     // +athleticism bonus on lifts
  | 'clutch'         // better in late-routine elements
  | 'leader'         // boosts nearby swimmers' sync
  | 'creative'       // +artistry variety bonus
  | 'steady'         // consistent, less variance
  | 'fiery'          // high ceiling, low floor
  | 'calm';          // resistant to fatigue

export interface SwimmerData {
  id: string;
  name: string;
  stats: SwimmerStats;
  level: number;
  xp: number;
  isAlternate: boolean;
  specialty: Specialty;
  personality: Personality;
  nationality: string;
  age: number;
  bio: string;
  skinTone: number;    // 0-5 index for sprite color
  hairColor: number;   // 0-5 index for sprite color
  capColor: number;    // hex color for swim cap
}

let nextId = 1;

const SPECIALTIES: Specialty[] = ['lifts', 'spins', 'figures', 'sculls', 'formations', 'all-rounder'];
const PERSONALITIES: Personality[] = ['perfectionist', 'powerhouse', 'clutch', 'leader', 'creative', 'steady', 'fiery', 'calm'];

const NATIONALITIES = [
  'Japan', 'Spain', 'USA', 'China', 'Russia', 'France', 'Brazil', 'Italy',
  'Mexico', 'South Korea', 'Canada', 'Australia', 'Ukraine', 'Netherlands',
  'Greece', 'Colombia', 'Sweden', 'Egypt', 'New Zealand', 'Germany',
];

const BIOS: Record<Specialty, string[]> = {
  lifts: [
    'Known for explosive power in the pool.',
    'Started as a gymnast before switching to synchro.',
    'Can hold a lift longer than anyone on the team.',
  ],
  spins: [
    'Dizzying spin speed that wows the judges.',
    'Trained in figure skating before taking up swimming.',
    'Once completed a 1080 spin in practice at age 14.',
  ],
  figures: [
    'Textbook form on every figure position.',
    'Studies competition footage obsessively.',
    'Has the cleanest vertical on the team.',
  ],
  sculls: [
    'Glides through the water like it\'s nothing.',
    'Incredible hand technique developed over years.',
    'The engine that drives every formation change.',
  ],
  formations: [
    'Has an innate sense of spacing and timing.',
    'Always in the right place at the right time.',
    'The glue that holds the team\'s patterns together.',
  ],
  'all-rounder': [
    'Solid at everything, a true team player.',
    'Versatile and reliable in any position.',
    'The coach\'s go-to for any routine slot.',
  ],
};

const PERSONALITY_DESCRIPTIONS: Record<Personality, string> = {
  perfectionist: 'Obsesses over every detail of execution.',
  powerhouse: 'Raw strength that shines in lifts and thrusts.',
  clutch: 'Gets better as the routine goes on.',
  leader: 'Lifts the whole team\'s synchronization.',
  creative: 'Brings flair and expression to every move.',
  steady: 'Consistent and reliable, never rattled.',
  fiery: 'Capable of brilliance, but occasionally erratic.',
  calm: 'Cool under pressure, resists fatigue.',
};

const CAP_COLORS = [0xbbe1fa, 0xf0c040, 0xe74c3c, 0x2ecc71, 0x9b59b6, 0xff69b4, 0x00bcd4, 0xff8c00, 0x7b68ee, 0x20b2aa];

export function createSwimmer(name: string, stats: SwimmerStats, isAlternate = false): SwimmerData {
  const specialty = pickRandom(SPECIALTIES);
  const personality = pickRandom(PERSONALITIES);
  const nationality = pickRandom(NATIONALITIES);
  const age = 16 + Math.floor(Math.random() * 12);
  const bios = BIOS[specialty];
  const bio = bios[Math.floor(Math.random() * bios.length)]!;

  return {
    id: `swimmer-${nextId++}`,
    name,
    stats,
    level: 1,
    xp: 0,
    isAlternate,
    specialty,
    personality,
    nationality,
    age,
    bio,
    skinTone: Math.floor(Math.random() * 6),
    hairColor: Math.floor(Math.random() * 6),
    capColor: CAP_COLORS[Math.floor(Math.random() * CAP_COLORS.length)]!,
  };
}

export function personalityDescription(p: Personality): string {
  return PERSONALITY_DESCRIPTIONS[p];
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
