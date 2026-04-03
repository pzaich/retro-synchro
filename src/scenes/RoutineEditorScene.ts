import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { GameState } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { ElementData } from '../entities/Element';
import { RoutineData, RoutineSlot, createRoutine } from '../entities/Routine';
import { validateRoutine } from '../systems/RoutineValidator';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';
import { ElementCard } from '../ui/ElementCard';
import elementsData from '../data/elements.json';

const MAX_ROUTINE_SLOTS = 8;
const TIMELINE_X = 540;
const TIMELINE_Y = 90;
const TIMELINE_W = 700;
const SLOT_H = 48;

const ELEMENT_LIST_X = 20;
const ELEMENT_LIST_Y = 90;
const ELEMENT_LIST_W = 260;

export class RoutineEditorScene extends Phaser.Scene {
  private allElements: ElementData[] = [];
  private elementLookup = new Map<string, ElementData>();
  private routine!: RoutineData;
  private slotGraphics: Phaser.GameObjects.Container[] = [];
  private validationText!: Phaser.GameObjects.Text;
  private difficultyBar!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private selectedElement: ElementData | null = null;
  private elementCards: ElementCard[] = [];
  private scrollOffset = 0;
  private elementListMask!: Phaser.Display.Masks.GeometryMask;
  private elementListContainer!: Phaser.GameObjects.Container;
  private filterCategory: string = 'all';

  constructor() {
    super('RoutineEditor');
  }

  create(): void {
    const state = GameState.getInstance().get();

    // Load elements (filter by coach level / tier)
    this.allElements = (elementsData as ElementData[]).filter(
      e => e.tier <= Math.ceil(state.coachLevel / 2) + 1
    );
    this.elementLookup.clear();
    for (const el of elementsData as ElementData[]) {
      this.elementLookup.set(el.id, el);
    }

    // Load or create routine
    if (state.routines.length > 0) {
      this.routine = state.routines[0]!;
    } else {
      this.routine = createRoutine('Routine 1');
      state.routines.push(this.routine);
    }

    this.selectedElement = null;
    this.scrollOffset = 0;

    // Header
    new UIButton(this, 20, 16, '< Back', () => {
      SaveManager.save();
      this.scene.start('Manage');
    }, 120, 36);

    this.add.text(GAME_WIDTH / 2, 34, 'ROUTINE EDITOR', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#bbe1fa',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 62, this.routine.name, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#3282b8',
    }).setOrigin(0.5);

    // Left panel: Element catalog
    this.buildElementCatalog();

    // Right panel: Timeline
    this.buildTimeline();

    // Bottom: Difficulty meter
    this.buildDifficultyMeter();

