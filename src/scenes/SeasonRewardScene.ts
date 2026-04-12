import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, MAX_SWIMMER_STAT } from '../config';
import { GameState, generateSeasonMatches } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';

export class SeasonRewardScene extends Phaser.Scene {
  constructor() {
    super('SeasonReward');
  }

  create(): void {
    const state = GameState.getInstance().get();
    const seasonNum = state.seasonNumber ?? 1;

    // Big celebration header
    this.add.text(GAME_WIDTH / 2, 40, `SEASON ${seasonNum} CHAMPIONS!`, {
      fontFamily: 'monospace', fontSize: '36px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 80, state.team.name, {
      fontFamily: 'monospace', fontSize: '24px', color: '#bbe1fa',
    }).setOrigin(0.5);

    // Trophy particles
    for (let i = 0; i < 30; i++) {
      const px = Math.random() * GAME_WIDTH;
      const py = -20 - Math.random() * 100;
      const color = [COLORS.gold, COLORS.accent, COLORS.green, 0xff69b4][Math.floor(Math.random() * 4)]!;
      const confetti = this.add.rectangle(px, py, 4 + Math.random() * 4, 4 + Math.random() * 4, color);
      this.tweens.add({
        targets: confetti,
        y: GAME_HEIGHT + 20,
        x: px + (Math.random() - 0.5) * 200,
        angle: Math.random() * 720,
        duration: 2000 + Math.random() * 2000,
        delay: Math.random() * 1000,
        ease: 'Sine.easeIn',
        onComplete: () => confetti.destroy(),
      });
    }

    // Rewards panel
    new UIPanel(this, 80, 110, GAME_WIDTH - 160, 380);

    this.add.text(100, 124, 'SEASON REWARDS', {
      fontFamily: 'monospace', fontSize: '18px', color: '#f0c040', fontStyle: 'bold',
    });

    let rewardY = 156;

    // 1. All swimmers level up
    this.add.text(100, rewardY, 'ALL SWIMMERS LEVEL UP!', {
      fontFamily: 'monospace', fontSize: '16px', color: '#2ecc71', fontStyle: 'bold',
    });
    rewardY += 22;

    const levelUps: string[] = [];
    state.team.swimmers.forEach(swimmer => {
      swimmer.level++;
      // Boost a random stat
      const stats: ('artistry' | 'athleticism' | 'endurance')[] = ['artistry', 'athleticism', 'endurance'];
      const stat = stats[Math.floor(Math.random() * stats.length)]!;
      if (swimmer.stats[stat] < MAX_SWIMMER_STAT) {
        swimmer.stats[stat]++;
        levelUps.push(`${swimmer.name} -> Lv${swimmer.level} (+1 ${stat})`);
      } else {
        levelUps.push(`${swimmer.name} -> Lv${swimmer.level} (maxed ${stat})`);
      }
    });

    levelUps.forEach((text, i) => {
      if (rewardY > 380) return;
      const t = this.add.text(120, rewardY, text, {
        fontFamily: 'monospace', fontSize: '11px', color: '#bbe1fa',
      });
      t.setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 200, delay: 300 + i * 80 });
      rewardY += 18;
    });

    rewardY += 10;

    // 2. Coach levels up
    state.coachLevel = Math.min(state.coachLevel + 1, 10);
    this.add.text(100, rewardY, `COACH LEVEL UP -> Level ${state.coachLevel}!`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#f0c040', fontStyle: 'bold',
    });
    rewardY += 22;

    const tierUnlocked = Math.ceil(state.coachLevel / 2);
    this.add.text(120, rewardY, `Element Tier ${tierUnlocked} now available!`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#3282b8',
    });
    rewardY += 28;

    // 3. New season starts
    this.add.text(100, rewardY, `SEASON ${seasonNum + 1} BEGINS!`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#bbe1fa', fontStyle: 'bold',
    });
    rewardY += 20;
    this.add.text(120, rewardY, 'Opponents will be tougher. New challengers await!', {
      fontFamily: 'monospace', fontSize: '12px', color: '#3282b8',
    });

    // Track nationals / olympics wins from completed season
    const completedMatches = state.seasonMatches ?? [];
    const hadNationals = completedMatches.some(m => m.type === 'nationals');
    const hadOlympics = completedMatches.some(m => m.type === 'olympics');
    if (hadNationals) {
      state.nationalsWon = (state.nationalsWon ?? 0) + 1;
      rewardY += 16;
      this.add.text(100, rewardY, `NATIONALS WON! (Total: ${state.nationalsWon})`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
      });
    }
    if (hadOlympics) {
      if (!state.olympicMedals) state.olympicMedals = { gold: 0, silver: 0, bronze: 0 };
      state.olympicMedals.gold++;
      rewardY += 16;
      this.add.text(100, rewardY, `OLYMPIC GOLD MEDAL! (Total: ${state.olympicMedals.gold})`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
      });
    }

    // Reset season, increment season number, generate new matches
    state.seasonIndex = 0;
    state.seasonNumber = (state.seasonNumber ?? 1) + 1;
    state.seasonMatches = generateSeasonMatches(state.seasonNumber);
    SaveManager.save();

    // Continue to draft
    new UIButton(this, GAME_WIDTH / 2 - 100, GAME_HEIGHT - 70, 'Draft New Player!', () => {
      this.scene.start('Draft');
    }, 220, 44);
  }
}
