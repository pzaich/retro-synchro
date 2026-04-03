import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { GameState } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { CompetitionResult } from '../systems/ScoringEngine';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';

export class ResultsScene extends Phaser.Scene {
  private result!: CompetitionResult;

  constructor() {
    super('Results');
  }

  init(data: { result: CompetitionResult }): void {
    this.result = data.result;
  }

  create(): void {
    // Header
    this.add.text(GAME_WIDTH / 2, 36, 'COMPETITION RESULTS', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#f0c040',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Final score (big, animated)
    const finalScoreText = this.add.text(GAME_WIDTH / 2, 100, this.result.finalScore.toFixed(1), {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#bbe1fa',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    finalScoreText.setScale(0);
    this.tweens.add({
      targets: finalScoreText,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      delay: 300,
      ease: 'Back.easeOut',
    });

    const rating = this.getPerformanceRating();
    const ratingText = this.add.text(GAME_WIDTH / 2, 145, rating, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: this.getRatingColor(rating),
    }).setOrigin(0.5);
    ratingText.setAlpha(0);
    this.tweens.add({
      targets: ratingText,
      alpha: 1,
      duration: 400,
      delay: 800,
    });

    // Judge scores panel
    new UIPanel(this, 40, 180, 560, 220);
    this.add.text(60, 192, 'JUDGE SCORES', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    // Judge headers
    const jhY = 218;
    this.add.text(60, jhY, 'JUDGE', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(160, jhY, 'EXEC', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(240, jhY, 'ART', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(320, jhY, 'SYNC', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(420, jhY, 'TOTAL', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });

    // Sort to find dropped scores
    const sortedJudges = [...this.result.judgeScores].sort((a, b) => a.total - b.total);
    const droppedIds = new Set([sortedJudges[0]!.judgeId, sortedJudges[4]!.judgeId]);

    this.result.judgeScores.forEach((judge, i) => {
      const jy = 238 + i * 28;
      const isDropped = droppedIds.has(judge.judgeId);
      const alpha = isDropped ? 0.4 : 1;
      const color = isDropped ? '#555555' : '#ffffff';
      const suffix = isDropped ? ' (dropped)' : '';

      const row = [
        { x: 60, text: `Judge ${judge.judgeId}${suffix}` },
        { x: 160, text: judge.execution.toFixed(1) },
        { x: 240, text: judge.artistry.toFixed(1) },
        { x: 320, text: judge.synchronization.toFixed(1) },
        { x: 420, text: judge.total.toFixed(1) },
      ];
      row.forEach(col => {
        const t = this.add.text(col.x, jy, col.text, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color,
        });
        t.setAlpha(0);
        this.tweens.add({
          targets: t,
          alpha,
          duration: 300,
          delay: 1000 + i * 150,
        });
      });
    });

    // Element breakdown panel
    new UIPanel(this, 620, 180, 620, 220);
    this.add.text(640, 192, 'ELEMENT BREAKDOWN', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    const ehY = 218;
    this.add.text(640, ehY, 'ELEMENT', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(860, ehY, 'DD', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(920, ehY, 'EXEC', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(990, ehY, 'RESULT', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });
    this.add.text(1100, ehY, 'SCORE', { fontFamily: 'monospace', fontSize: '12px', color: '#3282b8' });

    this.result.elementScores.forEach((elem, i) => {
      const ey = 238 + i * 22;
      if (ey > 380) return; // don't overflow panel

      const resultColor = elem.success === 'clean' ? '#2ecc71'
        : elem.success === 'partial' ? '#f0c040' : '#e74c3c';
      const resultLabel = elem.success === 'clean' ? 'CLEAN'
        : elem.success === 'partial' ? 'SHAKY' : 'FAIL';

      this.add.text(640, ey, elem.elementName, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' });
      this.add.text(860, ey, elem.difficulty.toFixed(1), { fontFamily: 'monospace', fontSize: '12px', color: '#f0c040' });
      this.add.text(920, ey, elem.execution.toFixed(1), { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' });
      this.add.text(990, ey, resultLabel, { fontFamily: 'monospace', fontSize: '12px', color: resultColor });
      this.add.text(1100, ey, elem.total.toFixed(1), { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' });
    });

    // XP and progression section
    const xpY = 420;
    new UIPanel(this, 40, xpY, GAME_WIDTH - 80, 100);

    this.add.text(60, xpY + 12, 'PROGRESSION', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    const xpText = this.add.text(60, xpY + 40, `XP Earned: +${this.result.xpEarned}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#2ecc71',
    });
    xpText.setAlpha(0);
    this.tweens.add({
      targets: xpText,
      alpha: 1,
      duration: 400,
      delay: 2000,
    });

    this.add.text(60, xpY + 66, `Total Difficulty: ${this.result.totalDifficulty}  |  Elements: ${this.result.elementScores.length}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#3282b8',
    });

    // Apply XP to swimmers
    this.applyXP();

    // Navigation
    new UIButton(this, GAME_WIDTH / 2 - 100, GAME_HEIGHT - 70, 'Continue', () => {
      SaveManager.save();
      this.scene.start('Manage');
    }, 200, 44);
  }

  private applyXP(): void {
    const state = GameState.getInstance().get();
    const xpPerSwimmer = Math.floor(this.result.xpEarned / 8);

    state.team.swimmers.forEach(swimmer => {
      if (!swimmer.isAlternate) {
        swimmer.xp += xpPerSwimmer;
      }
    });

    // Coach XP
    state.coachXp += Math.floor(this.result.xpEarned * 0.5);
    state.competitionsWon++;

    SaveManager.save();
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
