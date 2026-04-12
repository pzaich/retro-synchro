import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { GameState } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { CompetitionResult } from '../systems/ScoringEngine';
import { processProgression, ProgressionResult } from '../systems/ProgressionSystem';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';

export class ResultsScene extends Phaser.Scene {
  private result!: CompetitionResult;
  private opponentScore!: number;
  private opponentName!: string;

  constructor() {
    super('Results');
  }

  init(data: { result: CompetitionResult; opponentScore?: number; opponentName?: string }): void {
    this.result = data.result;
    this.opponentScore = data.opponentScore ?? 0;
    this.opponentName = data.opponentName ?? 'Opponent';
  }

  create(): void {
    const state = GameState.getInstance().get();

    // Apply XP first
    this.applyXP();
    const progression = processProgression(state);

    // Determine win/loss
    const won = this.result.finalScore >= this.opponentScore;
    if (won && this.opponentScore > 0) {
      state.seasonIndex++;
    }

    SaveManager.save();

    // Event name header
    const matches = state.seasonMatches ?? [];
    // seasonIndex was already incremented if won, so look at previous match
    const matchIdx = won ? state.seasonIndex - 1 : state.seasonIndex;
    const currentMatch = matches[matchIdx];
    const matchName = currentMatch?.name ?? 'COMPETITION';

    this.add.text(GAME_WIDTH / 2, 14, matchName, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#3282b8',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 36, 'RESULTS', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#f0c040',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Win/Loss and scores comparison
    if (this.opponentScore > 0) {
      const outcomeText = won ? 'VICTORY!' : 'DEFEAT';
      const outcomeColor = won ? '#2ecc71' : '#e74c3c';
      this.add.text(GAME_WIDTH / 2, 60, outcomeText, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: outcomeColor,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Side by side scores
      this.add.text(GAME_WIDTH / 2 - 200, 100, state.team.name, {
        fontFamily: 'monospace', fontSize: '16px', color: '#bbe1fa',
      }).setOrigin(0.5);
      const playerScore = this.add.text(GAME_WIDTH / 2 - 200, 130, this.result.finalScore.toFixed(1), {
        fontFamily: 'monospace', fontSize: '48px', color: '#bbe1fa', fontStyle: 'bold',
      });
      playerScore.setOrigin(0.5);
      playerScore.setScale(0);
      this.tweens.add({ targets: playerScore, scaleX: 1, scaleY: 1, duration: 500, delay: 300, ease: 'Back.easeOut' });

      this.add.text(GAME_WIDTH / 2, 120, 'vs', {
        fontFamily: 'monospace', fontSize: '20px', color: '#555555',
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2 + 200, 100, this.opponentName, {
        fontFamily: 'monospace', fontSize: '16px', color: '#888888',
      }).setOrigin(0.5);
      const oppScore = this.add.text(GAME_WIDTH / 2 + 200, 130, this.opponentScore.toFixed(1), {
        fontFamily: 'monospace', fontSize: '48px', color: '#888888', fontStyle: 'bold',
      });
      oppScore.setOrigin(0.5);
      oppScore.setScale(0);
      this.tweens.add({ targets: oppScore, scaleX: 1, scaleY: 1, duration: 500, delay: 500, ease: 'Back.easeOut' });
    } else {
      // No opponent — exhibition
      const finalScoreText = this.add.text(GAME_WIDTH / 2, 100, this.result.finalScore.toFixed(1), {
        fontFamily: 'monospace', fontSize: '56px', color: '#bbe1fa', fontStyle: 'bold',
      }).setOrigin(0.5);
      finalScoreText.setScale(0);
      this.tweens.add({ targets: finalScoreText, scaleX: 1, scaleY: 1, duration: 600, delay: 300, ease: 'Back.easeOut' });

      const rating = this.getPerformanceRating();
      this.add.text(GAME_WIDTH / 2, 140, rating, {
        fontFamily: 'monospace', fontSize: '18px', color: this.getRatingColor(rating),
      }).setOrigin(0.5);
    }

    // Judge scores panel
    const panelStartY = 170;
    new UIPanel(this, 40, panelStartY, 540, 200);
    this.add.text(60, panelStartY + 10, 'JUDGE SCORES', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
    });

    const jhY = panelStartY + 32;
    this.add.text(60, jhY, 'JUDGE', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });
    this.add.text(170, jhY, 'EXEC', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });
    this.add.text(240, jhY, 'ART', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });
    this.add.text(310, jhY, 'SYNC', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });
    this.add.text(400, jhY, 'TOTAL', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });

    const sortedJudges = [...this.result.judgeScores].sort((a, b) => a.total - b.total);
    const droppedIds = new Set([sortedJudges[0]!.judgeId, sortedJudges[4]!.judgeId]);

    this.result.judgeScores.forEach((judge, i) => {
      const jy = jhY + 18 + i * 26;
      const isDropped = droppedIds.has(judge.judgeId);
      const color = isDropped ? '#555555' : '#ffffff';
      const suffix = isDropped ? ' *' : '';

      this.add.text(60, jy, `Judge ${judge.judgeId}${suffix}`, { fontFamily: 'monospace', fontSize: '13px', color });
      this.add.text(170, jy, judge.execution.toFixed(1), { fontFamily: 'monospace', fontSize: '13px', color });
      this.add.text(240, jy, judge.artistry.toFixed(1), { fontFamily: 'monospace', fontSize: '13px', color });
      this.add.text(310, jy, judge.synchronization.toFixed(1), { fontFamily: 'monospace', fontSize: '13px', color });
      this.add.text(400, jy, judge.total.toFixed(1), { fontFamily: 'monospace', fontSize: '13px', color });
    });

    this.add.text(60, panelStartY + 185, '* = dropped score', {
      fontFamily: 'monospace', fontSize: '10px', color: '#555555',
    });

    // Element breakdown panel
    new UIPanel(this, 600, panelStartY, 640, 200);
    this.add.text(620, panelStartY + 10, 'ELEMENT BREAKDOWN', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
    });

    const ehY = panelStartY + 32;
    this.add.text(620, ehY, 'ELEMENT', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });
    this.add.text(840, ehY, 'DD', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });
    this.add.text(900, ehY, 'EXEC', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });
    this.add.text(970, ehY, 'RESULT', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });
    this.add.text(1080, ehY, 'PTS', { fontFamily: 'monospace', fontSize: '11px', color: '#3282b8' });

    this.result.elementScores.forEach((elem, i) => {
      const ey = ehY + 18 + i * 20;
      if (ey > panelStartY + 185) return;

      const resultColor = elem.success === 'clean' ? '#2ecc71' : elem.success === 'partial' ? '#f0c040' : '#e74c3c';
      const resultLabel = elem.success === 'clean' ? 'CLEAN' : elem.success === 'partial' ? 'SHAKY' : 'FAIL';

      this.add.text(620, ey, elem.elementName, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' });
      this.add.text(840, ey, elem.difficulty.toFixed(1), { fontFamily: 'monospace', fontSize: '12px', color: '#f0c040' });
      this.add.text(900, ey, elem.execution.toFixed(1), { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' });
      this.add.text(970, ey, resultLabel, { fontFamily: 'monospace', fontSize: '12px', color: resultColor });
      this.add.text(1080, ey, elem.total.toFixed(1), { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' });
    });

    // Progression section
    this.buildProgressionPanel(progression, panelStartY + 215);

    // Navigation
    new UIButton(this, GAME_WIDTH / 2 - 100, GAME_HEIGHT - 60, 'Continue', () => {
      this.scene.start('Manage');
    }, 200, 44);
  }

  private buildProgressionPanel(progression: ProgressionResult, y: number): void {
    const panelH = 120 + progression.swimmerLevelUps.length * 20;
    new UIPanel(this, 40, y, GAME_WIDTH - 80, Math.min(panelH, 180));

    this.add.text(60, y + 10, 'PROGRESSION', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
    });

    this.add.text(60, y + 34, `XP Earned: +${this.result.xpEarned}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#2ecc71',
    });

    let infoY = y + 58;

    // Coach level-up
    if (progression.coachLevelUp) {
      const tierMsg = progression.coachLevelUp.newTierUnlocked > 0
        ? `  |  NEW TIER ${progression.coachLevelUp.newTierUnlocked} UNLOCKED!`
        : '';
      this.add.text(60, infoY, `Coach Level Up! -> Level ${progression.coachLevelUp.newLevel}${tierMsg}`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
      });
      infoY += 22;
    }

    // Swimmer level-ups
    progression.swimmerLevelUps.forEach(lu => {
      if (infoY > y + 160) return;
      this.add.text(60, infoY, `${lu.swimmerName} -> Level ${lu.newLevel}  (+1 ${lu.statIncreased})`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#bbe1fa',
      });
      infoY += 20;
    });

    if (progression.swimmerLevelUps.length === 0 && !progression.coachLevelUp) {
      this.add.text(60, infoY, 'Keep competing to level up your team!', {
        fontFamily: 'monospace', fontSize: '12px', color: '#555555',
      });
    }
  }

  private applyXP(): void {
    const state = GameState.getInstance().get();
    const xpPerSwimmer = Math.floor(this.result.xpEarned / 8);

    state.team.swimmers.forEach(swimmer => {
      if (!swimmer.isAlternate) {
        swimmer.xp += xpPerSwimmer;
      }
    });

    state.coachXp += Math.floor(this.result.xpEarned * 0.5);
    state.competitionsWon++;
  }

  private getPerformanceRating(): string {
    const score = this.result.finalScore;
    if (score >= 8) return 'OUTSTANDING';
    if (score >= 6) return 'GREAT';
    if (score >= 4) return 'GOOD';
    if (score >= 2) return 'FAIR';
    return 'NEEDS WORK';
  }

  private getRatingColor(rating: string): string {
    switch (rating) {
      case 'OUTSTANDING': return '#f0c040';
      case 'GREAT': return '#2ecc71';
      case 'GOOD': return '#bbe1fa';
      case 'FAIR': return '#f39c12';
      default: return '#e74c3c';
    }
  }
}
