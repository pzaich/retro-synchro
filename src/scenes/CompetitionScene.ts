import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState, generateSeasonMatches } from '../systems/GameState';
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
  private swimmerSprites: Phaser.GameObjects.Container[] = [];
  private swimmerDots: Phaser.GameObjects.Arc[] = [];
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

    // Ensure season matches exist
    if (!state.seasonMatches || state.seasonMatches.length === 0) {
      state.seasonMatches = generateSeasonMatches(state.seasonNumber ?? 1);
    }

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
    const state = GameState.getInstance().get();
    const matches = state.seasonMatches ?? [];
    const currentMatch = matches[state.seasonIndex];
    const matchName = currentMatch?.name ?? 'Exhibition Match';
    const matchType = currentMatch?.type ?? 'regular';
    const matchTier = currentMatch?.tier ?? 1;
    const seasonNum = state.seasonNumber ?? 1;

    // Overlay background
    const overlay = this.add.graphics();
    overlay.fillStyle(0x1a1a2e, 0.95);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Event name (big, top)
    const eventColor = matchType === 'olympics' ? '#d4a0ff'
      : matchType === 'nationals' ? '#f0c040' : '#bbe1fa';
    this.add.text(GAME_WIDTH / 2, 40, matchName, {
      fontFamily: 'monospace', fontSize: '32px', color: eventColor, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Season + tier info
    const tierLabels = ['', 'Local', 'City', 'State/Regional', 'National', 'International'];
    this.add.text(GAME_WIDTH / 2, 76, `Season ${seasonNum}  |  ${tierLabels[matchTier] ?? ''} Tier ${matchTier}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#3282b8',
    }).setOrigin(0.5);

    // Special event badge
    if (matchType === 'olympics') {
      this.add.text(GAME_WIDTH / 2, 104, `Representing ${state.country ?? 'your country'} at the OLYMPIC GAMES`, {
        fontFamily: 'monospace', fontSize: '16px', color: '#d4a0ff', fontStyle: 'bold',
      }).setOrigin(0.5);
    } else if (matchType === 'nationals') {
      this.add.text(GAME_WIDTH / 2, 104, `Competing for the ${state.country ?? ''} National Title`, {
        fontFamily: 'monospace', fontSize: '16px', color: '#f0c040', fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // VS display
    const vsY = matchType !== 'regular' ? 160 : 140;
    this.add.text(GAME_WIDTH / 2 - 250, vsY, teamName, {
      fontFamily: 'monospace', fontSize: '28px', color: '#bbe1fa', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, vsY, 'VS', {
      fontFamily: 'monospace', fontSize: '24px', color: '#555555',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2 + 250, vsY, this.opponent.team.name, {
      fontFamily: 'monospace', fontSize: '28px', color: '#e74c3c', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Opponent info
    const styleLabels = { aggressive: 'Aggressive', safe: 'Conservative', balanced: 'Balanced' };
    this.add.text(GAME_WIDTH / 2 + 250, vsY + 40, `Style: ${styleLabels[this.opponent.style]}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#3282b8',
    }).setOrigin(0.5);

    // Your routine info
    const routine = state.routines[0]!;
    this.add.text(GAME_WIDTH / 2 - 250, vsY + 40, `${routine.slots.length} elements`, {
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
    this.swimmerDots = [];
    const state = GameState.getInstance().get();
    const activeSwimmers = state.team.swimmers.filter(s => !s.isAlternate);
    const startPositions = getFormationPositions('straight-line', POOL_CX, POOL_CY, FORMATION_SPREAD);

    for (let i = 0; i < 8; i++) {
      const pos = startPositions[i]!;
      const swimmerData = activeSwimmers[i];
      const capColor = swimmerData?.capColor ?? COLORS.accent;

      const container = this.add.container(pos.x, pos.y);

      // Body oval
      const body = this.add.ellipse(0, 2, 12, 8, capColor, 0.6);
      container.add(body);

      // Head dot (used for color feedback)
      const dot = this.add.circle(0, -3, 6, capColor);
      dot.setStrokeStyle(1, COLORS.white, 0.7);
      container.add(dot);

      // Cap highlight
      const capHighlight = this.add.arc(0, -5, 5, 180, 360, false, capColor);
      container.add(capHighlight);

      this.swimmerSprites.push(container);
      this.swimmerDots.push(dot);
    }
  }

  private createUI(): void {
    // Show current event name at top
    const state = GameState.getInstance().get();
    const matches = state.seasonMatches ?? [];
    const currentMatch = matches[state.seasonIndex];
    const matchName = currentMatch?.name ?? 'Exhibition';

    this.add.text(GAME_WIDTH / 2, POOL_Y + POOL_H + 16, matchName, {
      fontFamily: 'monospace',
      fontSize: '16px',
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
    const actionDuration = 900;
    const element = this.elementLookup.get(elemScore.elementId);
    const category = element?.category ?? 'position';

    const color = elemScore.success === 'clean' ? 0x2ecc71
      : elemScore.success === 'partial' ? 0xf0c040
      : 0xe74c3c;

    // Show element name label floating above the pool
    const actionLabel = this.add.text(POOL_CX, POOL_Y + 16, elemScore.elementName.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#16213ecc', padding: { x: 8, y: 3 },
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: actionLabel, alpha: 1, duration: 200 });
    this.time.delayedCall(actionDuration + 200, () => {
      this.tweens.add({ targets: actionLabel, alpha: 0, duration: 200, onComplete: () => actionLabel.destroy() });
    });

    this.swimmerSprites.forEach((sprite, idx) => {
      const dot = this.swimmerDots[idx];
      if (dot) dot.setFillStyle(color);

      this.createSplash(sprite.x, sprite.y, elemScore.success === 'clean' ? 6 : 3);

      // Fail: wobble for all categories
      if (elemScore.success === 'fail') {
        this.tweens.add({
          targets: sprite, x: sprite.x + 12, duration: 70,
          yoyo: true, repeat: 5, ease: 'Sine.easeInOut',
        });
      }

      // Category-specific animations
      switch (category) {
        case 'spin':
          this.animateSpin(sprite, idx, actionDuration, elemScore.success);
          break;
        case 'lift':
          this.animateLift(sprite, idx, actionDuration, elemScore.success);
          break;
        case 'figure':
          this.animateFigure(sprite, idx, actionDuration, elemScore.success);
          break;
        case 'scull':
          this.animateScull(sprite, idx, actionDuration, elemScore.success);
          break;
        case 'formation':
          this.animateFormation(sprite, idx, actionDuration, elemScore.success);
          break;
        default: // position
          this.animatePosition(sprite, idx, actionDuration, elemScore.success);
          break;
      }
    });

    // Restore colors after action
    this.time.delayedCall(actionDuration, () => {
      const state = GameState.getInstance().get();
      const active = state.team.swimmers.filter(s => !s.isAlternate);
      this.swimmerDots.forEach((dot, idx) => {
        if (dot) dot.setFillStyle(active[idx]?.capColor ?? COLORS.accent);
      });
    });

    // Show score flash
    this.time.delayedCall(actionDuration + 100, () => {
      this.showScoreFlash(elemScore);
    });
  }

  // ── Category-specific animations ──────────────────────

  /** Spins: swimmers rotate rapidly in place */
  private animateSpin(sprite: Phaser.GameObjects.Container, _idx: number, dur: number, success: string): void {
    const rotations = success === 'clean' ? 720 : success === 'partial' ? 540 : 180;
    this.tweens.add({
      targets: sprite, angle: rotations, duration: dur * 0.8,
      ease: 'Cubic.easeInOut',
      onComplete: () => { sprite.angle = 0; },
    });
    // Shrink down (submerge) then pop back up
    this.tweens.add({
      targets: sprite, scaleX: 0.5, scaleY: 0.5,
      duration: dur * 0.3, yoyo: true, ease: 'Sine.easeInOut',
    });
    // Water ring effect
    this.createWaterRing(sprite.x, sprite.y, dur);
  }

  /** Lifts: one swimmer (index 0) rises up while others cluster beneath */
  private animateLift(sprite: Phaser.GameObjects.Container, idx: number, dur: number, success: string): void {
    if (idx === 0) {
      // The "flyer" rises up
      const liftHeight = success === 'clean' ? -40 : success === 'partial' ? -25 : -10;
      this.tweens.add({
        targets: sprite, y: sprite.y + liftHeight,
        duration: dur * 0.4, yoyo: true, hold: dur * 0.2,
        ease: 'Quad.easeOut',
      });
      // Scale up (appear larger/closer)
      this.tweens.add({
        targets: sprite, scaleX: 1.8, scaleY: 1.8,
        duration: dur * 0.4, yoyo: true, hold: dur * 0.2,
        ease: 'Quad.easeOut',
      });
      // Big splash on landing
      this.time.delayedCall(dur * 0.8, () => {
        this.createSplash(sprite.x, sprite.y, 12);
      });
    } else {
      // Bases: huddle closer to center and pulse (straining)
      const cx = this.swimmerSprites.reduce((sum, s) => sum + s.x, 0) / this.swimmerSprites.length;
      const cy = this.swimmerSprites.reduce((sum, s) => sum + s.y, 0) / this.swimmerSprites.length;
      this.tweens.add({
        targets: sprite,
        x: sprite.x + (cx - sprite.x) * 0.3,
        y: sprite.y + (cy - sprite.y) * 0.3,
        duration: dur * 0.3, yoyo: true, hold: dur * 0.3,
        ease: 'Sine.easeInOut',
      });
      // Slight tremble
      this.tweens.add({
        targets: sprite, scaleX: 1.1, scaleY: 0.9,
        duration: 120, yoyo: true, repeat: Math.floor(dur / 250),
      });
    }
  }

  /** Figures: swimmers sink down (submerge) then rise into a pose */
  private animateFigure(sprite: Phaser.GameObjects.Container, _idx: number, dur: number, success: string): void {
    // Submerge: shrink + fade
    this.tweens.add({
      targets: sprite,
      scaleX: 0.3, scaleY: 0.3, alpha: 0.3,
      duration: dur * 0.3, ease: 'Sine.easeIn',
    });
    // Hold underwater
    this.time.delayedCall(dur * 0.35, () => {
      // Emerge with leg kick (scale Y tall = vertical position)
      const targetScaleY = success === 'clean' ? 1.6 : success === 'partial' ? 1.3 : 1.0;
      this.tweens.add({
        targets: sprite,
        scaleX: 0.7, scaleY: targetScaleY, alpha: 1,
        duration: dur * 0.3, ease: 'Back.easeOut',
      });
      this.createSplash(sprite.x, sprite.y, 4);
      // Bubble effect
      this.createBubbles(sprite.x, sprite.y, 5);
    });
    // Return to normal
    this.time.delayedCall(dur * 0.8, () => {
      this.tweens.add({
        targets: sprite,
        scaleX: 1, scaleY: 1,
        duration: dur * 0.2, ease: 'Sine.easeOut',
      });
    });
  }

  /** Sculls: swimmers glide smoothly in a direction */
  private animateScull(sprite: Phaser.GameObjects.Container, idx: number, dur: number, _success: string): void {
    // Glide forward then back (alternating direction per swimmer)
    const dir = idx % 2 === 0 ? 1 : -1;
    const glideDistance = 25;
    this.tweens.add({
      targets: sprite,
      x: sprite.x + dir * glideDistance,
      duration: dur * 0.4, yoyo: true,
      ease: 'Sine.easeInOut',
    });
    // Stretch horizontally (streamlined shape)
    this.tweens.add({
      targets: sprite,
      scaleX: 1.4, scaleY: 0.7,
      duration: dur * 0.3, yoyo: true,
      ease: 'Sine.easeInOut',
    });
    // Subtle wake trail
    this.createWake(sprite.x, sprite.y, dir, dur);
  }

  /** Formation: swimmers move outward then snap into a pattern */
  private animateFormation(sprite: Phaser.GameObjects.Container, idx: number, dur: number, success: string): void {
    // Expand outward
    const angle = (idx / 8) * Math.PI * 2;
    const expandDist = success === 'clean' ? 30 : 15;
    this.tweens.add({
      targets: sprite,
      x: sprite.x + Math.cos(angle) * expandDist,
      y: sprite.y + Math.sin(angle) * expandDist,
      duration: dur * 0.3, ease: 'Quad.easeOut',
    });
    // Snap back into tight formation
    this.time.delayedCall(dur * 0.35, () => {
      this.tweens.add({
        targets: sprite,
        x: sprite.x, y: sprite.y,
        duration: dur * 0.2, ease: 'Back.easeIn',
      });
    });
    // Flash sync indicator (all swimmers flash at once)
    this.time.delayedCall(dur * 0.55, () => {
      this.tweens.add({
        targets: sprite, alpha: 0.3,
        duration: 80, yoyo: true, repeat: 2,
      });
    });
  }

  /** Position: swimmers hold a pose — gentle bob + leg kick visual */
  private animatePosition(sprite: Phaser.GameObjects.Container, idx: number, dur: number, success: string): void {
    // Gentle bob up and down (treading water)
    const bobDelay = idx * 60; // staggered for wave effect
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 6,
      duration: dur * 0.25, yoyo: true, repeat: 1,
      delay: bobDelay, ease: 'Sine.easeInOut',
    });
    // Leg extension: stretch tall briefly
    if (success === 'clean') {
      this.time.delayedCall(dur * 0.3, () => {
        this.tweens.add({
          targets: sprite, scaleY: 1.4,
          duration: dur * 0.25, yoyo: true,
          ease: 'Back.easeOut',
        });
      });
    }
    // Small ripple
    this.createRipple(sprite.x, sprite.y + 8);
  }

  // ── Visual effects ────────────────────────────────────

  private createWaterRing(x: number, y: number, dur: number): void {
    const ring = this.add.circle(x, y, 8, 0x000000, 0);
    ring.setStrokeStyle(2, COLORS.waterLight, 0.6);
    this.tweens.add({
      targets: ring,
      scaleX: 4, scaleY: 4,
      alpha: 0,
      duration: dur * 0.7,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private createBubbles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const bx = x + (Math.random() - 0.5) * 20;
      const bubble = this.add.circle(bx, y, 1.5 + Math.random() * 2, COLORS.waterLight, 0.5);
      this.tweens.add({
        targets: bubble,
        y: y - 20 - Math.random() * 30,
        alpha: 0,
        scaleX: 0.3, scaleY: 0.3,
        duration: 500 + Math.random() * 400,
        delay: i * 80,
        ease: 'Sine.easeOut',
        onComplete: () => bubble.destroy(),
      });
    }
  }

  private createWake(x: number, y: number, dir: number, dur: number): void {
    for (let i = 0; i < 4; i++) {
      const wake = this.add.ellipse(x - dir * (10 + i * 8), y + 4, 6, 3, COLORS.waterLight, 0.3);
      this.tweens.add({
        targets: wake,
        x: wake.x - dir * 15,
        alpha: 0,
        scaleX: 2,
        duration: dur * 0.4,
        delay: i * 60,
        onComplete: () => wake.destroy(),
      });
    }
  }

  private createRipple(x: number, y: number): void {
    const ripple = this.add.ellipse(x, y, 10, 4, 0x000000, 0);
    ripple.setStrokeStyle(1, COLORS.waterLight, 0.4);
    this.tweens.add({
      targets: ripple,
      scaleX: 3, scaleY: 2,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => ripple.destroy(),
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
