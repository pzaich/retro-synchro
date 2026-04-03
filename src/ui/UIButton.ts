import Phaser from 'phaser';
import { COLORS } from '../config';

export class UIButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    width = 200,
    height = 40,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this.bg = scene.add.graphics();
    this.drawBg(COLORS.panel, COLORS.panelBorder);
    this.add(this.bg);

    this.label = scene.add.text(width / 2, height / 2, text, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    });
    this.label.setOrigin(0.5);
    this.add(this.label);

    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => {
      this.drawBg(COLORS.panelBorder, COLORS.accent);
      this.label.setColor('#f0c040');
    });
    this.on('pointerout', () => {
      this.drawBg(COLORS.panel, COLORS.panelBorder);
      this.label.setColor('#ffffff');
    });
    this.on('pointerdown', onClick);
  }

  private drawBg(fill: number, stroke: number): void {
    const w = this.width;
    const h = this.height;
    this.bg.clear();
    this.bg.fillStyle(fill);
    this.bg.fillRect(0, 0, w, h);
    this.bg.lineStyle(2, stroke);
    this.bg.strokeRect(0, 0, w, h);
  }
}
