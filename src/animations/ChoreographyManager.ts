import { Position } from './FormationManager';

export type SwimmerPose = 'swimmer-default' | 'swimmer-lift' | 'swimmer-figure' | 'swimmer-vertical' | 'swimmer-tuck';

export interface ChoreographyFrame {
  /** Target positions for each of the 8 swimmers */
  positions: Position[];
  /** Which texture each swimmer should display */
  poses: SwimmerPose[];
}

/** Element IDs that should use the vertical sprite */
const VERTICAL_ELEMENTS = new Set([
  'vertical', 'pencil', 'tower', 'porpoise', 'swordfish-straight',
  'barracuda', 'ballet-leg', 'double-ballet-leg', 'flamingo',
]);

/** Element IDs that should use the tuck sprite */
const TUCK_ELEMENTS = new Set([
  'tub', 'inverted-tuck', 'back-tuck-somersault', 'oyster',
]);

/**
 * Returns choreography (positions + poses) for 8 swimmers
 * based on element category, centered around (cx, cy).
 *
 * Multiple patterns per category keep routines visually varied.
 * The patternIndex picks which variant to use.
 * The optional elementId selects pose variants within a category.
 */
export function getChoreography(
  category: string,
  cx: number,
  cy: number,
  spread: number,
  patternIndex: number,
  elementId?: string,
): ChoreographyFrame {
  let frame: ChoreographyFrame;
  switch (category) {
    case 'lift':
      frame = liftChoreography(cx, cy, spread, patternIndex);
      break;
    case 'figure':
      frame = figureChoreography(cx, cy, spread, patternIndex);
      break;
    case 'spin':
      frame = spinChoreography(cx, cy, spread, patternIndex);
      break;
    case 'scull':
      frame = scullChoreography(cx, cy, spread, patternIndex);
      break;
    case 'formation':
      frame = formationChoreography(cx, cy, spread, patternIndex);
      break;
    case 'hybrid':
      frame = hybridChoreography(cx, cy, spread, patternIndex);
      frame = {
        positions: frame.positions,
        poses: frame.poses.map(() => 'swimmer-vertical'),
      };
      break;
    default: // position
      frame = positionChoreography(cx, cy, spread, patternIndex);
      break;
  }

  // Override poses for elements that use specific sprites
  if (elementId && VERTICAL_ELEMENTS.has(elementId)) {
    frame = {
      positions: frame.positions,
      poses: frame.poses.map(p => p === 'swimmer-default' || p === 'swimmer-figure' ? 'swimmer-vertical' : p),
    };
  } else if (elementId && TUCK_ELEMENTS.has(elementId)) {
    frame = {
      positions: frame.positions,
      poses: frame.poses.map(p => p === 'swimmer-default' || p === 'swimmer-figure' ? 'swimmer-tuck' : p),
    };
  }

  return frame;
}

// ── Lift choreography ──────────────────────────────────
// Real synchro lifts: 1-2 flyers elevated above bases.
// Bases cluster tightly underneath to provide support platform.

