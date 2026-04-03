import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { SaveManager } from '../systems/SaveManager';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    // Title text
    const title = this.add.text(GAME_WIDTH / 2, 160, 'RETRO SYNCHRO', {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#bbe1fa',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, 224, 'Artistic Swimming Manager', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#3282b8',
    });
    subtitle.setOrigin(0.5);

    // Animated water decoration
    this.createWaterDecoration();

    // Menu items
    const hasSave = SaveManager.hasSave();
    const menuItems = hasSave
      ? ['Continue', 'New Game']
      : ['New Game'];

    menuItems.forEach((label, i) => {
      const y = 400 + i * 80;
      const text = this.add.text(GAME_WIDTH / 2, y, label, {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
      text.setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        text.setColor('#f0c040');
      });
      text.on('pointerout', () => {
        text.setColor('#ffffff');
      });
      text.on('pointerdown', () => {
        this.onMenuSelect(label);
      });

      // Entrance tween
      text.setAlpha(0);
      text.y += 40;
      this.tweens.add({
        targets: text,
        alpha: 1,
        y: y,
        duration: 300,
        delay: 200 + i * 100,
        ease: 'Power2',
      });
    });

    // Version
    this.add.text(16, GAME_HEIGHT - 40, 'v0.1.0', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#3282b8',
    });
  }

  private createWaterDecoration(): void {
    const gfx = this.add.graphics();
    this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        gfx.clear();
        gfx.lineStyle(3, COLORS.waterLight, 0.4);
        gfx.beginPath();
        for (let x = 0; x <= GAME_WIDTH; x += 4) {
          const y = GAME_HEIGHT - 80 + Math.sin(x * 0.012 + (tween.getValue() ?? 0)) * 12;
          if (x === 0) gfx.moveTo(x, y);
          else gfx.lineTo(x, y);
        }
        gfx.strokePath();

        gfx.lineStyle(3, COLORS.water, 0.3);
        gfx.beginPath();
        for (let x = 0; x <= GAME_WIDTH; x += 4) {
          const y = GAME_HEIGHT - 56 + Math.sin(x * 0.01 + (tween.getValue() ?? 0) + 1) * 8;
          if (x === 0) gfx.moveTo(x, y);
          else gfx.lineTo(x, y);
        }
        gfx.strokePath();
      },
    });
  }

  private onMenuSelect(label: string): void {
    switch (label) {
      case 'New Game':
        SaveManager.newGame();
        // TODO: transition to ManageScene
        console.log('New game started!', SaveManager.load());
        break;
      case 'Continue':
        // TODO: transition to ManageScene
        console.log('Continue game!', SaveManager.load());
        break;
    }
  }
}
