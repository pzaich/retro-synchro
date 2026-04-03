import Phaser from 'phaser';
import { COLORS } from '../config';
import { ElementData } from '../entities/Element';

const CATEGORY_COLORS: Record<string, number> = {
  position: 0x3282b8,
  figure: 0x9b59b6,
  scull: 0x1abc9c,
  lift: 0xe74c3c,
  spin: 0xf39c12,
  formation: 0x2ecc71,
  hybrid: 0xe67e22,
};

export class ElementCard extends Phaser.GameObjects.Container {
  public element: ElementData;
  private bg: Phaser.GameObjects.Graphics;
  private isSelected = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    element: ElementData,
    width = 240,
    height = 44,
    onClick?: (element: ElementData) => void,
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    this.element = element;

    const catColor = CATEGORY_COLORS[element.category] ?? COLORS.panelBorder;

    this.bg = scene.add.graphics();
    this.drawBg(COLORS.dark, catColor);
    this.add(this.bg);

    // Category color stripe on left
    const stripe = scene.add.graphics();
    stripe.fillStyle(catColor);
    stripe.fillRect(0, 0, 4, height);
    this.add(stripe);

    // Element name
    const name = scene.add.text(12, 6, element.name, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
    });
    this.add(name);

    // Difficulty badge
    const ddText = scene.add.text(12, 24, `DD ${element.difficulty.toFixed(1)}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#f0c040',
    });
    this.add(ddText);

    // Category label
    const catLabel = scene.add.text(width - 8, 6, element.category.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#' + catColor.toString(16).padStart(6, '0'),
    });
    catLabel.setOrigin(1, 0);
    this.add(catLabel);

    // Tier indicator
    const tierText = scene.add.text(width - 8, 24, `T${element.tier}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#3282b8',
    });
    tierText.setOrigin(1, 0);
    this.add(tierText);

    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => {
      if (!this.isSelected) this.drawBg(COLORS.panel, catColor);
    });
    this.on('pointerout', () => {
      if (!this.isSelected) this.drawBg(COLORS.dark, catColor);
    });
    if (onClick) {
      this.on('pointerdown', () => onClick(element));
    }
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;
    const catColor = CATEGORY_COLORS[this.element.category] ?? COLORS.panelBorder;
    if (selected) {
      this.drawBg(COLORS.panelBorder, COLORS.gold);
    } else {
      this.drawBg(COLORS.dark, catColor);
    }
  }

  private drawBg(fill: number, border: number): void {
    const w = this.width;
    const h = this.height;
    this.bg.clear();
    this.bg.fillStyle(fill);
    this.bg.fillRect(0, 0, w, h);
    this.bg.lineStyle(1, border, 0.6);
    this.bg.strokeRect(0, 0, w, h);
  }
}
