import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { ManageScene } from './scenes/ManageScene';
import { SwimmerDetailScene } from './scenes/SwimmerDetailScene';
import { RoutineEditorScene } from './scenes/RoutineEditorScene';
import { CompetitionScene } from './scenes/CompetitionScene';
import { ResultsScene } from './scenes/ResultsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: document.body,
  backgroundColor: COLORS.bg,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, ManageScene, SwimmerDetailScene, RoutineEditorScene, CompetitionScene, ResultsScene],
};

new Phaser.Game(config);