function liftChoreography(cx: number, cy: number, s: number, idx: number): ChoreographyFrame {
  const patterns: (() => ChoreographyFrame)[] = [
    // Pattern 0: Solo lift — one flyer centered, 7 bases in tight horseshoe
    () => ({
      positions: [
        { x: cx, y: cy - s * 0.6 },            // flyer — centered, elevated
        { x: cx - s * 0.4, y: cy + s * 0.1 },  // base front-left
        { x: cx + s * 0.4, y: cy + s * 0.1 },  // base front-right
        { x: cx - s * 0.6, y: cy + s * 0.5 },  // base mid-left
        { x: cx + s * 0.6, y: cy + s * 0.5 },  // base mid-right
        { x: cx - s * 0.3, y: cy + s * 0.7 },  // base rear-left
        { x: cx + s * 0.3, y: cy + s * 0.7 },  // base rear-right
        { x: cx, y: cy + s * 0.9 },             // base rear-center
      ],
      poses: [
        'swimmer-lift',    // flyer
        'swimmer-default', 'swimmer-default',
        'swimmer-default', 'swimmer-default',
        'swimmer-default', 'swimmer-default',
        'swimmer-default',
      ],
    }),

    // Pattern 1: Pair lift — two flyers, 6 bases in support wedge
    () => ({
      positions: [
        { x: cx - s * 0.35, y: cy - s * 0.6 }, // flyer left
        { x: cx + s * 0.35, y: cy - s * 0.6 }, // flyer right
        { x: cx - s * 0.5, y: cy + s * 0.1 },  // base front-left
        { x: cx + s * 0.5, y: cy + s * 0.1 },  // base front-right
        { x: cx, y: cy + s * 0.2 },             // base front-center
        { x: cx - s * 0.4, y: cy + s * 0.6 },  // base rear-left
        { x: cx + s * 0.4, y: cy + s * 0.6 },  // base rear-right
        { x: cx, y: cy + s * 0.8 },             // base rear-center
      ],
      poses: [
        'swimmer-lift', 'swimmer-lift',          // two flyers
        'swimmer-default', 'swimmer-default',
        'swimmer-default', 'swimmer-default',
        'swimmer-default', 'swimmer-default',
      ],
    }),

    // Pattern 2: Platform lift — one flyer, bases in tight 2-3-2 grid
    () => ({
      positions: [
        { x: cx, y: cy - s * 0.8 },             // flyer — high center
        { x: cx - s * 0.35, y: cy - s * 0.1 },  // top-left platform
        { x: cx + s * 0.35, y: cy - s * 0.1 },  // top-right platform
        { x: cx - s * 0.5, y: cy + s * 0.3 },   // mid-left
        { x: cx, y: cy + s * 0.3 },              // mid-center
        { x: cx + s * 0.5, y: cy + s * 0.3 },   // mid-right
        { x: cx - s * 0.25, y: cy + s * 0.65 },  // bottom-left
        { x: cx + s * 0.25, y: cy + s * 0.65 },  // bottom-right
      ],
      poses: [
        'swimmer-lift',
        'swimmer-default', 'swimmer-default',
        'swimmer-default', 'swimmer-default', 'swimmer-default',
        'swimmer-default', 'swimmer-default',
      ],
    }),

    // Pattern 3: Tower lift — one flyer top, one secondary elevated, 6 bases
    () => ({
      positions: [
        { x: cx, y: cy - s * 0.9 },             // top flyer
        { x: cx, y: cy - s * 0.3 },             // secondary lifter
        { x: cx - s * 0.5, y: cy + s * 0.15 },
        { x: cx + s * 0.5, y: cy + s * 0.15 },
        { x: cx - s * 0.3, y: cy + s * 0.5 },
        { x: cx + s * 0.3, y: cy + s * 0.5 },
        { x: cx - s * 0.15, y: cy + s * 0.8 },
        { x: cx + s * 0.15, y: cy + s * 0.8 },
      ],
      poses: [
        'swimmer-lift', 'swimmer-lift',
        'swimmer-default', 'swimmer-default',
        'swimmer-default', 'swimmer-default',
        'swimmer-default', 'swimmer-default',
      ],
    }),
  ];

  return patterns[idx % patterns.length]!();
}

// ── Figure choreography ────────────────────────────────
// Figures are individual technical elements (somersaults, walkouts, barracudas).
// Swimmers spread out so judges can see each one clearly.

