export interface Position {
  x: number;
  y: number;
}

/**
 * Returns target positions for 8 swimmers in a given formation,
 * centered around (cx, cy) with the given radius/spread.
 */
export function getFormationPositions(
  formationId: string,
  cx: number,
  cy: number,
  spread: number,
): Position[] {
  switch (formationId) {
    case 'circle':
      return circleFormation(cx, cy, spread);
    case 'straight-line':
      return lineFormation(cx, cy, spread, 0);
    case 'diagonal-line':
      return lineFormation(cx, cy, spread, Math.PI / 6);
    case 'v-formation':
      return vFormation(cx, cy, spread);
    case 'diamond':
      return diamondFormation(cx, cy, spread);
    default:
      return lineFormation(cx, cy, spread, 0);
  }
}

function circleFormation(cx: number, cy: number, r: number): Position[] {
  const positions: Position[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    positions.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }
  return positions;
}

function lineFormation(cx: number, cy: number, spread: number, angle: number): Position[] {
  const positions: Position[] = [];
  const totalWidth = spread * 2;
  const spacing = totalWidth / 7;
  for (let i = 0; i < 8; i++) {
    const offset = -spread + i * spacing;
    positions.push({
      x: cx + Math.cos(angle) * offset,
      y: cy + Math.sin(angle) * offset,
    });
  }
  return positions;
}

function vFormation(cx: number, cy: number, spread: number): Position[] {
  const positions: Position[] = [];
  // V shape: leader at front, wings spreading back
  for (let i = 0; i < 8; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const depth = Math.floor(i / 2);
    positions.push({
      x: cx + side * (depth + 1) * spread * 0.35,
      y: cy - spread * 0.6 + depth * spread * 0.35,
    });
  }
  return positions;
}

function diamondFormation(cx: number, cy: number, spread: number): Position[] {
  // Diamond with 8 points: top, 2 upper-mid, 2 mid, 2 lower-mid, bottom
  const s = spread * 0.5;
  return [
    { x: cx, y: cy - s * 2 },         // top
    { x: cx - s, y: cy - s },         // upper left
    { x: cx + s, y: cy - s },         // upper right
    { x: cx - s * 1.5, y: cy },       // mid left
    { x: cx + s * 1.5, y: cy },       // mid right
    { x: cx - s, y: cy + s },         // lower left
    { x: cx + s, y: cy + s },         // lower right
    { x: cx, y: cy + s * 2 },         // bottom
  ];
}
