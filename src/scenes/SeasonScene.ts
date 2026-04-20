import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config';
import { GameState, SeasonMatch, generateSeasonMatches } from '../systems/GameState';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';

const TIER_COLORS = [0x3282b8, 0x2ecc71, 0xf0c040, 0xe74c3c, 0x9b59b6];
const TYPE_LABELS: Record<string, string> = { regular: '', nationals: 'NATL', trials: 'TRIAL', olympics: 'OLY' };

export class SeasonScene extends Phaser.Scene {
  constructor() {
    super('Season');
  }

  create(): void {
    const state = GameState.getInstance().get();

    // Generate matches if missing (old saves)
    if (!state.seasonMatches || state.seasonMatches.length === 0) {
      state.seasonMatches = generateSeasonMatches(state.seasonNumber ?? 1);
    }

    const matches = state.seasonMatches;
    const currentIndex = state.seasonIndex;
    const seasonNum = state.seasonNumber ?? 1;
    const country = state.country ?? 'USA';

    // Header
    new UIButton(this, 20, 16, '< Back', () => {
      this.scene.start('Manage');
    }, 120, 36);

    this.add.text(GAME_WIDTH / 2, 24, `SEASON ${seasonNum}`, {
      fontFamily: 'monospace', fontSize: '26px', color: '#bbe1fa', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 50, `${country}  |  Wins: ${state.competitionsWon}  |  Nationals Won: ${state.nationalsWon ?? 0}  |  Olympic Gold: ${state.olympicMedals?.gold ?? 0}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#3282b8',
    }).setOrigin(0.5);

    // Panel
    const panelX = 40;
    const panelY = 68;
    const panelW = GAME_WIDTH - 80;
    const panelH = 590;
    new UIPanel(this, panelX, panelY, panelW, panelH);

    // Progress bar
    const progBarX = panelX + 20;
    const progBarY = panelY + 10;
    const progBarW = panelW - 40;
    const progGfx = this.add.graphics();
    progGfx.fillStyle(COLORS.dark);
    progGfx.fillRect(progBarX, progBarY, progBarW, 12);
    const progPct = matches.length > 0 ? currentIndex / matches.length : 0;
    progGfx.fillStyle(COLORS.green);
    progGfx.fillRect(progBarX, progBarY, progBarW * progPct, 12);
    progGfx.lineStyle(1, COLORS.panelBorder);
    progGfx.strokeRect(progBarX, progBarY, progBarW, 12);
    this.add.text(progBarX + progBarW / 2, progBarY + 6, `${Math.round(progPct * 100)}% — Match ${Math.min(currentIndex + 1, matches.length)} of ${matches.length}`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5);

    // Match list
    const listY = progBarY + 22;
    const matchH = 30;

    matches.forEach((match: SeasonMatch, i: number) => {
      const my = listY + i * (matchH + 2);
      if (my + matchH > panelY + panelH - 6) return;

      const isCurrent = i === currentIndex;
      const isCompleted = i < currentIndex;
      const isLocked = i > currentIndex;
      const isSpecial = match.type === 'nationals' || match.type === 'trials' || match.type === 'olympics';

      // Row bg
      const rowGfx = this.add.graphics();
      if (match.type === 'olympics') {
        rowGfx.fillStyle(0x9b59b6, isCurrent ? 0.25 : isCompleted ? 0.08 : 0.03);
      } else if (match.type === 'trials') {
        rowGfx.fillStyle(0x9b59b6, isCurrent ? 0.18 : isCompleted ? 0.06 : 0.02);
      } else if (match.type === 'nationals') {
        rowGfx.fillStyle(COLORS.gold, isCurrent ? 0.2 : isCompleted ? 0.06 : 0.02);
      } else if (isCurrent) {
        rowGfx.fillStyle(COLORS.gold, 0.12);
      } else if (isCompleted) {
        rowGfx.fillStyle(COLORS.green, 0.05);
      }
      if (isCurrent || isCompleted || isSpecial) {
        rowGfx.fillRect(panelX + 8, my, panelW - 16, matchH);
      }

      // Number
      const numColor = isCompleted ? '#2ecc71' : isCurrent ? '#f0c040' : '#333333';
      this.add.text(panelX + 18, my + matchH / 2, `${i + 1}`, {
        fontFamily: 'monospace', fontSize: '11px', color: numColor,
      }).setOrigin(0, 0.5);

      // Status icon
      const iconGfx = this.add.graphics();
      const iconX = panelX + 40;
      const iconY = my + matchH / 2;
      if (isCompleted) {
        iconGfx.fillStyle(COLORS.green);
        iconGfx.fillCircle(iconX, iconY, 5);
      } else if (isCurrent) {
        iconGfx.fillStyle(COLORS.gold);
        iconGfx.fillCircle(iconX, iconY, 5);
        iconGfx.fillStyle(COLORS.dark);
        iconGfx.fillCircle(iconX, iconY, 2);
      } else {
        iconGfx.lineStyle(1, COLORS.panelBorder, 0.3);
        iconGfx.strokeCircle(iconX, iconY, 5);
      }

      // Match name
      let nameColor = isLocked ? '#444444' : isCurrent ? '#f0c040' : '#ffffff';
      if (match.type === 'olympics' && !isLocked) nameColor = '#d4a0ff';
      if (match.type === 'trials' && !isLocked) nameColor = '#c084f0';
      if (match.type === 'nationals' && !isLocked) nameColor = '#f0c040';

      const nameText = isSpecial ? `★ ${match.name}` : match.name;
      this.add.text(panelX + 56, my + matchH / 2, nameText, {
        fontFamily: 'monospace', fontSize: '12px', color: nameColor,
        fontStyle: (isCurrent || isSpecial) ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);

      // Type badge for special events
      if (isSpecial && !isLocked) {
        const badgeColor = match.type === 'olympics' ? 0x9b59b6 : match.type === 'trials' ? 0x9b59b6 : COLORS.gold;
        const badgeLabel = TYPE_LABELS[match.type] ?? '';
        const badge = this.add.graphics();
        badge.fillStyle(badgeColor, 0.6);
        badge.fillRoundedRect(panelX + panelW - 180, my + 4, 44, 22, 3);
        this.add.text(panelX + panelW - 158, my + matchH / 2, badgeLabel, {
          fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
        }).setOrigin(0.5);
      }

      // Tier badge
      const tierColor = TIER_COLORS[match.tier - 1] ?? COLORS.panelBorder;
      const tBadge = this.add.graphics();
      tBadge.fillStyle(tierColor, isLocked ? 0.15 : 0.6);
      tBadge.fillRoundedRect(panelX + panelW - 120, my + 4, 40, 22, 3);
      this.add.text(panelX + panelW - 100, my + matchH / 2, `T${match.tier}`, {
        fontFamily: 'monospace', fontSize: '10px', color: isLocked ? '#444444' : '#ffffff',
      }).setOrigin(0.5);

      // Win / Compete
      if (isCompleted) {
        this.add.text(panelX + panelW - 60, my + matchH / 2, 'WIN', {
          fontFamily: 'monospace', fontSize: '10px', color: '#2ecc71',
        }).setOrigin(0.5);
      }

      if (isCurrent) {
        new UIButton(this, panelX + panelW - 120, my - 2, 'Compete!', () => {
          this.scene.start('Competition');
        }, 100, matchH + 4);
      }
    });

    // Season complete
    if (currentIndex >= matches.length && matches.length > 0) {
      this.add.text(GAME_WIDTH / 2, panelY + panelH - 30, 'SEASON COMPLETE!', {
        fontFamily: 'monospace', fontSize: '18px', color: '#f0c040', fontStyle: 'bold',
      }).setOrigin(0.5);

      new UIButton(this, GAME_WIDTH / 2 - 100, panelY + panelH - 8, 'Claim Rewards!', () => {
        this.scene.start('SeasonReward');
      }, 200, 34);
    }
  }
}
