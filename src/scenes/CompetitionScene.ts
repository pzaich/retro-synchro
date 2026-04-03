import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../systems/GameState';
import { scoreRoutine, CompetitionResult, ElementScore } from '../systems/ScoringEngine';
import { generateOpponent, OpponentTeam } from '../systems/OpponentGenerator';
import { getFormationPositions } from '../animations/FormationManager';
import { ElementData } from '../entities/Element';
import elementsData from '../data/elements.json';

const POOL_X = 140;
const POOL_Y = 80;
const POOL_W = 1000;
const POOL_H = 480;
const POOL_CX = POOL_X + POOL_W / 2;
const POOL_CY = POOL_Y + POOL_H / 2;
const FORMATION_SPREAD = 80;

export class CompetitionScene extends Phaser.Scene {
  private swimmerSprites: Phaser.GameObjects.Arc[] = [];
  private elementLookup = new Map<string, ElementData>();
  private result!: CompetitionResult;
  private opponent!: OpponentTeam;
  private currentElementIndex = 0;
  private elementLabel!: Phaser.GameObjects.Text;
  private scoreFlash!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('Competition');
  }

  create(): void {
    const state = GameState.getInstance().get();

    // Build element lookup
    this.elementLookup.clear();
    for (const el of elementsData as ElementData[]) {
      this.elementLookup.set(el.id, el);
    }

    // Check routine exists
    const routine = state.routines[0];
    if (!routine || routine.slots.length === 0) {
      this.showNoRoutine();
      return;
    }

    // Generate opponent
    const allElements = elementsData as ElementData[];
    this.opponent = generateOpponent(
      state.seasonIndex,
      state.competitionsWon,
      allElements,
      this.elementLookup,
    );

    // Pre-calculate scores
    this.result = scoreRoutine(routine, state.team.swimmers, this.elementLookup);
    this.currentElementIndex = 0;

    // Show pre-competition screen first
    this.showPreCompetition(state.team.name);
  }

  private showPreCompetition(teamName: string): void {
    // Overlay background
    const overlay = this.add.graphics();
    overlay.fillStyle(0x1a1a2e, 0.95);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    this.add.text(GAME_WIDTH / 2, 80, 'COMPETITION', {
      fontFamily: 'monospace', fontSize: '36px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5);

    // VS display
    this.add.text(GAME_WIDTH / 2 - 250, 180, teamName, {
      fontFamily: 'monospace', fontSize: '28px', color: '#bbe1fa', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 180, 'VS', {
      fontFamily: 'monospace', fontSize: '24px', color: '#555555',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2 + 250, 180, this.opponent.team.name, {
      fontFamily: 'monospace', fontSize: '28px', color: '#e74c3c', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Opponent info
    const styleLabels = { aggressive: 'Aggressive', safe: 'Conservative', balanced: 'Balanced' };
    this.add.text(GAME_WIDTH / 2 + 250, 220, `Style: ${styleLabels[this.opponent.style]}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#3282b8',
    }).setOrigin(0.5);

    // Your routine info
    const routine = GameState.getInstance().get().routines[0]!;
    this.add.text(GAME_WIDTH / 2 - 250, 220, `${routine.slots.length} elements`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#3282b8',
    }).setOrigin(0.5);

    // Start button
    const startBtn = this.add.text(GAME_WIDTH / 2, 350, '[ START ROUTINE ]', {
      fontFamily: 'monospace', fontSize: '24px', color: '#2ecc71', fontStyle: 'bold',
    }).setOrigin(0.5);
    startBtn.setInteractive({ useHandCursor: true });
    startBtn.on('pointerover', () => startBtn.setColor('#f0c040'));
    startBtn.on('pointerout', () => startBtn.setColor('#2ecc71'));
    startBtn.on('pointerdown', () => {
      // Fade out overlay and start
      this.tweens.add({
        targets: [overlay, ...this.children.list.filter(c => c !== overlay)],
        alpha: 0,
        duration: 400,
        onComplete: () => {
          // Remove all pre-comp elements
          this.children.removeAll();

          // Now build the competition view
          this.drawPool();
          this.createSwimmers();
          this.createUI();
          this.time.delayedCall(600, () => this.playNextElement());
        },
      });
    });

    // Back button
    const backBtn = this.add.text(GAME_WIDTH / 2, 420, '[ BACK TO TEAM ]', {
      fontFamily: 'monospace', fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#888888'));
    backBtn.on('pointerdown', () => this.scene.start('Manage'));
  }

  private showNoRoutine(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'No routine set!', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#e74c3c',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Go to Edit Routine first.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#3282b8',
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => this.scene.start('Manage'));
  }

  private drawPool(): void {
    const gfx = this.add.graphics();

    // Pool water
    gfx.fillStyle(COLORS.water);
    gfx.fillRect(POOL_X, POOL_Y, POOL_W, POOL_H);

    // Pool border
    gfx.lineStyle(3, COLORS.accent, 0.8);
    gfx.strokeRect(POOL_X, POOL_Y, POOL_W, POOL_H);

    // Lane lines (subtle)
    gfx.lineStyle(1, COLORS.waterLight, 0.15);
    for (let i = 1; i < 6; i++) {
      const ly = POOL_Y + (POOL_H / 6) * i;
      gfx.lineBetween(POOL_X + 4, ly, POOL_X + POOL_W - 4, ly);
    }

    // Water shimmer effect
    this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 4000,
      repeat: -1,
      onUpdate: (tween) => {
        const val = tween.getValue() ?? 0;
        const shimmer = this.add.graphics();
        shimmer.clear();
        shimmer.lineStyle(1, COLORS.waterLight, 0.08);
        for (let i = 0; i < 3; i++) {
          shimmer.beginPath();
          for (let x = POOL_X; x <= POOL_X + POOL_W; x += 6) {
            const y = POOL_Y + 40 + i * 140 + Math.sin(x * 0.015 + val + i) * 8;
            if (x === POOL_X) shimmer.moveTo(x, y);
            else shimmer.lineTo(x, y);
          }
          shimmer.strokePath();
        }
        this.time.delayedCall(100, () => shimmer.destroy());
      },
    });

    // Poolside audience area (top)
    gfx.fillStyle(COLORS.dark);
    gfx.fillRect(0, 0, GAME_WIDTH, POOL_Y);

    // Audience dots
    for (let i = 0; i < 40; i++) {
      const ax = 50 + Math.random() * (GAME_WIDTH - 100);
      const ay = 15 + Math.random() * 50;
      const color = [0xbbe1fa, 0xf0c040, 0xe74c3c, 0x2ecc71, 0x9b59b6][Math.floor(Math.random() * 5)]!;
      gfx.fillStyle(color, 0.5);
      gfx.fillCircle(ax, ay, 3);
    }
  }

  private createSwimmers(): void {
    this.swimmerSprites = [];
    const startPositions = getFormationPositions('straight-line', POOL_CX, POOL_CY, FORMATION_SPREAD);

    for (let i = 0; i < 8; i++) {
      const pos = startPositions[i]!;
      const swimmer = this.add.circle(pos.x, pos.y, 10, COLORS.accent);
      swimmer.setStrokeStyle(2, COLORS.white, 0.8);
      this.swimmerSprites.push(swimmer);
    }
  }

  private createUI(): void {
    // Competition header
    this.add.text(GAME_WIDTH / 2, POOL_Y + POOL_H + 20, 'COMPETITION', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f0c040',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Current element label
    this.elementLabel = this.add.text(GAME_WIDTH / 2, POOL_Y + POOL_H + 44, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Score flash (appears after each element)
    this.scoreFlash = this.add.text(GAME_WIDTH / 2, POOL_CY - 40, '', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#f0c040',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.scoreFlash.setAlpha(0);

    // Progress
    this.progressText = this.add.text(POOL_X, POOL_Y + POOL_H + 20, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#3282b8',
    });

    // Status
    this.statusText = this.add.text(POOL_X + POOL_W, POOL_Y + POOL_H + 20, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(1, 0);
  }

  private playNextElement(): void {
    if (this.currentElementIndex >= this.result.elementScores.length) {
      this.finishRoutine();
      return;
    }

    const elemScore = this.result.elementScores[this.currentElementIndex]!;
    const routine = GameState.getInstance().get().routines[0]!;
    const slot = routine.slots[this.currentElementIndex]!;

    // Update UI
    this.elementLabel.setText(elemScore.elementName);
    this.progressText.setText(`Element ${this.currentElementIndex + 1} / ${this.result.elementScores.length}`);

    // Move swimmers to formation
    const formationId = slot.formationId || 'straight-line';
    const positions = getFormationPositions(formationId, POOL_CX, POOL_CY, FORMATION_SPREAD);

    // Animate swimmers to positions
    const moveDuration = 800;
    this.swimmerSprites.forEach((sprite, i) => {
      const target = positions[i]!;

      // Add slight desync for partial/fail
      let offsetX = 0;
      let offsetY = 0;
      if (elemScore.success === 'partial') {
        offsetX = (Math.random() - 0.5) * 15;
        offsetY = (Math.random() - 0.5) * 15;
      } else if (elemScore.success === 'fail') {
        offsetX = (Math.random() - 0.5) * 30;
        offsetY = (Math.random() - 0.5) * 30;
      }

      this.tweens.add({
        targets: sprite,
        x: target.x + offsetX,
        y: target.y + offsetY,
        duration: moveDuration,
        ease: 'Sine.easeInOut',
      });
    });

    // Element action animation (pulse/spin effect)
    this.time.delayedCall(moveDuration, () => {
      this.playElementAction(elemScore);
    });
  }

  private playElementAction(elemScore: ElementScore): void {
    const actionDuration = 600;

    const color = elemScore.success === 'clean' ? 0x2ecc71
      : elemScore.success === 'partial' ? 0xf0c040
      : 0xe74c3c;

    this.swimmerSprites.forEach(sprite => {
      sprite.setFillStyle(color);

      // Splash particles
      this.createSplash(sprite.x, sprite.y, elemScore.success === 'clean' ? 6 : 3);

      // Pulse animation
      this.tweens.add({
        targets: sprite,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: actionDuration / 2,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          sprite.setFillStyle(COLORS.accent);
        },
      });

      // Fail: wobble
      if (elemScore.success === 'fail') {
        this.tweens.add({
          targets: sprite,
          x: sprite.x + 10,
          duration: 80,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.easeInOut',
        });
      }

      // Clean: brief rotation flourish
      if (elemScore.success === 'clean') {
        this.tweens.add({
          targets: sprite,
          angle: 360,
          duration: actionDuration,
          ease: 'Sine.easeInOut',
          onComplete: () => { sprite.angle = 0; },
        });
      }
    });

    // Show score flash
    this.time.delayedCall(actionDuration, () => {
      this.showScoreFlash(elemScore);
    });
  }

  private showScoreFlash(elemScore: ElementScore): void {
    const successLabels = { clean: 'CLEAN!', partial: 'SHAKY', fail: 'MISTAKE!' };
    const successColors = { clean: '#2ecc71', partial: '#f0c040', fail: '#e74c3c' };

    this.scoreFlash.setText(`${successLabels[elemScore.success]}  ${elemScore.total.toFixed(1)}`);
    this.scoreFlash.setColor(successColors[elemScore.success]);
    this.scoreFlash.setAlpha(1);
    this.scoreFlash.setScale(0.5);

    this.tweens.add({
      targets: this.scoreFlash,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: this.scoreFlash,
      alpha: 0,
      duration: 400,
      delay: 800,
      onComplete: () => {
        this.currentElementIndex++;
        this.playNextElement();
      },
    });

    // Update running score
    const runningTotal = this.result.elementScores
      .slice(0, this.currentElementIndex + 1)
      .reduce((sum, s) => sum + s.total, 0);
    this.statusText.setText(`Score: ${runningTotal.toFixed(1)}`);
  }

  private finishRoutine(): void {
    this.elementLabel.setText('Routine Complete!');

    // Final splash celebration
    this.swimmerSprites.forEach(sprite => {
      this.createSplash(sprite.x, sprite.y, 10);
    });

    // Brief pause then show results
    this.time.delayedCall(1500, () => {
      this.scene.start('Results', {
        result: this.result,
        opponentScore: this.opponent.preCalculatedScore,
        opponentName: this.opponent.team.name,
      });
    });
  }

  private createSplash(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.add.circle(
        x, y,
        2 + Math.random() * 2,
        COLORS.waterLight,
        0.7,
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 40;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 400 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
