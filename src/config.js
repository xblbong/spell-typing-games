import Phaser from "phaser";
import { MenuScene } from "./scene/MenuScene.js"
import { GameScene } from "./scene/GameScene.js"

export const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    parent: 'game-container',
    scene: [
        MenuScene,
        GameScene,
    ]
};