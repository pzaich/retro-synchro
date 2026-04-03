import Phaser from 'phaser';
import { COLORS } from '../config';

export class UIPanel extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    fill = COLORS.panel,
    border = COLORS.panelBorder,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this.bg = scene.add.graphics();
    this.bg.fillStyle(fill);
    this.bg.fillRect(0, 0, width, height);
    this.bg.lineStyle(2, border);
    this.bg.strokeRect(0, 0, width, height);
    this.add(this.bg);

    this.setSize(width, height);
  }
}
