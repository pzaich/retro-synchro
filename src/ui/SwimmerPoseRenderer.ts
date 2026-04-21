import Phaser from 'phaser';
import { SwimmerData } from '../entities/Swimmer';

export type SwimmerPose =
  | 'swimmer-default'
  | 'swimmer-lift'
  | 'swimmer-figure'
  | 'swimmer-vertical'
  | 'swimmer-tuck';

const SKIN_TONES = [0xffe0bd, 0xf1c27d, 0xd4a76a, 0xc68642, 0x8d5524, 0x5c3a1e];
const HAIR_COLORS = [0x2c1b18, 0x4a2912, 0x8b6914, 0xd4a017, 0xc0392b, 0x1a1a2e];

interface PoseColors {
  skin: number;
  hair: number;
  cap: number;
}

function resolveColors(swimmer: SwimmerData): PoseColors {
  return {
    skin: SKIN_TONES[swimmer.skinTone] ?? SKIN_TONES[0]!,
    hair: HAIR_COLORS[swimmer.hairColor] ?? HAIR_COLORS[0]!,
    cap: swimmer.capColor,
  };
}

export function drawSwimmerPose(
  gfx: Phaser.GameObjects.Graphics,
  pose: SwimmerPose,
  swimmer: SwimmerData,
): void {
  gfx.clear();
  const c = resolveColors(swimmer);
  switch (pose) {
    case 'swimmer-lift':     drawLift(gfx, c); break;
    case 'swimmer-figure':   drawFigure(gfx, c); break;
    case 'swimmer-vertical': drawVertical(gfx, c); break;
    case 'swimmer-tuck':     drawTuck(gfx, c); break;
    default:                 drawDefault(gfx, c); break;
  }
}

function drawHeadWithCap(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, c: PoseColors): void {
  g.fillStyle(c.skin);
  g.fillCircle(cx, cy, r);
  g.fillStyle(c.hair);
  g.fillRect(cx - r, cy - 1, 2, 3);
  g.fillRect(cx + r - 2, cy - 1, 2, 3);
  g.fillStyle(c.cap);
  g.beginPath();
  g.arc(cx, cy, r, Math.PI, 0, false);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x1a1a2e);
  g.fillRect(cx - 2, cy, 1, 1);
  g.fillRect(cx + 1, cy, 1, 1);
}

function drawDefault(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  // Top-down floating pose
  g.fillStyle(c.skin);
  g.fillEllipse(0, 4, 14, 10);
  g.fillRect(-11, 2, 4, 3);
  g.fillRect(7, 2, 4, 3);
  g.fillStyle(c.cap);
  g.fillEllipse(0, 4, 10, 7);
  g.fillStyle(c.skin);
  g.fillRect(-3, 10, 6, 6);
  drawHeadWithCap(g, 0, -4, 6, c);
}

function drawLift(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.lineStyle(1, 0xbbe1fa, 0.35);
  g.strokeCircle(0, 10, 18);
  g.fillStyle(c.skin);
  g.fillRect(-18, -3, 36, 4);
  g.fillRect(-2, 0, 4, 14);
  g.fillStyle(c.cap);
  g.fillRect(-5, 1, 10, 10);
  g.fillStyle(c.skin);
  g.fillRect(-3, 14, 6, 6);
  drawHeadWithCap(g, 0, -6, 5, c);
}

function drawFigure(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.skin);
  g.fillRect(-6, -16, 3, 10);
  g.fillRect(3, -16, 3, 10);
  g.fillRect(-6, -18, 4, 4);
  g.fillRect(2, -18, 4, 4);
  g.fillStyle(c.cap);
  g.fillRect(-5, -4, 10, 12);
  g.fillStyle(c.skin);
  g.fillRect(-3, 8, 6, 8);
  drawHeadWithCap(g, 0, -8, 5, c);
}

function drawVertical(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.skin);
  g.fillRect(-4, -18, 3, 6);
  g.fillRect(1, -18, 3, 6);
  g.fillRect(-4, -12, 3, 10);
  g.fillRect(1, -12, 3, 10);
  g.fillStyle(c.cap);
  g.fillRect(-5, -3, 10, 7);
  g.fillStyle(0x3282b8, 0.7);
  g.fillEllipse(0, 6, 26, 6);
  g.fillStyle(0xffffff, 0.5);
  g.fillEllipse(0, 6, 20, 3);
}

function drawTuck(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.cap);
  g.fillCircle(0, 2, 10);
  g.fillStyle(c.skin);
  g.fillCircle(-5, 6, 4);
  g.fillCircle(5, 6, 4);
  g.fillRect(-8, 0, 3, 6);
  g.fillRect(5, 0, 3, 6);
  drawHeadWithCap(g, 0, -8, 5, c);
}
