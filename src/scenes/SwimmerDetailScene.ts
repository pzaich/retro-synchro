import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config';
import { GameState } from '../systems/GameState';
import { xpForLevel, personalityDescription } from '../entities/Swimmer';
import { StatBar } from '../ui/StatBar';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';
import { createSwimmerPortrait } from '../ui/SwimmerSprite';

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

    // Name header
    this.add.text(GAME_WIDTH / 2, 36, swimmer.name, {
      fontFamily: 'monospace', fontSize: '32px', color: '#bbe1fa', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Role + nationality
    const roleText = swimmer.isAlternate ? 'ALTERNATE' : 'ACTIVE';
    const roleColor = swimmer.isAlternate ? '#888888' : '#2ecc71';
    this.add.text(GAME_WIDTH / 2, 66, `${roleText}  |  ${swimmer.nationality}  |  Age ${swimmer.age}`, {
      fontFamily: 'monospace', fontSize: '14px', color: roleColor,
    }).setOrigin(0.5);

    // ── Left: Portrait + Identity ───────────────────────
    const leftX = 60;
    const leftY = 94;
    new UIPanel(this, leftX, leftY, 400, 320);

    // Large portrait
    createSwimmerPortrait(this, leftX + 80, leftY + 90, swimmer, 'large');

    // Specialty badge
    const specColor = this.getSpecialtyColor(swimmer.specialty);
    const specGfx = this.add.graphics();
    specGfx.fillStyle(specColor, 0.2);
    specGfx.fillRoundedRect(leftX + 160, leftY + 20, 220, 30, 4);
    specGfx.lineStyle(1, specColor, 0.6);
    specGfx.strokeRoundedRect(leftX + 160, leftY + 20, 220, 30, 4);
    this.add.text(leftX + 270, leftY + 35, swimmer.specialty.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '16px',
      color: '#' + specColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Personality
    this.add.text(leftX + 160, leftY + 64, swimmer.personality.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '13px', color: '#f0c040',
    });
    this.add.text(leftX + 160, leftY + 82, personalityDescription(swimmer.personality), {
      fontFamily: 'monospace', fontSize: '10px', color: '#3282b8',
      wordWrap: { width: 220 },
    });

    // Bio
    this.add.text(leftX + 20, leftY + 170, 'BIO', {
      fontFamily: 'monospace', fontSize: '12px', color: '#f0c040', fontStyle: 'bold',
    });
    this.add.text(leftX + 20, leftY + 190, `"${swimmer.bio}"`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#bbe1fa',
      wordWrap: { width: 360 }, fontStyle: 'italic',
    });

    // Specialty effect description
    this.add.text(leftX + 20, leftY + 240, 'SPECIALTY BONUS', {
      fontFamily: 'monospace', fontSize: '12px', color: '#f0c040', fontStyle: 'bold',
    });
    this.add.text(leftX + 20, leftY + 260, this.getSpecialtyBonus(swimmer.specialty), {
      fontFamily: 'monospace', fontSize: '11px', color: '#3282b8',
      wordWrap: { width: 360 },
    });

    // Cap color swatch
    const swatchGfx = this.add.graphics();
    swatchGfx.fillStyle(swimmer.capColor);
    swatchGfx.fillCircle(leftX + 80, leftY + 160, 6);
    swatchGfx.lineStyle(1, COLORS.panelBorder);
    swatchGfx.strokeCircle(leftX + 80, leftY + 160, 6);
    this.add.text(leftX + 92, leftY + 154, 'Cap Color', {
      fontFamily: 'monospace', fontSize: '10px', color: '#555555',
    });

    // ── Right: Stats + Progression ──────────────────────
    const rightX = 480;
    const rightY = 94;
    new UIPanel(this, rightX, rightY, 460, 320);

    // Level & XP
    this.add.text(rightX + 20, rightY + 16, `LEVEL ${swimmer.level}`, {
      fontFamily: 'monospace', fontSize: '26px', color: '#f0c040', fontStyle: 'bold',
    });

    const xpNeeded = xpForLevel(swimmer.level);
    const xpPct = Math.min(swimmer.xp / xpNeeded, 1);
    const xpBarX = rightX + 20;
    const xpBarY = rightY + 52;
    const xpBarW = 420;
    const xpBarH = 16;

    this.add.text(xpBarX, xpBarY - 14, 'Experience', {
      fontFamily: 'monospace', fontSize: '11px', color: '#3282b8',
    });

    const xpGfx = this.add.graphics();
    xpGfx.fillStyle(COLORS.dark);
    xpGfx.fillRect(xpBarX, xpBarY, xpBarW, xpBarH);
    xpGfx.fillStyle(COLORS.accent);
    xpGfx.fillRect(xpBarX, xpBarY, xpBarW * xpPct, xpBarH);
    xpGfx.lineStyle(1, COLORS.panelBorder);
    xpGfx.strokeRect(xpBarX, xpBarY, xpBarW, xpBarH);

    this.add.text(xpBarX + xpBarW / 2, xpBarY + xpBarH / 2, `${swimmer.xp} / ${xpNeeded} XP`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
    }).setOrigin(0.5);

    // Stats
    this.add.text(rightX + 20, xpBarY + 30, 'STATS', {
      fontFamily: 'monospace', fontSize: '16px', color: '#f0c040', fontStyle: 'bold',
    });

    const statStartY = xpBarY + 56;
    new StatBar(this, rightX + 30, statStartY, 'Artistry', swimmer.stats.artistry, 220, 16);
    new StatBar(this, rightX + 30, statStartY + 36, 'Athletic', swimmer.stats.athleticism, 220, 16);
    new StatBar(this, rightX + 30, statStartY + 72, 'Endurance', swimmer.stats.endurance, 220, 16);

    // Overall
    const overall = Math.round(
      (swimmer.stats.artistry + swimmer.stats.athleticism + swimmer.stats.endurance) / 3 * 10
    ) / 10;
    this.add.text(rightX + 30, statStartY + 112, `Overall: ${overall.toFixed(1)}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    });

    // Personality effect on stats
    this.add.text(rightX + 200, statStartY + 112, this.getPersonalityEffect(swimmer.personality), {
      fontFamily: 'monospace', fontSize: '11px', color: '#3282b8',
    });

    // ── Bottom: Navigation ──────────────────────────────
    const swimmers = state.team.swimmers;
    const currentIdx = swimmers.findIndex(s => s.id === this.swimmerId);

    const navY = 430;
    if (currentIdx > 0) {
      new UIButton(this, 60, navY, '< Prev', () => {
        this.scene.start('SwimmerDetail', { swimmerId: swimmers[currentIdx - 1]!.id });
      }, 120, 36);
    }

    if (currentIdx < swimmers.length - 1) {
      new UIButton(this, GAME_WIDTH - 180, navY, 'Next >', () => {
        this.scene.start('SwimmerDetail', { swimmerId: swimmers[currentIdx + 1]!.id });
      }, 120, 36);
    }
  }

  private getSpecialtyColor(specialty: string): number {
    const colors: Record<string, number> = {
      lifts: 0xe74c3c, spins: 0xf39c12, figures: 0x9b59b6,
      sculls: 0x1abc9c, formations: 0x2ecc71, 'all-rounder': 0x3282b8,
    };
    return colors[specialty] ?? 0x3282b8;
  }

  private getSpecialtyBonus(specialty: string): string {
    const bonuses: Record<string, string> = {
      lifts: '+15% execution on lift elements. Stronger base for team acrobatics.',
      spins: '+15% execution on spin and twist elements. Cleaner rotations.',
      figures: '+15% execution on figure elements. Better form in complex positions.',
      sculls: '+15% execution on scull elements. Smoother transitions between moves.',
      formations: '+10% sync bonus on all formation changes. Better spatial awareness.',
      'all-rounder': '+5% execution on all element types. Flexible and dependable.',
    };
    return bonuses[specialty] ?? '';
  }

  private getPersonalityEffect(personality: string): string {
    const effects: Record<string, string> = {
      perfectionist: '+ART under pressure',
      powerhouse: '+ATH on lifts',
      clutch: '+END late in routine',
      leader: '+SYNC for team',
      creative: '+ART variety bonus',
      steady: 'Less score variance',
      fiery: 'Higher ceiling & floor',
      calm: 'Fatigue resistant',
    };
    return effects[personality] ?? '';
  }
}
