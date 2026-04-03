import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config';
import { GameState } from '../systems/GameState';
import { xpForLevel } from '../entities/Swimmer';
import { StatBar } from '../ui/StatBar';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';

export class SwimmerDetailScene extends Phaser.Scene {
  private swimmerId!: string;

  constructor() {
    super('SwimmerDetail');
  }

  init(data: { swimmerId: string }): void {
    this.swimmerId = data.swimmerId;
  }

  create(): void {
    const state = GameState.getInstance().get();
    const swimmer = state.team.swimmers.find(s => s.id === this.swimmerId);
    if (!swimmer) {
      this.scene.start('Manage');
      return;
    }

    // Back button
    new UIButton(this, 30, 20, '< Back', () => {
      this.scene.start('Manage');
    }, 120, 36);

    // Swimmer name header
    this.add.text(GAME_WIDTH / 2, 40, swimmer.name, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#bbe1fa',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Role tag
    const roleText = swimmer.isAlternate ? 'ALTERNATE' : 'ACTIVE';
    const roleColor = swimmer.isAlternate ? '#888888' : '#2ecc71';
    this.add.text(GAME_WIDTH / 2, 74, roleText, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: roleColor,
    }).setOrigin(0.5);

    // Main panel
    const panelX = 80;
    const panelY = 100;
    const panelW = GAME_WIDTH - 160;
    const panelH = 460;
    new UIPanel(this, panelX, panelY, panelW, panelH);

    // Large swimmer portrait (placeholder circle)
    const portraitX = panelX + 120;
    const portraitY = panelY + 100;
    const gfx = this.add.graphics();
    gfx.fillStyle(COLORS.water);
    gfx.fillCircle(portraitX, portraitY, 50);
    gfx.lineStyle(3, COLORS.panelBorder);
    gfx.strokeCircle(portraitX, portraitY, 50);

    // Swimmer silhouette inside circle
    gfx.fillStyle(COLORS.accent);
    gfx.fillCircle(portraitX, portraitY - 12, 14); // head
    gfx.fillRect(portraitX - 10, portraitY + 2, 20, 28); // body

    // Level & XP section
    const infoX = panelX + 260;
    const infoY = panelY + 50;

    this.add.text(infoX, infoY, `LEVEL ${swimmer.level}`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    // XP progress bar
    const xpNeeded = xpForLevel(swimmer.level);
    const xpPct = Math.min(swimmer.xp / xpNeeded, 1);
    const xpBarX = infoX;
    const xpBarY = infoY + 44;
    const xpBarW = 300;
    const xpBarH = 18;

    this.add.text(xpBarX, xpBarY - 18, 'Experience', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#3282b8',
    });

    const xpGfx = this.add.graphics();
    xpGfx.fillStyle(COLORS.dark);
    xpGfx.fillRect(xpBarX, xpBarY, xpBarW, xpBarH);
    xpGfx.fillStyle(COLORS.accent);
    xpGfx.fillRect(xpBarX, xpBarY, xpBarW * xpPct, xpBarH);
    xpGfx.lineStyle(1, COLORS.panelBorder);
    xpGfx.strokeRect(xpBarX, xpBarY, xpBarW, xpBarH);

    this.add.text(xpBarX + xpBarW / 2, xpBarY + xpBarH / 2, `${swimmer.xp} / ${xpNeeded} XP`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Stats section
    const statsY = panelY + 200;
    this.add.text(panelX + 40, statsY, 'STATS', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    const statStartY = statsY + 40;
    const statX = panelX + 60;
    new StatBar(this, statX, statStartY, 'Artistry', swimmer.stats.artistry, 200, 16);
    new StatBar(this, statX, statStartY + 40, 'Athletic', swimmer.stats.athleticism, 200, 16);
    new StatBar(this, statX, statStartY + 80, 'Endurance', swimmer.stats.endurance, 200, 16);

    // Overall rating
    const overall = Math.round(
      (swimmer.stats.artistry + swimmer.stats.athleticism + swimmer.stats.endurance) / 3 * 10
    ) / 10;
    this.add.text(panelX + 60, statStartY + 130, `Overall: ${overall.toFixed(1)}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    });

    // Swimmer navigation (prev/next)
    const swimmers = state.team.swimmers;
    const currentIdx = swimmers.findIndex(s => s.id === this.swimmerId);

    if (currentIdx > 0) {
      new UIButton(this, panelX + panelW - 280, panelY + panelH - 60, '< Prev', () => {
        this.scene.start('SwimmerDetail', { swimmerId: swimmers[currentIdx - 1]!.id });
      }, 120, 36);
    }

    if (currentIdx < swimmers.length - 1) {
      new UIButton(this, panelX + panelW - 140, panelY + panelH - 60, 'Next >', () => {
        this.scene.start('SwimmerDetail', { swimmerId: swimmers[currentIdx + 1]!.id });
      }, 120, 36);
    }
  }
}
