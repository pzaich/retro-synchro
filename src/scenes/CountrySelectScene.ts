import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { SaveManager } from '../systems/SaveManager';
import { UIButton } from '../ui/UIButton';

const COUNTRIES = [
  'USA', 'Japan', 'Spain', 'China', 'France',
  'Brazil', 'Italy', 'Canada', 'Australia', 'Mexico',
  'South Korea', 'Ukraine', 'Germany', 'Netherlands', 'Greece',
  'Russia', 'Colombia', 'Egypt', 'Sweden', 'New Zealand',
];

export class CountrySelectScene extends Phaser.Scene {
  private selectedCountry = -1;
  private teamName = 'Walnut Creek Aquanuts';
  private inputEl: HTMLInputElement | null = null;

  constructor() {
    super('CountrySelect');
  }

  create(): void {
    this.selectedCountry = -1;

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'NEW CAREER', {
      fontFamily: 'monospace', fontSize: '32px', color: '#f0c040', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Team name input
    this.add.text(GAME_WIDTH / 2, 72, 'TEAM NAME', {
      fontFamily: 'monospace', fontSize: '14px', color: '#bbe1fa', fontStyle: 'bold',
    }).setOrigin(0.5);

    const inputHtml = `<input type="text"
      value="${this.teamName}"
      maxlength="30"
      style="
        font-family: monospace;
        font-size: 20px;
        text-align: center;
        width: 400px;
        padding: 8px 16px;
        background: #16213e;
        color: #bbe1fa;
        border: 2px solid #3282b8;
        outline: none;
      "
    />`;
    const domElement = this.add.dom(GAME_WIDTH / 2, 104).createFromHTML(inputHtml);
    this.inputEl = domElement.node.querySelector('input') as HTMLInputElement;
    if (this.inputEl) {
      this.inputEl.addEventListener('input', () => {
        this.teamName = this.inputEl?.value ?? 'Aqua Stars';
      });
    }

    // Country selection
    this.add.text(GAME_WIDTH / 2, 144, 'CHOOSE YOUR COUNTRY', {
      fontFamily: 'monospace', fontSize: '14px', color: '#bbe1fa', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 162, 'Your team represents this country at Nationals and the Olympics', {
      fontFamily: 'monospace', fontSize: '10px', color: '#3282b8',
    }).setOrigin(0.5);

    const cols = 5;
    const btnW = 220;
    const btnH = 44;
    const gapX = 12;
    const gapY = 8;
    const totalW = cols * btnW + (cols - 1) * gapX;
    const startX = (GAME_WIDTH - totalW) / 2;
    const startY = 180;

    COUNTRIES.forEach((countryName, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (btnW + gapX);
      const cy = startY + row * (btnH + gapY);
      const isSelected = i === this.selectedCountry;

      const gfx = this.add.graphics();
      if (isSelected) {
        gfx.fillStyle(COLORS.gold, 0.2);
        gfx.lineStyle(2, COLORS.gold);
      } else {
        gfx.fillStyle(COLORS.panel);
        gfx.lineStyle(1, COLORS.panelBorder);
      }
      gfx.fillRoundedRect(cx, cy, btnW, btnH, 4);
      gfx.strokeRoundedRect(cx, cy, btnW, btnH, 4);

      this.add.text(cx + 14, cy + btnH / 2, countryName, {
        fontFamily: 'monospace', fontSize: '14px',
        color: isSelected ? '#f0c040' : '#ffffff',
        fontStyle: isSelected ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);

      const hit = this.add.rectangle(cx + btnW / 2, cy + btnH / 2, btnW, btnH);
      hit.setFillStyle(0x000000, 0);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.selectedCountry = i;
        this.scene.restart();
      });
    });

    // Start button (only if country selected)
    if (this.selectedCountry >= 0) {
      const countryName = COUNTRIES[this.selectedCountry]!;

      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, `${this.teamName}  —  ${countryName}`, {
        fontFamily: 'monospace', fontSize: '20px', color: '#bbe1fa',
      }).setOrigin(0.5);

      new UIButton(this, GAME_WIDTH / 2 - 110, GAME_HEIGHT - 66, 'Start Career!', () => {
        const name = this.inputEl?.value?.trim() || 'Aqua Stars';
        SaveManager.newGame(name, countryName);
        this.scene.start('Manage');
      }, 220, 44);
    }
  }
}
