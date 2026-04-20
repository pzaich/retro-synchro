import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Draw a simple loading bar
    const barW = GAME_WIDTH * 0.6;
    const barH = 6;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.dark);
    bg.fillRect(barX, barY, barW, barH);

    const fill = this.add.graphics();
    this.load.on('progress', (value: number) => {
      fill.clear();
      fill.fillStyle(COLORS.accent);
      fill.fillRect(barX, barY, barW * value, barH);
    });

    // Load swimmer pose sprites
    this.load.image('swimmer-default', 'assets/sprites/swimmer-default.png');
    this.load.image('swimmer-lift', 'assets/sprites/swimmer-lift.png');
    this.load.image('swimmer-figure', 'assets/sprites/swimmer-figure.png');
    this.load.image('swimmer-vertical', 'assets/sprites/swimmer-vertical.png');
    this.load.image('swimmer-tuck', 'assets/sprites/swimmer-tuck.png');

    // Generate placeholder textures instead of loading files
    this.generatePlaceholders();
  }

  create(): void {
    this.scene.start('Title');
  }

  private generatePlaceholders(): void {
    // Swimmer placeholder: 8x8 colored circle
    const swimmerGfx = this.add.graphics();
    swimmerGfx.fillStyle(COLORS.accent);
    swimmerGfx.fillCircle(4, 4, 4);
    swimmerGfx.generateTexture('swimmer', 8, 8);
    swimmerGfx.destroy();

    // Pool tile placeholder
    const poolGfx = this.add.graphics();
    poolGfx.fillStyle(COLORS.water);
    poolGfx.fillRect(0, 0, 16, 16);
    poolGfx.lineStyle(1, COLORS.waterLight, 0.3);
    poolGfx.strokeRect(0, 0, 16, 16);
    poolGfx.generateTexture('pool-tile', 16, 16);
    poolGfx.destroy();
  }
}
