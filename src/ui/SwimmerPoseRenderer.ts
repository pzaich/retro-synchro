import Phaser from 'phaser';
import { SwimmerData } from '../entities/Swimmer';

export type SwimmerPose =
  | 'swimmer-default'
  | 'swimmer-lift'
  | 'swimmer-figure'
  | 'swimmer-vertical'
  | 'swimmer-tuck'
  | 'swimmer-pike'
  | 'swimmer-split'
  | 'swimmer-spin'
  | 'swimmer-scull'
  | 'swimmer-ballet-leg'
  | 'swimmer-arch'
  | 'swimmer-submerged'
  | 'swimmer-throw'
  | 'swimmer-starfish'
  | 'swimmer-flamingo'
  | 'swimmer-somersault';

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
    case 'swimmer-lift':       drawLift(gfx, c); break;
    case 'swimmer-figure':     drawFigure(gfx, c); break;
    case 'swimmer-vertical':   drawVertical(gfx, c); break;
    case 'swimmer-tuck':       drawTuck(gfx, c); break;
    case 'swimmer-pike':       drawPike(gfx, c); break;
    case 'swimmer-split':      drawSplit(gfx, c); break;
    case 'swimmer-spin':       drawSpin(gfx, c); break;
    case 'swimmer-scull':      drawScull(gfx, c); break;
    case 'swimmer-ballet-leg': drawBalletLeg(gfx, c); break;
    case 'swimmer-arch':       drawArch(gfx, c); break;
    case 'swimmer-submerged':  drawSubmerged(gfx, c); break;
    case 'swimmer-throw':      drawThrow(gfx, c); break;
    case 'swimmer-starfish':   drawStarfish(gfx, c); break;
    case 'swimmer-flamingo':   drawFlamingo(gfx, c); break;
    case 'swimmer-somersault': drawSomersault(gfx, c); break;
    default:                   drawDefault(gfx, c); break;
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
  g.fillStyle(c.skin);
  g.fillEllipse(0, 4, 14, 10);
  g.fillRect(-11, 2, 4, 3);
  g.fillRect(7, 2, 4, 3);
  g.fillStyle(c.cap);
  g.fillEllipse(0, 4, 10, 7);
  g.fillStyle(c.skin);
  g.fillRect(-3, 10, 2, 6);
  g.fillRect(1, 10, 2, 6);
  drawHeadWithCap(g, 0, -4, 6, c);
}

function drawLift(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.skin);
  g.fillRect(-18, -3, 36, 4);
  g.fillRect(-2, 0, 4, 14);
  g.fillStyle(c.cap);
  g.fillRect(-5, 1, 10, 10);
  g.fillStyle(c.skin);
  g.fillRect(-3, 14, 2, 6);
  g.fillRect(1, 14, 2, 6);
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
  g.fillRect(-3, 8, 2, 8);
  g.fillRect(1, 8, 2, 8);
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

function drawPike(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.cap);
  g.fillRect(-5, 0, 10, 10);
  g.fillStyle(c.skin);
  g.fillRect(-5, -12, 3, 12);
  g.fillRect(2, -12, 3, 12);
  g.fillRect(-5, -15, 3, 3);
  g.fillRect(2, -15, 3, 3);
  g.fillRect(-9, -2, 4, 2);
  g.fillRect(5, -2, 4, 2);
  drawHeadWithCap(g, 0, -6, 4, c);
}

function drawSplit(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.skin);
  g.fillTriangle(-14, 16, -3, 4, -1, 4);
  g.fillTriangle(14, 16, 3, 4, 1, 4);
  g.fillRect(-16, 14, 3, 3);
  g.fillRect(13, 14, 3, 3);
  g.fillStyle(c.cap);
  g.fillRect(-5, -2, 10, 8);
  g.fillStyle(c.skin);
  g.fillRect(-10, -2, 4, 2);
  g.fillRect(6, -2, 4, 2);
  drawHeadWithCap(g, 0, -7, 5, c);
}

function drawSpin(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.skin, 0.5);
  g.fillEllipse(-3, 4, 12, 8);
  g.fillStyle(c.cap, 0.8);
  g.fillEllipse(0, 3, 10, 7);
  g.fillStyle(c.skin);
  g.fillRect(-3, 9, 2, 5);
  g.fillRect(1, 9, 2, 5);
  drawHeadWithCap(g, 0, -5, 5, c);
  g.fillStyle(0xffffff, 0.7);
  g.fillTriangle(-15, 2, -12, -1, -12, 5);
  g.fillTriangle(15, 2, 12, -1, 12, 5);
}

