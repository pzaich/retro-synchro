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

function drawFlag(g: Phaser.GameObjects.Graphics, country: string, x: number, y: number, w: number, h: number): void {
  switch (country) {
    case 'USA': {
      g.fillStyle(0xb22234); g.fillRect(x, y, w, h);
      g.fillStyle(0xffffff);
      const sh = h / 7;
      for (let i = 1; i < 7; i += 2) g.fillRect(x, y + i * sh, w, sh);
      g.fillStyle(0x3c3b6e); g.fillRect(x, y, w * 0.4, sh * 4);
      break;
    }
    case 'Japan': {
      g.fillStyle(0xffffff); g.fillRect(x, y, w, h);
      g.fillStyle(0xbc002d); g.fillCircle(x + w / 2, y + h / 2, h * 0.3);
      break;
    }
    case 'Spain': {
      g.fillStyle(0xaa151b); g.fillRect(x, y, w, h);
      g.fillStyle(0xf1bf00); g.fillRect(x, y + h * 0.25, w, h * 0.5);
      break;
    }
    case 'China': {
      g.fillStyle(0xde2910); g.fillRect(x, y, w, h);
      g.fillStyle(0xffde00);
      g.fillCircle(x + w * 0.22, y + h * 0.32, 2.5);
      g.fillCircle(x + w * 0.38, y + h * 0.18, 1);
      g.fillCircle(x + w * 0.44, y + h * 0.34, 1);
      g.fillCircle(x + w * 0.44, y + h * 0.54, 1);
      g.fillCircle(x + w * 0.38, y + h * 0.7, 1);
      break;
    }
    case 'France': {
      g.fillStyle(0x0055a4); g.fillRect(x, y, w / 3, h);
      g.fillStyle(0xffffff); g.fillRect(x + w / 3, y, w / 3, h);
      g.fillStyle(0xef4135); g.fillRect(x + (2 * w) / 3, y, w / 3, h);
      break;
    }
    case 'Brazil': {
      g.fillStyle(0x009c3b); g.fillRect(x, y, w, h);
      g.fillStyle(0xffdf00);
      g.fillTriangle(x + w / 2, y + 2, x + w - 3, y + h / 2, x + w / 2, y + h - 2);
      g.fillTriangle(x + w / 2, y + 2, x + 3, y + h / 2, x + w / 2, y + h - 2);
      g.fillStyle(0x002776); g.fillCircle(x + w / 2, y + h / 2, h * 0.2);
      break;
    }
    case 'Italy': {
      g.fillStyle(0x009246); g.fillRect(x, y, w / 3, h);
      g.fillStyle(0xffffff); g.fillRect(x + w / 3, y, w / 3, h);
      g.fillStyle(0xce2b37); g.fillRect(x + (2 * w) / 3, y, w / 3, h);
      break;
    }
    case 'Canada': {
      g.fillStyle(0xff0000); g.fillRect(x, y, w / 4, h);
      g.fillStyle(0xffffff); g.fillRect(x + w / 4, y, w / 2, h);
      g.fillStyle(0xff0000); g.fillRect(x + (3 * w) / 4, y, w / 4, h);
      g.fillStyle(0xff0000); g.fillCircle(x + w / 2, y + h / 2, 3);
      break;
    }
    case 'Australia': {
      g.fillStyle(0x012169); g.fillRect(x, y, w, h);
      g.fillStyle(0xffffff);
      g.fillRect(x, y + h * 0.22, w * 0.4, 1.5);
      g.fillRect(x + w * 0.18, y, 1.5, h * 0.5);
      g.fillStyle(0xffffff);
      g.fillCircle(x + w * 0.75, y + h * 0.55, 1.2);
      g.fillCircle(x + w * 0.62, y + h * 0.3, 1);
      g.fillCircle(x + w * 0.88, y + h * 0.3, 1);
      g.fillCircle(x + w * 0.7, y + h * 0.78, 1);
      g.fillCircle(x + w * 0.9, y + h * 0.72, 1);
      break;
    }
    case 'Mexico': {
      g.fillStyle(0x006847); g.fillRect(x, y, w / 3, h);
      g.fillStyle(0xffffff); g.fillRect(x + w / 3, y, w / 3, h);
      g.fillStyle(0xce1126); g.fillRect(x + (2 * w) / 3, y, w / 3, h);
      g.fillStyle(0x8b4513); g.fillCircle(x + w / 2, y + h / 2, 2);
      break;
    }
    case 'South Korea': {
      g.fillStyle(0xffffff); g.fillRect(x, y, w, h);
      g.fillStyle(0xcd2e3a); g.fillCircle(x + w / 2, y + h / 2, h * 0.28);
      g.fillStyle(0x0047a0);
      g.slice(x + w / 2, y + h / 2, h * 0.28, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(180));
      g.fillPath();
      g.fillStyle(0x000000);
      g.fillRect(x + 2, y + 3, 3, 1);
      g.fillRect(x + w - 5, y + 3, 3, 1);
      g.fillRect(x + 2, y + h - 4, 3, 1);
      g.fillRect(x + w - 5, y + h - 4, 3, 1);
      break;
    }
    case 'Ukraine': {
      g.fillStyle(0x0057b7); g.fillRect(x, y, w, h / 2);
      g.fillStyle(0xffd700); g.fillRect(x, y + h / 2, w, h / 2);
      break;
    }
    case 'Germany': {
      g.fillStyle(0x000000); g.fillRect(x, y, w, h / 3);
      g.fillStyle(0xdd0000); g.fillRect(x, y + h / 3, w, h / 3);
      g.fillStyle(0xffce00); g.fillRect(x, y + (2 * h) / 3, w, h / 3);
      break;
    }
    case 'Netherlands': {
      g.fillStyle(0xae1c28); g.fillRect(x, y, w, h / 3);
      g.fillStyle(0xffffff); g.fillRect(x, y + h / 3, w, h / 3);
      g.fillStyle(0x21468b); g.fillRect(x, y + (2 * h) / 3, w, h / 3);
      break;
    }
    case 'Greece': {
      g.fillStyle(0x0d5eaf); g.fillRect(x, y, w, h);
      g.fillStyle(0xffffff);
      g.fillRect(x + w * 0.15, y, 2, h * 0.5);
      g.fillRect(x, y + h * 0.2, w * 0.4, 2);
      const stripeH = h / 9;
      for (let i = 0; i < 4; i++) {
        g.fillRect(x + w * 0.4, y + h * 0.5 - stripeH + i * 2 * stripeH, w * 0.6, stripeH);
      }
      break;
    }
    case 'Russia': {
      g.fillStyle(0xffffff); g.fillRect(x, y, w, h / 3);
      g.fillStyle(0x0039a6); g.fillRect(x, y + h / 3, w, h / 3);
      g.fillStyle(0xd52b1e); g.fillRect(x, y + (2 * h) / 3, w, h / 3);
      break;
    }
    case 'Colombia': {
      g.fillStyle(0xfcd116); g.fillRect(x, y, w, h / 2);
      g.fillStyle(0x003893); g.fillRect(x, y + h / 2, w, h / 4);
      g.fillStyle(0xce1126); g.fillRect(x, y + (3 * h) / 4, w, h / 4);
      break;
    }
    case 'Egypt': {
      g.fillStyle(0xce1126); g.fillRect(x, y, w, h / 3);
      g.fillStyle(0xffffff); g.fillRect(x, y + h / 3, w, h / 3);
      g.fillStyle(0x000000); g.fillRect(x, y + (2 * h) / 3, w, h / 3);
      g.fillStyle(0xc09300); g.fillCircle(x + w / 2, y + h / 2, 2);
      break;
    }
    case 'Sweden': {
      g.fillStyle(0x006aa7); g.fillRect(x, y, w, h);
      g.fillStyle(0xfecc00);
      g.fillRect(x + w * 0.3, y, 3, h);
      g.fillRect(x, y + h * 0.45, w, 3);
      break;
    }
    case 'New Zealand': {
      g.fillStyle(0x012169); g.fillRect(x, y, w, h);
      g.fillStyle(0xffffff);
      g.fillRect(x, y + h * 0.22, w * 0.4, 1.5);
      g.fillRect(x + w * 0.18, y, 1.5, h * 0.5);
      g.fillStyle(0xce1126);
      g.fillCircle(x + w * 0.62, y + h * 0.32, 1);
      g.fillCircle(x + w * 0.88, y + h * 0.42, 1);
      g.fillCircle(x + w * 0.72, y + h * 0.7, 1);
      g.fillCircle(x + w * 0.92, y + h * 0.72, 1);
      break;
    }
  }
}

export class CountrySelectScene extends Phaser.Scene {
  private selectedCountry = -1;
  private teamName = 'Walnut Creek Aquanuts';
  private inputEl: HTMLInputElement | null = null;

  constructor() {
    super('CountrySelect');
  }

  create(): void {
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

      const flagW = 30;
      const flagH = 20;
      const flagX = cx + 10;
      const flagY = cy + (btnH - flagH) / 2;
      const flagGfx = this.add.graphics();
      drawFlag(flagGfx, countryName, flagX, flagY, flagW, flagH);
      flagGfx.lineStyle(1, 0x000000, 0.6);
      flagGfx.strokeRect(flagX, flagY, flagW, flagH);

      this.add.text(cx + 50, cy + btnH / 2, countryName, {
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
