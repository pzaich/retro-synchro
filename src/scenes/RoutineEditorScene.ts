import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { ElementData } from '../entities/Element';
import { RoutineData, createRoutine } from '../entities/Routine';
import { validateRoutine } from '../systems/RoutineValidator';
import { coachLevelToTier, tierUnlockLevel } from '../systems/ProgressionSystem';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';
import { setTextInteractive } from '../ui/hitArea';
import elementsData from '../data/elements.json';

const MAX_ROUTINE_SLOTS = 8;

const CATALOG_X = 20;
const CATALOG_Y = 90;
const CATALOG_W = 490;

const TIMELINE_X = 530;
const TIMELINE_Y = 90;
const TIMELINE_W = 730;
const SLOT_H = 48;

const CARD_H = 42;
const CARD_GAP = 4;

export class RoutineEditorScene extends Phaser.Scene {
  private allElements: ElementData[] = [];
  private elementLookup = new Map<string, ElementData>();
  private routine!: RoutineData;
  private validationText!: Phaser.GameObjects.Text;
  private difficultyBar!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private filterCategory = 'all';
  private scrollOffset = 0;
  private maxTier = 1;

  // Objects we need to destroy/rebuild dynamically
  private catalogItems: Phaser.GameObjects.GameObject[] = [];
  private timelineItems: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('RoutineEditor');
  }

  create(): void {
    const state = GameState.getInstance().get();

    this.allElements = (elementsData as ElementData[]).slice().sort((a, b) => a.tier - b.tier);
    this.maxTier = coachLevelToTier(state.coachLevel);
    this.elementLookup.clear();
    for (const el of elementsData as ElementData[]) {
      this.elementLookup.set(el.id, el);
    }

    if (state.routines.length > 0) {
      this.routine = state.routines[0]!;
    } else {
      this.routine = createRoutine('Routine 1');
      state.routines.push(this.routine);
    }

    this.scrollOffset = 0;
    this.catalogItems = [];
    this.timelineItems = [];

    // Header
    new UIButton(this, 20, 16, '< Back', () => {
      this.routine.slots = this.routine.slots.filter(s => s.elementId !== '');
      SaveManager.save();
      this.scene.start('Manage');
    }, 120, 36);

    this.add.text(GAME_WIDTH / 2, 34, 'ROUTINE EDITOR', {
      fontFamily: 'monospace', fontSize: '28px', color: '#bbe1fa', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 62, this.routine.name, {
      fontFamily: 'monospace', fontSize: '16px', color: '#3282b8',
    }).setOrigin(0.5);

    // Static panels
    new UIPanel(this, CATALOG_X, CATALOG_Y, CATALOG_W, GAME_HEIGHT - 180);
    new UIPanel(this, TIMELINE_X, TIMELINE_Y, TIMELINE_W, GAME_HEIGHT - 180);

    this.add.text(CATALOG_X + 12, CATALOG_Y + 8, 'ELEMENTS  (click to add)', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
    });

    this.add.text(CATALOG_X + CATALOG_W - 12, CATALOG_Y + 8, `Tier ${this.maxTier}/4 unlocked`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#3282b8',
    }).setOrigin(1, 0);

    this.add.text(TIMELINE_X + 12, TIMELINE_Y + 8, 'ROUTINE TIMELINE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
    });

    // Filter buttons
    this.buildFilterButtons();

    // Dynamic content
    this.rebuildCatalog();
    this.rebuildTimeline();

    // Difficulty meter
    this.buildDifficultyMeter();
    this.updateValidation();

    // Scroll
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _dx: number, dy: number) => {
      const filtered = this.getFilteredElements();
      const totalH = filtered.length * (CARD_H + CARD_GAP);
      const listH = GAME_HEIGHT - 180 - 68;
      const maxScroll = Math.max(0, totalH - listH);
      this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + dy * 0.5, 0, maxScroll);
      this.rebuildCatalog();
    });
  }

  // ── Filters ───────────────────────────────────────────────

  private buildFilterButtons(): void {
    const categories = ['all', 'position', 'figure', 'scull', 'spin', 'formation', 'lift', 'hybrid'];
    const filterY = CATALOG_Y + 30;
    categories.forEach((cat, i) => {
      const bx = CATALOG_X + 10 + i * 58;
      const label = cat === 'all' ? 'ALL' : cat.substring(0, 4).toUpperCase();
      const btn = this.add.text(bx, filterY, label, {
        fontFamily: 'monospace', fontSize: '11px',
        color: this.filterCategory === cat ? '#f0c040' : '#3282b8',
        padding: { x: 3, y: 2 },
      });
      setTextInteractive(btn, 8, 6);
      btn.on('pointerdown', () => {
        this.filterCategory = cat;
        this.scrollOffset = 0;
        this.rebuildCatalog();
      });
    });
  }

  private getFilteredElements(): ElementData[] {
    return this.filterCategory === 'all'
      ? this.allElements
      : this.allElements.filter(e => e.category === this.filterCategory);
  }

  // ── Element Catalog ───────────────────────────────────────

  private rebuildCatalog(): void {
    this.catalogItems.forEach(obj => obj.destroy());
    this.catalogItems = [];

    const filtered = this.getFilteredElements();
    const listY = CATALOG_Y + 54;
    const listH = GAME_HEIGHT - 180 - 68;

    filtered.forEach((element, i) => {
      const cardY = listY + i * (CARD_H + CARD_GAP) - this.scrollOffset;

      // Clip: skip cards outside visible area
      if (cardY + CARD_H < listY || cardY > listY + listH) return;

      this.createElementCard(element, CATALOG_X + 8, cardY, CATALOG_W - 16, CARD_H);
    });
  }

  private createElementCard(element: ElementData, x: number, y: number, w: number, h: number): void {
    const CATEGORY_COLORS: Record<string, number> = {
      position: 0x3282b8, figure: 0x9b59b6, scull: 0x1abc9c,
      lift: 0xe74c3c, spin: 0xf39c12, formation: 0x2ecc71, hybrid: 0xe67e22,
    };
    const catColor = CATEGORY_COLORS[element.category] ?? COLORS.panelBorder;
    const locked = element.tier > this.maxTier;

    const bg = this.add.graphics();
    const drawNormal = () => {
      bg.clear();
      bg.fillStyle(COLORS.dark, locked ? 0.55 : 1);
      bg.fillRect(x, y, w, h);
      bg.lineStyle(1, locked ? 0x333333 : catColor, locked ? 0.6 : 0.5);
      bg.strokeRect(x, y, w, h);
      bg.fillStyle(locked ? 0x444444 : catColor);
      bg.fillRect(x, y, 4, h);
    };
    drawNormal();
    this.catalogItems.push(bg);

    const textColor = locked ? '#555555' : '#ffffff';
    const ddColor = locked ? '#555555' : '#f0c040';
    const catColorHex = locked ? '#555555' : '#' + catColor.toString(16).padStart(6, '0');
    const tierColor = locked ? '#666666' : '#3282b8';

    const name = this.add.text(x + 12, y + 6, element.name, {
      fontFamily: 'monospace', fontSize: '13px', color: textColor,
    });
    this.catalogItems.push(name);

    const dd = this.add.text(x + 12, y + 24, `DD ${element.difficulty.toFixed(1)}`, {
      fontFamily: 'monospace', fontSize: '10px', color: ddColor,
    });
    this.catalogItems.push(dd);

    const catLabel = this.add.text(x + w - 8, y + 6, element.category.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '9px', color: catColorHex,
    }).setOrigin(1, 0);
    this.catalogItems.push(catLabel);

    const tierLabel = this.add.text(x + w - 8, y + 22, `Tier ${element.tier}`, {
      fontFamily: 'monospace', fontSize: '10px', color: tierColor,
    }).setOrigin(1, 0);
    this.catalogItems.push(tierLabel);

    if (locked) {
      this.drawLockIcon(x + w - 28, y + h / 2);
    }

    const hitArea = this.add.rectangle(x + w / 2, y + h / 2, w, h);
    hitArea.setFillStyle(0x000000, 0);
    hitArea.setInteractive({ useHandCursor: !locked });

    if (locked) {
      hitArea.on('pointerdown', () => {
        this.showToast(`Tier ${element.tier} unlocks at Coach Level ${tierUnlockLevel(element.tier)}`);
      });
    } else {
      hitArea.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.panel);
        bg.fillRect(x, y, w, h);
        bg.lineStyle(1, COLORS.gold, 0.8);
        bg.strokeRect(x, y, w, h);
        bg.fillStyle(catColor);
        bg.fillRect(x, y, 4, h);
      });
      hitArea.on('pointerout', drawNormal);
      hitArea.on('pointerdown', () => this.addElementToRoutine(element));
    }
    this.catalogItems.push(hitArea);
  }

  private drawLockIcon(cx: number, cy: number): void {
    const g = this.add.graphics();
    const bodyW = 10;
    const bodyH = 8;
    const bodyX = cx - bodyW / 2;
    const bodyY = cy - 1;
    g.fillStyle(0x888888);
    g.fillRect(bodyX, bodyY, bodyW, bodyH);
    g.lineStyle(2, 0x888888);
    g.beginPath();
    g.arc(cx, bodyY, bodyW / 2 - 1, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360));
    g.strokePath();
    g.fillStyle(0x16213e);
    g.fillCircle(cx, bodyY + bodyH / 2 + 1, 1);
    this.catalogItems.push(g);
  }

  private addElementToRoutine(element: ElementData): void {
    if (this.routine.slots.length >= MAX_ROUTINE_SLOTS) {
      this.showToast('Routine is full! (8 elements max)');
      return;
    }
    this.routine.slots.push({
      elementId: element.id,
      formationId: 'straight-line',
    });
    this.rebuildTimeline();
    this.updateValidation();
  }

  private showToast(message: string): void {
    const toast = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, message, {
      fontFamily: 'monospace', fontSize: '18px', color: '#e74c3c',
      backgroundColor: '#16213e', padding: { x: 16, y: 8 },
    }).setOrigin(0.5);
    toast.setDepth(100);
    this.tweens.add({
      targets: toast, alpha: 0, y: toast.y - 40,
      duration: 1200, delay: 600,
      onComplete: () => toast.destroy(),
    });
  }

  // ── Routine Timeline ──────────────────────────────────────

  private rebuildTimeline(): void {
    this.timelineItems.forEach(obj => obj.destroy());
    this.timelineItems = [];

    if (this.routine.slots.length === 0) {
      const hint = this.add.text(TIMELINE_X + TIMELINE_W / 2, TIMELINE_Y + 240,
        'Click elements on the left\nto build your routine!', {
          fontFamily: 'monospace', fontSize: '16px', color: '#555555', align: 'center',
        }).setOrigin(0.5);
      this.timelineItems.push(hint);
    }

    for (let i = 0; i < MAX_ROUTINE_SLOTS; i++) {
      this.createTimelineSlot(i);
    }
  }

  private createTimelineSlot(index: number): void {
    const slotX = TIMELINE_X + 12;
    const slotY = TIMELINE_Y + 32 + index * (SLOT_H + 6);
    const bgX = slotX + 28;
    const bgW = TIMELINE_W - 24 - 28;

    const num = this.add.text(slotX + 4, slotY + SLOT_H / 2, `${index + 1}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#3282b8',
    }).setOrigin(0, 0.5);
    this.timelineItems.push(num);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.dark);
    bg.fillRect(bgX, slotY, bgW, SLOT_H);
    bg.lineStyle(1, COLORS.panelBorder, 0.3);
    bg.strokeRect(bgX, slotY, bgW, SLOT_H);
    this.timelineItems.push(bg);

    const slot = this.routine.slots[index];
    const element = slot ? this.elementLookup.get(slot.elementId) : null;

    if (element) {
      const name = this.add.text(bgX + 12, slotY + SLOT_H / 2, element.name, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      }).setOrigin(0, 0.5);
      this.timelineItems.push(name);

      const ddT = this.add.text(bgX + bgW - 90, slotY + 8, `DD ${element.difficulty.toFixed(1)}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#f0c040',
      });
      this.timelineItems.push(ddT);

      const catT = this.add.text(bgX + bgW - 90, slotY + 24, element.category, {
        fontFamily: 'monospace', fontSize: '10px', color: '#3282b8',
      });
      this.timelineItems.push(catT);

      const removeBtn = this.add.text(bgX + bgW - 20, slotY + SLOT_H / 2, 'X', {
        fontFamily: 'monospace', fontSize: '16px', color: '#e74c3c', fontStyle: 'bold',
      }).setOrigin(0.5);
      setTextInteractive(removeBtn, 10, 8);
      removeBtn.on('pointerover', () => removeBtn.setColor('#ffffff'));
      removeBtn.on('pointerout', () => removeBtn.setColor('#e74c3c'));
      removeBtn.on('pointerdown', () => {
        this.routine.slots.splice(index, 1);
        this.rebuildTimeline();
        this.updateValidation();
      });
      this.timelineItems.push(removeBtn);
    } else {
      const empty = this.add.text(bgX + 12, slotY + SLOT_H / 2, '-- empty --', {
        fontFamily: 'monospace', fontSize: '13px', color: '#333333',
      }).setOrigin(0, 0.5);
      this.timelineItems.push(empty);
    }
  }

  // ── Difficulty Meter ──────────────────────────────────────

  private buildDifficultyMeter(): void {
    const meterY = GAME_HEIGHT - 80;
    new UIPanel(this, 20, meterY, GAME_WIDTH - 40, 64);

    this.add.text(32, meterY + 8, 'DIFFICULTY', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f0c040', fontStyle: 'bold',
    });

    this.difficultyBar = this.add.graphics();
    this.validationText = this.add.text(160, meterY + 8, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
    });
    this.scoreText = this.add.text(160, meterY + 32, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#bbe1fa',
    });

    new UIButton(this, GAME_WIDTH - 200, meterY + 10, 'Save Routine', () => {
      this.routine.slots = this.routine.slots.filter(s => s.elementId !== '');
      SaveManager.save();
      this.showToast('Routine saved!');
    }, 160, 40);
  }

  private updateValidation(): void {
    const state = GameState.getInstance().get();
    const activeSwimmers = state.team.swimmers.filter(s => !s.isAlternate);
    const filledSlots = this.routine.slots.filter(s => s.elementId !== '');

    if (filledSlots.length === 0) {
      this.validationText.setText('No elements placed yet');
      this.validationText.setColor('#555555');
      this.scoreText.setText('');
      this.drawDifficultyBar(0, 'easy');
      return;
    }

    const tempRoutine: RoutineData = { ...this.routine, slots: filledSlots };
    const result = validateRoutine(tempRoutine, activeSwimmers, this.elementLookup);

    const ratingColors: Record<string, string> = {
      easy: '#2ecc71', moderate: '#f0c040', hard: '#e67e22', risky: '#e74c3c',
    };

    this.validationText.setText(
      `Total DD: ${result.totalDifficulty}  |  Rating: ${result.difficultyRating.toUpperCase()}  |  Team Avg: ${result.avgTeamStat}`
    );
    this.validationText.setColor(ratingColors[result.difficultyRating] ?? '#ffffff');
    this.scoreText.setText(
      `Est. Score Range: ${result.estimatedScore.low} - ${result.estimatedScore.high}`
    );
    this.drawDifficultyBar(result.totalDifficulty, result.difficultyRating);
  }

  private drawDifficultyBar(totalDD: number, rating: string): void {
    const barX = 32;
    const barY = GAME_HEIGHT - 42;
    const barW = 110;
    const barH = 10;

    const ratingColors: Record<string, number> = {
      easy: COLORS.green, moderate: COLORS.gold, hard: 0xe67e22, risky: COLORS.red,
    };

    this.difficultyBar.clear();
    this.difficultyBar.fillStyle(COLORS.dark);
    this.difficultyBar.fillRect(barX, barY, barW, barH);

    const fillPct = Math.min(1, totalDD / 15);
    this.difficultyBar.fillStyle(ratingColors[rating] ?? COLORS.accent);
    this.difficultyBar.fillRect(barX, barY, barW * fillPct, barH);

    this.difficultyBar.lineStyle(1, COLORS.panelBorder);
    this.difficultyBar.strokeRect(barX, barY, barW, barH);
  }
}
