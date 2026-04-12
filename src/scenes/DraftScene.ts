import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, MAX_SWIMMER_STAT } from '../config';
import { GameState } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { SwimmerData, createSwimmer } from '../entities/Swimmer';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';
import { createSwimmerPortrait } from '../ui/SwimmerSprite';

const DRAFT_POOL_SIZE = 8;

const DRAFT_FIRST_NAMES = [
  'Valentina', 'Haruka', 'Ingrid', 'Camila', 'Daria', 'Freya', 'Amara', 'Suki',
  'Petra', 'Lucia', 'Kira', 'Maren', 'Elara', 'Thea', 'Rio', 'Vera',
  'Soleil', 'Nadia', 'Iris', 'Celeste',
];
const DRAFT_LAST_NAMES = [
  'Volkov', 'Takahashi', 'Eriksen', 'Ferreira', 'Novak', 'Laurent', 'Jansen', 'Cho',
  'Romero', 'Fischer', 'Okafor', 'Lindgren', 'Moreau', 'Sato', 'Reyes', 'Bakker',
  'Popov', 'Haga', 'Torres', 'Leung',
];

export class DraftScene extends Phaser.Scene {
  private draftPool: SwimmerData[] = [];
  private selectedIndex = -1;
  private replacingIndex = -1;
  private phase: 'pick' | 'replace' = 'pick';
  private infoText!: Phaser.GameObjects.Text;

  constructor() {
    super('Draft');
  }

