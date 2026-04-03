import Phaser from 'phaser';
import { COLORS, MAX_SWIMMER_STAT } from '../config';

export class StatBar extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    value: number,
    barWidth = 120,
    barHeight = 12,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    // Label
    const text = scene.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#bbe1fa',
    });
    text.setOrigin(0, 0.5);
    this.add(text);

    // Value text
    const valText = scene.add.text(barWidth + 100, 0, `${value}/${MAX_SWIMMER_STAT}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    valText.setOrigin(0, 0.5);
    this.add(valText);

    // Bar background
    const barX = 90;
    const gfx = scene.add.graphics();
    gfx.fillStyle(COLORS.dark);
    gfx.fillRect(barX, -barHeight / 2, barWidth, barHeight);

    // Bar fill
    const fillWidth = (value / MAX_SWIMMER_STAT) * barWidth;
    const color = value >= 7 ? COLORS.green : value >= 4 ? COLORS.gold : COLORS.red;
    gfx.fillStyle(color);
    gfx.fillRect(barX, -barHeight / 2, fillWidth, barHeight);

    // Bar border
    gfx.lineStyle(1, COLORS.panelBorder);
    gfx.strokeRect(barX, -barHeight / 2, barWidth, barHeight);

    this.add(gfx);
  }
}
