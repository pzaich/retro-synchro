import Phaser from 'phaser';

/**
 * Makes a Text object interactive with a padded hit area
 * so the clickable region is larger than the rendered glyphs.
 */
export function setTextInteractive(
  text: Phaser.GameObjects.Text,
  padX = 12,
  padY = 8,
): Phaser.GameObjects.Text {
  text.setInteractive({
    useHandCursor: true,
    hitArea: new Phaser.Geom.Rectangle(
      -padX, -padY,
      text.width + padX * 2,
      text.height + padY * 2,
    ),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
  });
  return text;
}
