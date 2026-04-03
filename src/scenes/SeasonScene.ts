import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config';
import { GameState } from '../systems/GameState';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';

interface Tournament {
  name: string;
  tier: number;
  description: string;
}

const SEASON_TOURNAMENTS: Tournament[] = [
  { name: 'Regional Qualifier', tier: 1, description: 'Local competition to prove your team' },
  { name: 'City Championship', tier: 1, description: 'Compete against city rivals' },
  { name: 'State Meet', tier: 2, description: 'Best teams in the state face off' },
  { name: 'Regional Finals', tier: 2, description: 'Top regional teams compete' },
  { name: 'National Open', tier: 3, description: 'Open national competition' },
  { name: 'National Championship', tier: 3, description: 'The best in the country' },
  { name: 'International Invitational', tier: 4, description: 'Global teams invited' },
  { name: 'World Cup', tier: 4, description: 'The pinnacle of artistic swimming' },
];

export class SeasonScene extends Phaser.Scene {
  constructor() {
    super('Season');
  }

  create(): void {
    const state = GameState.getInstance().get();
    const currentIndex = state.seasonIndex;

    // Header
    new UIButton(this, 20, 16, '< Back', () => {
      this.scene.start('Manage');
    }, 120, 36);

    this.add.text(GAME_WIDTH / 2, 34, 'SEASON CALENDAR', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#bbe1fa',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 62, `Competitions Won: ${state.competitionsWon}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#3282b8',
    }).setOrigin(0.5);

    // Tournament list
    const panelX = 80;
    const panelY = 90;
    const panelW = GAME_WIDTH - 160;
    new UIPanel(this, panelX, panelY, panelW, 520);

    SEASON_TOURNAMENTS.forEach((tournament, i) => {
      const rowY = panelY + 16 + i * 62;
      const isCurrent = i === currentIndex;
      const isCompleted = i < currentIndex;
      const isLocked = i > currentIndex;

      // Status indicator
      const gfx = this.add.graphics();
      const indicatorX = panelX + 24;
      const indicatorY = rowY + 24;

      if (isCompleted) {
        gfx.fillStyle(COLORS.green);
        gfx.fillCircle(indicatorX, indicatorY, 10);
        // Checkmark
        gfx.lineStyle(2, 0xffffff);
        gfx.beginPath();
        gfx.moveTo(indicatorX - 5, indicatorY);
        gfx.lineTo(indicatorX - 1, indicatorY + 4);
        gfx.lineTo(indicatorX + 6, indicatorY - 4);
        gfx.strokePath();
      } else if (isCurrent) {
        gfx.fillStyle(COLORS.gold);
        gfx.fillCircle(indicatorX, indicatorY, 10);
        gfx.fillStyle(COLORS.dark);
        gfx.fillCircle(indicatorX, indicatorY, 4);
      } else {
        gfx.lineStyle(2, COLORS.panelBorder);
        gfx.strokeCircle(indicatorX, indicatorY, 10);
      }

      // Connecting line
      if (i < SEASON_TOURNAMENTS.length - 1) {
        gfx.lineStyle(1, isCompleted ? COLORS.green : COLORS.panelBorder, isCompleted ? 0.6 : 0.3);
        gfx.lineBetween(indicatorX, indicatorY + 12, indicatorX, indicatorY + 50);
      }

      // Tournament name
      const nameColor = isLocked ? '#555555' : isCurrent ? '#f0c040' : '#ffffff';
      this.add.text(panelX + 50, rowY + 6, tournament.name, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: nameColor,
        fontStyle: isCurrent ? 'bold' : 'normal',
      });

      // Description
      this.add.text(panelX + 50, rowY + 28, tournament.description, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: isLocked ? '#333333' : '#3282b8',
      });

      // Tier badge
      const tierColors = [0x3282b8, 0x2ecc71, 0xf0c040, 0xe74c3c];
      const tierColor = tierColors[tournament.tier - 1] ?? COLORS.panelBorder;
      const tierBadge = this.add.graphics();
      tierBadge.fillStyle(tierColor, isLocked ? 0.3 : 0.8);
      tierBadge.fillRoundedRect(panelX + panelW - 100, rowY + 10, 60, 24, 4);
      this.add.text(panelX + panelW - 70, rowY + 22, `Tier ${tournament.tier}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: isLocked ? '#555555' : '#ffffff',
      }).setOrigin(0.5);

      // Compete button for current tournament
      if (isCurrent) {
        new UIButton(this, panelX + panelW - 220, rowY + 4, 'Compete!', () => {
          this.scene.start('Competition');
        }, 110, 36);
      }

      // Completed marker
      if (isCompleted) {
        this.add.text(panelX + panelW - 200, rowY + 16, 'COMPLETED', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#2ecc71',
        });
      }
    });

    // Season complete message
    if (currentIndex >= SEASON_TOURNAMENTS.length) {
      this.add.text(GAME_WIDTH / 2, panelY + 540, 'SEASON COMPLETE! You are a champion!', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#f0c040',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }
  }
}