    // Initial validation
    this.updateValidation();
  }

  private buildElementCatalog(): void {
    new UIPanel(this, ELEMENT_LIST_X, ELEMENT_LIST_Y, ELEMENT_LIST_W + 240, GAME_HEIGHT - 180);

    this.add.text(ELEMENT_LIST_X + 12, ELEMENT_LIST_Y + 8, 'ELEMENTS', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    // Category filter buttons
    const categories = ['all', 'position', 'figure', 'scull', 'spin', 'formation'];
    const filterY = ELEMENT_LIST_Y + 32;
    categories.forEach((cat, i) => {
      const bx = ELEMENT_LIST_X + 12 + i * 78;
      const label = cat === 'all' ? 'ALL' : cat.substring(0, 4).toUpperCase();
      const btn = this.add.text(bx, filterY, label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: this.filterCategory === cat ? '#f0c040' : '#3282b8',
        backgroundColor: this.filterCategory === cat ? '#16213e' : undefined,
        padding: { x: 4, y: 2 },
      });
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.filterCategory = cat;
        this.scrollOffset = 0;
        this.rebuildElementList();
      });
    });

    // Scrollable element list
    const listY = filterY + 28;
    const listH = GAME_HEIGHT - 180 - 70;

    // Create mask for scrolling
    const maskShape = this.add.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(ELEMENT_LIST_X, listY, ELEMENT_LIST_W + 230, listH);
    maskShape.setVisible(false);
    this.elementListMask = new Phaser.Display.Masks.GeometryMask(this, maskShape);

    this.elementListContainer = this.add.container(0, 0);
    this.elementListContainer.setMask(this.elementListMask);

    this.rebuildElementList();

    // Scroll with mouse wheel
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _dx: number, dy: number) => {
      const maxScroll = Math.max(0, this.elementCards.length * 50 - (listH - 10));
      this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + dy * 0.5, 0, maxScroll);
      this.updateElementListPositions();
    });
  }

  private rebuildElementList(): void {
    // Clear old cards
    this.elementCards.forEach(c => c.destroy());
    this.elementCards = [];
    this.elementListContainer.removeAll();

    const filtered = this.filterCategory === 'all'
      ? this.allElements
      : this.allElements.filter(e => e.category === this.filterCategory);

    const listY = ELEMENT_LIST_Y + 60;
    const cardW = ELEMENT_LIST_W + 210;

    filtered.forEach((element, i) => {
      const card = new ElementCard(
        this,
        ELEMENT_LIST_X + 10,
        listY + i * 50,
        element,
        cardW,
        44,
        (el) => this.onElementSelected(el),
      );
      this.elementListContainer.add(card);
      this.elementCards.push(card);
    });

    this.updateElementListPositions();
  }

  private updateElementListPositions(): void {
    const listY = ELEMENT_LIST_Y + 60;
    this.elementCards.forEach((card, i) => {
      card.y = listY + i * 50 - this.scrollOffset;
    });
  }

  private onElementSelected(element: ElementData): void {
    this.selectedElement = element;
    this.elementCards.forEach(c => c.setSelected(c.element.id === element.id));
  }

  private buildTimeline(): void {
    new UIPanel(this, TIMELINE_X, TIMELINE_Y, TIMELINE_W, GAME_HEIGHT - 180);

    this.add.text(TIMELINE_X + 12, TIMELINE_Y + 8, 'ROUTINE TIMELINE', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    this.add.text(TIMELINE_X + 12, TIMELINE_Y + 30, 'Click a slot, then select an element to place it.', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#3282b8',
    });

    this.slotGraphics = [];
    for (let i = 0; i < MAX_ROUTINE_SLOTS; i++) {
      this.createTimelineSlot(i);
    }
  }

  private createTimelineSlot(index: number): void {
    const slotX = TIMELINE_X + 12;
    const slotY = TIMELINE_Y + 56 + index * (SLOT_H + 8);
    const slotW = TIMELINE_W - 24;

    const container = this.add.container(slotX, slotY);
    this.slotGraphics.push(container);

    // Slot number
    const numText = this.add.text(4, SLOT_H / 2, `${index + 1}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#3282b8',
    });
    numText.setOrigin(0, 0.5);
    container.add(numText);

    // Slot background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.dark);
    bg.fillRect(30, 0, slotW - 30, SLOT_H);
    bg.lineStyle(1, COLORS.panelBorder, 0.4);
    bg.strokeRect(30, 0, slotW - 30, SLOT_H);
    container.add(bg);

    // Content (element name or empty prompt)
    const existingSlot = this.routine.slots[index];
    const element = existingSlot ? this.elementLookup.get(existingSlot.elementId) : null;

    const contentText = this.add.text(44, SLOT_H / 2, element ? element.name : '[ Empty - click to assign ]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: element ? '#ffffff' : '#555555',
    });
    contentText.setOrigin(0, 0.5);
    container.add(contentText);

    if (element) {
      const ddText = this.add.text(slotW - 100, SLOT_H / 2 - 8, `DD ${element.difficulty.toFixed(1)}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#f0c040',
      });
      container.add(ddText);

      const catText = this.add.text(slotW - 100, SLOT_H / 2 + 6, element.category, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3282b8',
      });
      container.add(catText);

      // Remove button
      const removeBtn = this.add.text(slotW - 16, SLOT_H / 2, 'X', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#e74c3c',
      });
      removeBtn.setOrigin(0.5);
      removeBtn.setInteractive({ useHandCursor: true });
      removeBtn.on('pointerdown', () => {
        this.routine.slots.splice(index, 1);
        this.refreshTimeline();
        this.updateValidation();
      });
      container.add(removeBtn);
    }

    // Make slot clickable to assign selected element
    const hitZone = this.add.zone(30 + (slotW - 30) / 2, SLOT_H / 2, slotW - 60, SLOT_H);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      if (this.selectedElement) {
        const newSlot: RoutineSlot = {
          elementId: this.selectedElement.id,
          formationId: 'straight-line',
        };
        if (index < this.routine.slots.length) {
          this.routine.slots[index] = newSlot;
        } else {
          // Fill gaps if needed
          while (this.routine.slots.length < index) {
            this.routine.slots.push({ elementId: '', formationId: 'straight-line' });
          }
          this.routine.slots[index] = newSlot;
        }
        this.refreshTimeline();
        this.updateValidation();
      }
    });
    hitZone.on('pointerover', () => {
      if (this.selectedElement) {
        bg.clear();
        bg.fillStyle(COLORS.panel);
        bg.fillRect(30, 0, slotW - 30, SLOT_H);
        bg.lineStyle(1, COLORS.gold, 0.6);
        bg.strokeRect(30, 0, slotW - 30, SLOT_H);
      }
    });
    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.dark);
      bg.fillRect(30, 0, slotW - 30, SLOT_H);
      bg.lineStyle(1, COLORS.panelBorder, 0.4);
      bg.strokeRect(30, 0, slotW - 30, SLOT_H);
    });
    container.add(hitZone);
  }

  private refreshTimeline(): void {
    // Destroy and rebuild all slots
    this.slotGraphics.forEach(c => c.destroy());
    this.slotGraphics = [];
    for (let i = 0; i < MAX_ROUTINE_SLOTS; i++) {
      this.createTimelineSlot(i);
    }
  }

  private buildDifficultyMeter(): void {
    const meterY = GAME_HEIGHT - 80;
    new UIPanel(this, 20, meterY, GAME_WIDTH - 40, 64);

    this.add.text(32, meterY + 8, 'DIFFICULTY', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f0c040',
      fontStyle: 'bold',
    });

    this.difficultyBar = this.add.graphics();
    this.validationText = this.add.text(160, meterY + 8, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
    });

    this.scoreText = this.add.text(160, meterY + 32, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#bbe1fa',
    });

    // Save button
    new UIButton(this, GAME_WIDTH - 200, meterY + 10, 'Save Routine', () => {
      // Clean empty slots
      this.routine.slots = this.routine.slots.filter(s => s.elementId !== '');
      SaveManager.save();
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
      easy: '#2ecc71',
      moderate: '#f0c040',
      hard: '#e67e22',
      risky: '#e74c3c',
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
      easy: COLORS.green,
      moderate: COLORS.gold,
      hard: 0xe67e22,
      risky: COLORS.red,
    };

    this.difficultyBar.clear();
    this.difficultyBar.fillStyle(COLORS.dark);
    this.difficultyBar.fillRect(barX, barY, barW, barH);

    const fillPct = Math.min(1, totalDD / 15); // 15 DD = full bar
    this.difficultyBar.fillStyle(ratingColors[rating] ?? COLORS.accent);
    this.difficultyBar.fillRect(barX, barY, barW * fillPct, barH);

    this.difficultyBar.lineStyle(1, COLORS.panelBorder);
    this.difficultyBar.strokeRect(barX, barY, barW, barH);
  }
}
