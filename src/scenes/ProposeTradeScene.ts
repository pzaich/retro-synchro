import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, MAX_SWIMMER_STAT } from '../config';
import { GameState, GameStateData } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { SwimmerData, createSwimmer } from '../entities/Swimmer';
import { UIButton } from '../ui/UIButton';
import { UIPanel } from '../ui/UIPanel';
import { createSwimmerPortrait } from '../ui/SwimmerSprite';

const TRADE_FIRST = [
  'Tatiana', 'Miyu', 'Adriana', 'Xiuying', 'Helga', 'Paloma', 'Anika', 'Sakura',
  'Dagny', 'Reina', 'Liora', 'Simone', 'Chiara', 'Miko', 'Esme', 'Zara',
];
const TRADE_LAST = [
  'Orlov', 'Hayashi', 'Mendez', 'Fang', 'Brandt', 'Sousa', 'Bakker', 'Aoki',
  'Holm', 'Castillo', 'Levy', 'Adeyemi', 'Brun', 'Tanaka', 'Voss', 'Shah',
];

type Phase = 'pick-yours' | 'view-offers';

export class ProposeTradeScene extends Phaser.Scene {
  private phase: Phase = 'pick-yours';
  private yourIndex = -1;
  private returnOffers: SwimmerData[] = [];
  private selectedOffer = -1;

  constructor() {
    super('ProposeTrade');
  }

  create(): void {
    this.phase = 'pick-yours';
    this.yourIndex = -1;
    this.returnOffers = [];
    this.selectedOffer = -1;
    this.buildUI();
  }

  private buildUI(): void {
    this.children.removeAll();

    if (this.phase === 'pick-yours') {
      this.buildPickPhase();
    } else {
      this.buildOffersPhase();
    }
  }

