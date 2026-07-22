import Phaser from 'phaser';
import { levelLibrary } from '../data/levels';

export class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const { width, height } = this.scale;

        this.add.text(width/2, 100, 'CHOOSE YOUR MISSION', { 
            fontSize: '40px', color: '#e6b800', fontFamily: 'monospace' 
        }).setOrigin(0.5);

        // Membuat Tombol Level secara dinamis dari Data
        levelLibrary.forEach((level, index) => {
            const yPos = 220 + (index * 80);
            
            // Container Tombol
            const btn = this.add.container(width / 2, yPos);
            const bg = this.add.rectangle(0, 0, 500, 60, 0x000000, 0.6)
                .setStrokeStyle(2, 0x7b56ff)
                .setInteractive({ useHandCursor: true });

            const txt = this.add.text(0, 0, 
                `${level.levelName} (${level.levelCategory}) - Target: ${level.minTarget}`, 
                { fontSize: '20px', fontFamily: 'monospace' }
            ).setOrigin(0.5);

            btn.add([bg, txt]);

            // Saat Level Diklik
            bg.on('pointerdown', () => {
                this.scene.start('GameScene', { levelIndex: index });
            });

            // Efek Hover
            bg.on('pointerover', () => bg.setFillStyle(0x7b56ff, 0.4));
            bg.on('pointerout', () => bg.setFillStyle(0x000000, 0.6));
        });
    }
}