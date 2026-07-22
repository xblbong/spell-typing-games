import Phaser from 'phaser';
import { GameScene } from '../scene/GameScene';
import { MenuScene } from '../scene/MenuScene';

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
        // FULLSCREEN:
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: '100%',
            height: '100%'
        },
        physics: {
            default: 'arcade',
            arcade: { debug: false }
        },
        scene: [MenuScene, GameScene]
    });
};