  private buildPickPhase(): void {
    const state = GameState.getInstance().get();

    new UIButton(this, 20, 16, '< Back', () => {
      this.scene.start('Trade');
    }, 120, 36);

    this.add.text(GAME_WIDTH / 2, 28, 'PROPOSE A TRADE', {
      fontFamily: 'monospace', fontSize: '26px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 56, 'Pick one of your swimmers to put on the trade block:', {
      fontFamily: 'monospace', fontSize: '13px', color: '#3282b8',
    }).setOrigin(0.5);

    new UIPanel(this, 40, 74, GAME_WIDTH - 80, 530);

    state.team.swimmers.forEach((swimmer, i) => {
      const rowY = 86 + i * 50;
      const isSelected = i === this.yourIndex;

      const gfx = this.add.graphics();
      if (isSelected) {
        gfx.fillStyle(COLORS.gold, 0.15);
        gfx.lineStyle(1, COLORS.gold, 0.6);
      } else {
        gfx.fillStyle(COLORS.dark, 0.4);
        gfx.lineStyle(1, COLORS.panelBorder, 0.2);
      }
      gfx.fillRect(52, rowY, GAME_WIDTH - 104, 44);
      gfx.strokeRect(52, rowY, GAME_WIDTH - 104, 44);

      createSwimmerPortrait(this, 74, rowY + 22, swimmer, 'small');

      const tag = swimmer.isAlternate ? ' (ALT)' : '';
      this.add.text(96, rowY + 6, `${swimmer.name}${tag}`, {
        fontFamily: 'monospace', fontSize: '14px', color: isSelected ? '#f0c040' : '#ffffff',
      });
      this.add.text(96, rowY + 24, `Lv${swimmer.level} | ${swimmer.specialty} | ART ${swimmer.stats.artistry} ATH ${swimmer.stats.athleticism} END ${swimmer.stats.endurance}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#3282b8',
      });

      const overall = ((swimmer.stats.artistry + swimmer.stats.athleticism + swimmer.stats.endurance) / 3).toFixed(1);
      this.add.text(GAME_WIDTH - 120, rowY + 14, `OVR ${overall}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
      });

      const hit = this.add.rectangle(GAME_WIDTH / 2, rowY + 22, GAME_WIDTH - 104, 44);
      hit.setFillStyle(0x000000, 0);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.yourIndex = i;
        this.buildUI();
      });
    });

    if (this.yourIndex >= 0) {
      const s = state.team.swimmers[this.yourIndex]!;
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 86, `Shopping: ${s.name}`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#bbe1fa',
      }).setOrigin(0.5);

      new UIButton(this, GAME_WIDTH / 2 - 110, GAME_HEIGHT - 58, 'See Offers', () => {
        this.generateReturnOffers(state);
        this.phase = 'view-offers';
        this.buildUI();
      }, 220, 40);
    }
  }

  private generateReturnOffers(state: GameStateData): void {
    const yours = state.team.swimmers[this.yourIndex]!;
    const yourOverall = (yours.stats.artistry + yours.stats.athleticism + yours.stats.endurance) / 3;
    const seasonNum = state.seasonNumber ?? 1;
    const usedNames = new Set(state.team.swimmers.map(s => s.name));
    this.returnOffers = [];

    // Generate 3-4 offers, some better some worse
    const count = 3 + (Math.random() > 0.5 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      let name: string;
      do {
        const first = TRADE_FIRST[Math.floor(Math.random() * TRADE_FIRST.length)]!;
        const last = TRADE_LAST[Math.floor(Math.random() * TRADE_LAST.length)]!;
        name = `${first} ${last}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      // Vary quality: some upgrades, some sidegrades, some downgrades
      const qualityRoll = Math.random();
      let bonus: number;
      if (qualityRoll > 0.7) bonus = 1 + seasonNum * 0.2; // upgrade
      else if (qualityRoll > 0.3) bonus = seasonNum * 0.1; // sidegrade
      else bonus = -0.5; // slight downgrade

      const minS = Math.max(1, Math.floor(yourOverall - 1 + bonus));
      const maxS = Math.min(MAX_SWIMMER_STAT, Math.ceil(yourOverall + 1 + bonus));

      this.returnOffers.push(createSwimmer(name, {
        artistry: randStat(minS, maxS),
        athleticism: randStat(minS, maxS),
        endurance: randStat(minS, maxS),
      }));
    }
  }

  private buildOffersPhase(): void {
    const state = GameState.getInstance().get();
    const yours = state.team.swimmers[this.yourIndex]!;

    new UIButton(this, 20, 16, '< Back', () => {
      this.phase = 'pick-yours';
      this.selectedOffer = -1;
      this.buildUI();
    }, 120, 36);

    this.add.text(GAME_WIDTH / 2, 28, 'TRADE OFFERS', {
      fontFamily: 'monospace', fontSize: '26px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 56, `Teams interested in ${yours.name}:`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#3282b8',
    }).setOrigin(0.5);

    // Your swimmer card (left side reference)
    new UIPanel(this, 40, 76, 360, 200);
    this.add.text(54, 84, 'YOUR PLAYER', {
      fontFamily: 'monospace', fontSize: '12px', color: '#e74c3c', fontStyle: 'bold',
    });
    createSwimmerPortrait(this, 74, 134, yours, 'large');
    this.add.text(130, 100, yours.name, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    });
    this.add.text(130, 118, `Lv${yours.level} | ${yours.specialty} | ${yours.personality}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#3282b8',
    });
    this.add.text(130, 138, `ART ${yours.stats.artistry}  ATH ${yours.stats.athleticism}  END ${yours.stats.endurance}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#888888',
    });
    const yourOvr = ((yours.stats.artistry + yours.stats.athleticism + yours.stats.endurance) / 3).toFixed(1);
    this.add.text(130, 158, `Overall: ${yourOvr}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    });

    // Return offers (right side)
    this.returnOffers.forEach((offer, i) => {
      const cardX = 420;
      const cardY = 76 + i * 146;
      const cardW = GAME_WIDTH - 460;
      const cardH = 138;
      const isSelected = i === this.selectedOffer;

      const gfx = this.add.graphics();
      if (isSelected) {
        gfx.fillStyle(COLORS.gold, 0.15);
        gfx.lineStyle(2, COLORS.gold);
      } else {
        gfx.fillStyle(COLORS.panel);
        gfx.lineStyle(1, COLORS.panelBorder);
      }
      gfx.fillRoundedRect(cardX, cardY, cardW, cardH, 4);
      gfx.strokeRoundedRect(cardX, cardY, cardW, cardH, 4);

      createSwimmerPortrait(this, cardX + 30, cardY + 44, offer, 'large');

      this.add.text(cardX + 80, cardY + 10, offer.name, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
      });
      this.add.text(cardX + 80, cardY + 28, `${offer.nationality} | Age ${offer.age} | ${offer.specialty}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#3282b8',
      });
      this.add.text(cardX + 80, cardY + 44, offer.personality, {
        fontFamily: 'monospace', fontSize: '9px', color: '#f0c040',
      });

      // Stats
      this.add.text(cardX + 80, cardY + 64, `ART ${offer.stats.artistry}  ATH ${offer.stats.athleticism}  END ${offer.stats.endurance}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#888888',
      });
      const ovr = ((offer.stats.artistry + offer.stats.athleticism + offer.stats.endurance) / 3).toFixed(1);
      const ovrDiff = parseFloat(ovr) - parseFloat(yourOvr);
      const diffStr = ovrDiff >= 0 ? `+${ovrDiff.toFixed(1)}` : ovrDiff.toFixed(1);
      const diffColor = ovrDiff >= 0 ? '#2ecc71' : '#e74c3c';
      this.add.text(cardX + 80, cardY + 84, `Overall: ${ovr}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      });
      this.add.text(cardX + 200, cardY + 84, `(${diffStr})`, {
        fontFamily: 'monospace', fontSize: '13px', color: diffColor,
      });

      // Bio
      this.add.text(cardX + 80, cardY + 104, `"${offer.bio}"`, {
        fontFamily: 'monospace', fontSize: '8px', color: '#555555', fontStyle: 'italic',
        wordWrap: { width: cardW - 100 },
      });

      const hit = this.add.rectangle(cardX + cardW / 2, cardY + cardH / 2, cardW, cardH);
      hit.setFillStyle(0x000000, 0);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.selectedOffer = i;
        this.buildUI();
      });
    });

    // Confirm
    if (this.selectedOffer >= 0) {
      const picked = this.returnOffers[this.selectedOffer]!;
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 86, `Trade ${yours.name} for ${picked.name}?`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#bbe1fa',
      }).setOrigin(0.5);

      new UIButton(this, GAME_WIDTH / 2 - 110, GAME_HEIGHT - 58, 'Confirm Trade', () => {
        picked.isAlternate = yours.isAlternate;
        state.team.swimmers[this.yourIndex] = picked;
        SaveManager.save();
        this.scene.start('Manage');
      }, 220, 40);
    }

    new UIButton(this, GAME_WIDTH - 200, GAME_HEIGHT - 58, 'No Deal', () => {
      this.scene.start('Trade');
    }, 140, 40);
  }
}

function randStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
