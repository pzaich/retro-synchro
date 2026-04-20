import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, MAX_SWIMMER_STAT } from '../config';
import { GameState } from '../systems/GameState';
import { SaveManager } from '../systems/SaveManager';
import { SwimmerData, createSwimmer } from '../entities/Swimmer';
import { UIButton } from '../ui/UIButton';
import { createSwimmerPortrait } from '../ui/SwimmerSprite';
import { setTextInteractive } from '../ui/hitArea';

const TRADE_NAMES_FIRST = [
  'Bianca', 'Yuna', 'Astrid', 'Priya', 'Naomi', 'Katya', 'Lila', 'Ximena',
  'Aisha', 'Daphne', 'Fern', 'Greta', 'Hina', 'Juno', 'Keiko', 'Margot',
];
const TRADE_NAMES_LAST = [
  'Osman', 'Zheng', 'Patel', 'Hoffman', 'Nunes', 'Kwon', 'Blom', 'Varga',
  'Sato', 'Ruiz', 'Melo', 'Strand', 'Kato', 'Bianchi', 'Wells', 'Nair',
];

interface TradeOffer {
  theirSwimmer: SwimmerData;
  wantIndex: number; // index in your roster they want
}

export class TradeScene extends Phaser.Scene {
  private offers: TradeOffer[] = [];
  private selectedOffer = -1;

  constructor() {
    super('Trade');
  }