function figureChoreography(cx: number, cy: number, s: number, idx: number): ChoreographyFrame {
  const allFigure: SwimmerPose[] = Array(8).fill('swimmer-figure');

  const patterns: (() => ChoreographyFrame)[] = [
    // Pattern 0: Staggered 2-row grid — classic judging layout
    () => ({
      positions: [
        { x: cx - s * 1.2, y: cy - s * 0.4 },
        { x: cx - s * 0.4, y: cy - s * 0.4 },
        { x: cx + s * 0.4, y: cy - s * 0.4 },
        { x: cx + s * 1.2, y: cy - s * 0.4 },
        { x: cx - s * 0.8, y: cy + s * 0.5 },
        { x: cx, y: cy + s * 0.5 },
        { x: cx + s * 0.8, y: cy + s * 0.5 },
        { x: cx + s * 1.5, y: cy + s * 0.5 },
      ],
      poses: allFigure,
    }),

    // Pattern 1: Chevron — V shape facing judges
    () => ({
      positions: [
        { x: cx, y: cy - s * 0.7 },             // point
        { x: cx - s * 0.5, y: cy - s * 0.3 },
        { x: cx + s * 0.5, y: cy - s * 0.3 },
        { x: cx - s * 1.0, y: cy + s * 0.1 },
        { x: cx + s * 1.0, y: cy + s * 0.1 },
        { x: cx - s * 1.4, y: cy + s * 0.5 },
        { x: cx + s * 1.4, y: cy + s * 0.5 },
        { x: cx, y: cy + s * 0.8 },             // tail center
      ],
      poses: allFigure,
    }),

    // Pattern 2: Wide arc — semicircle for dramatic presentation
    () => {
      const positions: Position[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = Math.PI * 0.15 + (i / 7) * Math.PI * 0.7;
        positions.push({
          x: cx + Math.cos(angle) * s * 1.5,
          y: cy + Math.sin(angle) * s * 0.8,
        });
      }
      return { positions, poses: allFigure };
    },
  ];

  return patterns[idx % patterns.length]!();
}

// ── Spin choreography ──────────────────────────────────
// Spins: swimmers rotate in place. Formations emphasize circular/radial patterns.

function spinChoreography(cx: number, cy: number, s: number, idx: number): ChoreographyFrame {
  const allDefault: SwimmerPose[] = Array(8).fill('swimmer-default');

  const patterns: (() => ChoreographyFrame)[] = [
    // Pattern 0: Pinwheel — circle formation, natural for spinning
    () => {
      const positions: Position[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        positions.push({
          x: cx + Math.cos(angle) * s,
          y: cy + Math.sin(angle) * s,
        });
      }
      return { positions, poses: allDefault };
    },

    // Pattern 1: Paired spins — 4 pairs spread across pool
    () => ({
      positions: [
        { x: cx - s * 1.0, y: cy - s * 0.6 },
        { x: cx - s * 0.7, y: cy - s * 0.6 },
        { x: cx + s * 0.7, y: cy - s * 0.6 },
        { x: cx + s * 1.0, y: cy - s * 0.6 },
        { x: cx - s * 1.0, y: cy + s * 0.5 },
        { x: cx - s * 0.7, y: cy + s * 0.5 },
        { x: cx + s * 0.7, y: cy + s * 0.5 },
        { x: cx + s * 1.0, y: cy + s * 0.5 },
      ],
      poses: allDefault,
    }),

    // Pattern 2: Concentric rings — inner 4 + outer 4
    () => {
      const positions: Position[] = [];
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
        positions.push({
          x: cx + Math.cos(angle) * s * 0.45,
          y: cy + Math.sin(angle) * s * 0.45,
        });
      }
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 4;
        positions.push({
          x: cx + Math.cos(angle) * s * 1.2,
          y: cy + Math.sin(angle) * s * 1.2,
        });
      }
      return { positions, poses: allDefault };
    },
  ];

  return patterns[idx % patterns.length]!();
}

// ── Scull choreography ─────────────────────────────────
// Sculling is about propulsion and travel. Parallel lanes and diagonal travel.

function scullChoreography(cx: number, cy: number, s: number, idx: number): ChoreographyFrame {
  const allDefault: SwimmerPose[] = Array(8).fill('swimmer-default');

  const patterns: (() => ChoreographyFrame)[] = [
    // Pattern 0: Two parallel lines of 4 — classic synchro travel
    () => ({
      positions: [
        { x: cx - s * 1.2, y: cy - s * 0.35 },
        { x: cx - s * 0.4, y: cy - s * 0.35 },
        { x: cx + s * 0.4, y: cy - s * 0.35 },
        { x: cx + s * 1.2, y: cy - s * 0.35 },
        { x: cx - s * 1.2, y: cy + s * 0.35 },
        { x: cx - s * 0.4, y: cy + s * 0.35 },
        { x: cx + s * 0.4, y: cy + s * 0.35 },
        { x: cx + s * 1.2, y: cy + s * 0.35 },
      ],
      poses: allDefault,
    }),

    // Pattern 1: Diagonal travel line — all 8 in a tilted row
    () => {
      const positions: Position[] = [];
      const angle = Math.PI / 5; // ~36 degree tilt
      for (let i = 0; i < 8; i++) {
        const offset = -s * 1.2 + i * (s * 2.4 / 7);
        positions.push({
          x: cx + Math.cos(angle) * offset,
          y: cy + Math.sin(angle) * offset,
        });
      }
      return { positions, poses: allDefault };
    },

    // Pattern 2: Arrowhead — travel in wedge formation
    () => ({
      positions: [
        { x: cx, y: cy - s * 0.8 },             // lead
        { x: cx - s * 0.4, y: cy - s * 0.35 },
        { x: cx + s * 0.4, y: cy - s * 0.35 },
        { x: cx - s * 0.8, y: cy + s * 0.1 },
        { x: cx + s * 0.8, y: cy + s * 0.1 },
        { x: cx - s * 1.1, y: cy + s * 0.55 },
        { x: cx + s * 1.1, y: cy + s * 0.55 },
        { x: cx, y: cy + s * 0.8 },              // tail
      ],
      poses: allDefault,
    }),
  ];

  return patterns[idx % patterns.length]!();
}

