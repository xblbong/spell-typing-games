import Phaser from 'phaser';
import { GameScene } from '../scene/GameScene';
import { MenuScene } from '../scene/MenuScene';
import { IntroScene } from '../scene/IntroScene';
import { ResultScene } from '../scene/ResultScene';

export const config = {
    type: Phaser.AUTO,
    width: screen,
    height: screen,
    scene: [MenuScene, GameScene]
};

export const startPhaser = (containerId) => {
    return new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerId,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 1280,
            height: 720
        },
        physics: {
            default: 'arcade',
            arcade: { debug: false }
        },
        scene: [IntroScene, MenuScene, GameScene, ResultScene]
    });
};