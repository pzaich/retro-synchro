export type ElementCategory =
  | 'position'
  | 'figure'
  | 'scull'
  | 'lift'
  | 'spin'
  | 'formation'
  | 'hybrid';

export type ElementTier = 1 | 2 | 3 | 4 | 5;

export interface ElementData {
  id: string;
  name: string;
  category: ElementCategory;
  tier: ElementTier;
  difficulty: number; // DD value (e.g., 1.4, 2.0, 3.0)
  description: string;
}
