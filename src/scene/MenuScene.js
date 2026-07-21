import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.text(400, 200, 'Spell Typing Game', {
            fontSize: '48px',
            color: '#e6b800',
            fontFamily: 'monospace',
        }).setOrigin(0.5);

        this.add.text(400, 350, 'Press ENTER to Start', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.input.keyboard?.once('keydown-ENTER', () => {
            this.scene.start('GameScene');
        });
    }
}