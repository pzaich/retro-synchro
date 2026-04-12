import Phaser from 'phaser';
import { SwimmerData } from '../entities/Swimmer';

const SKIN_TONES = [0xffe0bd, 0xf1c27d, 0xd4a76a, 0xc68642, 0x8d5524, 0x5c3a1e];
const HAIR_COLORS = [0x2c1b18, 0x4a2912, 0x8b6914, 0xd4a017, 0xc0392b, 0x1a1a2e];

/**
 * Draws a small pixel-art swimmer portrait at the given position.
 * Returns the container so it can be positioned/destroyed.
 */
export function createSwimmerPortrait(
  scene: Phaser.Scene,
  x: number,
  y: number,
  swimmer: SwimmerData,
  size: 'small' | 'large' = 'small',
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const gfx = scene.add.graphics();
  container.add(gfx);

  const skin = SKIN_TONES[swimmer.skinTone] ?? SKIN_TONES[0]!;
  const hair = HAIR_COLORS[swimmer.hairColor] ?? HAIR_COLORS[0]!;
  const cap = swimmer.capColor;

  if (size === 'large') {
    drawLargePortrait(gfx, skin, hair, cap);
  } else {
    drawSmallPortrait(gfx, skin, hair, cap);
  }

  return container;
}

function drawSmallPortrait(gfx: Phaser.GameObjects.Graphics, skin: number, _hair: number, cap: number): void {
  // Body (swimsuit) - 8x6
  gfx.fillStyle(cap);
  gfx.fillRect(-4, 2, 8, 6);

  // Head - 6x6
  gfx.fillStyle(skin);
  gfx.fillCircle(0, -2, 4);

  // Swim cap
  gfx.fillStyle(cap);
  gfx.fillRect(-4, -6, 8, 4);
  gfx.fillCircle(0, -5, 3);

  // Eyes
  gfx.fillStyle(0x1a1a2e);
  gfx.fillRect(-2, -3, 1, 1);
  gfx.fillRect(1, -3, 1, 1);
}

function drawLargePortrait(gfx: Phaser.GameObjects.Graphics, skin: number, hair: number, cap: number): void {
  // Body / swimsuit
  gfx.fillStyle(cap, 0.9);
  gfx.fillRect(-20, 16, 40, 36);
  // Shoulders
  gfx.fillRect(-28, 16, 56, 10);

  // Neck
  gfx.fillStyle(skin);
  gfx.fillRect(-6, 8, 12, 10);

  // Head
  gfx.fillStyle(skin);
  gfx.fillCircle(0, -4, 22);

  // Swim cap
  gfx.fillStyle(cap);
  gfx.beginPath();
  gfx.arc(0, -8, 22, Math.PI, 0, false);
  gfx.closePath();
  gfx.fillPath();

  // Hair peeking out
  gfx.fillStyle(hair);
  gfx.fillRect(-20, -2, 4, 8);
  gfx.fillRect(16, -2, 4, 8);

  // Eyes
  gfx.fillStyle(0xffffff);
  gfx.fillCircle(-8, -4, 5);
  gfx.fillCircle(8, -4, 5);
  gfx.fillStyle(0x1a1a2e);
  gfx.fillCircle(-7, -3, 3);
  gfx.fillCircle(9, -3, 3);
  // Highlights
  gfx.fillStyle(0xffffff);
  gfx.fillCircle(-6, -5, 1);
  gfx.fillCircle(10, -5, 1);

  // Mouth
  gfx.fillStyle(0xd4726a);
  gfx.fillRect(-4, 8, 8, 2);

  // Nose
  gfx.fillStyle(skin, 0.7);
  gfx.fillRect(-1, 2, 3, 4);

  // Goggles strap hint
  gfx.lineStyle(1, cap, 0.4);
  gfx.lineBetween(-22, -6, -14, -6);
  gfx.lineBetween(14, -6, 22, -6);
}

/**
 * Draws a small competition swimmer dot with cap color.
 */
export function createCompetitionSwimmer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  swimmer: SwimmerData,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const gfx = scene.add.graphics();

  const skin = SKIN_TONES[swimmer.skinTone] ?? SKIN_TONES[0]!;

  // Body in water (oval)
  gfx.fillStyle(skin);
  gfx.fillEllipse(0, 2, 10, 6);

  // Head
  gfx.fillStyle(skin);
  gfx.fillCircle(0, -3, 5);

  // Swim cap
  gfx.fillStyle(swimmer.capColor);
  gfx.beginPath();
  gfx.arc(0, -4, 5, Math.PI, 0, false);
  gfx.closePath();
  gfx.fillPath();

  // Arms
  gfx.fillStyle(skin);
  gfx.fillRect(-8, 0, 4, 2);
  gfx.fillRect(4, 0, 4, 2);

  container.add(gfx);
  return container;
}
