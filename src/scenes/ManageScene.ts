import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { SwimmerData } from '../entities/Swimmer';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';
import { createSwimmerPortrait } from '../ui/SwimmerSprite';

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
    const country = state.country ?? '';
    this.add.text(GAME_WIDTH / 2, 54, `${country}  |  Coach Lv${state.coachLevel}  |  Season ${state.seasonNumber ?? 1}  |  Wins: ${state.competitionsWon}`, {
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
    const cols = { name: panelX + 20, spec: panelX + 260, art: panelX + 370, ath: panelX + 470, end: panelX + 570, lvl: panelX + 670, swap: panelX + 720 };
    this.add.text(cols.name, colY, 'NAME', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(cols.spec, colY, 'SPEC', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
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
    const btnW = 160;
    const btnGap = 10;
    const totalBtnW = btnW * 4 + btnGap * 3;
    const btnStartX = (GAME_WIDTH - totalBtnW) / 2;

    new UIButton(this, btnStartX, btnY, 'Routine', () => {
      this.scene.start('RoutineEditor');
    }, btnW, 44);

    new UIButton(this, btnStartX + btnW + btnGap, btnY, 'Trade', () => {
      this.scene.start('Trade');
    }, btnW, 44);

    new UIButton(this, btnStartX + (btnW + btnGap) * 2, btnY, 'Season', () => {
      this.scene.start('Season');
    }, btnW, 44);

    new UIButton(this, btnStartX + (btnW + btnGap) * 3, btnY, 'Compete', () => {
      this.scene.start('Season');
    }, btnW, 44);
  }

  private createSwimmerRow(
    swimmer: SwimmerData,
    cols: { name: number; spec: number; art: number; ath: number; end: number; lvl: number; swap: number },
    y: number,
    isAlternate: boolean,
  ): void {
    const nameColor = isAlternate ? '#888888' : '#ffffff';

    // Swimmer portrait
    const portrait = createSwimmerPortrait(this, cols.name, y + 8, swimmer, 'small');
    if (isAlternate) portrait.setAlpha(0.5);

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

    // Specialty
    const specColors: Record<string, string> = {
      lifts: '#e74c3c', spins: '#f39c12', figures: '#9b59b6',
      sculls: '#1abc9c', formations: '#2ecc71', 'all-rounder': '#3282b8',
    };
    const specLabel = swimmer.specialty === 'all-rounder' ? 'ALL' : swimmer.specialty.substring(0, 4).toUpperCase();
    this.add.text(cols.spec, y + 2, specLabel, {
      fontFamily: 'monospace', fontSize: '12px',
      color: specColors[swimmer.specialty] ?? '#3282b8',
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
