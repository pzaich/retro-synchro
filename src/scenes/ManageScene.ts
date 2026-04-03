import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../systems/GameState';
import { SwimmerData } from '../entities/Swimmer';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';

export class ManageScene extends Phaser.Scene {
  constructor() {
    super('Manage');
  }

  create(): void {
    const state = GameState.getInstance().get();

    // Header
    this.add.text(GAME_WIDTH / 2, 30, state.team.name, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#bbe1fa',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 62, `Coach Level ${state.coachLevel}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#3282b8',
    }).setOrigin(0.5);

    // Roster panel
    const panelX = 40;
    const panelY = 90;
    const panelW = GAME_WIDTH - 80;
    const panelH = 500;
    new UIPanel(this, panelX, panelY, panelW, panelH);

    // Section headers
    this.add.text(panelX + 20, panelY + 12, 'ROSTER', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    // Column headers
    const colY = panelY + 44;
    const cols = { name: panelX + 20, art: panelX + 320, ath: panelX + 440, end: panelX + 560, lvl: panelX + 680 };
    this.add.text(cols.name, colY, 'NAME', { fontFamily: 'monospace', fontSize: '13px', color: '#3282b8' });
    this.add.text(cols.art, colY, 'ART', { fontFamily: 'monospace', fontSize: '13px', color: '#3282b8' });
    this.add.text(cols.ath, colY, 'ATH', { fontFamily: 'monospace', fontSize: '13px', color: '#3282b8' });
    this.add.text(cols.end, colY, 'END', { fontFamily: 'monospace', fontSize: '13px', color: '#3282b8' });
    this.add.text(cols.lvl, colY, 'LVL', { fontFamily: 'monospace', fontSize: '13px', color: '#3282b8' });

    // Divider line
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, COLORS.panelBorder, 0.5);
    divGfx.lineBetween(panelX + 10, colY + 20, panelX + panelW - 10, colY + 20);

    // Swimmer rows
    const active = state.team.swimmers.filter(s => !s.isAlternate);
    const alternates = state.team.swimmers.filter(s => s.isAlternate);

    let rowY = colY + 32;
    active.forEach((swimmer) => {
      this.createSwimmerRow(swimmer, cols, rowY, false);
      rowY += 36;
    });

    // Alternates divider
    rowY += 8;
    divGfx.lineStyle(1, COLORS.panelBorder, 0.3);
    divGfx.lineBetween(panelX + 10, rowY, panelX + panelW - 10, rowY);
    rowY += 8;

    this.add.text(panelX + 20, rowY, 'ALTERNATES', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#3282b8',
      fontStyle: 'bold',
    });
    rowY += 24;

    alternates.forEach((swimmer) => {
      this.createSwimmerRow(swimmer, cols, rowY, true);
      rowY += 36;
    });

    // Bottom navigation buttons
    const btnY = GAME_HEIGHT - 70;
    new UIButton(this, GAME_WIDTH / 2 - 320, btnY, 'Edit Routine', () => {
      this.scene.start('RoutineEditor');
    }, 200, 44);

    new UIButton(this, GAME_WIDTH / 2 - 100, btnY, 'Season', () => {
      // TODO: SeasonScene
      console.log('Season');
    }, 200, 44);

    new UIButton(this, GAME_WIDTH / 2 + 120, btnY, 'Compete', () => {
      this.scene.start('Competition');
    }, 200, 44);
  }

  private createSwimmerRow(
    swimmer: SwimmerData,
    cols: { name: number; art: number; ath: number; end: number; lvl: number },
    y: number,
    isAlternate: boolean,
  ): void {
    const nameColor = isAlternate ? '#888888' : '#ffffff';

    // Swimmer icon (small colored circle)
    const icon = this.add.graphics();
    const iconColor = isAlternate ? 0x555555 : COLORS.accent;
    icon.fillStyle(iconColor);
    icon.fillCircle(cols.name - 2, y + 8, 6);

    // Name (clickable)
    const nameText = this.add.text(cols.name + 14, y, swimmer.name, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: nameColor,
    });
    nameText.setInteractive({ useHandCursor: true });
    nameText.on('pointerover', () => nameText.setColor('#f0c040'));
    nameText.on('pointerout', () => nameText.setColor(nameColor));
    nameText.on('pointerdown', () => {
      this.scene.start('SwimmerDetail', { swimmerId: swimmer.id });
    });

    // Stat mini-bars
    this.createMiniBar(cols.art, y + 2, swimmer.stats.artistry);
    this.createMiniBar(cols.ath, y + 2, swimmer.stats.athleticism);
    this.createMiniBar(cols.end, y + 2, swimmer.stats.endurance);

    // Level
    this.add.text(cols.lvl, y, `${swimmer.level}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
    });
  }

  private createMiniBar(x: number, y: number, value: number): void {
    const barW = 80;
    const barH = 14;
    const gfx = this.add.graphics();

    // Background
    gfx.fillStyle(COLORS.dark);
    gfx.fillRect(x, y, barW, barH);

    // Fill
    const pct = value / 10;
    const color = value >= 7 ? COLORS.green : value >= 4 ? COLORS.gold : COLORS.red;
    gfx.fillStyle(color);
    gfx.fillRect(x, y, barW * pct, barH);

    // Border
    gfx.lineStyle(1, COLORS.panelBorder, 0.5);
    gfx.strokeRect(x, y, barW, barH);

    // Value text
    this.add.text(x + barW / 2, y + barH / 2, `${value}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }
}