function drawScull(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.skin);
  g.fillEllipse(0, 4, 11, 22);
  g.fillStyle(c.cap);
  g.fillEllipse(0, 4, 8, 14);
  g.fillStyle(c.skin);
  g.fillRect(-6, 2, 2, 9);
  g.fillRect(4, 2, 2, 9);
  g.fillStyle(0xffffff, 0.35);
  g.fillRect(-10, 18, 20, 1);
  g.fillRect(-8, 20, 16, 1);
  drawHeadWithCap(g, 0, -8, 5, c);
}

function drawBalletLeg(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.skin);
  g.fillRect(-2, -20, 3, 20);
  g.fillRect(-2, -22, 3, 3);
  g.fillEllipse(0, 6, 14, 8);
  g.fillStyle(c.cap);
  g.fillEllipse(0, 6, 10, 6);
  g.fillStyle(c.skin);
  g.fillRect(3, 8, 3, 8);
  g.fillRect(-9, 4, 4, 2);
  g.fillRect(5, 4, 4, 2);
  g.fillStyle(0xffffff, 0.4);
  g.fillEllipse(0, 12, 16, 2);
}

function drawArch(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.lineStyle(7, c.cap);
  g.beginPath();
  g.arc(0, 4, 10, Phaser.Math.DegToRad(-30), Phaser.Math.DegToRad(210));
  g.strokePath();
  drawHeadWithCap(g, 9, -3, 4, c);
  g.fillStyle(c.skin);
  g.fillRect(-12, -5, 3, 3);
  g.fillRect(-13, -1, 3, 3);
}

function drawSubmerged(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(-5, -14, 2);
  g.fillCircle(3, -10, 1.5);
  g.fillCircle(7, -17, 1);
  g.fillCircle(-2, -18, 1);
  g.fillStyle(c.skin, 0.35);
  g.fillEllipse(0, 4, 14, 10);
  g.fillStyle(c.cap, 0.45);
  g.fillEllipse(0, 4, 10, 7);
  g.fillStyle(c.skin, 0.35);
  g.fillRect(-3, 10, 2, 6);
  g.fillRect(1, 10, 2, 6);
  g.fillCircle(0, -4, 5);
  g.fillStyle(c.cap, 0.45);
  g.beginPath();
  g.arc(0, -4, 5, Math.PI, 0, false);
  g.closePath();
  g.fillPath();
}

function drawThrow(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(-8, -16, 1, 6);
  g.fillRect(7, -16, 1, 6);
  g.fillRect(-3, -20, 1, 4);
  g.fillRect(2, -20, 1, 4);
  g.fillStyle(c.skin);
  g.fillTriangle(-9, -16, -5, -4, -2, -4);
  g.fillTriangle(9, -16, 5, -4, 2, -4);
  g.fillStyle(c.cap);
  g.fillRect(-5, -2, 10, 10);
  g.fillStyle(c.skin);
  g.fillRect(-3, 8, 2, 10);
  g.fillRect(1, 8, 2, 10);
  drawHeadWithCap(g, 0, -7, 5, c);
}

function drawStarfish(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.skin);
  g.fillTriangle(-15, -10, -4, -1, -2, -4);
  g.fillTriangle(15, -10, 4, -1, 2, -4);
  g.fillTriangle(-15, 14, -4, 5, -2, 8);
  g.fillTriangle(15, 14, 4, 5, 2, 8);
  g.fillStyle(c.cap);
  g.fillCircle(0, 2, 7);
  drawHeadWithCap(g, 0, -5, 4, c);
}

function drawFlamingo(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.skin);
  g.fillRect(-4, -20, 3, 20);
  g.fillRect(-4, -22, 3, 3);
  g.fillRect(2, -10, 3, 10);
  g.fillRect(2, -12, 7, 3);
  g.fillRect(8, -14, 3, 3);
  g.fillEllipse(0, 6, 12, 8);
  g.fillStyle(c.cap);
  g.fillEllipse(0, 6, 9, 6);
  g.fillStyle(c.skin);
  g.fillRect(-8, 4, 3, 2);
  g.fillRect(5, 4, 3, 2);
  g.fillStyle(0xffffff, 0.4);
  g.fillEllipse(0, 12, 14, 2);
}

function drawSomersault(g: Phaser.GameObjects.Graphics, c: PoseColors): void {
  g.fillStyle(c.cap);
  g.fillCircle(0, 2, 9);
  g.fillStyle(c.skin);
  g.fillCircle(-5, 5, 3);
  g.fillCircle(5, 5, 3);
  g.fillCircle(-6, -4, 4);
  g.fillStyle(c.cap);
  g.beginPath();
  g.arc(-6, -4, 4, Math.PI * 0.5, Math.PI * 1.5, false);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x1a1a2e);
  g.fillRect(-5, -5, 1, 1);
  g.fillStyle(0xffffff, 0.85);
  g.fillTriangle(11, -6, 15, -2, 11, 2);
}