// ── Formation choreography ─────────────────────────────
// Formations are about the pattern itself — expanding, contracting, morphing.
// These provide the "target" shape that swimmers snap into.

function formationChoreography(cx: number, cy: number, s: number, idx: number): ChoreographyFrame {
  const allDefault: SwimmerPose[] = Array(8).fill('swimmer-default');

  const patterns: (() => ChoreographyFrame)[] = [
    // Pattern 0: Star burst — 8-pointed star
    () => {
      const positions: Position[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = i % 2 === 0 ? s * 1.3 : s * 0.6;
        positions.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        });
      }
      return { positions, poses: allDefault };
    },

    // Pattern 1: Cross/plus — 2 perpendicular lines of 4
    () => ({
      positions: [
        { x: cx, y: cy - s * 1.1 },        // top
        { x: cx, y: cy - s * 0.35 },       // top-inner
        { x: cx, y: cy + s * 0.35 },       // bottom-inner
        { x: cx, y: cy + s * 1.1 },        // bottom
        { x: cx - s * 1.1, y: cy },        // left
        { x: cx - s * 0.35, y: cy },       // left-inner
        { x: cx + s * 0.35, y: cy },       // right-inner
        { x: cx + s * 1.1, y: cy },        // right
      ],
      poses: allDefault,
    }),

    // Pattern 2: Square block — compact 2x4 grid
    () => ({
      positions: [
        { x: cx - s * 0.9, y: cy - s * 0.4 },
        { x: cx - s * 0.3, y: cy - s * 0.4 },
        { x: cx + s * 0.3, y: cy - s * 0.4 },
        { x: cx + s * 0.9, y: cy - s * 0.4 },
        { x: cx - s * 0.9, y: cy + s * 0.4 },
        { x: cx - s * 0.3, y: cy + s * 0.4 },
        { x: cx + s * 0.3, y: cy + s * 0.4 },
        { x: cx + s * 0.9, y: cy + s * 0.4 },
      ],
      poses: allDefault,
    }),

    // Pattern 3: Triangle — 1-2-2-3 rows
    () => ({
      positions: [
        { x: cx, y: cy - s * 0.9 },                 // apex
        { x: cx - s * 0.5, y: cy - s * 0.25 },
        { x: cx + s * 0.5, y: cy - s * 0.25 },
        { x: cx - s * 0.5, y: cy + s * 0.25 },
        { x: cx + s * 0.5, y: cy + s * 0.25 },
        { x: cx - s * 1.0, y: cy + s * 0.75 },
        { x: cx, y: cy + s * 0.75 },
        { x: cx + s * 1.0, y: cy + s * 0.75 },
      ],
      poses: allDefault,
    }),
  ];

  return patterns[idx % patterns.length]!();
}

// ── Position choreography ──────────────────────────────
// Positions are static holds — swimmers spread out elegantly so each is visible.