  create(): void {
    const state = GameState.getInstance().get();
    this.selectedOffer = -1;

    // Generate 3 trade offers
    this.offers = this.generateOffers(state);

    // Header
    new UIButton(this, 20, 16, '< Back', () => {
      this.scene.start('Manage');
    }, 120, 36);

    this.add.text(GAME_WIDTH / 2, 30, 'TRADE CENTER', {
      fontFamily: 'monospace', fontSize: '28px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 58, 'Other teams want to trade! Review the offers below.', {
      fontFamily: 'monospace', fontSize: '13px', color: '#3282b8',
    }).setOrigin(0.5);

    // Propose trade button
    new UIButton(this, GAME_WIDTH - 230, 12, 'Propose Trade', () => {
      this.scene.start('ProposeTrade');
    }, 180, 36);

    if (this.offers.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No trade offers right now.\nWin more matches to attract interest!', {
        fontFamily: 'monospace', fontSize: '16px', color: '#555555', align: 'center',
      }).setOrigin(0.5);
      return;
    }

    // Render each offer
    const offerH = 180;
    const startY = 80;

    this.offers.forEach((offer, i) => {
      const oy = startY + i * (offerH + 12);
      const isSelected = i === this.selectedOffer;
      const yourSwimmer = state.team.swimmers[offer.wantIndex]!;

      // Offer panel
      const panel = this.add.graphics();
      if (isSelected) {
        panel.fillStyle(COLORS.gold, 0.1);
        panel.lineStyle(2, COLORS.gold);
      } else {
        panel.fillStyle(COLORS.panel);
        panel.lineStyle(1, COLORS.panelBorder);
      }
      panel.fillRoundedRect(40, oy, GAME_WIDTH - 80, offerH, 4);
      panel.strokeRoundedRect(40, oy, GAME_WIDTH - 80, offerH, 4);

      // "YOU GIVE" side (left)
      this.add.text(80, oy + 8, 'YOU GIVE', {
        fontFamily: 'monospace', fontSize: '12px', color: '#e74c3c', fontStyle: 'bold',
      });
      this.drawSwimmerCard(80, oy + 28, yourSwimmer, 460);

      // Arrow
      this.add.text(GAME_WIDTH / 2, oy + offerH / 2, '⟷', {
        fontFamily: 'monospace', fontSize: '32px', color: '#f0c040',
      }).setOrigin(0.5);

      // "YOU GET" side (right)
      this.add.text(GAME_WIDTH / 2 + 80, oy + 8, 'YOU GET', {
        fontFamily: 'monospace', fontSize: '12px', color: '#2ecc71', fontStyle: 'bold',
      });
      this.drawSwimmerCard(GAME_WIDTH / 2 + 80, oy + 28, offer.theirSwimmer, 460);

      // Accept button directly on each offer
      new UIButton(this, GAME_WIDTH - 220, oy + offerH - 50, 'Accept', () => {
        this.acceptTrade(offer);
      }, 140, 36);

      // Decline button
      const declineBtn = this.add.text(GAME_WIDTH - 220, oy + offerH - 8, 'Decline', {
        fontFamily: 'monospace', fontSize: '11px', color: '#888888',
      });
      setTextInteractive(declineBtn, 16, 8);
      declineBtn.on('pointerover', () => declineBtn.setColor('#e74c3c'));
      declineBtn.on('pointerout', () => declineBtn.setColor('#888888'));
      declineBtn.on('pointerdown', () => {
        this.offers.splice(i, 1);
        this.scene.restart();
      });
    });

  }

  private generateOffers(state: GameStateData): TradeOffer[] {
    const offers: TradeOffer[] = [];
    const seasonNum = state.seasonNumber ?? 1;
    const numOffers = Math.min(3, 1 + Math.floor(state.competitionsWon / 4));
    const usedIndices = new Set<number>();
    const usedNames = new Set(state.team.swimmers.map(s => s.name));

    for (let o = 0; o < numOffers; o++) {
      // Pick a roster member they want (prefer weaker swimmers for fair trades)
      let wantIndex: number;
      let attempts = 0;
      do {
        wantIndex = Math.floor(Math.random() * state.team.swimmers.length);
        attempts++;
      } while (usedIndices.has(wantIndex) && attempts < 20);
      if (usedIndices.has(wantIndex)) continue;
      usedIndices.add(wantIndex);

      const yourSwimmer = state.team.swimmers[wantIndex]!;
      const yourOverall = (yourSwimmer.stats.artistry + yourSwimmer.stats.athleticism + yourSwimmer.stats.endurance) / 3;

      // Generate their swimmer — slightly better or different specialty
      let name: string;
      do {
        const first = TRADE_NAMES_FIRST[Math.floor(Math.random() * TRADE_NAMES_FIRST.length)]!;
        const last = TRADE_NAMES_LAST[Math.floor(Math.random() * TRADE_NAMES_LAST.length)]!;
        name = `${first} ${last}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      const bonus = seasonNum * 0.3;
      const minS = Math.max(1, Math.floor(yourOverall - 1 + bonus));
      const maxS = Math.min(MAX_SWIMMER_STAT, Math.ceil(yourOverall + 2 + bonus));

      const theirSwimmer = createSwimmer(name, {
        artistry: randStat(minS, maxS),
        athleticism: randStat(minS, maxS),
        endurance: randStat(minS, maxS),
      });

      offers.push({ theirSwimmer, wantIndex });
    }

    return offers;
  }

  private drawSwimmerCard(x: number, y: number, swimmer: SwimmerData, _maxW: number): void {
    createSwimmerPortrait(this, x + 16, y + 28, swimmer, 'small');

    this.add.text(x + 36, y + 4, swimmer.name, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
    });

    const tag = swimmer.isAlternate ? ' (ALT)' : '';
    const specColors: Record<string, string> = {
      lifts: '#e74c3c', spins: '#f39c12', figures: '#9b59b6',
      sculls: '#1abc9c', formations: '#2ecc71', 'all-rounder': '#3282b8',
    };

    this.add.text(x + 36, y + 22, `Lv${swimmer.level} | ${swimmer.specialty}${tag}`, {
      fontFamily: 'monospace', fontSize: '10px',
      color: specColors[swimmer.specialty] ?? '#3282b8',
    });

    this.add.text(x + 36, y + 38, swimmer.personality, {
      fontFamily: 'monospace', fontSize: '9px', color: '#f0c040',
    });

    // Stats inline
    const statsX = x + 36;
    const statsY = y + 56;
    const barW = 60;
    this.drawMiniStat(statsX, statsY, 'A', swimmer.stats.artistry, barW);
    this.drawMiniStat(statsX + 100, statsY, 'T', swimmer.stats.athleticism, barW);
    this.drawMiniStat(statsX + 200, statsY, 'E', swimmer.stats.endurance, barW);

    const overall = ((swimmer.stats.artistry + swimmer.stats.athleticism + swimmer.stats.endurance) / 3).toFixed(1);
    this.add.text(statsX + 310, statsY + 2, `OVR ${overall}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
    });
  }

  private drawMiniStat(x: number, y: number, label: string, value: number, barW: number): void {
    this.add.text(x, y + 2, label, {
      fontFamily: 'monospace', fontSize: '9px', color: '#3282b8',
    });
    const gfx = this.add.graphics();
    const bx = x + 12;
    gfx.fillStyle(COLORS.dark);
    gfx.fillRect(bx, y, barW, 10);
    const color = value >= 7 ? COLORS.green : value >= 4 ? COLORS.gold : COLORS.red;
    gfx.fillStyle(color);
    gfx.fillRect(bx, y, barW * (value / MAX_SWIMMER_STAT), 10);
    this.add.text(bx + barW + 4, y, `${value}`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#ffffff',
    });
  }

  private acceptTrade(offer: TradeOffer): void {
    const state = GameState.getInstance().get();
    const yourSwimmer = state.team.swimmers[offer.wantIndex]!;

    // New swimmer inherits alternate status
    offer.theirSwimmer.isAlternate = yourSwimmer.isAlternate;
    state.team.swimmers[offer.wantIndex] = offer.theirSwimmer;

    SaveManager.save();
    this.scene.start('Manage');
  }
}

// Need this import for the type
import { GameStateData } from '../systems/GameState';

function randStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
