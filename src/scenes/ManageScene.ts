import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { SwimmerData } from '../entities/Swimmer';
import { coachXpForLevel } from '../systems/ProgressionSystem';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';

export class ManageScene extends Phaser.Scene {
  private swapSource: SwimmerData | null = null;

  constructor() {
    super('Manage');
  }

  create(): void {
    const state = GameState.getInstance().get();
    this.swapSource = null;

    // Header
    this.add.text(GAME_WIDTH / 2, 24, state.team.name, {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#bbe1fa',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Coach info line
    const coachXpNeeded = coachXpForLevel(state.coachLevel);
    this.add.text(GAME_WIDTH / 2, 54, `Coach Level ${state.coachLevel}  |  XP: ${state.coachXp}/${coachXpNeeded}  |  Wins: ${state.competitionsWon}`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#3282b8',
    }).setOrigin(0.5);

    // Roster panel
    const panelX = 40;
    const panelY = 78;
    const panelW = GAME_WIDTH - 80;
    const panelH = 520;
    new UIPanel(this, panelX, panelY, panelW, panelH);

    // Section headers
    this.add.text(panelX + 20, panelY + 10, 'ROSTER', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    // Column headers
    const colY = panelY + 36;
    const cols = { name: panelX + 20, art: panelX + 300, ath: panelX + 410, end: panelX + 520, lvl: panelX + 640, swap: panelX + 700 };
    this.add.text(cols.name, colY, 'NAME', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(cols.art, colY, 'ART', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(cols.ath, colY, 'ATH', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(cols.end, colY, 'END', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(cols.lvl, colY, 'LVL', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(cols.swap, colY, 'SWAP', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });

    // Divider line
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, COLORS.panelBorder, 0.5);
    divGfx.lineBetween(panelX + 10, colY + 18, panelX + panelW - 10, colY + 18);

    // Swimmer rows
    const active = state.team.swimmers.filter(s => !s.isAlternate);
    const alternates = state.team.swimmers.filter(s => s.isAlternate);

    let rowY = colY + 26;
    active.forEach((swimmer) => {
      this.createSwimmerRow(swimmer, cols, rowY, false);
      rowY += 34;
    });

    // Alternates divider
    rowY += 6;
    divGfx.lineStyle(1, COLORS.panelBorder, 0.3);
    divGfx.lineBetween(panelX + 10, rowY, panelX + panelW - 10, rowY);
    rowY += 6;

    this.add.text(panelX + 20, rowY, 'ALTERNATES', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#3282b8',
      fontStyle: 'bold',
    });
    rowY += 22;

    alternates.forEach((swimmer) => {
      this.createSwimmerRow(swimmer, cols, rowY, true);
      rowY += 34;
    });

    // Bottom navigation buttons
    const btnY = GAME_HEIGHT - 60;
    new UIButton(this, GAME_WIDTH / 2 - 330, btnY, 'Edit Routine', () => {
      this.scene.start('RoutineEditor');
    }, 200, 44);

    new UIButton(this, GAME_WIDTH / 2 - 100, btnY, 'Season', () => {
      this.scene.start('Season');
    }, 200, 44);

    new UIButton(this, GAME_WIDTH / 2 + 130, btnY, 'Compete', () => {
      this.scene.start('Competition');
    }, 200, 44);
  }

  private createSwimmerRow(
    swimmer: SwimmerData,
    cols: { name: number; art: number; ath: number; end: number; lvl: number; swap: number },
    y: number,
    isAlternate: boolean,
  ): void {
    const nameColor = isAlternate ? '#888888' : '#ffffff';

    // Swimmer icon
    const icon = this.add.graphics();
    const iconColor = isAlternate ? 0x555555 : COLORS.accent;
    icon.fillStyle(iconColor);
    icon.fillCircle(cols.name - 2, y + 8, 5);

    // Name (clickable)
    const nameText = this.add.text(cols.name + 12, y, swimmer.name, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: nameColor,
    });
    nameText.setInteractive({ useHandCursor: true });
    nameText.on('pointerover', () => nameText.setColor('#f0c040'));
    nameText.on('pointerout', () => nameText.setColor(nameColor));
    nameText.on('pointerdown', () => {
      this.scene.start('SwimmerDetail', { swimmerId: swimmer.id });
    });

    // Stat mini-bars
    this.createMiniBar(cols.art, y + 1, swimmer.stats.artistry);
    this.createMiniBar(cols.ath, y + 1, swimmer.stats.athleticism);
    this.createMiniBar(cols.end, y + 1, swimmer.stats.endurance);

    // Level
    this.add.text(cols.lvl, y, `${swimmer.level}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    });

    // Swap button
    const swapBtn = this.add.text(cols.swap, y, '[swap]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#3282b8',
    });
    swapBtn.setInteractive({ useHandCursor: true });
    swapBtn.on('pointerover', () => swapBtn.setColor('#f0c040'));
    swapBtn.on('pointerout', () => swapBtn.setColor('#3282b8'));
    swapBtn.on('pointerdown', () => {
      if (!this.swapSource) {
        // First click: select this swimmer
        this.swapSource = swimmer;
        swapBtn.setText('[...]');
        swapBtn.setColor('#f0c040');
      } else if (this.swapSource.id === swimmer.id) {
        // Cancel
        this.swapSource = null;
        this.scene.restart();
      } else {
        // Second click: swap the two swimmers
        this.performSwap(this.swapSource, swimmer);
      }
    });
  }

  private performSwap(a: SwimmerData, b: SwimmerData): void {
    // Swap isAlternate status
    const tmpAlt = a.isAlternate;
    a.isAlternate = b.isAlternate;
    b.isAlternate = tmpAlt;

    SaveManager.save();
    this.swapSource = null;
    this.scene.restart();
  }

  private createMiniBar(x: number, y: number, value: number): void {
    const barW = 75;
    const barH = 14;
    const gfx = this.add.graphics();

    gfx.fillStyle(COLORS.dark);
    gfx.fillRect(x, y, barW, barH);

    const pct = value / 10;
    const color = value >= 7 ? COLORS.green : value >= 4 ? COLORS.gold : COLORS.red;
    gfx.fillStyle(color);
    gfx.fillRect(x, y, barW * pct, barH);

    gfx.lineStyle(1, COLORS.panelBorder, 0.5);
    gfx.strokeRect(x, y, barW, barH);

    this.add.text(x + barW / 2, y + barH / 2, `${value}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }
}