function positionChoreography(cx: number, cy: number, s: number, idx: number): ChoreographyFrame {
  const allDefault: SwimmerPose[] = Array(8).fill('swimmer-default');

  const patterns: (() => ChoreographyFrame)[] = [
    // Pattern 0: Showcase spread — staggered 3-2-3 rows
    () => ({
      positions: [
        { x: cx - s * 1.0, y: cy - s * 0.6 },
        { x: cx, y: cy - s * 0.6 },
        { x: cx + s * 1.0, y: cy - s * 0.6 },
        { x: cx - s * 0.5, y: cy },
        { x: cx + s * 0.5, y: cy },
        { x: cx - s * 1.0, y: cy + s * 0.6 },
        { x: cx, y: cy + s * 0.6 },
        { x: cx + s * 1.0, y: cy + s * 0.6 },
      ],
      poses: allDefault,
    }),

    // Pattern 1: Mirror line — two mirrored rows facing each other
    () => ({
      positions: [
        { x: cx - s * 1.2, y: cy - s * 0.45 },
        { x: cx - s * 0.4, y: cy - s * 0.45 },
        { x: cx + s * 0.4, y: cy - s * 0.45 },
        { x: cx + s * 1.2, y: cy - s * 0.45 },
        { x: cx - s * 1.2, y: cy + s * 0.45 },
        { x: cx - s * 0.4, y: cy + s * 0.45 },
        { x: cx + s * 0.4, y: cy + s * 0.45 },
        { x: cx + s * 1.2, y: cy + s * 0.45 },
      ],
      poses: allDefault,
    }),

    // Pattern 2: Scattered elegant — organic-looking spread
    () => ({
      positions: [
        { x: cx - s * 0.9, y: cy - s * 0.7 },
        { x: cx + s * 0.3, y: cy - s * 0.8 },
        { x: cx + s * 1.2, y: cy - s * 0.3 },
        { x: cx - s * 1.3, y: cy - s * 0.1 },
        { x: cx + s * 0.6, y: cy + s * 0.1 },
        { x: cx - s * 0.5, y: cy + s * 0.5 },
        { x: cx + s * 1.1, y: cy + s * 0.6 },
        { x: cx - s * 0.1, y: cy + s * 0.9 },
      ],
      poses: allDefault,
    }),
  ];

  return patterns[idx % patterns.length]!();
}

// ── Hybrid choreography ────────────────────────────────
// Hybrids mix categories — use a combination of poses.

function hybridChoreography(cx: number, cy: number, s: number, idx: number): ChoreographyFrame {
  const patterns: (() => ChoreographyFrame)[] = [
    // Pattern 0: Mixed action — 2 figures in front, 1 lift in back, rest default
    () => ({
      positions: [
        { x: cx - s * 0.5, y: cy - s * 0.7 },   // figure performer
        { x: cx + s * 0.5, y: cy - s * 0.7 },   // figure performer
        { x: cx, y: cy - s * 0.1 },              // lifter
        { x: cx - s * 0.8, y: cy + s * 0.2 },
        { x: cx + s * 0.8, y: cy + s * 0.2 },
        { x: cx - s * 0.4, y: cy + s * 0.6 },
        { x: cx + s * 0.4, y: cy + s * 0.6 },
        { x: cx, y: cy + s * 0.9 },
      ],
      poses: [
        'swimmer-figure', 'swimmer-figure',
        'swimmer-lift',
        'swimmer-default', 'swimmer-default',
        'swimmer-default', 'swimmer-default',
        'swimmer-default',
      ],
    }),

    // Pattern 1: Cascade — staggered action across the pool
    () => ({
      positions: [
        { x: cx - s * 1.3, y: cy - s * 0.3 },
        { x: cx - s * 0.8, y: cy - s * 0.5 },
        { x: cx - s * 0.3, y: cy - s * 0.3 },
        { x: cx + s * 0.2, y: cy - s * 0.5 },
        { x: cx + s * 0.7, y: cy - s * 0.3 },
        { x: cx + s * 1.2, y: cy - s * 0.5 },
        { x: cx - s * 0.5, y: cy + s * 0.5 },
        { x: cx + s * 0.5, y: cy + s * 0.5 },
      ],
      poses: [
        'swimmer-figure', 'swimmer-default',
        'swimmer-figure', 'swimmer-default',
        'swimmer-figure', 'swimmer-default',
        'swimmer-lift', 'swimmer-lift',
      ],
    }),
  ];

  return patterns[idx % patterns.length]!();
}