  create(): void {
    const state = GameState.getInstance().get();
    this.selectedIndex = -1;
    this.replacingIndex = -1;
    this.phase = 'pick';


    // Generate draft pool — stronger swimmers based on season number
    const seasonBonus = Math.min((state.seasonNumber ?? 1) - 1, 4);
    this.draftPool = [];
    const usedNames = new Set(state.team.swimmers.map(s => s.name));

    for (let i = 0; i < DRAFT_POOL_SIZE; i++) {
      let name: string;
      do {
        const first = DRAFT_FIRST_NAMES[Math.floor(Math.random() * DRAFT_FIRST_NAMES.length)]!;
        const last = DRAFT_LAST_NAMES[Math.floor(Math.random() * DRAFT_LAST_NAMES.length)]!;
        name = `${first} ${last}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      const minStat = Math.min(3 + seasonBonus, 7);
      const maxStat = Math.min(6 + seasonBonus, MAX_SWIMMER_STAT);
      this.draftPool.push(createSwimmer(name, {
        artistry: randStat(minStat, maxStat),
        athleticism: randStat(minStat, maxStat),
        endurance: randStat(minStat, maxStat),
      }));
    }

    this.buildUI();
  }

  private buildUI(): void {
    // Clear
    this.children.removeAll();

    if (this.phase === 'pick') {
      this.buildPickPhase();
    } else {
      this.buildReplacePhase();
    }
  }

  private buildPickPhase(): void {
    this.add.text(GAME_WIDTH / 2, 24, 'PLAYER DRAFT', {
      fontFamily: 'monospace', fontSize: '28px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 50, 'Choose a new swimmer to add to your roster!', {
      fontFamily: 'monospace', fontSize: '13px', color: '#3282b8',
    }).setOrigin(0.5);

    const cols = 4;
    const cardW = 290;
    const cardH = 260;
    const gapX = 12;
    const gapY = 10;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (GAME_WIDTH - totalW) / 2;
    const startY = 68;

    const specColors: Record<string, string> = {
      lifts: '#e74c3c', spins: '#f39c12', figures: '#9b59b6',
      sculls: '#1abc9c', formations: '#2ecc71', 'all-rounder': '#3282b8',
    };

    this.draftPool.forEach((swimmer, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);
      const isSelected = i === this.selectedIndex;

      const gfx = this.add.graphics();
      if (isSelected) {
        gfx.fillStyle(COLORS.gold, 0.15);
        gfx.lineStyle(2, COLORS.gold);
      } else {
        gfx.fillStyle(COLORS.panel);
        gfx.lineStyle(1, COLORS.panelBorder);
      }
      gfx.fillRoundedRect(cx, cy, cardW, cardH, 4);
      gfx.strokeRoundedRect(cx, cy, cardW, cardH, 4);

      // Portrait
      createSwimmerPortrait(this, cx + 40, cy + 50, swimmer, 'large');

      // Name
      this.add.text(cx + 90, cy + 14, swimmer.name, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
      });

      // Nationality + age
      this.add.text(cx + 90, cy + 32, `${swimmer.nationality} | Age ${swimmer.age}`, {
        fontFamily: 'monospace', fontSize: '9px', color: '#3282b8',
      });

      // Specialty + personality
      this.add.text(cx + 90, cy + 50, swimmer.specialty.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '11px',
        color: specColors[swimmer.specialty] ?? '#3282b8', fontStyle: 'bold',
      });
      this.add.text(cx + 90, cy + 66, swimmer.personality, {
        fontFamily: 'monospace', fontSize: '9px', color: '#f0c040',
      });

      // Stats
      const statX = cx + 12;
      const statY = cy + 100;
      this.drawStatLine(statX, statY, 'ART', swimmer.stats.artistry, cardW - 24);
      this.drawStatLine(statX, statY + 22, 'ATH', swimmer.stats.athleticism, cardW - 24);
      this.drawStatLine(statX, statY + 44, 'END', swimmer.stats.endurance, cardW - 24);

      // Overall
      const overall = ((swimmer.stats.artistry + swimmer.stats.athleticism + swimmer.stats.endurance) / 3).toFixed(1);
      this.add.text(cx + cardW / 2, statY + 68, `Overall: ${overall}`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffffff',
      }).setOrigin(0.5);

      // Bio
      this.add.text(cx + 12, statY + 86, `"${swimmer.bio}"`, {
        fontFamily: 'monospace', fontSize: '8px', color: '#555555', fontStyle: 'italic',
        wordWrap: { width: cardW - 24 },
      });

      // Click to select
      const hit = this.add.rectangle(cx + cardW / 2, cy + cardH / 2, cardW, cardH);
      hit.setFillStyle(0x000000, 0);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.selectedIndex = i;
        this.buildUI();
      });
    });

    // Bottom bar
    this.infoText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 86, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#bbe1fa',
    }).setOrigin(0.5);

    if (this.selectedIndex >= 0) {
      const picked = this.draftPool[this.selectedIndex]!;
      this.infoText.setText(`Selected: ${picked.name} (${picked.specialty})`);

      new UIButton(this, GAME_WIDTH / 2 - 120, GAME_HEIGHT - 58, 'Draft This Player', () => {
        this.phase = 'replace';
        this.buildUI();
      }, 240, 40);
    }

    new UIButton(this, GAME_WIDTH - 180, GAME_HEIGHT - 58, 'Skip Draft', () => {
      this.scene.start('Manage');
    }, 140, 40);
  }

  private buildReplacePhase(): void {
    const state = GameState.getInstance().get();
    const picked = this.draftPool[this.selectedIndex]!;

    this.add.text(GAME_WIDTH / 2, 24, 'CHOOSE WHO TO REPLACE', {
      fontFamily: 'monospace', fontSize: '26px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 52, `Drafting: ${picked.name} (${picked.specialty}) — who leaves the roster?`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#3282b8',
    }).setOrigin(0.5);

    // Show current roster
    const panelX = 40;
    const panelY = 74;
    const panelW = GAME_WIDTH - 80;
    new UIPanel(this, panelX, panelY, panelW, 520);

    state.team.swimmers.forEach((swimmer, i) => {
      const rowY = panelY + 12 + i * 50;
      const isSelected = i === this.replacingIndex;

      // Row bg
      const gfx = this.add.graphics();
      if (isSelected) {
        gfx.fillStyle(COLORS.red, 0.15);
        gfx.lineStyle(1, COLORS.red, 0.6);
      } else {
        gfx.fillStyle(COLORS.dark, 0.5);
        gfx.lineStyle(1, COLORS.panelBorder, 0.2);
      }
      gfx.fillRect(panelX + 10, rowY, panelW - 20, 46);
      gfx.strokeRect(panelX + 10, rowY, panelW - 20, 46);

      // Portrait
      createSwimmerPortrait(this, panelX + 34, rowY + 22, swimmer, 'small');

      // Name + info
      const tag = swimmer.isAlternate ? ' (ALT)' : '';
      this.add.text(panelX + 56, rowY + 6, `${swimmer.name}${tag}`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      });
      this.add.text(panelX + 56, rowY + 24, `Lv${swimmer.level} | ${swimmer.specialty} | ${swimmer.personality}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#3282b8',
      });

      // Stats
      const statsStr = `ART ${swimmer.stats.artistry}  ATH ${swimmer.stats.athleticism}  END ${swimmer.stats.endurance}`;
      this.add.text(panelX + panelW - 260, rowY + 14, statsStr, {
        fontFamily: 'monospace', fontSize: '12px', color: '#888888',
      });

      // Click to select for replacement
      const hit = this.add.rectangle(panelX + panelW / 2, rowY + 23, panelW - 20, 46);
      hit.setFillStyle(0x000000, 0);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.replacingIndex = i;
        this.buildUI();
      });
    });

    // Confirm
    if (this.replacingIndex >= 0) {
      const replacing = state.team.swimmers[this.replacingIndex]!;
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 90, `${replacing.name} will leave. ${picked.name} will join.`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#e74c3c',
      }).setOrigin(0.5);

      new UIButton(this, GAME_WIDTH / 2 - 110, GAME_HEIGHT - 60, 'Confirm Draft', () => {
        this.confirmDraft();
      }, 220, 40);
    }

    new UIButton(this, GAME_WIDTH - 180, GAME_HEIGHT - 60, '< Back', () => {
      this.phase = 'pick';
      this.replacingIndex = -1;
      this.buildUI();
    }, 140, 40);
  }

  private confirmDraft(): void {
    const state = GameState.getInstance().get();
    const picked = this.draftPool[this.selectedIndex]!;
    const replacing = state.team.swimmers[this.replacingIndex]!;

    // The new swimmer takes the replaced swimmer's roster slot
    picked.isAlternate = replacing.isAlternate;
    state.team.swimmers[this.replacingIndex] = picked;

    SaveManager.save();
    this.scene.start('Manage');
  }

  private drawStatLine(x: number, y: number, label: string, value: number, width: number): void {
    this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '10px', color: '#3282b8',
    });

    const barX = x + 30;
    const barW = width - 60;
    const barH = 10;
    const gfx = this.add.graphics();
    gfx.fillStyle(COLORS.dark);
    gfx.fillRect(barX, y + 2, barW, barH);
    const pct = value / MAX_SWIMMER_STAT;
    const color = value >= 7 ? COLORS.green : value >= 4 ? COLORS.gold : COLORS.red;
    gfx.fillStyle(color);
    gfx.fillRect(barX, y + 2, barW * pct, barH);
    gfx.lineStyle(1, COLORS.panelBorder, 0.4);
    gfx.strokeRect(barX, y + 2, barW, barH);

    this.add.text(barX + barW + 4, y, `${value}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
    });
  }
}

function randStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
